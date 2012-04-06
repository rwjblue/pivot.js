function pivotFields(type){
    var opts = {
      all:          getFields,
      set:          setFields,
      filterable:   restrictFields('filterable'),
      summarizable: restrictFields('summarizable'),
      pseudo:       restrictFields('pseudo'),
      labelable:    restrictFields('labelable'),
      get:          getField,
      add:          appendField
    }

    if (type !== undefined) {
      return opts[type]
    } else {
      return opts
    };
  };

  function setFields(listing){
    fields = {};
    var i = -1, m = listing.length;
    while (++i < m) {
      appendField(listing[i]);
    }
  };

  function getFields(){
    var retFields = [];
    for (var key in fields) {
      if (fields.hasOwnProperty(key)) retFields[fields[key].index] = fields[key];
    }

    return retFields;
  };

  function restrictFields(type){
    var retFields = [];
    for (var key in fields) {
      if (fields.hasOwnProperty(key) && fields[key][type] === true) retFields.push(fields[key]);
    }

    return retFields;
  };

  function getField(name){
    return fields[name];
  };

  function defaultSummarizeFunctionSum(rows, field){
    var runningTotal  = 0,
        i             = -1,
        m             = rows.length;
    while (++i < m) {
      runningTotal += rows[i][field.dataSource];
    };
    return runningTotal;
  };

  function defaultSummarizeFunctionAvg(rows, field){
    return defaultSummarizeFunctionSum(rows, field)/rows.length;
  };

  function defaultSummarizeFunctionCount(rows, field){
    return rows.length;
  }

  function appendField(field){
    // if field is a simple string setup and object with that string as a name
    if (objectType(field) === 'string') field = {name: field};

    if (field.type              === undefined) field.type          = 'string';
    if (field.pseudo            === undefined) field.pseudo        = false;
    if (field.labelable         === undefined) field.labelable     = true;
    if (field.filterable        === undefined) field.filterable    = false;
    if (field.dataSource        === undefined) field.dataSource    = field.name;
    if (field.index             === undefined) field.index         = objectKeys(fields).length;

    if (field.summarizable && (field.labelable || field.filterable)) {
      var summarizable_field            = shallowClone(field);
      summarizable_field.labelable      = false;
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

    fields[field.name] = field;

    return field;
  };

  function addFieldValue(field, value){
    if (fields[field] === undefined || fields[field].filterable === false) return;

    if (fields[field].values[value] === undefined) {
      fields[field].values[value]        = {count: 1, displayValue: fields[field].displayFunction(value, field)};
    } else {
      fields[field].values[value].count += 1;
    }
  };

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
            var output = Date.parse(value);
            if (isNaN(output)) output = parseInt(value);
            return output;
        };
      default:
        return value.toString();
    }
  };