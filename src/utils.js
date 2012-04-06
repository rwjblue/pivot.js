function pivotUtils(){
    return {
      pad: pad,
      padRight: padRight,
      padLeft: padLeft,
      formatDate: formatDate,
      formatTime: formatTime,
      isArray: isArray,
      isRegExp: isRegExp,
      shallowClone: shallowClone,
      objectKeys: objectKeys,
      objectType: objectType,
      sortNumerically: sortNumerically
    }
  };

  function pad(sideToPad, input, width, padString){
    if (padString === undefined) padString = " ";

    input     = input.toString();
    padString = padString.toString();

    while (input.length < width) {
      if (sideToPad === "left")
        input = padString + input;
      else
        input = input + padString;
    }

    return input
  };

  function padRight(input, width, padString){
    return pad('right', input, width, padString)
  };

  function padLeft(input, width, padString){
    return pad('left', input, width, padString)
  };

  function formatDate(value){
    return value.getUTCFullYear() + '-' + padLeft((value.getUTCMonth() + 1), 2, "0") + '-' + padLeft(value.getUTCDate(), 2, '0');
  };

  function formatTime(value){
    return formatDate(value) + ' ' + padLeft(value.getUTCHours(), 2,'0') + ':' + padLeft(value.getUTCMinutes(),2,'0');
  };

  function isArray(arg){
    if(!Array.isArray)
      return objectType(arg) == 'array';
    else
      return Array.isArray(arg);
  };

  function isRegExp(arg){
    return objectType(arg) == 'regexp';
  };

  function shallowClone(input){
    var output = {};

    for (var key in input) {
      if (input.hasOwnProperty(key))
        output[key] = input[key];
    }

    return output;
  };

  function objectKeys(object){
    if (Object.keys) return Object.keys(object);

    var output = [];

    for (key in object){
      output.push(key);
    }

    return output;
  };

  function objectType(obj) {
    return ({}).toString.call(obj).match(/\s([a-z|A-Z]+)/)[1].toLowerCase();
  };

  function sortNumerically(array){
    return array.sort(function(a,b){ return a - b;});
  };