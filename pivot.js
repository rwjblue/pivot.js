/**
* @docauthor Jonathan Jackson
* @class Pivot
* # Welcome to Pivot.js
*
* Pivot.js is a simple way for you to get to your data.  It allows for the
* creation of highly customizable unique table views from your browser.
*
* > In data processing, a pivot table is a data summarization tool found in
* > data visualization programs such as spreadsheets or business intelligence
* > software. Among other functions, pivot-table tools can automatically sort,
* > count, total or give the average of the data stored in one table or
* > spreadsheet. It displays the results in a second table (called a "pivot
* > table") showing the summarized data.
*
* In our case, results (or the pivot-table) will be displayed as an HTML table
* pivoting from the input data (CSV or JSON). Without further ado let's get to usage.
*
* View an [example](http://rjackson.github.com/pivot.js/).
*
* #Usage
*
* Step one is to initialize the pivot object.  It expects the following attributes:
*
* - `csv` - which should contain a valid string of comma separated values.  It is
*   __important to note__ that you must include a header row in the CSV for pivot
*   to work properly  (you'll understand why in a minute).
*
* - `json` - which should contain a valid JSON string. At this time this string
*   must be an array of arrays, and not an array of objects (storing the field
*   names with each row consumes significantly more space).
*
* - `fields` - which should be an array of objects.  This is used to instruct
*   pivot on how to interact with the fields you pass in.  It keys off of the
*   header row names.  And is formated like so:
*
*     [ {name: 'header-name', type: 'string', optional_attributes: 'optional field' },
*     {name: 'header-name', type: 'string', optional_attributes: 'optional field' }]
*
*
* - `filters` (default is empty) - which should contain any filters you would like to restrict your data to.  A filter is defined as an object like so:
*
*     {zip_code: '34471'}
*
*
* Those are the options that you should consider.  There are other options that are well covered in the spec
* A valid pivot could then be set up from like so.
*
*
*     var field_definitions = [{name: 'last_name',   type: 'string',   filterable: true},
*             {name: 'first_name',        type: 'string',   filterable: true},
*             {name: 'zip_code',          type: 'integer',  filterable: true},
*             {name: 'pseudo_zip',        type: 'integer',  filterable: true },
*             {name: 'billed_amount',     type: 'float',    rowLabelable: false,},
*             {name: 'last_billed_date',  type: 'date',     filterable: true}
*
*     // from csv data:
*     var csv_string  =  "last_name,first_name,zip_code,billed_amount,last_billed_date\n" +
*                        "Jackson,Robert,34471,100.00,\"Tue, 24 Jan 2012 00:00:00 +0000\"\n" +
*                        "Jackson,Jonathan,39401,124.63,\"Fri, 17 Feb 2012 00:00:00 +0000\""
*     pivot.init({csv: csv_string, fields: field_definitions});
*
*     // from json data:
*     var json_string = '[["last_name","first_name","zip_code","billed_amount","last_billed_date"],' +
*                         ' ["Jackson", "Robert", 34471, 100.00, "Tue, 24 Jan 2012 00:00:00 +0000"],' +
*                         ' ["Smith", "Jon", 34471, 173.20, "Mon, 13 Feb 2012 00:00:00 +0000"]]'
*
*     pivot.init({json: json_string, fields: field_definitions});
*
*/
var pivot = (function(){
'use strict';

var fields, filters, rawData, data, dataFilters, displayFields, results, resultsColumns;

init();
/**
* Initializes a new pivot.
* Optional parameters:
* * fields
* * filters
* * rowLabels
* * columnLabels
* * summaries
* @param {Object}
*/
function init(options){
  rawData = [], data = [], dataFilters = {}, fields = {}, filters = {};
  displayFields   = {rowLabels: {}, columnLabels: {}, summaries: {}};

  if (options               === undefined) options = {};
  if (options.fields        !== undefined) setFields(options.fields);
  if (options.filters       !== undefined) setFilters(options.filters);
  if (options.rowLabels     !== undefined) setRowLabelDisplayFields(options.rowLabels);
  if (options.columnLabels  !== undefined) setColumnLabelDisplayFields(options.columnLabels);
  if (options.summaries     !== undefined) setSummaryDisplayFields(options.summaries);

  if (options.csv !== undefined)
    processCSV(options.csv)
  if (options.json !== undefined)
    processJSON(options.json)

  return pivot;
}

/**
* Calls init with no options, which effectively resets the current pivot.
*/
function reset(){
  return init();
};

/**
* Very cool little function. If called like so: `pivot.config(true)` will return the exact object you would need
* to create the current pivot from scratch.  If passed with no argument will return everything except fields.
*/
function config(showFields){
  var fields;
  if (showFields === undefined)
    fields = cloneFields()
  else if (showFields === false)
    fields = "Pass showFields as true in order to view fields here.";

  return {  fields: fields,
            filters: filters,
            rowLabels: objectKeys(displayFields.rowLabels),
            columnLabels: objectKeys(displayFields.columnLabels),
            summaries: objectKeys(displayFields.summaries)
          };
};
function pivotUtils(){
    return {
      pad: pad,
      padRight: padRight,
      padLeft: padLeft,
      formatDate: formatDate,
      formatTime: formatTime,
      isArray: isArray,
      isRegExp: isRegExp,
      shallowClone: shallowClone,
      objectKeys: objectKeys,
      objectType: objectType,
      sortNumerically: sortNumerically
    }
  };

  function pad(sideToPad, input, width, padString){
    if (padString === undefined) padString = " ";

    input     = input.toString();
    padString = padString.toString();

    while (input.length < width) {
      if (sideToPad === "left")
        input = padString + input;
      else
        input = input + padString;
    }

    return input
  };

  function padRight(input, width, padString){
    return pad('right', input, width, padString)
  };

  function padLeft(input, width, padString){
    return pad('left', input, width, padString)
  };

  function formatDate(value){
    return value.getUTCFullYear() + '-' + padLeft((value.getUTCMonth() + 1), 2, "0") + '-' + padLeft(value.getUTCDate(), 2, '0');
  };

  function formatTime(value){
    return formatDate(value) + ' ' + padLeft(value.getUTCHours(), 2,'0') + ':' + padLeft(value.getUTCMinutes(),2,'0');
  };

  function isArray(arg){
    if(!Array.isArray)
      return objectType(arg) == 'array';
    else
      return Array.isArray(arg);
  };

  function isRegExp(arg){
    return objectType(arg) == 'regexp';
  };

  function shallowClone(input){
    var output = {};

    for (var key in input) {
      if (input.hasOwnProperty(key))
        output[key] = input[key];
    }

    return output;
  };

  function objectKeys(object){
    if (Object.keys) return Object.keys(object);

    var output = [];

    for (key in object){
      output.push(key);
    }

    return output;
  };

  function objectType(obj) {
    return ({}).toString.call(obj).match(/\s([a-z|A-Z]+)/)[1].toLowerCase();
  };

  function sortNumerically(array){
    return array.sort(function(a,b){ return a - b;});
  };
function processHeaderRow(row){
    var output = [];

    var o = {}, i = -1, m = row.length;
    while (++i < m) {
      var field = fields[row[i]];
      if (field === undefined) field = appendField(row[i]);
      output.push(field);
    };

    return output;
  };

  function processJSON(input) {
    var header,
        pseudoFields  = restrictFields('pseudo');

    if (objectType(input) === 'string') input = JSON.parse(input);
    rawData     = [];

    var o = {}, j = -1, m = input.length;
    while (++j < m) {
      if (j === 0)
        header = processHeaderRow(input[j]);
      else
        rawData.push(processRow(input[j], header, pseudoFields));
    };
  };

  // Accepts csv as a string
  function processCSV(text) {
    var header,
        pseudoFields = restrictFields('pseudo');

    rawData = processRows(text, function(row, i){
      if (i === 0)
        header = processHeaderRow(row);
      else
        return processRow(row, header, pseudoFields);
    });
  };

  function processRows(text, f) {
    var EOL = {}, // sentinel value for end-of-line
        EOF = {}, // sentinel value for end-of-file
        rows = [], // output rows
        re = /\r\n|[,\r\n]/g, // field separator regex
        n = 0, // the current line number
        t, // the current token
        eol; // is the current token followed by EOL?

    re.lastIndex = 0; // work-around bug in FF 3.6

    /** @private Returns the next token. */
    function token() {
      if (re.lastIndex >= text.length) return EOF; // special case: end of file
      if (eol) { eol = false; return EOL; } // special case: end of line

      // special case: quotes
      var j = re.lastIndex;
      if (text.charCodeAt(j) === 34) {
        var i = j;
        while (i++ < text.length) {
          if (text.charCodeAt(i) === 34) {
            if (text.charCodeAt(i + 1) !== 34) break;
            i++;
          }
        }
        re.lastIndex = i + 2;
        var c = text.charCodeAt(i + 1);
        if (c === 13) {
          eol = true;
          if (text.charCodeAt(i + 2) === 10) re.lastIndex++;
        } else if (c === 10) {
          eol = true;
        }
        return text.substring(j + 1, i).replace(/""/g, "\"");
      }

      // common case
      var m = re.exec(text);
      if (m) {
        eol = m[0].charCodeAt(0) !== 44;
        return text.substring(j, m.index);
      }
      re.lastIndex = text.length;
      return text.substring(j);
    }

    while ((t = token()) !== EOF) {
      var a = [];
      while ((t !== EOL) && (t !== EOF)) {
        a.push(t);
        t = token();
      }
      if (f && !(a = f(a, n++))) continue;
      rows.push(a);
    }

    return rows;
  };

  function processRow(row, header, pseudoFields) {
    // process actual fields
    var o = {}, j = -1, m = header.length;
    while (++j < m) {
      var value = castFieldValue(header[j].name, row[j]);
      o[header[j].name] = value;
      addFieldValue(header[j].name, value);
    };

    // process pseudo fields
    j = -1, m = pseudoFields.length;
    while (++j < m) {
      var field = pseudoFields[j],
          value = castFieldValue(field.name, field.pseudoFunction(o, field));
      o[field.name] = value;
      addFieldValue(field.name, value);
    };

    return o;
  };
  /**
  * Entry point for several filter methods.
  * See:
  *
  * * getFilters() - returns filters applied to current pivot
  * * setFilters() - sets a series of filters
  * * appendFilter() - adds a filter to current pivot filters
  * * applyFilter() - runs the filters on the values
  *
  * @param {String}
  * @return {function} One of the fucntions defined above.
  */
  function pivotFilters(type){
    var opts = {
      all:    getFilters,
      set:    setFilters,
      apply:  applyFilter,
      add:    appendFilter
    }

    if (type !== undefined) {
      return opts[type]
    } else {
      return opts
    };
  };

  function castFilterValues(restrictions){
    if (restrictions === undefined) restrictions = filters;

    var field;
    for (field in restrictions){
      if (restrictions.hasOwnProperty(field))
        if (isRegExp(restrictions[field])) {
          // no need to change
        } else if (isArray(restrictions[field])) {
          var i = -1, m = restrictions[field].length;
          while (++i < m) {
            restrictions[field][i] = castFieldValue(field, restrictions[field][i])
          };
        } else {
          restrictions[field] = castFieldValue(field, restrictions[field])
        }
    };
  };

  /**
  * Takes a new restrction (filter) and appends it to current pivot's filters
  * @param {Object} newRestriction should looke like {"last_name":"Jackson"}
  */
  function appendFilter(newRestriction) {
    for (var key in newRestriction) {
      if (newRestriction.hasOwnProperty(key))
        filters[key] = newRestriction[key];
    }

    castFilterValues();
  };

  /**
  * Returns current pivot's filters
  */
  function getFilters(){
    return filters;
  };

  /**
  * Accepts list of restrictions, assigns them  as current pivot's filters and casts their values.
  * @param {Object} restrictions - should looke something like {"employer":"Acme Corp"}
  */
  function setFilters(restrictions){
    filters = restrictions;
    resetResults();
    castFilterValues();
  };

  /**
  * Applies the current pivot's filters to the data returning a list of values
  * Optionally allows you to set filters and apply them.
  * @param {Object} restrictions allows you to pass the filters to apply without using set first.
  */
  function applyFilter(restrictions){
    var dataToFilter    = data,
        filteredData    = [];

    if (restrictions !== undefined) setFilters(restrictions);

    var preserveFilter = preserveFilteredData();

    if (preserveFilter) {
      dataToFilter = data;
    } else {
      dataToFilter = rawData;
    }

    var dataToFilterLength  = dataToFilter.length,
        filterLength        = objectKeys(filters).length,
        i                   = -1;

    while (++i < dataToFilterLength) {
      var row     = dataToFilter[i],
          matches = 0;

      for (var key in filters) {
        if (filters.hasOwnProperty(key) && row.hasOwnProperty(key) && matchesFilter(filters[key], row[key]))
          matches += 1;
      }

      if (matches === filterLength) {
        filteredData.push(row);
      };
    };

    data        = filteredData;
    dataFilters = shallowClone(filters);
    resetResults();

    return data;
  };

  function matchesFilter(filter, value){
    if (isArray(filter)) {
      var i = -1, m = filter.length;
      while (++i < m) {
        if(filter[i] === value) return true
      };
    } else if (isRegExp(filter)){
      return filter.test(value);
    } else {
      return value === filter;
    }

    return false
  };

  function preserveFilteredData(){
    var matches = 0,
        dataFiltersLength = objectKeys(dataFilters).length;

    for (var key in dataFilters) {
      if (dataFilters.hasOwnProperty(key) && dataFilters.hasOwnProperty(key) && filters[key] === dataFilters[key])
        matches += 1;
    }

    return dataFiltersLength > 0 && matches >= dataFiltersLength;
  };
  /**
  * Entry point for several field methods.
  * See:
  *
  * * restrictFields()
  * * cloneFields()
  * * appendField()
  * * getFields()
  * * getField()
  * * setField()
  *
  * @param {String}
  * @return {function} One of the fucntions defined above.
  */
  function pivotFields(type){
    var opts = {
      columnLabelable:  restrictFields('columnLabelable'),
      rowLabelable:     restrictFields('rowLabelable'),
      summarizable:     restrictFields('summarizable'),
      filterable:       restrictFields('filterable'),
      pseudo:           restrictFields('pseudo'),
      clone:            cloneFields,
      add:              appendField,
      all:              getFields,
      set:              setFields,
      get:              getField
    }

    if (type !== undefined) {
      return opts[type]
    } else {
      return opts
    };
  };
  /**
  * Method for setting multiple fields.  Usually used on pivot.init().
  * See {@link pivot#appendField} for more information.
  * @param {Object}
  * @return {undefined}
  */
  function setFields(listing){
    fields = {};
    var i = -1, m = listing.length;
    while (++i < m) {
      appendField(listing[i]);
    }
  };

  function cloneFields(){
    var fieldsOutput = [];
    for (var field in fields){
      var newField = {};
      for (var key in fields[field]){
        if (fields[field].hasOwnProperty(key) && key !== 'values')
          newField[key] = fields[field][key];
      }
      fieldsOutput.push(newField);
    }

    return fieldsOutput;
  }

  /**
  * Returns array of defined field objects.
  */
  function getFields(){
    var retFields = [];
    for (var key in fields) {
      if (fields.hasOwnProperty(key)) retFields[fields[key].index] = fields[key];
    }

    return retFields;
  };

  /**
  * Returns list of defined fields filtered by type
  * @param {String} 'columnLabelable', 'rowLabelable', 'summarizable', 'filterable', or 'pseudo'
  */
  function restrictFields(type){
    var retFields = [];
    for (var key in fields) {
      if (fields.hasOwnProperty(key) && fields[key][type] === true) retFields.push(fields[key]);
    }

    return retFields;
  };

  /**
  * Attr reader for fields
  * @param {String} Something like 'last_name'
  */
  function getField(name){
    return fields[name];
  };

  /**
  * Returns the sum value of all rows passed to it.
  */
  function defaultSummarizeFunctionSum(rows, field){
    var runningTotal  = 0,
        i             = -1,
        m             = rows.length;
    while (++i < m) {
      runningTotal += rows[i][field.dataSource];
    };
    return runningTotal;
  };

  /**
  * Returns Average of values passed in from rows
  */
  function defaultSummarizeFunctionAvg(rows, field){
    return defaultSummarizeFunctionSum(rows, field)/rows.length;
  };

  /**
  * Returns count of rows
  */
  function defaultSummarizeFunctionCount(rows, field){
    return rows.length;
  }

  /**
  * The main engine by which you create and assign field.  Takes an object that should look something like {name: 'last_name',type: 'string', filterable: true}, and assigns all the associated attributes to their correct state.
  * Allowed field attributes are
  * * filterable - Allows you to filter based off this field
  * * rowLabelable - Allows you to display rowLabels based off this field
  * * columnLabelable - Allows you to display columnLabels based off this field
  * * summarizable - Allows you to create a summary field.
  * * pseudo - Allows you to treat an anonymous function as a field (ie you could treat the sum of a set of values as a field)
  * * sortFunction - Allows you to override the default sort function for columnLabelable fields.
  * * displayFunction - Allows you to override the default display function. Using this function you can completely customize the way a field is displayed without having to modify the internal storage.
  * Be sure to run through the source on this one if you are unsure as to what it does.  It's pretty straightforward, but definitely bears looking into.
  * @param {Object} field
  */
  function appendField(field){
    // if field is a simple string setup and object with that string as a name
    if (objectType(field) === 'string') field = {name: field};

    if (field.type              === undefined) field.type             = 'string';
    if (field.pseudo            === undefined) field.pseudo           = false;
    if (field.rowLabelable      === undefined) field.rowLabelable     = true;
    if (field.columnLabelable   === undefined) field.columnLabelable  = false;
    if (field.filterable        === undefined) field.filterable       = false;
    if (field.dataSource        === undefined) field.dataSource       = field.name;

    if (field.summarizable && (field.rowLabelable || field.columnLabelable || field.filterable)) {
      var summarizable_field            = shallowClone(field);
      summarizable_field.rowLabelable   = false;
      summarizable_field.filterable     = false;
      summarizable_field.dataSource     = field.name;

      if (summarizable_field.summarizable !== true)
        summarizable_field.name = summarizable_field.name + '_' + summarizable_field.summarizable;
      else
        summarizable_field.name = summarizable_field.name + '_count'

      appendField(summarizable_field);

      field.summarizable  = false;
      field.summarizeFunction = undefined;
    } else if (field.summarizable) {
      if (field.summarizeFunction === undefined){
        switch (field.summarizable){
          case 'sum':
            field.summarizeFunction = defaultSummarizeFunctionSum;
            break;
          case 'avg':
            field.summarizeFunction = defaultSummarizeFunctionAvg;
            break;
          default:
            field.summarizeFunction = defaultSummarizeFunctionCount;
            break;
        };

        field.summarizable  = true;
      };
    } else {
      field.summarizable  = false
    }

    if (field.pseudo && field.pseudoFunction === undefined)
      field.pseudoFunction = function(row){ return '' };

    if (field.displayFunction === undefined)
      field.displayFunction = displayFieldValue;

    field.values        = {};
    field.displayValues = {};

    field.index         = objectKeys(fields).length;
    fields[field.name]  = field;

    return field;
  };

  /**
  * Adds value to field based off of the Fields' displayFunction, defaults to count.
  */
  function addFieldValue(field, value){
    if (fields[field] === undefined || fields[field].filterable === false) return;

    if (fields[field].values[value] === undefined) {
      fields[field].values[value]        = {count: 1, displayValue: fields[field].displayFunction(value, field)};
    } else {
      fields[field].values[value].count += 1;
    }
  };

  /**
  * Helper for displaying properly formated field values.
  */
  function displayFieldValue(value, fieldName){
    var field;
    if (objectType(fieldName) === 'string') field = fields[fieldName];
    if (field === undefined) field = appendField(fieldName);

    switch (field.type){
      case "cents":
        return '$' + (value/100).toFixed(2);
      case "currency":
        return '$' + value.toFixed(2);
      case "date":
        return formatDate(new Date(value));
      case "time":
        return formatTime(new Date(value));
      default:
        return value;
    }
  }

  /**
  * Used to change the string value as parsed from the CSV into the type of field it expects.
  */
  function castFieldValue(fieldName, value){
    var field, retValue;
    if (objectType(fieldName) === 'string') field = fields[fieldName];
    if (field === undefined) field = appendField(fieldName);

    switch (field.type){
      case "integer":
      case "cents":
        if (objectType(value) === 'number')
          return value;
        else
          return parseInt(value, 10);
      case "float":
      case "currency":
        if (objectType(value) === 'number')
          return value;
        else
          return parseFloat(value, 10);
      case "date":
      case "time":
        switch (objectType(value)){
          case 'number':
          case 'date':
            return value;
          default:
            if (/^\d+$/.test(value))
              return parseInt(value);
            else
              return Date.parse(value);
        };
      default:
        return value.toString();
    }
  };
/**
 * Returns object containing the raw fields(rawData) and filtered fields(data).
 * @param  string, either 'raw', or 'all'.
 * @return {Object} An object containing lists of fields
 */
function pivotData(type) {
    var opts = {raw:        rawData,
                all:        data
              };

    if (type !== undefined) {
      return opts[type]
    } else {
      return opts
    };
  }
  /**
  * Entry point for several display methods.  See {@link pivot#pivotDisplayAll}, {@link pivot#pivotDisplayRowLabels}, {@link  pivot#pivotDisplaycolumnLabels}, and {@link pivot#pivotDisplaySummaries}
  * @return {function} One of the fucntions defined above.
  */
  function pivotDisplay(){
    return {
      all:          pivotDisplayAll,
      rowLabels:    pivotDisplayRowLabels,
      columnLabels: pivotDisplayColumnLabels,
      summaries:    pivotDisplaySummaries
    }
  };

  /**
  * This will return an object containing rowLabels, summaries, and columnLabels that are currently applied to the pivot.
  */
  function pivotDisplayAll(){
    return displayFields;
  };

  /**
  * Returns either list of rowLabels or allows you to access the {@link pivot#setRowLabelDisplayFields}.
  *
  * Called from pivot like so: pivot.display().rowLabels().set() or pivot.display().rowLabels().get
  */
  function pivotDisplayRowLabels(){
    return {
      set: setRowLabelDisplayFields,
      get: displayFields.rowLabels
    }
  };

  /**
  * Returns either list of columnLabels or allows you to access the {@link pivot#setColumnLabelDisplayFields}.
  *
  * Called from pivot like so: pivot.display().columnLabels().set() or pivot.display().columnLabels().get
  */
  function pivotDisplayColumnLabels(){
    return {
      set: setColumnLabelDisplayFields,
      get: displayFields.columnLabels
    }
  };

  /**
  * Returns either list of summaries (labels) or allows you to access the {@link pivot#setSummaryDisplayFields}.
  *
  * Called from pivot like so: pivot.display().summaries().set() or pivot.display().summaries().get
  */
  function pivotDisplaySummaries(){
    return {
      set: setSummaryDisplayFields,
      get: displayFields.summaries
    }
  };

  /**
  * This method allows you to append a new label field to the specified type. For example, you could set a new displayRowLabel by sending it as the type and 'city' as the field
  * @param string type - must be either 'rowLabels', 'columnLabels', or 'summaries'
  * @param string field - Specify the label you would like to add.
  * @private
  * @return {undefined}
  */
  function appendDisplayField(type, field){
    if (objectType(field) === 'string')
      field = fields[field];

    resetResults();
    displayFields[type][field.name] = field;
  };

  /**
  * This method simply calls appendDisplayField on a collection passing in each to appendDisplayField.  The object should look something like the following
  *    {'rowLabels':['city','state'],'columnLabels':['billed_amount']}
  * @private
  * @return {undefined}
  */
  function setDisplayFields(type, listing){
    displayFields[type] = {};
    resetResults();

    var i = -1, m = listing.length;
    while (++i < m) {
      appendDisplayField(type, listing[i]);
    };
  };

  /**
  * Allows setting of row label fields
  * @param listing Should look like ['city','state']
  * @return {undefined}
  */
  function setRowLabelDisplayFields(listing){
    setDisplayFields('rowLabels', listing);
  };

  /**
  * Allows setting of column label fields
  * @param listing - Should look like ['city','state']
  * @return {undefined}
  */
  function setColumnLabelDisplayFields(listing){
    setDisplayFields('columnLabels', listing);
  };

  /**
  * Allows setting of summary label fields
  * @param listing - Should look like ['billed_amount']
  * @return {undefined}
  */
  function setSummaryDisplayFields(listing){
    setDisplayFields('summaries', listing);
  };
  /**
  * Entry point for several results methods.
  * See:
  *
  * * getDataResults() - returns filters applied to current pivot
  * * getColumnResults() - sets a series of filters
  *
  * @return {function} One of the fucntions defined above.
  */
  function pivotResults(){
    return {
      all:      getFormattedResults,
      columns:  getColumnResults
    }
  };

  function resetResults(){
    results = undefined; resultsColumns = undefined;
  }

  function getFormattedResults(){
    if (results !== undefined && resultsColumns !== undefined) return getResultArray();

    applyFilter();
    results = {}; resultsColumns = [];

    processRowLabelResults();

    if (objectKeys(displayFields.columnLabels).length > 0)
      processColumnLabelResults();
    else {
      populateSummaryColumnsResults();
      processSummaryResults();
    }

    return getResultArray();
  };

  function processRowLabelResults(){
    var i = -1, m = data.length, keys;

    while (++i < m) {
      var row       = data[i],
          resultKey = '';

      for (var key in displayFields.rowLabels) {
        if (displayFields.rowLabels.hasOwnProperty(key)) {
          if (i === 0) resultsColumns.push({fieldName: key, width: 1, type: 'row'});

          resultKey += key + ':' + row[key] + '|';
        }
      }
      if (results[resultKey] === undefined) {
        results[resultKey] = {};

        for (var key in displayFields.rowLabels) {
          if (displayFields.rowLabels.hasOwnProperty(key))
            results[resultKey][key] = fields[key].displayFunction(row[key], key);
        }

        results[resultKey].rows = [];
      };

      results[resultKey].rows.push(row);
    };
  };

  function processColumnLabelResults(){
    for (var key in displayFields.columnLabels) {
      if (displayFields.columnLabels.hasOwnProperty(key)) {
        var columnLabelColumns = {};
        for (var resultKey in results) {
          var values = pluckValues(results[resultKey].rows, fields[key]);

          for (var value in values){
            if (columnLabelColumns[value] === undefined)
              columnLabelColumns[value] = 1;
            else
              columnLabelColumns[value] += 1;

            results[resultKey][value] = getSummaryResults(values[value]);
          };
        }

        populateColumnLabelColumnsResults(key, columnLabelColumns);
      };
    };

    return results;
  };

  function pluckValues(rows, field){
    var i = -1, m = rows.length, output = {};
    while (++i < m){
      var value = rows[i][field.name];
      if (output[value] === undefined) output[value] = {rows: []}

      output[value].rows.push(rows[i]);
    };
    return output;
  }

  function processSummaryResults(){
    for (var resultKey in results) {
      getSummaryResults(results[resultKey])
    };

    return results;
  };

  function getSummaryResults(result){
    var output = {};
    for (var key in displayFields.summaries) {
      if (displayFields.summaries.hasOwnProperty(key)) {
        result[key] = fields[key].summarizeFunction(result.rows, fields[key]);
        result[key] = fields[key].displayFunction(result[key], key);
      }
    };

    return result;
  };

  function getResultArray(){
    var output  = [], keys  = objectKeys(results).sort(),
        i       = -1, m     = keys.length;

    while (++i < m){
      output.push(results[keys[i]])
    };


    return output;
  };

  function getColumnResults(){
    if (results === undefined || resultsColumns === undefined)
      getFormattedResults();

    return resultsColumns;
  }

  function populateSummaryColumnsResults(){
    for (var key in displayFields.summaries){
      if (displayFields.summaries.hasOwnProperty(key))
        resultsColumns.push({fieldName: key, width: 1, type: 'summary'})
    }

    return resultsColumns;
  };

  function populateColumnLabelColumnsResults(key, columnLabels){
    var keys  = objectKeys(columnLabels).sort(fields[key].sortFunction),
        i     = -1,
        m     = keys.length,
        w     = objectKeys(displayFields.summaries).length;

    while (++i < m){
      resultsColumns.push({fieldName: keys[i], width: w, type: 'column'})
    };


    return resultsColumns;
  }
// Entry Point
  return {
    init:     init,
    reset:    reset,
    config:   config,
    utils:    pivotUtils,
    csv:      processCSV,
    json:     processJSON,
    data:     pivotData,
    results:  pivotResults,
    fields:   pivotFields,
    filters:  pivotFilters,
    display:  pivotDisplay
  }
})();
