"use strict";
exports.__esModule = true;
exports.AlpineLite = void 0;
var StackScope = require("./Stack");
var AlpineLite;
(function (AlpineLite) {
    var Changes = /** @class */ (function () {
        function Changes(msDelay) {
            var _this = this;
            if (msDelay === void 0) { msDelay = 10; }
            this.listeners_ = {};
            this.list_ = new Array();
            this.getAccessStorage_ = new StackScope.AlpineLite.Stack();
            this.listeners_ = {};
            if (0 < msDelay) {
                setInterval(function () {
                    if (_this.list_.length == 0) {
                        return;
                    }
                    var list = _this.list_;
                    _this.list_ = new Array();
                    for (var _i = 0, list_1 = list; _i < list_1.length; _i++) { //Traverse changes
                        var item = list_1[_i];
                        if (item.path in _this.listeners_) {
                            for (var _a = 0, _b = _this.listeners_[item.path]; _a < _b.length; _a++) { //Traverse listeners
                                var listener = _b[_a];
                                listener.callback(item);
                            }
                        }
                    }
                }, msDelay);
            }
        }
        Changes.prototype.Add = function (item) {
            this.list_.push(item);
        };
        Changes.prototype.AddGetAccess = function (name, path) {
            var storage = this.getAccessStorage_.Peek();
            if (storage) {
                storage[path] = name;
            }
        };
        Changes.prototype.AddListener = function (path, callback, element) {
            this.listeners_[path].push({
                callback: callback,
                element: element
            });
        };
        Changes.prototype.RemoveListener = function (path, callback) {
            if (!callback) {
                delete this.listeners_[path];
                return;
            }
            for (var i = 0; i < this.listeners_[path].length; ++i) {
                if (this.listeners_[path][i].callback === callback) {
                    this.listeners_[path].slice(i, 1);
                    break;
                }
            }
        };
        Changes.prototype.RemoveListeners = function (element) {
            for (var path in this.listeners_) {
                for (var i = this.listeners_[path].length; i > 0; --i) {
                    if (this.listeners_[path][i - 1].element === element) {
                        this.listeners_[path].slice((i - 1), 1);
                    }
                }
            }
        };
        Changes.prototype.PushGetAccessStorage = function (storage) {
            this.getAccessStorage_.Push(storage);
        };
        Changes.prototype.PopGetAccessStorage = function () {
            return this.getAccessStorage_.Pop();
        };
        Changes.prototype.RetrieveGetAccessStorage = function () {
            return this.getAccessStorage_;
        };
        return Changes;
    }());
    AlpineLite.Changes = Changes;
})(AlpineLite = exports.AlpineLite || (exports.AlpineLite = {}));
