function pivotUtils() {
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
        sortNumerically: sortNumerically,
        isNumber: isNumber,
        formatCurrency: formatCurrency
    }
};

function pad(sideToPad, input, width, padString) {
    if (padString === undefined) padString = " ";

    input = input.toString();
    padString = padString.toString();

    while (input.length < width) {
        if (sideToPad === "left")
            input = padString + input;
        else
            input = input + padString;
    }

    return input
};

function padRight(input, width, padString) {
    return pad('right', input, width, padString)
};

function padLeft(input, width, padString) {
    return pad('left', input, width, padString)
};

function formatDate(value) {
    return value.getUTCFullYear() + '-' + padLeft((value.getUTCMonth() + 1), 2, "0") + '-' + padLeft(value.getUTCDate(), 2, '0');
};

function formatTime(value) {
    return formatDate(value) + ' ' + padLeft(value.getUTCHours(), 2, '0') + ':' + padLeft(value.getUTCMinutes(), 2, '0');
};

function formatCurrency(value, field, row) {
    var baseRow = row;
    //summary functions will return a row.rows.
    //row only contains visible rowLables
    //rows contains all the 'summed' rows, with all properties
    //use this to safely find the currency symbol
    if (isArray(baseRow.rows)) {
        baseRow = baseRow.rows[0];
    }
    //no built in 3rd party library support
    //can be easily handled with custom 'displayFunction' 
    var rowCurrency = baseRow[currencySymbolField];

    if (rowCurrency === undefined) {
        rowCurrency = defaultCurrencySymbol;
    }

    //format
    var result = value;
    if (isNumber(value)) { //may be a currency error, in which case just return
        if (accountingJsSupported()) {
            result = accounting.formatMoney(value, rowCurrency);
        } else {
            result = rowCurrency + value.toFixed(2);
        }
    }


    return result;
};

function accountingJsSupported() {
    return typeof accounting !== 'undefined' &&
           objectType(accounting) === 'object' &&
           objectType(accounting.formatMoney) === 'function';
};

function isNumber(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
}

function isArray(arg) {
    if (!Array.isArray)
        return objectType(arg) == 'array';
    else
        return Array.isArray(arg);
};

function isRegExp(arg) {
    return objectType(arg) == 'regexp';
};

function shallowClone(input) {
    var output = {};

    for (var key in input) {
        if (input.hasOwnProperty(key))
            output[key] = input[key];
    }

    return output;
};

function objectKeys(object) {
    if (Object.keys) return Object.keys(object);

    var output = [];

    for (key in object) {
        output.push(key);
    }

    return output;
};

function objectType(obj) {
    return ({}).toString.call(obj).match(/\s([a-z|A-Z]+)/)[1].toLowerCase();
};

function sortNumerically(array) {
    return array.sort(function (a, b) { return a - b; });
};