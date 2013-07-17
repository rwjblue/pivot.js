  /**
  * Entry point for several field methods.
  * See:
  *
  * * restrictFields()
  * * cloneFields()
  * * appendField()
  * * getFields()
  * * getField()
  * * setField()
  *
  * @param {String}
  * @return {function} One of the fucntions defined above.
  */
  function pivotFields(type){
    var opts = {
      columnLabelable:  restrictFields('columnLabelable'),
      rowLabelable:     restrictFields('rowLabelable'),
      summarizable:     restrictFields('summarizable'),
      filterable:       restrictFields('filterable'),
      pseudo:           restrictFields('pseudo'),
      clone:            cloneFields,
      add:              appendField,
      all:              getFields,
      set:              setFields,
      get:              getField
    }

    if (type !== undefined) {
      return opts[type]
    } else {
      return opts
    };
  };
  /**
  * Method for setting multiple fields.  Usually used on pivot.init().
  * See {@link pivot#appendField} for more information.
  * @param {Object}
  * @return {undefined}
  */
  function setFields(listing){
    fields = {};
    var i = -1, m = listing.length;
    while (++i < m) {
      appendField(listing[i]);
    }
  };

  function cloneFields(){
    var fieldsOutput = [];
    for (var field in fields){
      var newField = {};
      for (var key in fields[field]){
        if (fields[field].hasOwnProperty(key) && key !== 'values')
          newField[key] = fields[field][key];
      }
      fieldsOutput.push(newField);
    }

    return fieldsOutput;
  }

  /**
  * Returns array of defined field objects.
  */
  function getFields(){
    var retFields = [];
    for (var key in fields) {
      if (fields.hasOwnProperty(key)) retFields[fields[key].index] = fields[key];
    }

    return retFields;
  };

  /**
  * Returns list of defined fields filtered by type
  * @param {String} 'columnLabelable', 'rowLabelable', 'summarizable', 'filterable', or 'pseudo'
  */
  function restrictFields(type){
    var retFields = [];
    for (var key in fields) {
      if (fields.hasOwnProperty(key) && fields[key][type] === true) retFields.push(fields[key]);
    }

    return retFields;
  };

  /**
  * Attr reader for fields
  * @param {String} Something like 'last_name'
  */
  function getField(name){
    return fields[name];
  };

  /**
  * Returns the sum value of all rows passed to it.
  */
  function defaultSummarizeFunctionSum(rows, field){
    var runningTotal  = 0,
        i             = -1,
        m             = rows.length;
    while (++i < m) {
      runningTotal += rows[i][field.dataSource];
    };
    return runningTotal;
  };

  /**
  * Returns Average of values passed in from rows
  */
  function defaultSummarizeFunctionAvg(rows, field){
    return defaultSummarizeFunctionSum(rows, field)/rows.length;
  };

  /**
  * Returns count of rows
  */
  function defaultSummarizeFunctionCount(rows, field){
    return rows.length;
  }

  /**
  * The main engine by which you create and assign field.  Takes an object that should look something like {name: 'last_name',type: 'string', filterable: true}, and assigns all the associated attributes to their correct state.
  * Allowed field attributes are
  * * filterable - Allows you to filter based off this field
  * * rowLabelable - Allows you to display rowLabels based off this field
  * * columnLabelable - Allows you to display columnLabels based off this field
  * * summarizable - Allows you to create a summary field.
  * * pseudo - Allows you to treat an anonymous function as a field (ie you could treat the sum of a set of values as a field)
  * * sortFunction - Allows you to override the default sort function for columnLabelable fields.
  * * displayFunction - Allows you to override the default display function. Using this function you can completely customize the way a field is displayed without having to modify the internal storage.
  * Be sure to run through the source on this one if you are unsure as to what it does.  It's pretty straightforward, but definitely bears looking into.
  * @param {Object} field
  */
  function appendField(field){
    // if field is a simple string setup and object with that string as a name
    if (objectType(field) === 'string') field = {name: field};

    if (field.type              === undefined) field.type             = 'string';
    if (field.pseudo            === undefined) field.pseudo           = false;
    if (field.rowLabelable      === undefined) field.rowLabelable     = true;
    if (field.columnLabelable   === undefined) field.columnLabelable  = false;
    if (field.filterable        === undefined) field.filterable       = false;
    if (field.dataSource        === undefined) field.dataSource       = field.name;

    if (field.summarizable && (field.rowLabelable || field.columnLabelable || field.filterable)) {
      var summarizable_field            = shallowClone(field);
      summarizable_field.rowLabelable   = false;
      summarizable_field.filterable     = false;
      summarizable_field.dataSource     = field.name;

      if (summarizable_field.summarizable !== true)
        summarizable_field.name = summarizable_field.name + '_' + summarizable_field.summarizable;
      else
        summarizable_field.name = summarizable_field.name + '_count'

      appendField(summarizable_field);

      field.summarizable  = false;
      field.summarizeFunction = undefined;
    } else if (field.summarizable) {
      if (field.summarizeFunction === undefined){
        switch (field.summarizable){
          case 'sum':
            field.summarizeFunction = defaultSummarizeFunctionSum;
            break;
          case 'avg':
            field.summarizeFunction = defaultSummarizeFunctionAvg;
            break;
          default:
            field.summarizeFunction = defaultSummarizeFunctionCount;
            break;
        };

        field.summarizable  = true;
      };
    } else {
      field.summarizable  = false
    }

    if (field.pseudo && field.pseudoFunction === undefined)
      field.pseudoFunction = function(row){ return '' };

    if (field.displayFunction === undefined)
      field.displayFunction = displayFieldValue;

    field.values        = {};
    field.displayValues = {};

    field.index         = objectKeys(fields).length;
    fields[field.name]  = field;

    return field;
  };

  /**
  * Adds value to field based off of the Fields' displayFunction, defaults to count.
  */
  function addFieldValue(field, value){
    if (fields[field] === undefined || fields[field].filterable === false) return;

    if (fields[field].values[value] === undefined) {
      fields[field].values[value]        = {count: 1, displayValue: fields[field].displayFunction(value, field)};
    } else {
      fields[field].values[value].count += 1;
    }
  };

  /**
  * Helper for displaying properly formated field values.
  */
  function displayFieldValue(value, fieldName){
    var field;
    if (objectType(fieldName) === 'string') field = fields[fieldName];
    if (field === undefined) field = appendField(fieldName);

    switch (field.type){
      case "cents":
        return '$' + (value/100).toFixed(2);
      case "currency":
        return '$' + value.toFixed(2);
      case "date":
        return formatDate(new Date(value));
      case "time":
        return formatTime(new Date(value));
      default:
        return value;
    }
  }

  /**
  * Used to change the string value as parsed from the CSV into the type of field it expects.
  */
  function castFieldValue(fieldName, value){
    var field, retValue;
    if (objectType(fieldName) === 'string') field = fields[fieldName];
    if (field === undefined) field = appendField(fieldName);

    switch (field.type){
      case "integer":
      case "cents":
        if (objectType(value) === 'number')
          return value;
        else
          return parseInt(value, 10);
      case "float":
      case "currency":
        if (objectType(value) === 'number')
          return value;
        else
          return parseFloat(value, 10);
      case "date":
      case "time":
        switch (objectType(value)){
          case 'number':
          case 'date':
            return value;
          default:
            if (/^\d+$/.test(value))
              return parseInt(value);
            else
              return Date.parse(value);
        };
      default:
        return value.toString();
    }
  };
