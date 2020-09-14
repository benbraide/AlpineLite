"use strict";
exports.__esModule = true;
exports.AlpineLite = void 0;
var AlpineLite;
(function (AlpineLite) {
    var Stack = /** @class */ (function () {
        function Stack() {
            this.list_ = new Array();
        }
        Stack.prototype.Push = function (value) {
            this.list_.push(value);
        };
        Stack.prototype.Pop = function () {
            return this.list_.pop();
        };
        Stack.prototype.Peek = function () {
            return ((this.list_.length == 0) ? null : this.list_[this.list_.length - 1]);
        };
        Stack.prototype.IsEmpty = function () {
            return (this.list_.length == 0);
        };
        return Stack;
    }());
    AlpineLite.Stack = Stack;
})(AlpineLite = exports.AlpineLite || (exports.AlpineLite = {}));
