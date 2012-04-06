(function( $ ){
  'use strict';
var element;
var methods = {
  setup   : function(options){
    element = this; // set element for build_containers()
    if (options.url !== undefined)
      methods.process_from_url(options);
    else
      methods.process(options);
  },
  process : function(options){
    var self = methods;

    pivot.init(options);

    if (options.skipBuildContainers === undefined || options.skipBuildContainers === false) self.build_containers();

    self.build_toggle_fields('#row-label-fields',     pivot.fields().rowLabelable, 'row-labelable');
    self.build_toggle_fields('#column-label-fields',  pivot.fields().columnLabelable, 'column-labelable');
    self.build_toggle_fields('#summary-fields', pivot.fields().summarizable,  'summary');

    methods.build_filter_list();

    $('.row-labelable').change(function(event) {
      self.update_label_fields('row');
    });

    $('.column-labelable').change(function(event) {
      self.update_label_fields('column');
    });

    $('.summary').change(function(event) {
      self.update_summary_fields();
    });

    methods.update_results();
  },
  process_from_url : function(options){
    $.ajax({
      url: options.url,
      dataType: "text",
      accepts: "text/csv",
      success: function(data, status){
        options['csv'] = data
        methods.process(options)
      }
    });
  },
  build_containers : function(){

    var containers = '<div style="margin-left:-20px;*zoom:1;">' +
                     '  <div style="width:300px;float:left;margin-left:20px;">' +
                     '  <h2>Filter Fields</h2>' +
                     '   <div id="filter-list"></div>' +
                     '  </div>' +
                     '  <div style="width:300px;float:left;margin-left:20px;">' +
                     '  <h2>Label Fields</h2>' +
                     '   <div id="label-fields"></div>' +
                     '  </div>' +
                     '  <div style="width:300px;float:left;margin-left:20px;">' +
                     '  <h2>Summary Fields</h2>' +
                     '   <div id="summary-fields"></div>' +
                     '  </div>' +
                     '</div>';
    element.append(containers);
  },
  // Filters
  build_filter_list : function(){
    var select = '<select>'
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

    $('#filter-list select').change(function(){
      methods.build_filter_field($(this).val());
    })
  },
  build_filter_field : function(fieldName, selectedValue) {
    var remove_filter,
        snip,
        orderedValues = [],
        field = pivot.fields().get(fieldName);

    remove_filter = ' <a class="remove-filter-field" style="cursor:pointer;">(X)</a>'
    snip          = '<label>' + field.name + remove_filter + '</label>' +
                    '<select class="filter span3" data-field="' + field.name + '">' +
                    '<option></option>';

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

    $('#filter-list').append('<div><hr/>'+ snip + '</div>');

    // Update field listener
    $('.filter').on('change', function(event) {
      methods.update_filtered_rows();
    });
    // remove_filter listener
    $('.remove-filter-field').click(function(){
      $(this).parents('div').first().remove();
      methods.update_filtered_rows();
    })
  },
  update_filtered_rows :  function(){
    var restrictions = {};

    $('.filter').each(function(index){
      if ($(this).val() != '')
        restrictions[$(this).attr('data-field')] = $(this).val();
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
      var elem = $(div + ' input[data-field=' + fieldName +']');
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
  update_results : function(){
    var results = pivot.results(),
        columns = [],
        snip    = '',
        fieldName;

    for (fieldName in pivot.display().rowLabels().get){
      columns.push(fieldName);
    };

    for (fieldName in pivot.display().columnLabels().get){
      columns.push(fieldName);
    };

    for (fieldName in pivot.display().summaries().get){
      columns.push(fieldName);
    };

    var result_table = $('#results'),
        result_rows;
    result_table.empty();

    snip += '<table class="table table-striped table-condensed"><thead><tr>';

    $.each(columns, function(index, fieldName){
      snip += '<th>' + fieldName + '</th>';
    });
    snip += '</thead></tr><tbody id="result-rows"></tbody></table>';
    result_table.append(snip);

    result_rows = $('#result-rows');

    $.each(pivot.results(),function(index, row){
      snip = '<tr>';
      $.each(columns, function(index, fieldName){
        snip += '<td>' + row[fieldName] + '</td>';
      });
      snip += '</tr>';

      result_rows.append(snip);
    });
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