import * as StackScope from './Stack.js';
import * as ValueScope from './Value.js';
export var AlpineLite;
(function (AlpineLite) {
    let StateFlag;
    (function (StateFlag) {
        StateFlag[StateFlag["StaticBind"] = 0] = "StaticBind";
        StateFlag[StateFlag["DebugEnabled"] = 1] = "DebugEnabled";
    })(StateFlag = AlpineLite.StateFlag || (AlpineLite.StateFlag = {}));
    class State {
        constructor(changes, rootElement) {
            this.changes_ = null;
            this.elementId_ = 0;
            this.elementContext_ = new StackScope.AlpineLite.Stack();
            this.valueContext_ = new StackScope.AlpineLite.Stack();
            this.eventContext_ = new StackScope.AlpineLite.Stack();
            this.localKeys_ = new Array();
            this.flags_ = new Map();
            this.changes_ = changes;
            this.rootElement_ = rootElement;
            this.localKeys_['$locals'] = new ValueScope.AlpineLite.Value((valueContext) => {
                return null;
            });
        }
        GenerateElementId() {
            return ++this.elementId_;
        }
        GetElementId(element) {
            let id = element.getAttribute(State.GetIdKey());
            if (!id) { //Not initialized
                id = this.GenerateElementId().toString();
                element.setAttribute(State.GetIdKey(), id);
            }
            return id;
        }
        GetChanges() {
            return this.changes_;
        }
        GetRootElement() {
            return this.rootElement_;
        }
        GetAncestorElement(target, index) {
            if (!target || target === this.rootElement_) {
                return null;
            }
            let ancestor = target;
            for (; 0 < index && ancestor && ancestor !== this.rootElement_; --index) {
                ancestor = ancestor.parentElement;
            }
            return ((0 < index) ? null : ancestor);
        }
        PushElementContext(element) {
            this.elementContext_.Push(element);
        }
        PopElementContext() {
            return this.elementContext_.Pop();
        }
        GetElementContext() {
            return this.elementContext_.Peek();
        }
        PushValueContext(Value) {
            this.valueContext_.Push(Value);
        }
        PopValueContext() {
            return this.valueContext_.Pop();
        }
        GetValueContext() {
            return this.valueContext_.Peek();
        }
        PushEventContext(Value) {
            this.eventContext_.Push(Value);
        }
        PopEventContext() {
            return this.eventContext_.Pop();
        }
        GetEventContext() {
            return this.eventContext_.Peek();
        }
        GetLocal(name) {
            return ((name in this.localKeys_) ? this.localKeys_[name] : null);
        }
        PushFlag(key, Value) {
            if (!(key in this.flags_)) {
                this.flags_[key] = new StackScope.AlpineLite.Stack();
            }
            this.flags_[key].Push(Value);
        }
        PopFlag(key) {
            return ((key in this.flags_) ? this.flags_[key].Pop() : null);
        }
        GetFlag(key) {
            return ((key in this.flags_) ? this.flags_[key].Peek() : null);
        }
        ReportError(value, ref) {
            console.error(value, ref);
        }
        ReportWarning(value, ref, isDebug = true) {
            if (!isDebug || this.GetFlag(StateFlag.DebugEnabled)) {
                console.warn(value, ref);
            }
        }
        TrapGetAccess(callback, changeCallback, element) {
            let getAccessStorage = {};
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
            let paths = Object.keys(getAccessStorage);
            if (paths.length == 0) {
                return;
            }
            let onChange = (change) => {
                let newGetAccessStorage = {};
                try {
                    this.changes_.PushGetAccessStorage(newGetAccessStorage);
                    if (changeCallback === true) {
                        callback(change);
                    }
                    else {
                        changeCallback(change);
                    }
                }
                catch (err) {
                    this.ReportError(err, 'AlpineLine.State.TrapAccess.onChange');
                }
                this.changes_.PopGetAccessStorage(); //Stop listening for get events
                Object.keys(newGetAccessStorage).forEach((path) => {
                    if (!(path in getAccessStorage)) { //New path
                        getAccessStorage[path] = '';
                        this.changes_.AddListener(path, onChange, element);
                    }
                });
            };
            paths.forEach((path) => {
                this.changes_.AddListener(path, onChange, element);
            });
        }
        static GetIdKey() {
            return '__AlpineLiteId__';
        }
    }
    AlpineLite.State = State;
})(AlpineLite || (AlpineLite = {}));
