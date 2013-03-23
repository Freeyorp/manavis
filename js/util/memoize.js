/*
 * Helper function for memoization
 *
 * The passed labeller function must generate unique and exact names for entries that are naturally equal.
 * IDs are persistent.
 *
 * names, idByName, and entries are accessible fields from the memoizer.
 * Behaviour on external modification of these fields is undefined.
 *
 * An entry object passed to the memoizer has its field "id" set to the memoized id by default.
 * The name of the ID field can be modified by calling the getter/setter idField() from the memoizer.
 * Behaviour on changing the ID field used while the memoizer has already performed memoization is undefined.
 */
function memoize(labeller) {
  var idField = "id";
  var names = [];
  var idByName = {};
  var entries = [];
  var _memoizer = function(entry) {
    var name = labeller(entry);
    if (name in idByName) {
        /* We already have a suitable entry. */
        var id = idByName[name];
        return entries[id];
    }
    /* New entry. */
    /* Set the entry's ID. */
    entry[idField] = entries.length;
    /* Index the new entry. */
    idByName[name] = entry[idField];
    names[entry[idField]] = name;
    entries.push(entry);

    return entry;
  }
  _memoizer.names = function() { return names; };
  _memoizer.idByName = function() { return idByName; };
  _memoizer.entries = function() { return entries; };
  _memoizer.idField = function(x) {
    if (!arguments.length) return idField;
    idField = x;
    return _memoizer;
  };
  return _memoizer;
}
