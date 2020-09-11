export var AlpineLite;
(function (AlpineLite) {
    class Value {
        constructor(callback) {
            this.callback_ = callback;
        }
        Get(valueContext, elementContext) {
            return this.callback_(valueContext, elementContext);
        }
    }
    AlpineLite.Value = Value;
})(AlpineLite || (AlpineLite = {}));
