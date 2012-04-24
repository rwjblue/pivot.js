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