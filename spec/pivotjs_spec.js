describe('pivot', function () {
  var sample_csv, sample_fields;

  beforeEach(function () {
      sample_csv =  "last_name,first_name,zip_code,billed_amount,last_billed_date\n" +
                    "Jackson,Robert,34471,100.00,2012-01-24\n" +
                    "Smith,Jon,34471,173.20,2012-02-13\n" +
                    "Jackson,Jon,34474,262.42,2012-03-05\n" +
                    "Jackson,Susan,34476,7.45,2011-12-15\n" +
                    "Fornea,Chris,34474,62.98,2012-01-30\n" +
                    "Fornea,Shelly,39401,124.63,2012-02-17"

      sample_fields = [
        {name: 'first_name',    type: 'string',  filterable: true},
        {name: 'last_name',     type: 'string',  filterable: true},
        {name: 'zip_code',      type: 'integer', filterable: true},
        {name: 'pseudo_zip',    type: 'integer', filterable: true, pseudo: true, pseudoFunction: function(row){ return row.zip_code + 1}},
        {name: 'billed_amount', type: 'float', labelable: false, summarizable: 'sum'},
        {name: 'last_billed_date', type: 'date', filterable: true}
      ]

      pivot.fields().set(sample_fields);
      pivot.csv(sample_csv);
    });

  afterEach(function () {
    pivot.reset();
  });

  describe('CSV', function () {
    it('can parse csv into an array', function(){
      expect(pivot.data().raw[0]).toEqual({last_name:'Jackson',first_name:'Robert',zip_code: 34471, billed_amount: 100, pseudo_zip: 34472, last_billed_date: Date.parse('2012-01-24')});
      expect(pivot.data().raw.length).toEqual(6)
    });

    it('can filter items from csv', function() {
      expect(pivot.data().raw.length).toEqual(6);

      // apply filter
      pivot.filters().apply({last_name: 'Jackson'});
      expect(pivot.data().all.length).toEqual(3);
    });
  });

  describe('Filters', function() {
    beforeEach(function () {
      pivot.filters().set({last_name: 'Jackson'});
    });

    it('force type specifity on new filters', function(){
      pivot.filters().add({zip_code: '34471'})
      expect(pivot.filters().all.zip_code).toEqual(34471)
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

    it('should allow filtering on date fields', function(){
      pivot.filters().apply({last_billed_date: 'Sun Feb 12 2012 19:00:00 GMT-0500 (EST)'});
      expect(pivot.data().all.length).toEqual(1);

      pivot.filters().apply({last_billed_date: new Date('2012-02-13')});
      expect(pivot.data().all.length).toEqual(1);

      pivot.filters().apply({last_billed_date: '2012-02-13'});
      expect(pivot.data().all.length).toEqual(1);
    });
  });

  describe('Fields', function(){
    it('allows the specification of fields', function(){
      expect(pivot.fields().get('zip_code').type).toEqual("integer");
      expect(pivot.fields().get('zip_code').filterable).toBeTruthy();
    });

    it('allows for adding fields', function(){
      expect(pivot.fields().all().length).toEqual(sample_fields.length);
      pivot.fields().add({name:"not_a_real_fields", type: 'date', filterable: true})
      expect(pivot.fields().all().length).toEqual(sample_fields.length + 1);
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
      expect(pivot.fields().get('last_billed_date').values[Date.parse('2012-01-24')].displayValue).toEqual('2012-01-24');
    });

    describe('Pseudo Fields', function(){
      it('allows creating pseudo fields', function(){
        expect(pivot.data().raw[0].pseudo_zip).toEqual(34472);
      });

      it('captures values for filterable pseudo fields', function(){
        expect(Object.keys(pivot.fields().pseudo[0].values).length).toEqual(4);
      });
    });
  });

  describe('Display', function(){
    it('should allow set/get of label fields', function(){
      pivot.display().label().set(['last_name']);
      expect(Object.keys(pivot.display().label().get)).toEqual(['last_name']);
    });

    it('should allow set/get of summary fields', function(){
      pivot.display().summary().set(['last_name']);
      expect(Object.keys(pivot.display().summary().get)).toEqual(['last_name']);
    });

    it('should reset summary fields on subsequent calls', function(){
      pivot.display().summary().set(['last_name']);
      expect(Object.keys(pivot.display().summary().get)).toEqual(['last_name']);

      pivot.display().summary().set(['first_name']);
      expect(Object.keys(pivot.display().summary().get)).toEqual(['first_name']);
    });
  });

  describe('Results', function(){
    it('should only return label fields that were selected', function(){
      pivot.display().label().set(['last_name']);
      expect(pivot.results()['last_name:Jackson|'].last_name).toEqual('Jackson');
      expect(pivot.results()['last_name:Fornea|'].last_name).toEqual('Fornea');
      expect(pivot.results()['last_name:Smith|'].zip_code).toEqual(undefined);

      pivot.display().label().set(['last_name', 'zip_code']);
      expect(pivot.results()['last_name:Jackson|zip_code:34471|'].last_name).toEqual('Jackson');
      expect(pivot.results()['last_name:Fornea|zip_code:34474|'].zip_code).toEqual(34474);
    });

    it('should only return summary fields that were selected', function(){
      pivot.display().label().set(['last_name']);

      pivot.display().summary().set([]);
      expect(pivot.results()['last_name:Jackson|'].billed_amount).toEqual(undefined);

      pivot.display().summary().set(['billed_amount']);
      expect(pivot.results()['last_name:Jackson|'].billed_amount).toEqual(369.87);
    });

    it("should return sum for summarizable: 'sum' fields", function(){
      pivot.display().summary().set(['billed_amount']);
      expect(pivot.results()[''].billed_amount.toFixed(2)).toEqual('730.68');
    });

    it("should reformat the output based on the fields displayFunction", function(){
      pivot.fields().get('billed_amount').displayFunction = function(value){ return "$" + value.toFixed(2)};

      pivot.display().summary().set(['billed_amount']);
      expect(pivot.results()[''].billed_amount).toEqual('$730.68');
    });
  });
});