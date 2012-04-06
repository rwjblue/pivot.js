function pivotDisplay(){
    return {
      all:      pivotDisplayAll,
      label:    pivotDisplayLabel,
      summary:  pivotDisplaySummary
    }
  };

  function pivotDisplayAll(){
    return displayFields;
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

  function appendDisplayField(type, field){
    if (objectType(field) === 'string')
      field = fields[field];

    displayFields[type][field.name] = field;
  };

  function setDisplayFields(type, listing){
    displayFields[type] = {};

    var i = -1, m = listing.length;
    while (++i < m) {
      appendDisplayField(type, listing[i]);
    };
  };

  function setLabelDisplayFields(listing){
    setDisplayFields('label', listing);
  };

  function setSummaryDisplayFields(listing){
    setDisplayFields('summary', listing);
  };
