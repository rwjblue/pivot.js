var pivot = (function(){
  'use strict'; // Function-level strict mode syntax

  var fields, filters, rawData, data, results, dataFilters, displayFields;

  init();
  function init(options){
    rawData         = [];
    data            = [];
    dataFilters     = {};
    results         = [];

    if (options === undefined) options = {};

    (options.fields         === undefined) ? fields         = {}                        : setFields(options.fields);
    (options.filters        === undefined) ? filters        = {}                        : setFilters(options.filters);
    (options.displayFields  === undefined) ? displayFields  = {label: {}, summary: {}}  : displayFields = options.displayFields;

    return pivot;
  }

  function reset(){
    return init();
  };

  //*******************************
  // CSV Processing
  //*******************************

  // Accepts csv as a string
  function processCSV(text) {
    var header,
        pseudoFields = restrictFields('pseudo');

    rawData = processRows(text, function(row, i) {
      if (i > 0) {
        // process actual fields
        var o = {}, j = -1, m = header.length;
        while (++j < m) {
          var value = castFieldValue(header[j], row[j]);
          o[header[j]] = value;
          addFieldValue(header[j], value);
        };

        // process pseudo fields
        j = -1, m = pseudoFields.length;
        while (++j < m) {
          var field = pseudoFields[j],
              value = castFieldValue(field.name, field.pseudoFunction(o));
          o[field.name] = value;
          addFieldValue(field.name, value);
        };

        return o;
      } else {
        header = row;
        return null;
      }
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

  //*******************************
  // Filtering
  //*******************************
  function pivotFilters(type){
    var opts = {
      all:    filters,
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
    for (field in filters){
      if (restrictions.hasOwnProperty(field))
        restrictions[field] = castFieldValue(field, restrictions[field])
    };
  };

  function appendFilter(newRestriction) {
    for (var key in newRestriction) {
      if (newRestriction.hasOwnProperty(key))
        filters[key] = newRestriction[key];
    }

    castFilterValues();
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

    var dataToFilterLength = dataToFilter.length,
        filterLength = Object.keys(filters).length;

    for (var i = 0; i < dataToFilterLength; i++) {
      var row     = dataToFilter[i],
          matches = 0;

      for (var key in filters) {
        if (filters.hasOwnProperty(key) && row.hasOwnProperty(key) && row[key] === filters[key])
          matches += 1;
      }

      if (matches === filterLength) {
        filteredData.push(row);
      };
    };

    data = filteredData;
    setDataFilters();
    return data;
  };

  function setDataFilters(){
    dataFilters = {};

    for (var key in filters) {
      if (filters.hasOwnProperty(key))
        dataFilters[key] = filters[key];
    }
  };

  function preserveFilteredData(){
    var matches = 0,
        dataFiltersLength = Object.keys(dataFilters).length;

    for (var key in dataFilters) {
      if (dataFilters.hasOwnProperty(key) && dataFilters.hasOwnProperty(key) && filters[key] === dataFilters[key])
        matches += 1;
    }

    return dataFiltersLength > 0 && matches >= dataFiltersLength;
  };

  //*******************************
  // Fields
  //*******************************
  function pivotFields(type){
    var opts = {
      all:          getFields,
      set:          setFields,
      filterable:   restrictFields('filterable'),
      summarizable: restrictFields('summarizable'),
      pseudo:       restrictFields('pseudo'),
      labelable:    restrictFields('labelable'),
      get:          getField,
      add:          appendField
    }

    if (type !== undefined) {
      return opts[type]
    } else {
      return opts
    };
  };

  function setFields(listing){
    fields = {};
    for (var i = 0; i < listing.length; i++) {
      appendField(listing[i]);
    }
  };

  function getFields(){
    var retFields = [];
    for (var key in fields) {
      if (fields.hasOwnProperty(key)) retFields.push(fields[key]);
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

  function appendField(field){
    // if field is a simple string setup and object with that string as a name
    if (Object.prototype.toString.call(field) === '[object String]') field = {name: field};

    if (field.type          === undefined) field.type          = 'String';
    if (field.pseudo        === undefined) field.pseudo        = false;
    if (field.labelable     === undefined) field.labelable     = true;
    if (field.filterable    === undefined) field.filterable    = false;
    if (field.summarizable  === undefined) field.summarizable  = false;

    if (field.summarizable && field.summarizeFunction === undefined)
      field.summarizeFunction = function(rows){ return rows.length };

    if (field.pseudo && field.pseudoFunction === undefined)
      field.pseudoFunction = function(row){ return '' };

    field.values = {};

    fields[field.name] = field;

    return field;
  };

  function addFieldValue(field, value){
    if (fields[field] === undefined || fields[field].filterable === false) return;

    if (fields[field].values[value] === undefined)
      fields[field].values[value] = 0;
    else
      fields[field].values[value] += 1;
  };

  function castFieldValue(fieldName, value){
    var field;
    if (Object.prototype.toString.call(fieldName) === '[object String]') field = fields[fieldName];
    if (field === undefined) field = appendField(fieldName);

    switch (field.type){
      case "integer":
        return parseInt(value, 10);
      case "float":
        return parseFloat(value, 10);
      case "date":
        return new Date(value);
      default:
        return value.toString();
    }
  };

  //*******************************
  // Data
  //*******************************
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

  //*******************************
  // Display
  //*******************************
  function pivotDisplay(){
    return {
      label:    pivotDisplayLabel,
      summary:  pivotDisplaySummary
    }
  };

  function pivotDisplayLabel(){
    return {
      set: setLabelDisplayFields,
      get: displayFields.label
    }
  };

  function pivotDisplaySummary(){
    return {
      set: setSummaryDisplayFields,
      get: displayFields.summary
    }
  };

  function setDisplayFields(type, listing){
    var field;
    for (var i = 0; i < listing.length; i++) {
      if (Object.prototype.toString.call(listing[i]) === '[object String]')
        field = fields[listing[i]];
      else
        field = listing[i];

      displayFields[type][field.name] = field;
    };
  };

  function setLabelDisplayFields(listing){
    setDisplayFields('label', listing);
  };

  function setSummaryDisplayFields(listing){
    setDisplayFields('summary', listing);
  };

  //*******************************
  // Results
  //*******************************
  function pivotResults(){
    return {
      data:     getDataResults,
      columns:  getColumnResults
    }
  };

  function getDataResults(){
    applyFilter();
    results = {};

    for (var i = 0; i < data.length; i++) {
      var row       = data[i],
          resultKey = '';

      for (var key in displayFields.label) {
        if (displayFields.label.hasOwnProperty(key)) resultKey += key + ':' + row[key] + '|';
      }
      if (results[resultKey] === undefined) {
        results[resultKey] = {};

        for (var key in displayFields.label) {
          if (displayFields.label.hasOwnProperty(key)) results[resultKey][key] = row[key];
        }

        results[resultKey].rows = [];
      };

      results[resultKey].rows.push(row);
    };

    for (resultKey in results) {
      for (var key in displayFields.summary) {
        if (displayFields.summary.hasOwnProperty(key))
          results[resultKey][key] = fields[key].summarizeFunction(results[resultKey].rows);
      };
    };

    return results;
  };

  function getColumnResults(){

  };

  // Entry Point
  return {
    csv:      processCSV,
    data:     pivotData,
    results:  getDataResults,
    fields:   pivotFields,
    filters:  pivotFilters,
    display:  pivotDisplay,
    init:     init,
    reset:    reset
  }
})();