"use strict";
exports.__esModule = true;
exports.AlpineLite = void 0;
var AlpineLite;
(function (AlpineLite) {
    var Value = /** @class */ (function () {
        function Value(callback) {
            this.callback_ = callback;
        }
        Value.prototype.Get = function (valueContext, elementContext) {
            return this.callback_(valueContext, elementContext);
        };
        return Value;
    }());
    AlpineLite.Value = Value;
})(AlpineLite = exports.AlpineLite || (exports.AlpineLite = {}));
