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

Date Processing
===============

Dates are stored internally as milliseconds since the epoch.  Dates to be
parsed from CSV will use Date.parse so make sure that the format you use
will be recongnized by your target browser.  Please use a shim library if
you need to ensure proper parsing regardless of browser implementation.

See [here](https://github.com/csnover/js-iso8601) for an example.

(ISO8601 dates are still not handled properly by Safari 5.1 or IE8.)

License
----------
This software is licensed under a modified BSD license.

See LICENSE for more details.