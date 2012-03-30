(function( $ ){

  var methods = {
    process : function(){
    var self = methods;
    var data = "last_name,first_name,zip_code,billed_amount,last_billed_date\n" +
              "Jackson,Robert,34471,100.00,2012-01-24\n" +
              "Smith,Jon,34471,173.20,2012-02-13\n" +
              "Jackson,Jon,34474,262.42,2012-03-05\n" +
              "Jackson,Susan,34476,7.45,2011-12-15\n" +
              "Fornea,Chris,34474,62.98,2012-01-30\n" +
              "Fornea,Shelly,39401,124.63,2012-02-17"

    pivot.fields().set([{name: 'last_name',  type: 'string',  filterable: true},
        {name: 'first_name',        type: 'string',   filterable: true},
        {name: 'zip_code',          type: 'integer',  filterable: true},
        {name: 'pseudo_zip',        type: 'integer',  filterable: true, pseudo: true, pseudoFunction: function(row){ return row.zip_code + 1}},
        {name: 'billed_amount',     type: 'float',    labelable: false, summarizable: 'sum', displayFunction: function(value){ return '$' + value.toFixed(2)}},
        {name: 'last_billed_date',  type: 'date',     filterable: true}
    ]);

    pivot.csv(data);

    self.build_filter_fields();
    self.build_toggle_fields($('#label-fields'), pivot.fields().labelable, 'labelable');
    self.build_toggle_fields($('#summary-fields'), pivot.fields().summarizable, 'summary');

    $('.filter').change(function(event) {
      self.update_filtered_rows();
    });

    $('.labelable').change(function(event) {
      self.update_label_fields();
    });

    $('.summary').change(function(event) {
      self.update_summary_fields();
    });
  },
  build_filter_fields : function(){
    filterForm = $('#filter-fields');
    jQuery.each(pivot.fields().filterable, function(index, field){
      var snip = '<label>' + field.name + '</label>' +
             '<select class="filter span3" data-field="' + field.name + '">' +
             '<option></option>';

      jQuery.each(field.values, function(value, details){
        snip += '<option value="' + value + '">' + details.displayValue + '</option>';
      });

      snip += '</select>';
      filterForm.append(snip);
    });
  },

  build_toggle_fields : function(form, fields, classes){
    $.each(fields, function(index, field){
      form.append('<label class="checkbox">' +
                    '<input type="checkbox" ' +
                      'class="' + classes + '" ' +
                      'data-field="' + field.name + '"' +
                    '> ' + field.name +
                  '</label>');
    });
  },
  update_results : function(){
  start_time = Date.now();

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
update_filtered_rows :  function(){
  restrictions = {};

  $('.filter').each(function(index){
    if ($(this).val() != '')
      restrictions[$(this).attr('data-field')] = $(this).val();
  });

  pivot.filters().set(restrictions);
  methods.update_results();
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