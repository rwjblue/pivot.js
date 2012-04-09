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
      data:     getDataResults,
      columns:  getColumnResults
    }
  };

  function getDataResults(){
    applyFilter();
    results = {};

    var output  = [],
        i       = -1,
        m       = data.length,
        keys;

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

    for (resultKey in results) {
      for (var key in displayFields.summaries) {
        if (displayFields.summaries.hasOwnProperty(key)) {
          results[resultKey][key] = fields[key].summarizeFunction(results[resultKey].rows, fields[key]);
          results[resultKey][key] = fields[key].displayFunction(results[resultKey][key], key);
        }
      };
    };

    keys = objectKeys(results).sort();
    i = -1; m = keys.length;
    while (++i < m){
      output.push(results[keys[i]])
    };


    return output;
  };

  function getColumnResults(){

  };