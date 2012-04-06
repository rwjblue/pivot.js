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