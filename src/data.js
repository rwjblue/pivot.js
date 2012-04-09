/**
 * Returns object containing the raw fields(rawData) and filtered fields(data).
 * @param  string, either 'raw', or 'all'.
 * @return {Object} An object containing lists of fields
 */
function pivotData(type) {
    var opts = {raw:        rawData,
                all:        data
              };

    if (type !== undefined) {
      return opts[type]
    } else {
      return opts
    };
  }