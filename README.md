# Welcome to Pivot.js

Pivot.js is a simple way for you to get to your data.  It allows for the
creation of highly customizable unique table views from your browser.

> In data processing, a pivot table is a data summarization tool found in
> data visualization programs such as spreadsheets or business intelligence
> software. Among other functions, pivot-table tools can automatically sort,
> count, total or give the average of the data stored in one table or
> spreadsheet. It displays the results in a second table (called a "pivot
> table") showing the summarized data.

In our case, results (or the pivot-table) will be displayed as an HTML table
pivoting from the input data (CSV or JSON). Without further ado let's get to usage.

## View an [example](http://rjackson.github.com/pivot.js/) or view the [Docs](http://rjackson.github.com/pivot.js/docs/index.html#!/api/Pivot) for more information.

#Notable Changes in this Fork

##Currency

###Default / Single Currency
Any field with a type of 'currency' has some special handling. To set the default currency symbol for all currency fields:
```javascript
    pivot.init({ csv: sample_csv, fields: sample_fields, defaultCurrencySymbol: 'HK$'});
```
Now all values with a field type of 'currency' will have 'HK$' appended to the front. No other globalisation features are applied. 

###Multiple Currency Reports
A currency field can now be passed out in the data for a row in `currencySymbolField`. This enables reporting with rows in multiple currencies and protects against false aggregation. 
Any currency field in the row will now have whatever data is in the `currencySymbolField` appended to the front of the value. 

>Ensure you differentiate between currencies with the same currency symbol. e.g. '$' should be specified as: HK$, SG$, US$ etc. The symbol must be unique.

When an aggregation is attempted on a currency field with rows of differing currencies the display value will contain `Multiple-Currency-Error`. This avoids 
incorrect value aggregation. 

It is also suggested you either make the currency symbol field 'rowLabelable' and show it by default, or display another field that will ensure data is not
aggregated past the currency level. In the below example this achieved by hiding `currency_symbol` but allowing the full `currency_code` field to be shown at the lable level.

```javascript
 sample_json = '[["currency_symbol","currency_code","last_name","first_name","zip_code","billed_amount","last_billed_date"],' +
                    ' ["SG$","SGD","Jackson", "Robert", 34471, 100.00, "Tue, 24 Jan 2012 00:00:00 +0000"],' +
                    ' ["€","EUR","Smith", "Jon", 34471, 173.20, "Mon, 13 Feb 2012 00:00:00 +0000"],' +
                    ' ["US$","USD","Jackson", "Jon", 34474, 262.42, "Mon, 5 Mar 2012 00:00:00 +0000"],' +
                    ' ["US$","USD","Jackson", "Susan", 34476, 7.45, "Thu, 15 Dec 2011 00:00:00 +0000"],' +
                    ' ["SG$","SGD","Fornea", "Chris", 34474, 62.98, "Mon, 30 Jan 2012 00:00:00 +0000"],' +
                    ' ["SG$","SGD","Fornea", "Shelly", 39401, 124.63, "Fri, 17 Feb 2012 00:00:00 +0000"]]'
 sample_fields = [
        {name: 'currency_symbol', type: 'string', filterable: false, rowLabelable: false, columnLabelable: false },
        {name: 'currency_code', type: 'string', filterable: true, rowLabelable: true, columnLabelable: false },
        {name: 'first_name', type: 'string', filterable: true },
        {name: 'last_name',           type: 'string',  filterable: true},
        {name: 'zip_code',            type: 'integer', filterable: true, columnLabelable: true},
        {name: 'pseudo_zip',          type: 'integer', filterable: true, pseudo: true, pseudoFunction: function(row){ return row.zip_code + 1}},
        {name: 'billed_amount', type: 'currency', summarizable: 'sum' },
        {name: 'last_billed_date',    type: 'date',    filterable: true},
        {name: 'last_billed_yyyy_mm', type: 'string',  filterable: true, pseudo: true, columnLabelable: true,
          pseudoFunction: function(row){
            var date = new Date(row.last_billed_date);
            return date.getFullYear() + '_' + pivot.utils().padLeft((date.getMonth() + 1),2,'0')
          }
        }
      ]

    pivot.init({ csv: sample_csv, fields: sample_fields, defaultCurrencySymbol: 'HK$', currencySymbolField: 'currency_symbol' });});
```

##Built in Support for Accounting.js

If accounting.js is included within your page currency formatting will automatically format using `accounting.formatMoney(value, currencySymbol)`.

##Row Level Data in `displayFunction`

The signature of `displayFunction` has been extened to output the row level data the same was the 'pseudo' fields do. `row` will contain only the visible columns, `row.rows[i]` will give access to all the fields for all data in the aggregation.

```javascript 
 pivot.fields().get('billed_amount_sum').displayFunction = function (value, field, row) {
                return row.currency_code + value.toFixed(2) 
 };
```

##New Aggregate Functions

`summarizable` can now accept and perform Min / Max functions. Both will error in the same way as above on multiple currency aggregations. 

```javascript
 var fields =  { {name: 'some_int_field', type: 'integer', summarizable: 'min' },
                {name: 'some_currency_field', type: 'currency', summarizable: 'max' }
   };
```


#Base Functionaltiy

#Usage

Step one is to initialize the pivot object.  It expects the following attributes:

* `csv` - which should contain a valid string of comma separated values.  It is
  __important to note__ that you must include a header row in the CSV for pivot
  to work properly  (you'll understand why in a minute).
* `json` - which should contain a valid JSON string. At this time this string
  must be an array of arrays, and not an array of objects (storing the field
  names with each row consumes significantly more space).
* `fields` - which should be an array of objects.  This is used to instruct
  pivot on how to interact with the fields you pass in.  It keys off of the
  header row names.  And is formated like so:

```javascript
 [ {name: 'header-name', type: 'string', optional_attributes: 'optional field' },
 {name: 'header-name', type: 'string', optional_attributes: 'optional field' }]

```
(<small>See more about fields in Section below</small>)

* `filters` (default is empty) - which should contain any filters you would like to restrict your data to.  A filter is defined as an object like so:

```javascript
{zip_code: '34471'}

```

Those are the options that you should consider.  There are other options that are well covered in the spec.

A valid pivot could then be set up from like so.

```javascript

var field_definitions = [{name: 'last_name',   type: 'string',   filterable: true},
        {name: 'first_name',        type: 'string',   filterable: true},
        {name: 'zip_code',          type: 'integer',  filterable: true},
        {name: 'pseudo_zip',        type: 'integer',  filterable: true },
        {name: 'billed_amount',     type: 'float',    rowLabelable: false},
        {name: 'last_billed_date',  type: 'date',     filterable: true}

// from csv data:
var csv_string  =  "last_name,first_name,zip_code,billed_amount,last_billed_date\n" +
                   "Jackson,Robert,34471,100.00,\"Tue, 24 Jan 2012 00:00:00 +0000\"\n" +
                   "Jackson,Jonathan,39401,124.63,\"Fri, 17 Feb 2012 00:00:00 +0000\""

pivot.init({csv: csv_string, fields: field_definitions});

// from json data:
var json_string = '[["last_name","first_name","zip_code","billed_amount","last_billed_date"],' +
                    ' ["Jackson", "Robert", 34471, 100.00, "Tue, 24 Jan 2012 00:00:00 +0000"],' +
                    ' ["Smith", "Jon", 34471, 173.20, "Mon, 13 Feb 2012 00:00:00 +0000"]]'

pivot.init({json: json_string, fields: field_definitions});

```

# Wiki

* [Filters](https://github.com/rjackson/pivot.js/wiki/Filters)
* [Labels](https://github.com/rjackson/pivot.js/wiki/Labels)
* [Summaries](https://github.com/rjackson/pivot.js/wiki/Summaries)
* [Integrating with jQuery](https://github.com/rjackson/pivot.js/wiki/Integrating-with-jQuery)
* [jQuery Supporting Cast](https://github.com/rjackson/pivot.js/wiki/jQuery_pivot-Supporting-Cast)
* [Integrating with DataTables](https://github.com/rjackson/pivot.js/wiki/Integrating-with-Datatables)  (__Highly Recommend__)
* [Contribute](https://github.com/rjackson/pivot.js/wiki/Contributing)
* [DOCS](http://rjackson.github.com/pivot.js/docs/index.html#!/api/Pivot)

# Articles

* [Introducing Pivot.js](http://jonathan-jackson.net/2012/04/10/introducing-pivotjs) - Jonathan Jackson

# Authors

Pivot.js is the work of Robert Jackson and Jonathan Jackson.

## License

This software is licensed under a modified BSD license.

See LICENSE for more details.
