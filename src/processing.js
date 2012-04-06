function processHeaderRow(row){
    var output = [];

    var o = {}, i = -1, m = row.length;
    while (++i < m) {
      var field = fields[row[i]];
      if (field === undefined) field = appendField(row[i]);
      output.push(field);
    };

    return output;
  };

  function processJSON(input) {
    var header,
        pseudoFields  = restrictFields('pseudo');

    if (objectType(input) === 'string') input = JSON.parse(input);
    rawData     = [];

    var o = {}, j = -1, m = input.length;
    while (++j < m) {
      if (j === 0)
        header = processHeaderRow(input[j]);
      else
        rawData.push(processRow(input[j], header, pseudoFields));
    };
  };

  // Accepts csv as a string
  function processCSV(text) {
    var header,
        pseudoFields = restrictFields('pseudo');

    rawData = processRows(text, function(row, i){
      if (i === 0)
        header = processHeaderRow(row);
      else
        return processRow(row, header, pseudoFields);
    });
  };

  function processRows(text, f) {
    var EOL = {}, // sentinel value for end-of-line
        EOF = {}, // sentinel value for end-of-file
        rows = [], // output rows
        re = /\r\n|[,\r\n]/g, // field separator regex
        n = 0, // the current line number
        t, // the current token
        eol; // is the current token followed by EOL?

    re.lastIndex = 0; // work-around bug in FF 3.6

    /** @private Returns the next token. */
    function token() {
      if (re.lastIndex >= text.length) return EOF; // special case: end of file
      if (eol) { eol = false; return EOL; } // special case: end of line

      // special case: quotes
      var j = re.lastIndex;
      if (text.charCodeAt(j) === 34) {
        var i = j;
        while (i++ < text.length) {
          if (text.charCodeAt(i) === 34) {
            if (text.charCodeAt(i + 1) !== 34) break;
            i++;
          }
        }
        re.lastIndex = i + 2;
        var c = text.charCodeAt(i + 1);
        if (c === 13) {
          eol = true;
          if (text.charCodeAt(i + 2) === 10) re.lastIndex++;
        } else if (c === 10) {
          eol = true;
        }
        return text.substring(j + 1, i).replace(/""/g, "\"");
      }

      // common case
      var m = re.exec(text);
      if (m) {
        eol = m[0].charCodeAt(0) !== 44;
        return text.substring(j, m.index);
      }
      re.lastIndex = text.length;
      return text.substring(j);
    }

    while ((t = token()) !== EOF) {
      var a = [];
      while ((t !== EOL) && (t !== EOF)) {
        a.push(t);
        t = token();
      }
      if (f && !(a = f(a, n++))) continue;
      rows.push(a);
    }

    return rows;
  };

  function processRow(row, header, pseudoFields) {
    // process actual fields
    var o = {}, j = -1, m = header.length;
    while (++j < m) {
      var value = castFieldValue(header[j].name, row[j]);
      o[header[j].name] = value;
      addFieldValue(header[j].name, value);
    };

    // process pseudo fields
    j = -1, m = pseudoFields.length;
    while (++j < m) {
      var field = pseudoFields[j],
          value = castFieldValue(field.name, field.pseudoFunction(o, field));
      o[field.name] = value;
      addFieldValue(field.name, value);
    };

    return o;
  };