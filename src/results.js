  function pivotResults(){
    return {
      all:      getFormattedResults,
      columns:  populateColumnResults
    }
  };

  function getFormattedResults(){
    if (results !== undefined) return getResultArray();

    results = {}; resultsColumns = {};

    processRowLabelResults();

    if (objectKeys(displayFields.columnLabels).length > 0)
      processColumnLabelResults();
    else
      processSummaryResults();

    //populateColumnResults();

    return getResultArray();
  };

  function processRowLabelResults(){
    applyFilter();

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

  function populateColumnResults(){
    populateRowLabelColumnsResults();
    populateColumnLabelColumnsResults();

    return resultsColumns;
  };

  function populateRowLabelColumnsResults(){
    for (var key in displayFields.rowLabels){
      resultsColumns[displayFields.rowLabels[i]]
    }

    return resultsColumns
  };

  function populateColumnLabelColumnsResults(){

  };