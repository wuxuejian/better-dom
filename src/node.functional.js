var _ = require("./utils"),
    $Node = require("./node"),
    makeLoopMethod = (function(){
        var rcallback = /cb\.call\(([^)]+)\)/g,
            defaults = {
                BEGIN: "",
                COUNT:  "this ? this.length : 0",
                BODY:   "",
                END:  "return this"
            };

        return function(options) {
            var code = "%BEGIN%\nfor(var i=0,n=%COUNT%;i<n;++i){%BODY%}%END%", key;

            for (key in defaults) {
                code = code.replace("%" + key + "%", options[key] || defaults[key]);
            }
            // improve performance by using call method on demand
            code = code.replace(rcallback, function(expr, args) {
                return "(that?" + expr + ":cb(" + args.split(",").slice(1).join() + "))";
            });

            return Function("cb", "that", "undefined", code);
        };
    })();

_.extend($Node.prototype, {
    /**
     * Execute callback on each element in the collection
     * @memberOf $Node.prototype
     * @param  {Function} callback  function that accepts (element, index, this)
     * @param  {Object}   [context] callback context
     * @return {$Node}
     * @function
     */
    each: makeLoopMethod({
        BODY:  "cb.call(that, this[i], i, this)"
    }),
    /**
     * Check if the callback returns true for any element in the collection
     * @memberOf $Node.prototype
     * @param  {Function} callback   function that accepts (element, index, this)
     * @param  {Object}   [context]  callback context
     * @return {Boolean} true, if any element in the collection return true
     * @function
     */
    some: makeLoopMethod({
        BODY:  "if (cb.call(that, this[i], i, this) === true) return true",
        END:   "return false"
    }),
    /**
     * Check if the callback returns true for all elements in the collection
     * @memberOf $Node.prototype
     * @param  {Function} callback   function that accepts (element, index, this)
     * @param  {Object}   [context]  callback context
     * @return {Boolean} true, if all elements in the collection returns true
     * @function
     */
    every: makeLoopMethod({
        BEGIN: "var out = true",
        BODY:  "out = cb.call(that, this[i], i, this) && out",
        END:   "return out"
    }),
    /**
     * Create an array of values by running each element in the collection through the callback
     * @memberOf $Node.prototype
     * @param  {Function} callback   function that accepts (element, index, this)
     * @param  {Object}   [context]  callback context
     * @return {Array} new array of the results of each callback execution
     * @function
     */
    map: makeLoopMethod({
        BEGIN: "var out = Array(this && this.length || 0)",
        BODY:  "out[i] = cb.call(that, this[i], i, this)",
        END:   "return out"
    }),
    /**
     * Examine each element in a collection, returning an array of all elements the callback returns truthy for
     * @memberOf $Node.prototype
     * @param  {Function} callback   function that accepts (element, index, this)
     * @param  {Object}   [context]  callback context
     * @return {Array} new array with elements where callback returned true
     * @function
     */
    filter: makeLoopMethod({
        BEGIN: "var out = []",
        BODY:  "if (cb.call(that, this[i], i, this)) out.push(this[i])",
        END:   "return out"
    }),
    /**
     * Boil down a list of values into a single value (from start to end)
     * @memberOf $Node.prototype
     * @param  {Function} callback function that accepts (memo, element, index, this)
     * @param  {Object}   [memo]   initial value of the accumulator
     * @return {Object} the accumulated value
     * @function
     */
    reduce: makeLoopMethod({
        BEGIN: "if (arguments.length < 2) that = this[0]",
        BODY:  "that = cb(that, this[arguments.length < 2 ? i + 1 : i], i, this)",
        END:   "return that"
    }),
    /**
     * Boil down a list of values into a single value (from end to start)
     * @memberOf $Node.prototype
     * @param  {Function} callback function that accepts (memo, element, index, this)
     * @param  {Object}   [memo]   initial value of the accumulator
     * @return {Object} the accumulated value
     * @function
     */
    reduceRight: makeLoopMethod({
        BEGIN: "var j; if (arguments.length < 2) that = this[this.length - 1]",
        BODY:  "j = n - i - 1; that = cb(that, this[arguments.length < 2 ? j - 1 : j], j, this)",
        END:   "return that"
    }),
    /**
     * Execute code in a 'unsafe' block where the first callback argument is native object.
     * @memberOf $Node.prototype
     * @param  {Function} callback function that accepts (node, element, index, this)
     * @return {$Node}
     * @function
     */
    legacy: makeLoopMethod({
        BEGIN: "that = this",
        BODY:  "cb.call(that, this[i]._node, this[i], i)"
    })
});
