Usage
================
```javascript

sample_csv = "last_name,first_name,zip_code\n" +
             "Jackson,Robert,34471\n" +
             "Jackson,Jon,34474\n" +
             "Jackson,Susan,34476\n" +
             "Fornea,Chris,34474\n"

pivot.fields().set([
      {name: 'last_name', type: 'string', filterable: true},
      {name: 'first_name', type: 'string', filterable: true},
      {name: 'zip_code', type: 'integer', filterable: true}
]};

pivot.csv(sample_csv);

console.log('Filtered by last_name: Jackson');

pivot.filters().apply({last_name: 'Jackson'});

for (var i = 0; i < pivot.data().all; i++) {
  row = pivot.data().all[i];
  console.log(row.last_name + " - " row.first_name + " - " row.zip_code)
};


console.log('Filtered by zip_code: 34474');

pivot.filters().apply({zip_code: 34474});

for (var i = 0; i < pivot.data().all; i++) {
  row = pivot.data().all;
  console.log(row.last_name + " - " row.first_name + " - " row.zip_code)
};

```
License
----------
This software is licensed under a modified BSD license.

See LICENSE for more details.