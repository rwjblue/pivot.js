'use strict';

var fields, filters, rawData, data, dataFilters, displayFields;

init();

function init(options){
  rawData = [], data = [], dataFilters = {}, fields = {}, filters = {};
  displayFields   = {label: {}, summary: {}};

  if (options === undefined) options = {};
  if (options.fields   !== undefined) setFields(options.fields);
  if (options.filters  !== undefined) setFilters(options.filters);
  if (options.label    !== undefined) setLabelDisplayFields(options.label);
  if (options.summary  !== undefined) setSummaryDisplayFields(options.summary);

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
  return {fields: getFields(), filters: filters, display: displayFields};
};