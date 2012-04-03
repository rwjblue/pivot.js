(function( $ ){
var element;
var methods = {
  process : function(csv,fields,skipBuildContainers){
    var self = methods;
    element = this; // set element for build_containers()

    if (fields == undefined)
      fields = [];

    pivot.init({fields: fields, csv: csv});

    if (skipBuildContainers === undefined || skipBuildContainers === false) self.build_containers();

    self.build_toggle_fields('#label-fields', 'labels', pivot.fields().labelable, 'labelable');
    self.build_toggle_fields('#summary-fields', 'summary', pivot.fields().summarizable, 'summary');

    $('body').pivot_display('build_filter_list');

    $('.labelable').change(function(event) {
      self.update_label_fields();
    });

    $('.summary').change(function(event) {
      self.update_summary_fields();
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
      select += '<option value="' + index  + '">' + field.name + '</option>';
    })
    select += '</select>'

    $('#filter-list').append(select);
    $('#filter-list select').change(function(){
      methods.build_filter_field($(this).val());
    })
  },
  build_filter_field : function(index) {
    var field = pivot.fields().filterable[index]

    remove_filter = ' <a class="remove-filter-field" style="cursor:pointer;">(X)</a>'
    var snip      = '<label>' + field.name + remove_filter + '</label>' +
                    '<select class="filter span3" data-field="' + field.name + '">' +
                    '<option></option>';

    var orderedValues = [];
    for (var value in field.values){
      orderedValues.push(value);
    };

    orderedValues = orderedValues.sort();
    jQuery.each(orderedValues, function(index, value){
      snip += '<option value="' + value + '">' + field.values[value].displayValue + '</option>';
    });
    snip += '</select>'

    $('#filter-list').append('<div><hr/>'+ snip + '</div>');

    // Update field listener
    $('.filter').on('change', function(event) {
      methods.update_filtered_rows();
    });
    // remove_filter listener
    $('.remove-filter-field').click(function(){
      $(this).parents('div').first().remove()
    })
  },
  update_filtered_rows :  function(){
    restrictions = {};

    $('.filter').each(function(index){
      if ($(this).val() != '')
        restrictions[$(this).attr('data-field')] = $(this).val();
    });
    pivot.filters().set(restrictions);
    methods.update_results();
  },

  //toggles

  build_toggle_fields : function(div, id, fields, classes){
    $.each(fields, function(index, field){
      $(div).append('<label id="' + id + '" ' + 'class="checkbox">' +
                    '<input type="checkbox" ' +
                      'class="' + classes + '" ' +
                      'data-field="' + field.name + '"' +
                    '> ' + field.name +
                  '</label>');
    });
    // order listener
    $('#' + id + ' > input').on("click", function(){
      if (this.checked) {
        var last_checked = $(div + ' input:checked');     // last changed field (lcf)
        var field        = $(this).parent().detach()[0]; // pluck item from div
        var children     = $(div).children();

        //subtract 1 because clicked field is already checked insert plucked item into div at index
        if ((last_checked.length-1) === 0)
          $(div).prepend( field );
        else if (children.length < last_checked.length)
          $(div).append( field );
        else
          $(children[last_checked.length-1]).before( field );
      } else {
        var field = $(this).parent().detach()[0];
        $(div).append( field );
      };
    });
  },

  update_results : function(){
    var results = pivot.results(),
        columns = [],
        snip    = '',
        fieldName;

    for (fieldName in pivot.display().label().get){
      columns.push(fieldName);
    };

    for (fieldName in pivot.display().summary().get){
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
  update_label_fields :  function(){
    var display_fields = [];

    $('.labelable:checked').each(function(index){
        display_fields.push($(this).attr('data-field'));
    });

    pivot.display().label().set(display_fields);

    methods.update_results();
  },
  update_summary_fields : function(){
    var summary_fields = [];

    $('.summary:checked').each(function(index){
        summary_fields.push($(this).attr('data-field'));
    });

    pivot.display().summary().set(summary_fields);

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