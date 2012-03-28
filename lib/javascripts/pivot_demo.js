var start_time;

  $(document).ready(function() {
    start_time = Date.now();
    var pdemo = new PivotDemo();
    pdemo.process();
  });



function PivotDemo(options) {
  this.options = options;
 }

PivotDemo.prototype.process = function process(){
    var self = this;
    var data = "last_name,first_name,zip_code,billed_amount\n" +
              "Jackson,Robert,34471,100.00\n" +
              "Smith,Jon,34471,173.20\n" +
              "Jackson,Jon,34474,262.42\n" +
              "Jackson,Susan,34476,7.45\n" +
              "Fornea,Chris,34474,62.98\n" +
              "Fornea,Shelly,39401,124.63"

    pivot.fields().set([{name: 'last_name',  type: 'string',  filterable: true},
        {name: 'first_name', type: 'string',  filterable: true},
        {name: 'zip_code',   type: 'integer', filterable: true},
        {name: 'pseudo_zip', type: 'integer', filterable: true, pseudo: true, pseudoFunction: function(row){ return row.zip_code + 1}},
        {name: 'billed_amount',   type: 'float', labelable: false, summarizable: true, summaryFunction: function(row){ return row.billed_amount } }
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
  }

PivotDemo.prototype.build_filter_fields = function(){
    filterForm = $('#filter-fields');
    jQuery.each(pivot.fields().filterable, function(index, field){
      var snip = '<label>' + field.name + '</label>' +
             '<select class="filter span3" data-field="' + field.name + '">' +
             '<option></option>';

      jQuery.each(field.values, function(value, count){
        snip += '<option>' + value + '</option>';
      });

      snip += '</select>';
      filterForm.append(snip);
    });
  };

PivotDemo.prototype.build_toggle_fields = function(form, fields, classes){
    $.each(fields, function(index, field){
      form.append('<label class="checkbox">' +
                    '<input type="checkbox" ' +
                      'class="' + classes + '" ' +
                      'data-field="' + field.name + '"' +
                    '> ' + field.name +
                  '</label>');
    });
  };

PivotDemo.prototype.update_results = function(){
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

  result_table = $('#results');
  result_table.empty();

  snip += '<table class="table table-striped table-condensed"><thead><tr>';

  $.each(columns, function(index, fieldName){
    snip += '<td>' + fieldName + '</td>';
  });
  snip += '</thead></tr>';

  $.each(pivot.results(),function(index, row){
    snip += '<tr>';
    $.each(columns, function(index, fieldName){
      snip += '<td>' + row[fieldName] + '</td>';
    });
    snip += '</tr>';
  });
  snip += '</table>';
  result_table.append(snip);
};

PivotDemo.prototype.update_filtered_rows =  function(){
  restrictions = {};

  $('.filter').each(function(index){
    if ($(this).val() != '')
      restrictions[$(this).attr('data-field')] = $(this).val();
  });

  pivot.filters().set(restrictions);
  this.update_results();
}

PivotDemo.prototype.update_label_fields =  function(){
  var display_fields = [];

  $('.labelable:checked').each(function(index){
      display_fields.push($(this).attr('data-field'));
  });

  pivot.display().label().set(display_fields);

  this.update_results();
}

PivotDemo.prototype.update_summary_fields = function(){
  var summary_fields = [];

  $('.summary:checked').each(function(index){
      summary_fields.push($(this).attr('data-field'));
  });

  pivot.display().summary().set(summary_fields);

  this.update_results();
}