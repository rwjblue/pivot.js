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
