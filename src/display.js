  /**
  * Entry point for several display methods.  See {@link pivot#pivotDisplayAll}, {@link pivot#pivotDisplayRowLabels}, {@link  pivot#pivotDisplaycolumnLabels}, and {@link pivot#pivotDisplaySummaries}
  * @return {function} One of the fucntions defined above.
  */
  function pivotDisplay(){
    return {
      all:          pivotDisplayAll,
      rowLabels:    pivotDisplayRowLabels,
      columnLabels: pivotDisplayColumnLabels,
      summaries:    pivotDisplaySummaries
    }
  };

  /**
  * This will return an object containing rowLabels, summaries, and columnLabels that are currently applied to the pivot.
  */
  function pivotDisplayAll(){
    return displayFields;
  };

  /**
  * Returns either list of rowLabels or allows you to access the {@link pivot#setRowLabelDisplayFields}.
  *
  * Called from pivot like so: pivot.display().rowLabels().set() or pivot.display().rowLabels().get
  */
  function pivotDisplayRowLabels(){
    return {
      set: setRowLabelDisplayFields,
      get: displayFields.rowLabels
    }
  };

  /**
  * Returns either list of columnLabels or allows you to access the {@link pivot#setColumnLabelDisplayFields}.
  *
  * Called from pivot like so: pivot.display().columnLabels().set() or pivot.display().columnLabels().get
  */
  function pivotDisplayColumnLabels(){
    return {
      set: setColumnLabelDisplayFields,
      get: displayFields.columnLabels
    }
  };

  /**
  * Returns either list of summaries (labels) or allows you to access the {@link pivot#setSummaryDisplayFields}.
  *
  * Called from pivot like so: pivot.display().summaries().set() or pivot.display().summaries().get
  */
  function pivotDisplaySummaries(){
    return {
      set: setSummaryDisplayFields,
      get: displayFields.summaries
    }
  };

  /**
  * This method allows you to append a new label field to the specified type. For example, you could set a new displayRowLabel by sending it as the type and 'city' as the field
  * @param string type - must be either 'rowLabels', 'columnLabels', or 'summaries'
  * @param string field - Specify the label you would like to add.
  * @private
  * @return {undefined}
  */
  function appendDisplayField(type, field){
    if (objectType(field) === 'string')
      field = fields[field];

    resetResults();
    displayFields[type][field.name] = field;
  };

  /**
  * This method simply calls appendDisplayField on a collection passing in each to appendDisplayField.  The object should look something like the following
  *    {'rowLabels':['city','state'],'columnLabels':['billed_amount']}
  * @private
  * @return {undefined}
  */
  function setDisplayFields(type, listing){
    displayFields[type] = {};
    resetResults();

    var i = -1, m = listing.length;
    while (++i < m) {
      appendDisplayField(type, listing[i]);
    };
  };

  /**
  * Allows setting of row label fields
  * @param listing Should look like ['city','state']
  * @return {undefined}
  */
  function setRowLabelDisplayFields(listing){
    setDisplayFields('rowLabels', listing);
  };

  /**
  * Allows setting of column label fields
  * @param listing - Should look like ['city','state']
  * @return {undefined}
  */
  function setColumnLabelDisplayFields(listing){
    setDisplayFields('columnLabels', listing);
  };

  /**
  * Allows setting of summary label fields
  * @param listing - Should look like ['billed_amount']
  * @return {undefined}
  */
  function setSummaryDisplayFields(listing){
    setDisplayFields('summaries', listing);
  };