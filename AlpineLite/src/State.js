"use strict";
exports.__esModule = true;
exports.AlpineLite = void 0;
var StackScope = require("./Stack");
var ValueScope = require("./Value");
var AlpineLite;
(function (AlpineLite) {
    var StateFlag;
    (function (StateFlag) {
        StateFlag[StateFlag["StaticBind"] = 0] = "StaticBind";
        StateFlag[StateFlag["DebugEnabled"] = 1] = "DebugEnabled";
    })(StateFlag = AlpineLite.StateFlag || (AlpineLite.StateFlag = {}));
    var State = /** @class */ (function () {
        function State(changes, rootElement) {
            this.changes_ = null;
            this.elementId_ = 0;
            this.elementContext_ = new StackScope.AlpineLite.Stack();
            this.valueContext_ = new StackScope.AlpineLite.Stack();
            this.eventContext_ = new StackScope.AlpineLite.Stack();
            this.localKeys_ = new Array();
            this.flags_ = new Map();
            this.changes_ = changes;
            this.rootElement_ = rootElement;
            this.localKeys_['$locals'] = new ValueScope.AlpineLite.Value(function (valueContext) {
                return null;
            });
        }
        State.prototype.GenerateElementId = function () {
            return ++this.elementId_;
        };
        State.prototype.GetElementId = function (element) {
            var id = element.getAttribute(State.GetIdKey());
            if (!id) { //Not initialized
                id = this.GenerateElementId().toString();
                element.setAttribute(State.GetIdKey(), id);
            }
            return id;
        };
        State.prototype.GetChanges = function () {
            return this.changes_;
        };
        State.prototype.GetRootElement = function () {
            return this.rootElement_;
        };
        State.prototype.GetAncestorElement = function (target, index) {
            if (!target || target === this.rootElement_) {
                return null;
            }
            var ancestor = target;
            for (; 0 < index && ancestor && ancestor !== this.rootElement_; --index) {
                ancestor = ancestor.parentElement;
            }
            return ((0 < index) ? null : ancestor);
        };
        State.prototype.PushElementContext = function (element) {
            this.elementContext_.Push(element);
        };
        State.prototype.PopElementContext = function () {
            return this.elementContext_.Pop();
        };
        State.prototype.GetElementContext = function () {
            return this.elementContext_.Peek();
        };
        State.prototype.PushValueContext = function (Value) {
            this.valueContext_.Push(Value);
        };
        State.prototype.PopValueContext = function () {
            return this.valueContext_.Pop();
        };
        State.prototype.GetValueContext = function () {
            return this.valueContext_.Peek();
        };
        State.prototype.PushEventContext = function (Value) {
            this.eventContext_.Push(Value);
        };
        State.prototype.PopEventContext = function () {
            return this.eventContext_.Pop();
        };
        State.prototype.GetEventContext = function () {
            return this.eventContext_.Peek();
        };
        State.prototype.GetLocal = function (name) {
            return ((name in this.localKeys_) ? this.localKeys_[name] : null);
        };
        State.prototype.PushFlag = function (key, Value) {
            if (!(key in this.flags_)) {
                this.flags_[key] = new StackScope.AlpineLite.Stack();
            }
            this.flags_[key].Push(Value);
        };
        State.prototype.PopFlag = function (key) {
            return ((key in this.flags_) ? this.flags_[key].Pop() : null);
        };
        State.prototype.GetFlag = function (key) {
            return ((key in this.flags_) ? this.flags_[key].Peek() : null);
        };
        State.prototype.ReportError = function (value, ref) {
            console.error(value, ref);
        };
        State.prototype.ReportWarning = function (value, ref, isDebug) {
            if (isDebug === void 0) { isDebug = true; }
            if (!isDebug || this.GetFlag(StateFlag.DebugEnabled)) {
                console.warn(value, ref);
            }
        };
        State.prototype.TrapGetAccess = function (callback, changeCallback, element) {
            var _this = this;
            var getAccessStorage = {};
            if (changeCallback && !this.GetFlag(StateFlag.StaticBind)) { //Listen for get events
                this.changes_.PushGetAccessStorage(getAccessStorage);
            }
            try {
                callback(null);
            }
            catch (err) {
                this.ReportError(err, 'AlpineLine.State.TrapAccess');
            }
            if (!changeCallback || this.GetFlag(StateFlag.StaticBind)) {
                return;
            }
            this.changes_.PopGetAccessStorage(); //Stop listening for get events
            var paths = Object.keys(getAccessStorage);
            if (paths.length == 0) {
                return;
            }
            var onChange = function (change) {
                var newGetAccessStorage = {};
                try {
                    _this.changes_.PushGetAccessStorage(newGetAccessStorage);
                    if (changeCallback === true) {
                        callback(change);
                    }
                    else {
                        changeCallback(change);
                    }
                }
                catch (err) {
                    _this.ReportError(err, 'AlpineLine.State.TrapAccess.onChange');
                }
                _this.changes_.PopGetAccessStorage(); //Stop listening for get events
                Object.keys(newGetAccessStorage).forEach(function (path) {
                    if (!(path in getAccessStorage)) { //New path
                        getAccessStorage[path] = '';
                        _this.changes_.AddListener(path, onChange, element);
                    }
                });
            };
            paths.forEach(function (path) {
                _this.changes_.AddListener(path, onChange, element);
            });
        };
        State.GetIdKey = function () {
            return '__AlpineLiteId__';
        };
        return State;
    }());
    AlpineLite.State = State;
})(AlpineLite = exports.AlpineLite || (exports.AlpineLite = {}));
