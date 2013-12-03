(function( $ ){
  'use strict';

var element,
    callbacks = {},
    resultsTitle, 
    resultsDivID;

var methods = {
  setup   : function(options){
    element = this; // set element for build_containers()
    if (options.callbacks) callbacks = options.callbacks;
    
    if(options.resultsDivID){
    	
    	resultsDivID = options.resultsDivID;
    	
    }
    else
    {
    	resultsDivID = 'results';
    }

    if (options.url !== undefined)
      methods.process_from_url(options);
    else
      methods.process(options);
  },
  process : function(options){
    if (callbacks.beforePopulate) {
      callbacks.beforePopulate();
    };

    var self = methods;

    pivot.init(options);

    resultsTitle = options.resultsTitle;

    if (options.skipBuildContainers === undefined || options.skipBuildContainers === false) self.build_containers();

    self.populate_containers();

    $(document).on('change', '.row-labelable', function(event) {
      self.update_label_fields('row');
    });

    $(document).on('change', '.column-labelable', function(event) {
      self.update_label_fields('column');
    });

    $(document).on('change', '.summary', function(event) {
      self.update_summary_fields();
    });

    methods.update_results();

    if (callbacks.afterPopulate) {
      callbacks.afterPopulate();
    };
  },
  process_from_url : function(options){
    var re = /\.json$/i,
        dataType;

    if (re.test(options.url))
      dataType = 'text/json'
    else
      dataType = 'text/csv'

    $.ajax({
      url: options.url,
      dataType: "text",
      accepts: "text/csv",
      success: function(data, status){
        if (dataType === 'text/json')
          options['json'] = data
        else
          options['csv']  = data

        methods.process(options)
      }
    });
  },
  populate_containers: function(){
    methods.build_toggle_fields('#row-label-fields',     pivot.fields().rowLabelable,    'row-labelable');
    methods.build_toggle_fields('#column-label-fields',  pivot.fields().columnLabelable, 'column-labelable');
    methods.build_toggle_fields('#summary-fields',       pivot.fields().summarizable,    'summary');
    methods.build_filter_list();
  },
  reprocess_display : function(options){
    if (options.rowLabels     === undefined) options.rowLabels    = [];
    if (options.columnLabels  === undefined) options.columnLabels = [];
    if (options.summaries     === undefined) options.summaries    = [];
    if (options.filters       === undefined) options.filters      = {};
    if (options.callbacks     === undefined) options.callbacks    = {};

    if (options.callbacks.beforeReprocessDisplay) {
      options.callbacks.afterReprocessDisplay();
    }

    pivot.filters().set(options.filters);
    pivot.display().summaries().set(options.summaries);
    pivot.display().rowLabels().set(options.rowLabels);
    pivot.display().columnLabels().set(options.columnLabels);

    methods.populate_containers();
    methods.update_results();

    if (options.callbacks.afterReprocessDisplay) {
      options.callbacks.afterReprocessDisplay();
    }
  },
  build_containers : function(){

    var containers = '<div class="pivot_header_fields">' +
                     '  <div class="pivot_field">' +
                     '  <span class="pivot_header2">Filter Fields</span>' +
                     '   <div id="filter-list"></div>' +
                     '  </div>' +
                     '  <div class="pivot_field">' +
                     '  <span class="pivot_header2">Row Label Fields</span>' +
                     '   <div id="row-label-fields"></div>' +
                     '  </div>' +
                     '  <div class="pivot_field">' +
                     '  <span class="pivot_header2">Column Label Fields</span>' +
                     '   <div id="column-label-fields"></div>' +
                     '  </div>' +
                     '  <div class="pivot_field">' +
                     '  <span class="pivot_header2">Summary Fields</span>' +
                     '   <div id="summary-fields"></div>' +
                     '  </div>' +
                     '</div>';
    $(element).append(containers);
  },
  // Filters
  build_filter_list : function(){
    var select = '<select id="select-constructor">'
    select += '<option></option>'
    $.each(pivot.fields().filterable, function(index, field){
      select += '<option>' + field.name + '</option>';
    })
    select += '</select>'
    $('#filter-list').empty().append(select);

    // show pre-defined filters (from init)
    $.each(pivot.filters().all(), function(fieldName, restriction){
      methods.build_filter_field(fieldName, restriction);
    });

    // Bind build action to select-constructor explicitly
    $('#select-constructor').change(function(){
      methods.build_filter_field($(this).val());
    })
  },
  build_filter_field : function(fieldName, selectedValue) {
    var snip,
        remove_filter,
        field = pivot.fields().get(fieldName);

    if (fieldName === '') return;

    // Check to see if this field has already been built
    var filterExists = $('#filter-list select[data-field=' + field.name + ']');
    if (filterExists.length) return;

    if (field.filterType === 'regexp')
      snip = methods.build_regexp_filter_field(field, selectedValue);
    else
      snip = methods.build_select_filter_field(field, selectedValue);

    remove_filter = '<a class="remove-filter-field" style="cursor:pointer;">(X)</a></label>';
    $('#filter-list').append('<div><hr/><label>' + field.name + remove_filter + snip + '</div>');

    //Optional Chosen/Select2 integration
    if($.fn.chosen!==undefined) $('select.filter').chosen();
    else if($.fn.select2!==undefined) $('select.filter').select2();

    // Update field listeners
    $('select.filter').on('change', function(event) {
      methods.update_filtered_rows();
    });

    $('input[type=text].filter').on('keyup', function(event) {
      var filterInput = this,
          eventValue  = $(filterInput).val();

      setTimeout(function(){ if ($(filterInput).val() === eventValue) methods.update_filtered_rows()}, 500);
    });

    // remove_filter listener
    $('.remove-filter-field').click(function(){
      $(this).parents('div').first().remove();
      methods.update_filtered_rows();
    })
  },
  build_select_filter_field : function(field, selectedValue){
    var snip  = '<select class="filter span3" '+(field.filterType==='multiselect'?'multiple':'')+' data-field="' + field.name + '">' +
                '<option></option>',
        orderedValues = [];

    for (var value in field.values){
      orderedValues.push(value);
    };

    orderedValues = orderedValues.sort();
    jQuery.each(orderedValues, function(index, value){
      var selected = "";
      if (value === selectedValue) selected = 'selected="selected"';
      snip += '<option value="' + value + '" ' + selected + '>' + field.values[value].displayValue + '</option>';
    });
    snip += '</select>'

    return snip;
  },
  build_regexp_filter_field : function(field, value){
    if (value === undefined) value = "";
    return '<input type="text" class="filter span3" data-field="' + field.name + '" value="' + value + '">';
  },
  update_filtered_rows :  function(){
    var restrictions = {}, field;

    $('.filter').each(function(index){
      field = pivot.fields().get($(this).attr('data-field'));

      if (field) {
        if ($(this).val() !== null && $(this).val()[0] !== ''){
          if (field.filterType === 'regexp')
            restrictions[$(this).attr('data-field')] = new RegExp($(this).val(),'i');
          else
            restrictions[$(this).attr('data-field')] = $(this).val();
        }
      }
    });
    pivot.filters().set(restrictions);
    methods.update_results();
  },

  //toggles

  build_toggle_fields : function(div, fields, klass){
    $(div).empty();
    $.each(fields, function(index, field){
      $(div).append('<label class="checkbox">' +
                    '<input type="checkbox" class="' + klass + '" ' +
                      'data-field="' + field.name + '" ' +
                    '> ' + field.name +
                    '</label>');
    });

    var displayFields;
    if (klass === 'row-labelable')
      displayFields = pivot.display().rowLabels().get
    else if (klass === 'column-labelable')
      displayFields = pivot.display().columnLabels().get
    else
      displayFields = pivot.display().summaries().get

    for (var fieldName in displayFields) {
      var elem = $(div + ' input[data-field="' + fieldName +'"]');
      elem.prop("checked", true);
      methods.orderChecked(div, elem);
    };

    // order listener
    $(div + ' input').on("click", function(){
      if (this.checked) {
        methods.orderChecked(div, this);
      } else {
        var field = $(this).parent().detach()[0];
        $(div).append( field );
      };
    });
  },
  orderChecked : function(parent, elem){
    var last_checked = $(parent + ' input:checked');     // last changed field (lcf)
    var field        = $(elem).parent().detach()[0]; // pluck item from div
    var children     = $(parent).children();

    //subtract 1 because clicked field is already checked insert plucked item into div at index
    if ((last_checked.length-1) === 0)
      $(parent).prepend( field );
    else if (children.length < last_checked.length)
      $(parent).append( field );
    else
      $(children[last_checked.length-1]).before( field );
  },
  update_result_details : function(){
    var snip = '';
    var filters = '';
    $.each(pivot.filters().all(), function(k,v) {
      filters += '<em>' + k + '</em>' + " => " + v + " "
    });

    if ($('#pivot-detail').length !== 0)
      snip += '<b>Filters:</b> '    + filters + "<br/>"
      $('#pivot-detail').html(snip);
  },
  update_results : function(){
    if (callbacks && callbacks.beforeUpdateResults) {
      callbacks.beforeUpdateResults();
    };

    var results = pivot.results().all(),
        config  = pivot.config(),
        columns = pivot.results().columns(),
        snip    = '',
        fieldName;

    var result_table = $('#' + resultsDivID),
        result_rows;
    result_table.empty();

    snip += '<table id="pivot-table" class="table table-striped table-condensed"><thead>';

    // build columnLabel header row
    if (config.columnLabels.length > 0 && config.summaries.length > 1) {
      var summarySnip = '', summaryRow = '';
      $.each(config.summaries, function(index, fieldName){
        summarySnip += '<th>' + fieldName + '</th>';
      })

      snip += '<tr>'
      $.each(columns, function(index, column){
        switch (column.type){
          case 'row':
            snip += '<th rowspan="2">'+ column.fieldName + '</th>';
            break;
          case 'column':
            snip += '<th colspan="' + column.width + '">' + column.fieldName + '</th>';
            summaryRow += summarySnip
            break;
        }
      });
      snip += '</tr><tr>' + summaryRow + '</tr>';
    } else {
      snip += '<tr>'
      $.each(columns, function(index, column){
        if (column.type !== 'column' || config.summaries.length <= 1) {
          snip += '<th>' + column.fieldName + '</th>';
        } else {
          $.each(config.summaries, function(index, fieldName){
            snip += '<th>' + fieldName + '</th>';
          });
        }
      });
      snip += '</tr>'
    }
    snip += '</thead></tr><tbody id="result-rows"></tbody></table>';
    result_table.append(snip);

    result_rows = $('#result-rows');

    $.each(results,function(index, row){
      snip = '<tr>';
      $.each(columns, function(index, column){
        if (column.type !== 'column')
          snip += '<td>' + row[column.fieldName] + '</td>';
        else {
          $.each(config.summaries, function(index, fieldName){
            if (row[column.fieldName] !== undefined)
              snip += '<td>' + row[column.fieldName][fieldName] + '</td>';
            else
              snip += '<td>&nbsp;</td>';
          });
        }
      });
      snip += '</tr>';

      result_rows.append(snip);
    });
    methods.update_result_details();

    if (callbacks && callbacks.afterUpdateResults) {
      callbacks.afterUpdateResults();
    };
  },
  update_label_fields :  function(type){
    var display_fields = [];

    $('.' + type + '-labelable:checked').each(function(index){
        display_fields.push($(this).attr('data-field'));
    });

    pivot.display()[type + 'Labels']().set(display_fields);

    methods.update_results();
  },
  update_summary_fields : function(){
    var summary_fields = [];

    $('.summary:checked').each(function(index){
        summary_fields.push($(this).attr('data-field'));
    });

    pivot.display().summaries().set(summary_fields);

    methods.update_results();
  }
};

  $.fn.pivot_display = function( method ) {
    if ( methods[method] ) {
      return methods[method].apply( this, Array.prototype.slice.call( arguments, 1 ));
    } else if ( typeof method === 'object' || ! method ) {
      return methods.init.apply( this, arguments );
    } else {
      $.error( 'Method ' +  method + '  doesn\'t exists');
    }
  };

})( jQuery );
