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
