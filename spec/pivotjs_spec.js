describe('pivot', function () {
  var sample_csv, sample_fields;

  beforeEach(function () {
      sample_csv =  "last_name,first_name,zip_code,billed_amount,last_billed_date\n" +
                    "Jackson,Robert,34471,100.00,\"Tue, 24 Jan 2012 00:00:00 +0000\"\n" +
                    "Smith,Jon,34471,173.20,\"Mon, 13 Feb 2012 00:00:00 +0000\"\n" +
                    "Jackson,Jon,34474,262.42,\"Mon, 5 Mar 2012 00:00:00 +0000\"\n" +
                    "Jackson,Susan,34476,7.45,\"Thu, 15 Dec 2011 00:00:00 +0000\"\n" +
                    "Fornea,Chris,34474,62.98,\"Mon, 30 Jan 2012 00:00:00 +0000\"\n" +
                    "Fornea,Shelly,39401,124.63,\"Fri, 17 Feb 2012 00:00:00 +0000\""

      sample_json = '[["last_name","first_name","zip_code","billed_amount","last_billed_date"],' +
                    ' ["Jackson", "Robert", 34471, 100.00, "Tue, 24 Jan 2012 00:00:00 +0000"],' +
                    ' ["Smith", "Jon", 34471, 173.20, "Mon, 13 Feb 2012 00:00:00 +0000"],' +
                    ' ["Jackson", "Jon", 34474, 262.42, "Mon, 5 Mar 2012 00:00:00 +0000"],' +
                    ' ["Jackson", "Susan", 34476, 7.45, "Thu, 15 Dec 2011 00:00:00 +0000"],' +
                    ' ["Fornea", "Chris", 34474, 62.98, "Mon, 30 Jan 2012 00:00:00 +0000"],' +
                    ' ["Fornea", "Shelly", 39401, 124.63, "Fri, 17 Feb 2012 00:00:00 +0000"]]'

      sample_fields = [
        {name: 'first_name',          type: 'string',  filterable: true},
        {name: 'last_name',           type: 'string',  filterable: true},
        {name: 'zip_code',            type: 'integer', filterable: true, columnLabelable: true},
        {name: 'pseudo_zip',          type: 'integer', filterable: true, pseudo: true, pseudoFunction: function(row){ return row.zip_code + 1}},
        {name: 'billed_amount',       type: 'float',   summarizable: 'sum'},
        {name: 'last_billed_date',    type: 'date',    filterable: true},
        {name: 'last_billed_yyyy_mm', type: 'string',  filterable: true, pseudo: true, columnLabelable: true,
          pseudoFunction: function(row){
            var date = new Date(row.last_billed_date);
            return date.getFullYear() + '_' + pivot.utils().padLeft((date.getMonth() + 1),2,'0')
          }
        }
      ]

      pivot.init({csv: sample_csv, fields: sample_fields});
    });

  afterEach(function () {
    pivot.reset();
  });

  describe('config', function(){
    it('can generate a valid configuration object for passing into pivot.init()', function(){
      var initialRowLabels = pivot.utils().objectKeys(pivot.display().rowLabels().get),
          initialColumnLabels = pivot.utils().objectKeys(pivot.display().columnLabels().get),
          initialSummaries = pivot.utils().objectKeys(pivot.display().summaries().get),
          initialFilters = pivot.filters().all(),
          initialFields  = pivot.fields().clone();

      expect(pivot.config()).toEqual({  fields: initialFields,
                                        filters: initialFilters,
                                        rowLabels: initialRowLabels,
                                        columnLabels: initialColumnLabels,
                                        summaries: initialSummaries
                                      });

      var fields = pivot.config().fields,
          i = -1,
          m = fields.length;
      while (++i < m){
        expect(fields[i].values).toBeUndefined();
      }
    });
  });

  describe('CSV', function () {
    it('can populate csv data on initialization', function(){
      var initialRawData = pivot.data().raw;
      pivot.init({fields: sample_fields, csv: sample_csv});
      expect(pivot.data().raw).toEqual(initialRawData);
    });

    it('can parse csv into an array', function(){
      expect(pivot.data().raw[0]).toEqual(
        {last_name:'Jackson',first_name:'Robert',zip_code: 34471, billed_amount: 100,
        pseudo_zip: 34472, last_billed_date: 1327363200000, last_billed_yyyy_mm : '2012_01'}
      );
      expect(pivot.data().raw.length).toEqual(6)
    });

    it('can filter items from csv', function() {
      expect(pivot.data().raw.length).toEqual(6);

      // apply filter
      pivot.filters().apply({last_name: 'Jackson'});
      expect(pivot.data().all.length).toEqual(3);
    });
  });

  describe('JSON', function(){
    it('can populate csv data on initialization', function(){
      var initialRawData = pivot.data().raw;
      pivot.init({fields: sample_fields, json: sample_json});
      expect(pivot.data().raw).toEqual(initialRawData);
    });
  });

  describe('Filters', function() {
    beforeEach(function () {
      pivot.filters().set({last_name: 'Jackson'});
    });

    it('force type specifity on new filters', function(){
      pivot.filters().add({zip_code: '34471'})
      expect(pivot.filters().all().zip_code).toEqual(34471)
    });

    it('narrows filter and resets when filter chain is altered', function(){
      expect(pivot.data().all.length).toEqual(0);

      // apply filter
      pivot.filters().apply();
      expect(pivot.data().all.length).toEqual(3);

      // apply additional filter
      pivot.filters().add({first_name: 'Jon'});

      // with no params simply runs existing filters
      pivot.filters().apply()
      expect(pivot.data().all.length).toEqual(1);

      // reset original filter
      pivot.filters().apply({last_name: 'Fornea'});
      expect(pivot.data().all.length).toEqual(2);
    });

    describe('Date/Time', function() {

      // only test iso8601 type dates if the browser parses them properly
      if (new Date('2012-02-13').toString() !== 'Invalid Date') {

        describe('ISO8601 dates', function() {
          it('should filter based on Date.parse output (milliseconds from epoch (unix timestamp * 1000))', function(){
            pivot.filters().apply({last_billed_date: Date.parse('2012-02-13')});
            expect(pivot.data().all.length).toEqual(1);
          });

          it('should filter when given YYYY-MM-DD format string', function(){
            pivot.filters().apply({last_billed_date: '2012-02-13'});
            expect(pivot.data().all.length).toEqual(1);
          });
        });

      }

      it('should filter based on an RFC1123 date string', function(){
        pivot.filters().apply({last_billed_date: 'Sun Feb 12 2012 19:00:00 GMT-0500 (EST)'});
        expect(pivot.data().all.length).toEqual(1);
      });

      it('should allow filtering on milliseconds from epoch (unix timestamp * 1000)', function(){
        pivot.filters().apply({last_billed_date: 1329091200000});
        expect(pivot.data().all.length).toEqual(1);
      });

      it('should allow filtering on milliseconds from epoch (unix timestamp * 1000) in string format', function(){
        pivot.filters().apply({last_billed_date: '1329091200000'});
        expect(pivot.data().all.length).toEqual(1);
      });
    });

    it('should filter given a regular expression', function(){
      pivot.filters().apply({last_name: /ack/});
      expect(pivot.data().all.length).toEqual(3);

      pivot.filters().apply({last_name: /(ack|smi)/i});
      expect(pivot.data().all.length).toEqual(4);
    });

    it('should filter given an array of filter values', function(){
      pivot.filters().apply({last_name: ['Jackson','Smith']});
      expect(pivot.data().all.length).toEqual(4);
    });
  });

  describe('Fields', function(){
    it('allows the specification of fields', function(){
      expect(pivot.fields().get('zip_code').type).toEqual("integer");
      expect(pivot.fields().get('zip_code').filterable).toBeTruthy();
    });

    it('allows for adding fields', function(){
      var initialFieldCount = pivot.fields().all().length;
      pivot.fields().add({name:"not_a_real_fields", type: 'date', filterable: true})
      expect(pivot.fields().all().length).toEqual(initialFieldCount + 1);
    });

    it('stores a list of values for filterable fields', function(){
      expect(Object.keys(pivot.fields().get('last_name').values)).toEqual(['Jackson','Smith','Fornea']);
    });

    it('stores a list of display values using the fields displayFunction', function(){
      pivot.fields().set(sample_fields);
      pivot.fields().get('last_name').displayFunction = function(value){return value.toLowerCase()};
      pivot.csv(sample_csv);
      expect(pivot.fields().get('last_name').values['Jackson'].displayValue).toEqual('jackson');
    });

    it('uses default displayFunctions for date', function(){
      expect(pivot.fields().get('last_billed_date').values[1327363200000].displayValue).toEqual('2012-01-24');
    });

    describe('Pseudo Fields', function(){
      it('allows creating pseudo fields', function(){
        expect(pivot.data().raw[0].pseudo_zip).toEqual(34472);
      });

      it('captures values for filterable pseudo fields', function(){
        expect(Object.keys(pivot.fields().pseudo[0].values).length).toEqual(4);
      });

      it('should create psuedo field for summary columns if they are also labelable', function(){
        pivot.fields().add({name: 'zip_code', type: 'integer', summarizable: true})
        expect(pivot.fields().get('zip_code_count')).toBeDefined();

      });
    });

    it('allows for storing a sortFunction for a field', function(){
      pivot.fields().add({name: 'zip_code', type: 'integer', sortFunction: function(a,b){ return b - a}});

      pivot.csv(sample_csv);

      expect(pivot.fields().get('zip_code')['sortFunction']).toBeDefined();
    });
  });

  describe('Display', function(){
    it('should allow set/get of label fields', function(){
      pivot.display().rowLabels().set(['last_name']);
      expect(Object.keys(pivot.display().rowLabels().get)).toEqual(['last_name']);
    });

    it('should allow set/get of summary fields', function(){
      pivot.display().summaries().set(['last_name']);
      expect(Object.keys(pivot.display().summaries().get)).toEqual(['last_name']);
    });

    it('should reset summary fields on subsequent calls', function(){
      pivot.display().summaries().set(['last_name']);
      expect(Object.keys(pivot.display().summaries().get)).toEqual(['last_name']);

      pivot.display().summaries().set(['first_name']);
      expect(Object.keys(pivot.display().summaries().get)).toEqual(['first_name']);
    });
  });

  describe('Results', function(){
    it('should only return label fields that were selected', function(){
      pivot.display().rowLabels().set(['last_name']);
      expect(pivot.results().all()[0].last_name).toEqual('Fornea');
      expect(pivot.results().all()[2].last_name).toEqual('Smith');
      expect(pivot.results().all()[0].zip_code).toEqual(undefined);

      pivot.display().rowLabels().set(['last_name', 'zip_code']);
      expect(pivot.results().all()[0].last_name).toEqual('Fornea');
      expect(pivot.results().all()[0].zip_code).toEqual(34474);
    });

    it('should only return summary fields that were selected', function(){
      pivot.display().rowLabels().set(['last_name']);

      pivot.display().summaries().set([]);
      expect(pivot.results().all()[0].billed_amount_sum).toEqual(undefined);

      pivot.display().summaries().set(['billed_amount_sum']);
      expect(pivot.results().all()[1].billed_amount_sum).toEqual(369.87);
    });

    it("should return sum for summarizable: 'sum' fields", function(){
      pivot.display().summaries().set(['billed_amount_sum']);
      expect(pivot.results().all()[0].billed_amount_sum.toFixed(2)).toEqual('730.68');
    });

    it("should reformat the output based on the fields displayFunction", function(){
      pivot.fields().get('billed_amount_sum').displayFunction = function(value){ return "$" + value.toFixed(2)};

      pivot.display().summaries().set(['billed_amount_sum']);
      expect(pivot.results().all()[0].billed_amount_sum).toEqual('$730.68');
    });

    it('should return a column for each field value in columnLabels', function(){
      pivot.display().summaries().set(['billed_amount_sum']);
      pivot.display().columnLabels().set(['last_billed_yyyy_mm']);
      expect(pivot.results().all()[0]['2012_01'].billed_amount_sum).toEqual(162.98);
    });

    it('should return the column titles and span counts for each resulting table column', function(){
      pivot.display().summaries().set(['billed_amount_sum']);
      expect(pivot.results().columns().length).toEqual(1);
      expect(pivot.results().columns()[0].fieldName).toEqual('billed_amount_sum');
      expect(pivot.results().columns()[0].width).toEqual(1);

      pivot.display().rowLabels().set(['last_name']);
      pivot.display().summaries().set(['billed_amount_sum']);
      expect(pivot.results().columns().length).toEqual(2);
      expect(pivot.results().columns()[0].fieldName).toEqual('last_name');
      expect(pivot.results().columns()[0].width).toEqual(1);
      expect(pivot.results().columns()[1].fieldName).toEqual('billed_amount_sum');
      expect(pivot.results().columns()[1].width).toEqual(1);
    });

    it('should add column label fields values as columns', function(){
      pivot.display().rowLabels().set(['last_name']);
      pivot.display().columnLabels().set(['last_billed_yyyy_mm', 'zip_code']);
      pivot.display().summaries().set(['billed_amount_sum']);

      expect(pivot.results().columns().length).toEqual(9);
      expect(pivot.results().columns()[1].fieldName).toEqual('2011_12');
      expect(pivot.results().columns()[1].width).toEqual(1);
      expect(pivot.results().all()[1][pivot.results().columns()[1].fieldName].billed_amount_sum).toEqual(7.45);

      expect(pivot.results().columns()[2].fieldName).toEqual('2012_01');
      expect(pivot.results().columns()[2].width).toEqual(1);
      expect(pivot.results().all()[1][pivot.results().columns()[2].fieldName].billed_amount_sum).toEqual(100);
    });

    it('should sort the results of the column label fields using the fields sortFunction', function(){
      pivot.fields().add({name: 'zip_code', type: 'integer', columnLabelable: true, sortFunction: function(a,b){ return b - a}});
      pivot.csv(sample_csv);
      pivot.display().summaries().set(['billed_amount_sum']);
      pivot.display().columnLabels().set(['zip_code']);

      expect(pivot.results().columns()[0].fieldName).toEqual('39401');
    });
  });
});
