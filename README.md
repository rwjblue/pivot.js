# Welcome to Pivot.js

Pivot.js is a simple way for you to get to your data.  It allows for the creation of highly customizeable unique table views from your browser.

>In data processing, a pivot table is a data summarization tool found in data visualization programs such as spreadsheets or business intelligence software. Among other functions, pivot-table tools can automatically sort, count, total or give the average of the data stored in one table or spreadsheet. It displays the results in a second table (called a "pivot table") showing the summarized data.

In this case the 'pivot table' is displayed in a `div` as an HTML table from the calculation of the other table, which is passed into the pivot object as CSV.  Without further ado let's get to usage.

#Usage

Step one is to initialize the pivot object.  It expects the following attributes:

* `csv` - which should contain a valid javascript string of comma separated values.  It is __important to note__ that you must include a header row in the CSV for pivot to work properly  (you'll understand why in a minute)
* `fields` - which should be an associative array of objects.  This is used to instruct pivot on how to interact with the fields you pass in.  It keys off of the header row names.  And is formated like so:

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

A valid pivot could then be set up like so.

```javascript
var data =  "last_name,first_name,zip_code,billed_amount,last_billed_date\n" +
                "Jackson,Robert,34471,100.00,\"Tue, 24 Jan 2012 00:00:00 +0000\"\n" +
                "Jackson,Jonathan,39401,124.63,\"Fri, 17 Feb 2012 00:00:00 +0000\""

var fields = [{name: 'last_name',   type: 'string',   filterable: true},
        {name: 'first_name',        type: 'string',   filterable: true},
        {name: 'zip_code',          type: 'integer',  filterable: true},
        {name: 'pseudo_zip',        type: 'integer',  filterable: true },
        {name: 'billed_amount',     type: 'float',    labelable: false,},
        {name: 'last_billed_date',  type: 'date',     filterable: true}

$('#pivot-demo').pivot_display('process', data, fields)
```

# Data Interaction

Now that you have a pivot object instantiated properly. Let's start using it!


## Filters

### Get the data

```javascript
// From here on I'll be using the CSV from the spec for all examples

// before filters have been run pivot.data().all
// and pivot.data().raw are the same
pivot.data().all
//=> [Object, Object, Object, Object, Object, Object]

pivot.data().raw
//=> [Object, Object, Object, Object, Object, Object]
```

### Apply a filter

```javascript
pivot.data().all()
//=> [Object, Object, Object, Object, Object, Object]

pivot.filters().set({last_name: 'Jackson'});
pivot.filters().apply();
//=> [Object, Object, Object]
```

As you can see once the filter was applied the fields were filtered accordingly.  Only objects with last_name of 'Jackson' remain in `pivot.data().all`

### Append filter to existing filters

```javascript
// Set pre-existing filters
pivot.filters().set({last_name: 'Jackson'});
pivot.filters().apply();
//=> [Object, Object, Object]

// Further restrict the data
pivot.filters().add({first_name: 'Jon'});
//=> [Object]
```

## Labels

Pivot has a concept of labels.  A label is simply the value that is shown after data has been filtered.  By default, every field is `labelable`.  To access said labels:

```javascript
pivot.display().label().set(['last_name'])

// which creates an object that you can view with pivot.display().label().get:

pivot.display().label().get;
> Object
 >last_name: Object
 >__proto__: Object
```

In table you'll use the labels to display your filtered fields.  Once again I reccomend reading the spec for more details.

## Summaries

You can summarize by adding the attribute `summarizable` to the field on init.

```javascript
{name: 'last_name',   type: 'string',   filterable: true, summarizable: 'count' }
```

There are a few built in functions that can be used on a summarizable field ('sum', 'avg', 'count').  If you would like to define your own simply pass an anonymous function in the field declaration.  The functions will be applied to each cell in the cvs that matches the filter criteria.

For example,

If you were to filter the spec csv by last_name='Jackson' and set summarizable to 'count' it would give you a count of 3 when you called `pivot.results()[''].last_name_count`.  The reason for the empty string is because no label fields were set.  Each label will have its own object in results that corresponds to the summarized values.

# Integrating with jQuery

You don't have to know all of the internals to get something running quickly.  We have packaged a jQuery plugin that will create a pivot-table for you right out of the box

Set the following in your HTML

```html
<div id="pivot-table">
</div>
<div id="results">
</div>

<script type="text/javascript">
  $(document).ready(function() {
    var data = "" // Your CSV as a string

    // default fields are labelable, non-sumarrizable, non-filterable
    // so be sure define the fields you expect to be able to filter by
    var fields = []

    $('#pivot-demo').pivot_display('process', data, fields)
  });
</script>
```

This will create the filters in a drop down list, and checkboxes for labels/summaries.  Optionally you can disable the creation of the containing element.  If you do this then `<div id='filter-list'></div>`, `<div id="label-fields"></div>`, and `<div id='summary-fields'></div>` must be defined.  This offers a much more configurable setup (results div must exist).


# Date Processing

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