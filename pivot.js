/**
 * @class Pivot
 *
 * Pivot.js is a simple way for you to get to your data. It allows for the creation of highly customizable unique table views from your browser.
 */
var pivot = (function(){
'use strict';

var fields, filters, rawData, data, dataFilters, displayFields, results;

init();

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

function reset(){
  return init();
};

function config(){


  return {  fields: cloneFields(),
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

  function appendFilter(newRestriction) {
    for (var key in newRestriction) {
      if (newRestriction.hasOwnProperty(key))
        filters[key] = newRestriction[key];
    }

    castFilterValues();
  };

  function getFilters(){
    return filters;
  };

  function setFilters(restrictions){
    filters = restrictions;
    castFilterValues();
  };

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

  function getFields(){
    var retFields = [];
    for (var key in fields) {
      if (fields.hasOwnProperty(key)) retFields[fields[key].index] = fields[key];
    }

    return retFields;
  };

  function restrictFields(type){
    var retFields = [];
    for (var key in fields) {
      if (fields.hasOwnProperty(key) && fields[key][type] === true) retFields.push(fields[key]);
    }

    return retFields;
  };

  function getField(name){
    return fields[name];
  };

  function defaultSummarizeFunctionSum(rows, field){
    var runningTotal  = 0,
        i             = -1,
        m             = rows.length;
    while (++i < m) {
      runningTotal += rows[i][field.dataSource];
    };
    return runningTotal;
  };

  function defaultSummarizeFunctionAvg(rows, field){
    return defaultSummarizeFunctionSum(rows, field)/rows.length;
  };

  function defaultSummarizeFunctionCount(rows, field){
    return rows.length;
  }

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

  function addFieldValue(field, value){
    if (fields[field] === undefined || fields[field].filterable === false) return;

    if (fields[field].values[value] === undefined) {
      fields[field].values[value]        = {count: 1, displayValue: fields[field].displayFunction(value, field)};
    } else {
      fields[field].values[value].count += 1;
    }
  };

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
            var output = Date.parse(value);
            if (isNaN(output)) output = parseInt(value);
            return output;
        };
      default:
        return value.toString();
    }
  };
/**
 * Returns object containing the raw fields and filtered fields.
 * @param  type A string, either 'raw', or 'all'.
 * @return {Object} An object containing lists of fields
 * @return {Object} return.all() A collection of fields after filter has been applied.
 * @return {Object} return.raw() A collection of all fields.
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
  function pivotDisplay(){
    return {
      all:          pivotDisplayAll,
      rowLabels:    pivotDisplayRowLabels,
      columnLabels: pivotDisplayColumnLabels,
      summaries:    pivotDisplaySummaries
    }
  };

  function pivotDisplayAll(){
    return displayFields;
  };

  function pivotDisplayRowLabels(){
    return {
      set: setRowLabelDisplayFields,
      get: displayFields.rowLabels
    }
  };

  function pivotDisplayColumnLabels(){
    return {
      set: setColumnLabelDisplayFields,
      get: displayFields.columnLabels
    }
  };

  function pivotDisplaySummaries(){
    return {
      set: setSummaryDisplayFields,
      get: displayFields.summaries
    }
  };

  function appendDisplayField(type, field){
    if (objectType(field) === 'string')
      field = fields[field];

    results = undefined;

    displayFields[type][field.name] = field;
  };

  function setDisplayFields(type, listing){
    displayFields[type] = {};

    var i = -1, m = listing.length;
    while (++i < m) {
      appendDisplayField(type, listing[i]);
    };
  };

  function setRowLabelDisplayFields(listing){
    setDisplayFields('rowLabels', listing);
  };

  function setColumnLabelDisplayFields(listing){
    setDisplayFields('columnLabels', listing);
  };

  function setSummaryDisplayFields(listing){
    setDisplayFields('summaries', listing);
  };
  function pivotResults(){
    return {
      all:      getFormattedResults,
      columns:  getColumnResults
    }
  };

  function getFormattedResults(){
    if (results !== undefined) return getResultArray();

    processRowLabelResults();

    if (objectKeys(displayFields.columnLabels).length > 0)
      processColumnLabelResults();
    else
      processSummaryResults();

    return getResultArray();
  };

  function processRowLabelResults(){
    applyFilter();
    results = {};

    var i = -1, m = data.length, keys;

    while (++i < m) {
      var row       = data[i],
          resultKey = '';

      for (var key in displayFields.rowLabels) {
        if (displayFields.rowLabels.hasOwnProperty(key)) resultKey += key + ':' + row[key] + '|';
      }
      if (results[resultKey] === undefined) {
        results[resultKey] = {};

        for (var key in displayFields.rowLabels) {
          if (displayFields.rowLabels.hasOwnProperty(key)) results[resultKey][key] = fields[key].displayFunction(row[key], key);
        }

        results[resultKey].rows = [];
      };

      results[resultKey].rows.push(row);
    };
  };

  function processColumnLabelResults(){
    for (var resultKey in results) {
      for (var key in displayFields.columnLabels) {
        if (displayFields.columnLabels.hasOwnProperty(key)) {
          var values = pluckValues(results[resultKey].rows, fields[key]);

          for (var value in values){
            results[resultKey][value] = getSummaryResults(values[value]);
          };
        }
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

  };
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
