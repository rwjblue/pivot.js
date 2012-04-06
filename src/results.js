  function pivotResults(){
    return {
      all:      getFormattedResults,
      columns:  getColumnResults
    }
  };

  function getFormattedResults(){
    if (results !== undefined) return getResultArray();

    processRowLabelResults();

    if (objectKeys(displayFields.columnLabels) > 0)
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

  function processSummaryResults(){
    for (var resultKey in results) {
      for (var key in displayFields.summaries) {
        if (displayFields.summaries.hasOwnProperty(key)) {
          results[resultKey][key] = fields[key].summarizeFunction(results[resultKey].rows, fields[key]);
          results[resultKey][key] = fields[key].displayFunction(results[resultKey][key], key);
        }
      };
    };

    return results;
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