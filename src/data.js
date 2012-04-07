/**
 * Returns object containing the raw fields and filtered fields.
 * @param  type A string, either 'raw', or 'all'.
 * @return {Object} An object containing lists of fields
 * @return {Object} return.all() A collection of fields after filter has been applied.
 * @return {Object} return.raw() A collection of all fields.
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