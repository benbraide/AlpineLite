"use strict";
let AlpineLiteJSProxy = Proxy;
var AlpineLite;
(function (AlpineLite) {
    //Stack begin
    class Stack {
        constructor() {
            this.list_ = new Array();
        }
        Push(value) {
            this.list_.push(value);
        }
        Pop() {
            return this.list_.pop();
        }
        Peek() {
            return ((this.list_.length == 0) ? null : this.list_[this.list_.length - 1]);
        }
        IsEmpty() {
            return (this.list_.length == 0);
        }
    }
    AlpineLite.Stack = Stack;
    //Value begin
    class Value {
        constructor(callback) {
            this.callback_ = callback;
        }
        Get(valueContext, elementContext) {
            return this.callback_(valueContext, elementContext);
        }
    }
    AlpineLite.Value = Value;
    //Changes begin
    class Changes {
        constructor(msDelay = 10) {
            this.listeners_ = {};
            this.list_ = new Array();
            this.getAccessStorage_ = new Stack();
            this.listeners_ = {};
            if (0 < msDelay) {
                setInterval(() => {
                    if (this.list_.length == 0) {
                        return;
                    }
                    let list = this.list_;
                    this.list_ = new Array();
                    for (let item of list) { //Traverse changes
                        if (item.path in this.listeners_) {
                            for (let listener of this.listeners_[item.path]) { //Traverse listeners
                                listener.callback(item);
                            }
                        }
                    }
                }, msDelay);
            }
        }
        Add(item) {
            this.list_.push(item);
        }
        AddGetAccess(name, path) {
            let storage = this.getAccessStorage_.Peek();
            if (storage) {
                storage[path] = name;
            }
        }
        AddListener(path, callback, element) {
            if (!(path in this.listeners_)) {
                this.listeners_[path] = new Array();
            }
            this.listeners_[path].push({
                callback: callback,
                element: element
            });
        }
        RemoveListener(path, callback) {
            if (!(path in this.listeners_)) {
                return;
            }
            if (!callback) {
                delete this.listeners_[path];
                return;
            }
            for (let i = 0; i < this.listeners_[path].length; ++i) {
                if (this.listeners_[path][i].callback === callback) {
                    this.listeners_[path].slice(i, 1);
                    break;
                }
            }
        }
        RemoveListeners(element) {
            for (let path in this.listeners_) {
                for (let i = this.listeners_[path].length; i > 0; --i) {
                    if (this.listeners_[path][i - 1].element === element) {
                        this.listeners_[path].slice((i - 1), 1);
                    }
                }
            }
        }
        PushGetAccessStorage(storage) {
            this.getAccessStorage_.Push(storage);
        }
        PopGetAccessStorage() {
            return this.getAccessStorage_.Pop();
        }
        RetrieveGetAccessStorage() {
            return this.getAccessStorage_;
        }
    }
    AlpineLite.Changes = Changes;
    let StateFlag;
    (function (StateFlag) {
        StateFlag[StateFlag["StaticBind"] = 0] = "StaticBind";
        StateFlag[StateFlag["DebugEnabled"] = 1] = "DebugEnabled";
    })(StateFlag = AlpineLite.StateFlag || (AlpineLite.StateFlag = {}));
    //State begin
    class State {
        constructor(changes_, rootElement_, componentFinder_) {
            this.changes_ = changes_;
            this.rootElement_ = rootElement_;
            this.componentFinder_ = componentFinder_;
            this.elementId_ = 0;
            this.elementContext_ = new Stack();
            this.valueContext_ = new Stack();
            this.eventContext_ = new Stack();
            this.localKeys_ = new Array();
            this.flags_ = new Map();
            this.localKeys_['$locals'] = new Value((valueContext) => {
                return null;
            });
        }
        FindComponent(id) {
            return (this.componentFinder_ ? this.componentFinder_(id) : null);
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
                this.flags_[key] = new Stack();
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
            return '__alpineliteid__';
        }
    }
    AlpineLite.State = State;
    //Proxy types
    class ProxyNoResult {
    }
    AlpineLite.ProxyNoResult = ProxyNoResult;
    class ProxyStopPropagation {
        constructor(value) {
            this.value = value;
        }
    }
    AlpineLite.ProxyStopPropagation = ProxyStopPropagation;
    let ProxyRequireType;
    (function (ProxyRequireType) {
        ProxyRequireType[ProxyRequireType["Nil"] = 0] = "Nil";
        ProxyRequireType[ProxyRequireType["Required"] = 1] = "Required";
        ProxyRequireType[ProxyRequireType["MustBeAbsent"] = 2] = "MustBeAbsent";
    })(ProxyRequireType = AlpineLite.ProxyRequireType || (AlpineLite.ProxyRequireType = {}));
    //Proxy begin
    class Proxy {
        constructor(details) {
            this.proxies_ = {};
            this.proxy_ = null;
            this.details_ = details;
            if (!this.details_.parent && !this.details_.name) {
                this.details_.name = 'root';
            }
            if (this.details_.parent && this.details_.element) {
                this.details_.element = null;
            }
            this.Init_();
        }
        Uninit(element) {
            this.details_.parent = null;
            this.details_.element = null;
        }
        Init_() {
            if (!this.details_.target) {
                return;
            }
            let self = this;
            let handler = {
                get(target, prop) {
                    var _a;
                    if (typeof prop === 'symbol' || (typeof prop === 'string' && prop === 'prototype')) {
                        return Reflect.get(target, prop);
                    }
                    let element = (self.details_.restricted ? self.details_.element : self.GetContextElement());
                    let name = prop.toString();
                    let keyResult = Proxy.HandleSpecialKey(target, name, self);
                    if (!(keyResult instanceof ProxyNoResult)) { //Value returned
                        return Proxy.ResolveValue(keyResult, element);
                    }
                    if (element) {
                        let value = Proxy.Get(element, name, !(prop in target), self.details_.state);
                        if (!(value instanceof ProxyNoResult)) { //Value returned
                            return Proxy.ResolveValue(value, element);
                        }
                    }
                    let baseValue = ((prop in target) ? Reflect.get(target, prop) : null);
                    let value = Proxy.Create({
                        target: baseValue,
                        name: name,
                        parent: self,
                        element: null,
                        state: self.details_.state
                    });
                    let changes = (_a = self.details_.state) === null || _a === void 0 ? void 0 : _a.GetChanges();
                    if (changes) {
                        changes.AddGetAccess(name, self.GetPath(name));
                    }
                    if (value) {
                        return value.proxy_;
                    }
                    return baseValue;
                },
                set(target, prop, value) {
                    if (typeof prop === 'symbol' || (typeof prop === 'string' && prop === 'prototype')) {
                        return Reflect.set(target, prop, value);
                    }
                    let exists = (prop in target);
                    let nonProxyValue = Proxy.GetNonProxy(value);
                    let element = (self.details_.restricted ? self.details_.element : self.GetContextElement());
                    if (element && Proxy.Set(self.GetContextElement(), prop.toString(), nonProxyValue, !exists, self.details_.state)) {
                        return true;
                    }
                    target[prop] = nonProxyValue;
                    if (prop in self.proxies_) {
                        self.proxies_[prop].details_.parent = null;
                        delete self.proxies_[prop];
                    }
                    self.Alert_('set', prop.toString(), exists, value, true);
                    return true;
                },
                deleteProperty(target, prop) {
                    if (typeof prop === 'symbol' || (typeof prop === 'string' && prop === 'prototype')) {
                        return Reflect.deleteProperty(target, prop);
                    }
                    let exists = (prop in target);
                    let element = (self.details_.restricted ? self.details_.element : self.GetContextElement());
                    if (element && Proxy.Delete(self.GetContextElement(), prop.toString(), self.details_.state)) {
                        return true;
                    }
                    if (self.details_.parent) {
                        self.details_.parent.Alert_('delete', self.details_.name, exists, { name: prop, value: target[prop] }, false);
                    }
                    delete target[prop];
                    if (prop in self.proxies_) {
                        self.proxies_[prop].details_.parent = null;
                        delete self.proxies_[prop];
                    }
                    return true;
                },
                has(target, prop) {
                    return (typeof prop !== 'symbol' || Reflect.has(target, prop));
                },
            };
            this.proxy_ = new AlpineLiteJSProxy(this.details_.target, handler);
            if (this.details_.parent) {
                this.details_.parent.proxies_[this.details_.name] = this;
            }
        }
        Alert_(type, name, exists, value, alertChildren) {
            var _a;
            let change = {
                type: type,
                name: name,
                path: this.GetPath(name),
                exists: exists,
                value: value
            };
            let changes = (_a = this.details_.state) === null || _a === void 0 ? void 0 : _a.GetChanges();
            if (changes) {
                changes.Add(change);
            }
            if (this.details_.parent) {
                this.details_.parent.BubbleAlert_(change);
            }
            if (alertChildren) {
                this.AlertChildren_(change);
            }
        }
        BubbleAlert_(change) {
            var _a;
            let changes = (_a = this.details_.state) === null || _a === void 0 ? void 0 : _a.GetChanges();
            if (changes) {
                changes.Add({
                    original: change,
                    name: this.details_.name,
                    path: this.GetPath()
                });
            }
            if (this.details_.parent) {
                this.details_.parent.BubbleAlert_(change);
            }
        }
        AlertChildren_(change) {
            var _a;
            let changes = (_a = this.details_.state) === null || _a === void 0 ? void 0 : _a.GetChanges();
            if (!changes) {
                return;
            }
            for (let name in this.proxies_) {
                if (changes) {
                    changes.Add({
                        original: change,
                        name: this.proxies_[name].details_.name,
                        path: this.proxies_[name].GetPath()
                    });
                }
                this.proxies_[name].AlertChildren_(change);
            }
        }
        IsRoot() {
            return !this.details_.parent;
        }
        GetDetails() {
            return this.details_;
        }
        GetPath(append = '') {
            if (append !== '') {
                append = ('.' + append);
            }
            return (this.details_.parent ? this.details_.parent.GetPath(this.details_.name + append) : (this.details_.name + append));
        }
        GetPathList() {
            if (!this.details_.parent) {
                return [this.details_.name];
            }
            let list = this.details_.parent.GetPathList();
            list.push(this.details_.name);
            return list;
        }
        GetContextElement() {
            return ((this.details_.parent || !this.details_.state) ? null : (this.details_.element || this.details_.state.GetElementContext()));
        }
        GetProxy() {
            return this.proxy_;
        }
        GetChildProxy(name) {
            return ((name in this.proxies_) ? this.proxies_[name] : null);
        }
        static Create(details) {
            if (details.parent && (details.name in details.parent.proxies_)) { //Use previously created proxy
                return details.parent.proxies_[details.name];
            }
            let target = details.target;
            let targetType = typeof target;
            if (!target || targetType === 'string' || targetType === 'function' || targetType !== 'object') {
                return null;
            }
            return new Proxy(details);
        }
        static Get(element, name, always, state) {
            if (!element) {
                return new ProxyNoResult();
            }
            let pk = Proxy.GetProxyKey();
            let initialized = (pk in element);
            let changes = state === null || state === void 0 ? void 0 : state.GetChanges();
            if (initialized && (name in element[pk])) {
                let value = Proxy.Create({
                    target: element[pk].raw[name],
                    name: name,
                    parent: element[pk].proxy,
                    element: null,
                    state: state
                });
                if (changes) {
                    changes.AddGetAccess(name, element[pk].proxy.GetPath(name));
                }
                if (value === null) {
                    return element[pk].raw[name];
                }
                return value;
            }
            let value;
            if (element === (state === null || state === void 0 ? void 0 : state.GetRootElement())) {
                value = new ProxyNoResult();
            }
            else {
                value = Proxy.Get(element.parentElement, name, false, state);
            }
            if (!always || !(value instanceof ProxyNoResult)) { //Value returned or 'always' disabled
                return value;
            }
            if (!initialized) { //Initialize
                let raw = { name: null };
                element[pk] = {
                    raw: raw,
                    proxy: Proxy.Create({
                        target: raw,
                        name: element.dataset.id,
                        parent: null,
                        element: element,
                        state: state
                    })
                };
            }
            else {
                element[pk].raw[name] = null;
                if (changes) {
                    changes.AddGetAccess(name, element[pk].proxy.GetPath(name));
                }
            }
            if (changes) {
                changes.AddGetAccess(name, element[pk].proxy.GetPath(name));
            }
            return null;
        }
        static Set(element, name, value, always, state) {
            if (!element) {
                return false;
            }
            let pk = Proxy.GetProxyKey();
            let initialized = (pk in element);
            if (initialized && (name in element[pk])) {
                element[pk].raw[name] = value;
                element[pk].proxy.Alert_('set', name, true, value, true);
                return true;
            }
            let result;
            if (element === (state === null || state === void 0 ? void 0 : state.GetRootElement())) {
                result = false;
            }
            else {
                result = Proxy.Set(element.parentElement, name, value, false, state);
            }
            if (!always || result) {
                return result;
            }
            if (!initialized) { //Initialize
                let raw = { name: value };
                element[pk] = {
                    raw: raw,
                    proxy: Proxy.Create({
                        target: raw,
                        name: element.dataset.id,
                        parent: null,
                        element: element,
                        state: state
                    })
                };
            }
            else {
                element[pk].raw[name] = value;
                element[pk].proxy.Alert_('set', name, true, value, true);
            }
            return true;
        }
        static Delete(element, name, state) {
            if (!element) {
                return false;
            }
            let pk = Proxy.GetProxyKey();
            let initialized = (pk in element);
            if (initialized && (name in element[pk])) {
                let raw = element[pk].raw;
                let proxy = element[pk].proxy;
                if (proxy.details_.parent) {
                    proxy.details_.parent.Alert_('delete', proxy.details_.name, true, { name: name, value: raw[name] }, false);
                }
                delete proxy[name];
                delete raw[name];
                return true;
            }
            if (element === (state === null || state === void 0 ? void 0 : state.GetRootElement())) {
                return false;
            }
            return Proxy.Delete(element.parentElement, name, state);
        }
        static GetNonProxy(target) {
            if (target instanceof Proxy) {
                return Proxy.GetNonProxy(target.details_.target);
            }
            return target;
        }
        static ResolveValue(value, element) {
            if (value instanceof Value) {
                return value.Get();
            }
            return value;
        }
        static GetProxyKey() {
            return '__AlpineLiteProxy__';
        }
        static AddSpecialKey(key, handler) {
            if (!(key in Proxy.specialKeys_)) {
                Proxy.specialKeys_[key] = new Array();
            }
            Proxy.specialKeys_[key].push(handler);
        }
        static HandleSpecialKey(target, name, proxy) {
            if (!(name in Proxy.specialKeys_)) {
                return new ProxyNoResult();
            }
            let result = new ProxyNoResult();
            let handlers = Proxy.specialKeys_[name];
            for (let i = 0; i < handlers.length; ++i) {
                result = (handlers[i])(target, name, proxy, result);
                if (result instanceof ProxyStopPropagation) {
                    return result.value;
                }
            }
            return result;
        }
        static AddCoreSpecialKeys() {
            let addKey = (key, callback, requireRoot, requireElement) => {
                Proxy.AddSpecialKey(key, (target, name, proxy) => {
                    if (requireRoot == ProxyRequireType.Required && proxy.details_.parent) {
                        return new ProxyNoResult();
                    }
                    if (requireRoot == ProxyRequireType.MustBeAbsent && !proxy.details_.parent) {
                        return new ProxyNoResult();
                    }
                    if (requireElement == ProxyRequireType.Required && !proxy.details_.element) {
                        return new ProxyNoResult();
                    }
                    if (requireElement == ProxyRequireType.MustBeAbsent && proxy.details_.element) {
                        return new ProxyNoResult();
                    }
                    return callback(target, name, proxy);
                });
            };
            let addRootKey = (key, callback) => {
                addKey(key, (target, name, proxy) => {
                    return callback(target, name, proxy);
                }, ProxyRequireType.Required, ProxyRequireType.MustBeAbsent);
            };
            let addElementKey = (key, callback) => {
                addKey(key, (target, name, proxy) => {
                    return callback(target, name, proxy);
                }, ProxyRequireType.Nil, ProxyRequireType.Required);
            };
            let addAnyKey = (key, callback) => {
                addKey(key, (target, name, proxy) => {
                    return callback(target, name, proxy);
                }, ProxyRequireType.Nil, ProxyRequireType.Nil);
            };
            addRootKey('$component', (target, name, proxy) => {
                return (id) => {
                    return proxy.details_.state.FindComponent(id);
                };
            });
            addAnyKey('$get', (target, name, proxy) => {
                return (prop) => {
                    var _a;
                    let baseValue = ((prop in target) ? Reflect.get(target, prop) : null);
                    let value = Proxy.Create({
                        target: baseValue,
                        name: name,
                        parent: proxy,
                        element: null,
                        state: proxy.details_.state
                    });
                    let changes = (_a = proxy.details_.state) === null || _a === void 0 ? void 0 : _a.GetChanges();
                    if (changes) {
                        changes.AddGetAccess(name, proxy.GetPath(name));
                    }
                    if (value) {
                        return value.proxy_;
                    }
                    return baseValue;
                };
            });
        }
    }
    Proxy.specialKeys_ = new Map();
    AlpineLite.Proxy = Proxy;
    //Evaluator begin
    class Evaluator {
        constructor(state) {
            this.state_ = null;
            this.state_ = state;
        }
        GetState() {
            return this.state_;
        }
        Evaluate(expression) {
            return Evaluator.Evaluate(expression, this.state_);
        }
        EvaluateWith(expression, elementContext, valueContext) {
            if (!this.state_) {
                return null;
            }
            this.state_.PushElementContext(elementContext);
            if (valueContext) {
                this.state_.PushValueContext(valueContext);
            }
            let value = Evaluator.Evaluate(expression, this.state_);
            if (valueContext) {
                this.state_.PopValueContext();
            }
            this.state_.PopElementContext();
            return value;
        }
        Interpolate(expression) {
            return Evaluator.Interpolate(expression, this.state_);
        }
        InterpolateWith(expression, elementContext, valueContext) {
            if (!this.state_) {
                return '';
            }
            this.state_.PushElementContext(elementContext);
            if (valueContext) {
                this.state_.PushValueContext(valueContext);
            }
            let value = Evaluator.Interpolate(expression, this.state_);
            if (valueContext) {
                this.state_.PopValueContext();
            }
            this.state_.PopElementContext();
            return value;
        }
        static Evaluate(expression, state) {
            expression = expression.trim();
            if (expression === '') {
                return null;
            }
            let result = null;
            let elementContext = (state ? state.GetElementContext() : null);
            let valueContext = (state ? state.GetValueContext() : null);
            try {
                if (valueContext) {
                    result = (new Function(Evaluator.GetContextKey(), `
                        with (${Evaluator.GetContextKey()}){
                            return (${expression});
                        };
                    `)).bind(elementContext)(valueContext);
                }
                else {
                    result = (new Function(`
                        return (${expression});
                    `))();
                }
            }
            catch (err) {
                state.ReportError(err, `AlpineLite.Evaluator.Value(${expression})`);
            }
            return result;
        }
        static Interpolate(expression, state) {
            return expression.replace(/\{\{(.+?)\}\}/g, ($0, $1) => {
                return (Evaluator.Evaluate($1, state) || '');
            });
        }
        static GetContextKey() {
            return '__AlpineLiteContext__';
        }
    }
    AlpineLite.Evaluator = Evaluator;
    //Handler interfaces
    let HandlerReturn;
    (function (HandlerReturn) {
        HandlerReturn[HandlerReturn["Nil"] = 0] = "Nil";
        HandlerReturn[HandlerReturn["Handled"] = 1] = "Handled";
        HandlerReturn[HandlerReturn["Rejected"] = 2] = "Rejected";
    })(HandlerReturn || (HandlerReturn = {}));
    //Handler begin
    class Handler {
        constructor() {
            this.directiveHandlers_ = new Map();
            this.bulkDirectiveHandlers_ = new Array();
        }
        AddDirectiveHandler(directive, handler) {
            this.directiveHandlers_[directive] = handler;
        }
        AddBulkDirectiveHandler(handler) {
            this.bulkDirectiveHandlers_.push(handler);
        }
        HandleDirective(directive, element, state) {
            for (let i = 0; i < this.bulkDirectiveHandlers_.length; ++i) {
                let result = this.bulkDirectiveHandlers_[i](directive, element, state);
                if (result != HandlerReturn.Nil) { //Handled or rejected
                    return result;
                }
            }
            if (directive.key in this.directiveHandlers_) { //Call handler
                return this.directiveHandlers_[directive.key](directive, element, state);
            }
            return HandlerReturn.Nil;
        }
    }
    AlpineLite.Handler = Handler;
    //Processor begin
    class Processor {
        constructor(state, handler) {
            this.state_ = null;
            this.handler_ = null;
            this.state_ = state;
            this.handler_ = handler;
        }
        All(node, options) {
            if (!Processor.Check(node, options)) { //Check failed -- ignore
                return;
            }
            let isTemplate = (node.nodeType == 1 && node.tagName == 'TEMPLATE');
            if (!isTemplate && (options === null || options === void 0 ? void 0 : options.checkTemplate) && Processor.GetHTMLElement(node).closest('template')) { //Inside template -- ignore
                return;
            }
            this.One(node);
            if (isTemplate || node.nodeType == 3) { //Don't process template content OR node is text node (no content)
                return;
            }
            node.childNodes.forEach((node) => {
                this.All(node);
            });
        }
        One(node, options) {
            if (!Processor.Check(node, options)) { //Check failed -- ignore
                return;
            }
            let isTemplate = (node.nodeType == 1 && node.tagName == 'TEMPLATE');
            if (!isTemplate && (options === null || options === void 0 ? void 0 : options.checkTemplate) && Processor.GetHTMLElement(node).closest('template')) { //Inside template -- ignore
                return;
            }
            if (node.nodeType == 3) { //Text node
                return;
            }
            let elementNode = node;
            Processor.TraverseDirectives(elementNode, (directive) => {
                return this.DispatchDirective(directive, elementNode);
            }, (attribute) => {
                return true;
            });
        }
        DispatchDirective(directive, element) {
            let result;
            try {
                this.state_.PushElementContext(element);
                result = this.handler_.HandleDirective(directive, element, this.state_);
                this.state_.PopElementContext();
            }
            catch (err) {
                this.state_.PopElementContext();
                this.state_.ReportError(err, `AlpineLite.Processor.DispatchDirective._Handle_.${directive.key}`);
                return true;
            }
            if (result == HandlerReturn.Nil) { //Not handled
                if (1 < directive.parts.length && directive.parts[0] === 'static') {
                    this.state_.PushFlag(StateFlag.StaticBind, true);
                    try {
                        let newDirective = {
                            original: directive.original,
                            parts: directive.parts.splice(1),
                            raw: '',
                            key: '',
                            value: directive.value
                        };
                        newDirective.raw = newDirective.parts.join('-');
                        newDirective.key = Processor.GetCamelCaseDirectiveName(newDirective.raw);
                        if (this.DispatchDirective(newDirective, element)) {
                            result = HandlerReturn.Handled;
                        }
                        else {
                            result = HandlerReturn.Rejected;
                        }
                    }
                    catch (err) {
                        this.state_.ReportError(err, `AlpineLite.Processor.DispatchDirective._Handle_.${directive.key}`);
                    }
                    this.state_.PopFlag(StateFlag.StaticBind);
                }
                else {
                    this.state_.ReportWarning(`'${directive.original}': Handler not found. Skipping...`, `AlpineLite.Processor.DispatchDirective._Handle_.${directive.key}`);
                }
            }
            if (result == HandlerReturn.Rejected) {
                return false;
            }
            element.removeAttribute(directive.original);
            if (result == HandlerReturn.Handled) {
                Processor.GetElementId(element, this.state_);
            }
            return true;
        }
        static Check(node, options) {
            if (node.nodeType != 1 && node.nodeType != 3) { //Node is not an element or a text node
                return false;
            }
            if ((options === null || options === void 0 ? void 0 : options.checkDocument) && !document.contains(node)) { //Node is not contained inside the document
                return false;
            }
            return true;
        }
        static GetHTMLElement(node) {
            return ((node.nodeType == 1) ? node : node.parentElement);
        }
        static TraverseDirectives(element, callback, noMatchCallback) {
            let attributes = new Array();
            for (let i = 0; i < element.attributes.length; ++i) { //Duplicate attributes
                attributes.push(element.attributes[i]);
            }
            for (let i = 0; i < attributes.length; ++i) { //Traverse attributes
                let directive = Processor.GetDirective(attributes[i]);
                if (!directive && noMatchCallback && !noMatchCallback(attributes[i])) {
                    return;
                }
                if (directive && !callback(directive)) {
                    return;
                }
            }
        }
        static GetDirective(attribute) {
            let matches = attribute.name.match(/^(data-)?x-(.+)$/);
            if (!matches || matches.length != 3 || !matches[2]) { //Not a directive
                return null;
            }
            return {
                original: attribute.name,
                parts: matches[2].split('-'),
                raw: matches[2],
                key: Processor.GetCamelCaseDirectiveName(matches[2]),
                value: attribute.value
            };
        }
        static GetCamelCaseDirectiveName(name) {
            return name.replace(/-([^-])/g, ($0, $1) => {
                return ($1.charAt(0).toUpperCase() + $1.slice(1));
            });
        }
        static GetElementId(element, state) {
            return state.GetElementId(element);
        }
        static GetIdKey() {
            return State.GetIdKey();
        }
    }
    AlpineLite.Processor = Processor;
    //PlaceholderElement begin
    class PlaceholderElement extends HTMLElement {
        static Register() {
            customElements.define('x-placeholder', PlaceholderElement);
        }
    }
    AlpineLite.PlaceholderElement = PlaceholderElement;
    //ConditionGroup begin
    class ConditionGroup {
        constructor() {
            this.handlers_ = new Array();
        }
        AddHandler(handler) {
            this.handlers_.push(handler);
        }
        CallHandlers() {
            let isHandled = false;
            this.handlers_.forEach((handler) => {
                isHandled = (handler(isHandled) || isHandled);
            });
        }
        GetCount() {
            return this.handlers_.length;
        }
    }
    AlpineLite.ConditionGroup = ConditionGroup;
    //CoreBulkHandler begin
    class CoreBulkHandler {
        static AddOutsideEventHandler(eventName, info, state) {
            if (!(eventName in CoreBulkHandler.outsideEventsHandlers_)) {
                CoreBulkHandler.outsideEventsHandlers_[eventName] = new Array();
                document.addEventListener(eventName, (event) => {
                    state.PushEventContext(event);
                    let handlers = CoreBulkHandler.outsideEventsHandlers_[eventName];
                    handlers.forEach((info) => {
                        if (event.target !== info.element && !info.element.contains(event.target)) {
                            try {
                                info.handler(event); //Event is outside element
                            }
                            catch (err) {
                                state.ReportError(err, `AlpineLite.CoreHandler.AddOutsideEventHandler._Trigger_.${eventName}`);
                            }
                        }
                    });
                    state.PopEventContext();
                });
            }
            CoreBulkHandler.outsideEventsHandlers_[eventName].push(info);
        }
        static RemoveOutsideEventHandlers(element, checkTemplate = true) {
            let isTemplate = (element.tagName == 'TEMPLATE');
            if (!isTemplate && checkTemplate && element.closest('template')) { //Inside template -- ignore
                return;
            }
            for (let eventName in CoreBulkHandler.outsideEventsHandlers_) {
                let list = CoreBulkHandler.outsideEventsHandlers_[eventName];
                for (let i = list.length; 0 < i; --i) { //Check list for matching element
                    if (list[i - 1].element === element) {
                        list.splice((i - 1), 1);
                    }
                }
            }
        }
        static Attr(directive, element, state) {
            const booleanAttributes = [
                'allowfullscreen', 'allowpaymentrequest', 'async', 'autofocus', 'autoplay', 'checked', 'controls',
                'default', 'defer', 'disabled', 'formnovalidate', 'hidden', 'ismap', 'itemscope', 'loop', 'multiple', 'muted',
                'nomodule', 'novalidate', 'open', 'playsinline', 'readonly', 'required', 'reversed', 'selected',
            ];
            if (directive.parts[0] !== 'attr') {
                return HandlerReturn.Nil;
            }
            let isBoolean = (booleanAttributes.indexOf(directive.key) != -1);
            let isDisabled = (isBoolean && directive.key == 'disabled');
            state.TrapGetAccess((change) => {
                if (isBoolean) {
                    if (Evaluator.Evaluate(directive.value, state)) {
                        if (isDisabled && element.tagName === 'A') {
                            element.classList.add(CoreBulkHandler.GetDisabledClassKey());
                        }
                        else {
                            element.setAttribute(directive.parts[1], directive.parts[1]);
                        }
                    }
                    else if (isDisabled && element.tagName === 'A') {
                        element.classList.remove(CoreBulkHandler.GetDisabledClassKey());
                    }
                    else {
                        element.removeAttribute(directive.parts[1]);
                    }
                }
                else {
                    element.setAttribute(directive.parts[1], Evaluator.Evaluate(directive.value, state));
                }
            }, true);
            return HandlerReturn.Handled;
        }
        static Event(directive, element, state) {
            const knownEvents = [
                'blur', 'change', 'click', 'contextmenu', 'context-menu', 'dblclick', 'dbl-click', 'focus', 'focusin', 'focus-in', 'focusout', 'focus-out',
                'hover', 'keydown', 'key-down', 'keyup', 'key-up', 'mousedown', 'mouse-down', 'mouseenter', 'mouse-enter', 'mouseleave', 'mouse-leave',
                'mousemove', 'mouse-move', 'mouseout', 'mouse-out', 'mouseover', 'mouse-over', 'mouseup', 'mouse-up', 'scroll', 'submit',
            ];
            let markers = {
                'on': false,
                'outside': false,
                'prevented': false,
                'stopped': false
            };
            let eventParts = new Array();
            for (let i = 0; i < directive.parts.length; ++i) {
                let part = directive.parts[i];
                if (part in markers) {
                    if (0 < eventParts.length) { //Malformed
                        return HandlerReturn.Nil;
                    }
                    markers[part] = true;
                    eventParts = new Array();
                }
                else { //Part of event
                    eventParts.push(part);
                }
            }
            if (eventParts.length == 0) { //Malformed
                return HandlerReturn.Nil;
            }
            let eventName = eventParts.join('-');
            if (!markers.on && knownEvents.indexOf(eventName) == -1) { //Malformed
                return HandlerReturn.Nil;
            }
            if (!markers.outside) {
                element.addEventListener(eventName, (event) => {
                    if (markers.prevented) {
                        event.preventDefault();
                    }
                    if (markers.stopped) {
                        event.stopPropagation();
                    }
                    state.PushEventContext(event);
                    try {
                        let result = Evaluator.Evaluate(directive.value, state);
                        if (typeof result === 'function') { //Call function
                            result(event);
                        }
                    }
                    catch (err) {
                        state.ReportError(err, `AlpineLite.CoreBulkHandler.Event._Trigger_.${eventName}`);
                    }
                    state.PopEventContext();
                });
            }
            else { //Listen for event outside element
                CoreBulkHandler.AddOutsideEventHandler(eventName, {
                    handler: (event) => {
                        let result = Evaluator.Evaluate(directive.value, state);
                        if (typeof result === 'function') { //Call function
                            result(event);
                        }
                    },
                    element: element
                }, state);
            }
        }
        static AddAll(handler) {
            handler.AddBulkDirectiveHandler(CoreBulkHandler.Attr);
            handler.AddBulkDirectiveHandler(CoreBulkHandler.Event);
        }
        static GetDisabledClassKey() {
            return '__AlpineLiteDisabled__';
        }
    }
    CoreBulkHandler.outsideEventsHandlers_ = new Map();
    AlpineLite.CoreBulkHandler = CoreBulkHandler;
    //CoreHandler begin
    class CoreHandler {
        static Cloak(directive, element, state) {
            return HandlerReturn.Handled;
        }
        static Data(directive, element, state) {
            return HandlerReturn.Handled;
        }
        static Init(directive, element, state) {
            let result = Evaluator.Evaluate(directive.value, state);
            if (typeof result === 'function') { //Call function
                result();
            }
            return HandlerReturn.Handled;
        }
        static Uninit(directive, element, state) {
            element[CoreHandler.GetUninitKey()] = () => {
                let result = Evaluator.Evaluate(directive.value, state);
                if (typeof result === 'function') { //Call function
                    result();
                }
            };
            return HandlerReturn.Handled;
        }
        static Bind(directive, element, state) {
            state.TrapGetAccess((change) => {
                let result = Evaluator.Evaluate(directive.value, state);
                if (typeof result === 'function') { //Call function
                    result();
                }
            }, true);
            return HandlerReturn.Handled;
        }
        static Locals(directive, element, state) {
            let result = Evaluator.Evaluate(directive.value, state);
            if (typeof result === 'function') { //Call function
                result = result();
            }
            let proxy = Proxy.Create({
                target: result,
                name: state.GetElementId(element),
                parent: null,
                element: element,
                state: state
            });
            if (!proxy) {
                state.ReportError('Invalid target for locals', 'AlpineLite.CoreHandler.Locals');
            }
            element[Proxy.GetProxyKey()] = {
                raw: result,
                proxy: proxy
            };
            return HandlerReturn.Handled;
        }
        static Id(directive, element, state) {
            Evaluator.Evaluate(`(${directive.value})='${state.GetElementId(element)}'`, state);
            return HandlerReturn.Handled;
        }
        static Ref(directive, element, state) {
            if (element.tagName === 'TEMPLATE') {
                Evaluator.Evaluate(`(${directive.value})=this.content`, state);
            }
            else {
                Evaluator.Evaluate(`(${directive.value})=this`, state);
            }
            return HandlerReturn.Handled;
        }
        static Text(directive, element, state) {
            CoreHandler.Text_(directive, element, state, {
                isHtml: false,
                callback: null
            });
            return HandlerReturn.Handled;
        }
        static Html(directive, element, state) {
            CoreHandler.Text_(directive, element, state, {
                isHtml: true,
                callback: null
            });
            return HandlerReturn.Handled;
        }
        static Text_(directive, element, state, options) {
            let callback;
            let getValue = () => {
                let result = Evaluator.Evaluate(directive.value, state);
                return ((typeof result === 'function') ? result() : result);
            };
            if (options.isHtml) {
                callback = (change) => {
                    element.innerHTML = getValue();
                };
            }
            else if (element.tagName === 'INPUT') {
                let inputElement = element;
                if (inputElement.type === 'checkbox' || inputElement.type === 'radio') {
                    callback = (change) => {
                        inputElement.checked = !!getValue();
                    };
                }
                else {
                    callback = (change) => {
                        inputElement.value = getValue();
                    };
                }
            }
            else if (element.tagName === 'TEXTAREA') {
                callback = (change) => {
                    element.value = getValue();
                };
            }
            else if (element.tagName === 'SELECT') {
                callback = (change) => {
                    element.value = getValue();
                };
            }
            else { //Unknown element
                callback = (change) => {
                    element.innerText = getValue();
                };
            }
            state.TrapGetAccess((change) => {
                if (!options.callback || options.callback()) {
                    callback(change);
                }
            }, true);
        }
        static Input(directive, element, state) {
            CoreHandler.Input_(directive, element, state, {
                preEvaluate: true,
                callback: null
            });
            return HandlerReturn.Handled;
        }
        static Model(directive, element, state) {
            let doneInput = false;
            CoreHandler.Input_(directive, element, state, {
                preEvaluate: false,
                callback: () => {
                    doneInput = true;
                    return true;
                }
            });
            CoreHandler.Text_(directive, element, state, {
                isHtml: false,
                callback: () => {
                    if (doneInput) {
                        doneInput = false;
                        return false;
                    }
                    return true;
                }
            });
            return HandlerReturn.Handled;
        }
        static Input_(directive, element, state, options) {
            let getValue;
            let isCheckable = false;
            if (element.tagName === 'INPUT') {
                let inputElement = element;
                if (inputElement.type === 'checkbox' || inputElement.type === 'radio') {
                    getValue = () => {
                        return 'this.checked';
                    };
                }
                else {
                    getValue = () => {
                        return 'this.value';
                    };
                }
                isCheckable = true;
            }
            else if (element.tagName === 'TEXTAREA' || element.tagName === 'SELECT') {
                getValue = () => {
                    return 'this.value';
                };
            }
            else { //Unsupported
                state.ReportError(`'${element.tagName}' is not supported`, 'AlpineLite.CoreHandler.Input');
                return;
            }
            if (options.preEvaluate) {
                Evaluator.Evaluate(`(${directive.value})=${getValue()}`, state);
            }
            let onEvent = (event) => {
                if (!options.callback || options.callback()) {
                    Evaluator.Evaluate(`(${directive.value})=${getValue()}`, state);
                }
            };
            element.addEventListener('input', onEvent);
            if (!isCheckable && element.tagName !== 'SELECT') {
                element.addEventListener('keydown', onEvent);
                element.addEventListener('paste', onEvent);
                element.addEventListener('cut', onEvent);
            }
        }
        static Show(directive, element, state) {
            let getValue = () => {
                let result = Evaluator.Evaluate(directive.value, state);
                return ((typeof result === 'function') ? result() : result);
            };
            let previousDisplay = element.style.display;
            if (previousDisplay === 'none') {
                previousDisplay = 'block';
            }
            state.TrapGetAccess((change) => {
                if (getValue()) {
                    element.style.display = previousDisplay;
                }
                else {
                    element.style.display = 'none';
                }
            }, true);
            return HandlerReturn.Handled;
        }
        static If(directive, element, state) {
            let isInserted = true;
            let marker = document.createElement('x-placeholder');
            let getValue = () => {
                let result = Evaluator.Evaluate(directive.value, state);
                return ((typeof result === 'function') ? result() : result);
            };
            let attributes = new Map();
            for (let i = 0; i < element.attributes.length; ++i) { //Copy attributes
                if (element.attributes[i].name !== directive.original) {
                    attributes[element.attributes[i].name] = element.attributes[i].value;
                }
            }
            element.parentElement.insertBefore(marker, element);
            state.TrapGetAccess((change) => {
                let value = getValue();
                if (value && !isInserted) {
                    for (let name in attributes) { //Insert copied attributes
                        element.setAttribute(name, attributes[name]);
                    }
                    marker.parentElement.insertBefore(element, marker);
                    isInserted = true;
                }
                else if (!value && isInserted) {
                    isInserted = false;
                    element.parentElement.removeChild(element);
                }
            }, true);
            if (!isInserted) {
                element.removeAttribute(directive.original);
                for (let name in attributes) { //Remove copied attributes
                    element.removeAttribute(name);
                }
                return HandlerReturn.Rejected;
            }
            return HandlerReturn.Handled;
        }
        static AddAll(handler) {
            handler.AddDirectiveHandler('cloak', CoreHandler.Cloak);
            handler.AddDirectiveHandler('data', CoreHandler.Data);
            handler.AddDirectiveHandler('init', CoreHandler.Init);
            handler.AddDirectiveHandler('uninit', CoreHandler.Uninit);
            handler.AddDirectiveHandler('bind', CoreHandler.Bind);
            handler.AddDirectiveHandler('locals', CoreHandler.Locals);
            handler.AddDirectiveHandler('id', CoreHandler.Id);
            handler.AddDirectiveHandler('ref', CoreHandler.Ref);
            handler.AddDirectiveHandler('text', CoreHandler.Text);
            handler.AddDirectiveHandler('html', CoreHandler.Html);
            handler.AddDirectiveHandler('input', CoreHandler.Input);
            handler.AddDirectiveHandler('model', CoreHandler.Model);
            handler.AddDirectiveHandler('show', CoreHandler.Show);
            handler.AddDirectiveHandler('if', CoreHandler.If);
        }
        static GetUninitKey() {
            return '__AlpineLiteUninit__';
        }
    }
    AlpineLite.CoreHandler = CoreHandler;
    //Bootstrap begin
    class Bootstrap {
        constructor() {
            this.dataRegions_ = new Array();
        }
        InitializeHandlers(handler) {
            CoreHandler.AddAll(handler);
            CoreBulkHandler.AddAll(handler);
        }
        Attach(msDelay = 10) {
            this.Attach_('data-x-data', msDelay);
            this.Attach_('x-data', msDelay);
        }
        Attach_(attr, msDelay) {
            document.querySelectorAll(`[${attr}]`).forEach((element) => {
                let attributeValue = element.getAttribute(attr);
                if (!attributeValue) { //Probably contained inside another region
                    return;
                }
                let state = new State(new Changes(msDelay), element, (id) => {
                    for (let i = 0; i < this.dataRegions_.length; ++i) {
                        if (this.dataRegions_[i].element.id === id || this.dataRegions_[i].element.dataset['id'] === id) {
                            return this.dataRegions_[i].data.GetProxy();
                        }
                    }
                    return null;
                });
                let data = Evaluator.Evaluate(attributeValue, state);
                if (typeof data === 'function') {
                    data = data();
                }
                let proxyData = Proxy.Create({
                    target: data,
                    name: null,
                    parent: null,
                    element: null,
                    state: state
                });
                if (!proxyData) {
                    proxyData = Proxy.Create({
                        target: {},
                        name: null,
                        parent: null,
                        element: null,
                        state: state
                    });
                }
                let handler = new Handler();
                let processor = new Processor(state, handler);
                let observer = new MutationObserver(function (mutations) {
                    mutations.forEach((mutation) => {
                        mutation.removedNodes.forEach((element) => {
                            if (element.nodeType != 1) {
                                return;
                            }
                            let uninitKey = CoreHandler.GetUninitKey();
                            if (uninitKey in element) { //Execute uninit callback
                                element[uninitKey]();
                                delete element[uninitKey];
                            }
                            CoreBulkHandler.RemoveOutsideEventHandlers(element);
                        });
                        mutation.addedNodes.forEach((element) => {
                            processor.All(element, {
                                checkTemplate: true,
                                checkDocument: false
                            });
                        });
                    });
                });
                state.PushValueContext(proxyData.GetProxy());
                this.dataRegions_.push({
                    element: element,
                    data: proxyData,
                    state: state,
                    processor: processor,
                    handler: handler,
                    observer: observer
                });
                Proxy.AddCoreSpecialKeys();
                CoreBulkHandler.AddAll(handler);
                CoreHandler.AddAll(handler);
                processor.All(element);
                observer.observe(element, {
                    childList: true,
                    subtree: true,
                    characterData: false,
                });
            });
        }
    }
    AlpineLite.Bootstrap = Bootstrap;
})(AlpineLite || (AlpineLite = {}));
//# sourceMappingURL=Bundle.js.map