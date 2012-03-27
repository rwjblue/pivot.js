describe('pivot', function () {
  beforeEach(function () {
    sample_csv = "last_name,first_name,zip_code\n" +
                 "Jackson,Robert,34471\n" +
                 "Jackson,Jon,34474\n" +
                 "Jackson,Susan,34476\n" +
                 "Fornea,Chris,34474\n"
    pivot.csv(sample_csv)
  });

  it('can parse csv into an array', function(){
    expect(pivot.data().raw[0]).toEqual({last_name:'Jackson',first_name:'Robert',zip_code:'34471'});
    expect(pivot.data().raw.length).toEqual(4)
  });

  it('can filter items from csv', function() {
    expect(pivot.data().raw.length).toEqual(4);

    // apply filter
    pivot.filters().apply({last_name: 'Jackson'});

    expect(pivot.data().all.length).toEqual(3);
  });
});