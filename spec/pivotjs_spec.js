describe('pivot', function () {
  beforeEach(function () {
      sample_csv = "last_name,first_name,zip_code\n" +
                   "Jackson,Robert,34471\n" +
                   "Smith,Jon,34471\n" +
                   "Jackson,Jon,34474\n" +
                   "Jackson,Susan,34476\n" +
                   "Fornea,Chris,34474\n" +
                   "Fornea,Shelly,39401"
      pivot.csv(sample_csv)
    });

  describe('CSV', function () {
    it('can parse csv into an array', function(){
      expect(pivot.data().raw[0]).toEqual({last_name:'Jackson',first_name:'Robert',zip_code:'34471'});
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
    it('narrows filter and resets when filter chain is altered', function(){
      expect(pivot.data().raw.length).toEqual(6);

      // apply filter
      pivot.filters().apply({last_name: 'Jackson'});
      expect(pivot.data().all.length).toEqual(3);

      // apply additional filter
      pivot.filters().apply({first_name: 'Jon'});
      expect(pivot.data().all.length).toEqual(1);

      // reset original filter
      pivot.filters().apply({last_name: 'Fornea'});
      expect(pivot.data().all.length).toEqual(2);
    });
  });

  describe('Fields', function(){
    beforeEach(function () {
      pivot.fields().set([
        {name: 'last_name',  type: 'string',  filterable: true},
        {name: 'first_name', type: 'string',  filterable: true},
        {name: 'zip_code',   type: 'integer', filterable: true}
      ]);
    });

    it('allows the specification of fields', function(){
      expect(pivot.fields().get('zip_code').type).toEqual("integer");
      expect(pivot.fields().get('zip_code').filterable).toBeTruthy();
    });

    it('allows for adding fields', function(){
      expect(pivot.fields().all().length).toEqual(3);
      pivot.fields().add({name:"not_a_real_fields", type: 'date', filterable: true})
       expect(pivot.fields().all().length).toEqual(4);
    });
  });
});