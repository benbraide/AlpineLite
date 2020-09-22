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
        constructor() {
            this.listeners_ = {};
            this.list_ = new Array();
            this.getAccessStorage_ = new Stack();
            this.isScheduled_ = false;
        }
        Schedule_() {
            if (this.isScheduled_) {
                return;
            }
            this.isScheduled_ = true;
            setTimeout(() => {
                this.isScheduled_ = false;
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
            }, 0);
        }
        Add(item) {
            this.list_.push(item);
            this.Schedule_();
        }
        AddGetAccess(name, path) {
            let storage = this.getAccessStorage_.Peek();
            if (storage) {
                storage[path] = {
                    name: name,
                    ref: this
                };
            }
        }
        AddListener(path, callback, element, key) {
            if (!(path in this.listeners_)) {
                this.listeners_[path] = new Array();
            }
            this.listeners_[path].push({
                callback: callback,
                element: element,
                key: key
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
        RemoveListeners(target) {
            let isKey = (typeof target === 'string');
            for (let path in this.listeners_) {
                for (let i = this.listeners_[path].length; i > 0; --i) {
                    if (isKey && this.listeners_[path][i - 1].key === target) {
                        this.listeners_[path].slice((i - 1), 1);
                    }
                    else if (!isKey && this.listeners_[path][i - 1].element === target) {
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
        constructor(changes_, rootElement_, externalCallbacks_) {
            this.changes_ = changes_;
            this.rootElement_ = rootElement_;
            this.externalCallbacks_ = externalCallbacks_;
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
            return (this.externalCallbacks_.componentFinder ? this.externalCallbacks_.componentFinder(id) : null);
        }
        IsEqual(first, second) {
            return (this.externalCallbacks_.isEqual ? this.externalCallbacks_.isEqual(first, second) : (first === second));
        }
        DeepCopy(target) {
            return (this.externalCallbacks_.deepCopy ? this.externalCallbacks_.deepCopy(target) : target);
        }
        GenerateElementId() {
            return ++this.elementId_;
        }
        GetElementId(element) {
            if (!element) {
                return '';
            }
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
        TrapGetAccess(callback, changeCallback, element, key) {
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
                        getAccessStorage[path] = newGetAccessStorage[path];
                        this.changes_.AddListener(path, onChange, element, key);
                    }
                });
            };
            paths.forEach((path) => {
                getAccessStorage[path].ref.AddListener(path, onChange, element, key);
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
                    let name = prop.toString();
                    if (name === '__AlpineLiteTarget__') {
                        return target;
                    }
                    let element = (self.details_.restricted ? self.details_.element : self.GetContextElement());
                    let keyResult = Proxy.HandleSpecialKey(name, self);
                    if (!(keyResult instanceof ProxyNoResult)) { //Value returned
                        return Proxy.ResolveValue(keyResult);
                    }
                    if (element && !self.details_.element && !(prop in target)) {
                        let value = Proxy.Get(element, name, false, self.details_.state);
                        if (!(value instanceof ProxyNoResult)) { //Value returned
                            return Proxy.ResolveValue(value);
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
                    if (element && !self.details_.element && !exists && Proxy.Set(self.GetContextElement(), prop.toString(), nonProxyValue, false, self.details_.state)) {
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
                    if (element && !self.details_.element && !exists && Proxy.Delete(self.GetContextElement(), prop.toString(), self.details_.state)) {
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
            if (target instanceof Node || target instanceof DOMTokenList) {
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
            if (initialized && (name in element[pk].raw)) {
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
                let raw = {};
                raw[name] = null;
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
            if (initialized && (name in element[pk].raw)) {
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
                let raw = {};
                raw[name] = value;
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
            if (initialized && (name in element[pk].raw)) {
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
        static GetBaseValue(target) {
            target = Proxy.GetNonProxy(target);
            if (!target || typeof target !== 'object') {
                return null;
            }
            return (('__AlpineLiteTarget__' in target) ? target['__AlpineLiteTarget__'] : target);
        }
        static ResolveValue(value) {
            if (value instanceof Value) {
                return value.Get();
            }
            return value;
        }
        static GetProxyKey() {
            return '__AlpineLiteProxy__';
        }
        static AddSpecialKey(key, handler) {
            key = ('$' + key);
            if (!(key in Proxy.specialKeys_)) {
                Proxy.specialKeys_[key] = new Array();
            }
            Proxy.specialKeys_[key].push(handler);
        }
        static HandleSpecialKey(name, proxy) {
            let externalKey = Proxy.GetExternalSpecialKey();
            let contextElement = proxy.GetContextElement();
            if (contextElement && typeof contextElement === 'object' && (externalKey in contextElement)) {
                let externalCallbacks = contextElement[externalKey];
                if (name in externalCallbacks) {
                    let result = Proxy.ResolveValue(externalCallbacks[name](proxy));
                    if (!(result instanceof ProxyNoResult)) {
                        return result;
                    }
                }
            }
            if (!(name in Proxy.specialKeys_)) {
                return new ProxyNoResult();
            }
            let result = new ProxyNoResult();
            let handlers = Proxy.specialKeys_[name];
            for (let i = 0; i < handlers.length; ++i) {
                result = Proxy.ResolveValue((handlers[i])(proxy, result));
                if (result instanceof ProxyStopPropagation) {
                    return result.value;
                }
            }
            return result;
        }
        static AddCoreSpecialKeys() {
            let addKey = (key, callback, requireRoot, requireElement) => {
                Proxy.AddSpecialKey(key, (proxy, result) => {
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
                    return callback(proxy, result);
                });
            };
            let addRootKey = (key, callback) => {
                addKey(key, callback, ProxyRequireType.Required, ProxyRequireType.MustBeAbsent);
            };
            let addElementKey = (key, callback) => {
                addKey(key, callback, ProxyRequireType.Nil, ProxyRequireType.Required);
            };
            let addAnyKey = (key, callback) => {
                addKey(key, callback, ProxyRequireType.Nil, ProxyRequireType.Nil);
            };
            let getLocals = (element, proxy) => {
                if (!element) {
                    return null;
                }
                let pk = Proxy.GetProxyKey();
                if (pk in element) { //Initialized
                    return element[pk].proxy.GetProxy();
                }
                let raw = {};
                let localsProxy = Proxy.Create({
                    target: raw,
                    name: proxy.details_.state.GetElementId(element),
                    parent: null,
                    element: element,
                    state: proxy.details_.state
                });
                element[pk] = {
                    raw: raw,
                    proxy: localsProxy
                };
                return localsProxy.GetProxy();
            };
            let watch = (target, proxy, callback) => {
                let stoppedWatching = false;
                let previousValue = null;
                let contextElement = proxy.GetContextElement();
                let key = proxy.details_.state.GetElementId(contextElement);
                if (key !== '') {
                    key += '_watch';
                }
                proxy.details_.state.TrapGetAccess((change) => {
                    previousValue = Evaluator.Evaluate(target, proxy.details_.state, contextElement);
                    previousValue = proxy.details_.state.DeepCopy(Proxy.GetBaseValue(previousValue));
                    stoppedWatching = !callback(previousValue);
                }, (change) => {
                    if (stoppedWatching) {
                        if (key !== '') {
                            proxy.details_.state.GetChanges().RemoveListeners(key);
                            key = '';
                        }
                        return;
                    }
                    let value = Evaluator.Evaluate(target, proxy.details_.state, contextElement);
                    if (proxy.details_.state.IsEqual(value, previousValue)) {
                        return;
                    }
                    if (key !== '') {
                        proxy.details_.state.GetChanges().RemoveListeners(key);
                        key = '';
                    }
                    previousValue = proxy.details_.state.DeepCopy(Proxy.GetBaseValue(value));
                    stoppedWatching = !callback(value);
                }, null, key);
            };
            let getProp = (prop, target, proxy) => {
                if (typeof target !== 'object' || !(prop in target)) {
                    return null;
                }
                let baseValue = target[prop];
                let value = Proxy.Create({
                    target: baseValue,
                    name: prop,
                    parent: proxy,
                    element: null,
                    state: proxy.details_.state
                });
                return [value, (value ? value.proxy_ : baseValue)];
            };
            let reduce = (target, parts, proxy) => {
                if (parts.length == 0) {
                    return null;
                }
                if (parts.length == 1) {
                    return [proxy, parts[0]];
                }
                let info = getProp(parts[0], target, proxy);
                if (!info[0]) {
                    return null;
                }
                return reduce(info[0].proxy_, parts.splice(1), info[0]);
            };
            let get = (target, parts, proxy) => {
                let info = reduce(target, parts, proxy);
                if (!info) {
                    return null;
                }
                return getProp(info[1], info[0].proxy_, info[0])[1];
            };
            let call = (target, parts, proxy, ...args) => {
                let info = reduce(target, parts, proxy);
                if (!info) {
                    return null;
                }
                let callback = info[0].proxy_[info[1]];
                if (typeof callback !== 'function') {
                    return null;
                }
                return callback.call(info[0].proxy_, ...args);
            };
            let getOrCall = (prop, component, isGet, proxy, ...args) => {
                let componentRef = proxy.details_.state.FindComponent(component);
                if (!componentRef) {
                    return null;
                }
                let getAccessStorage = proxy.details_.state.GetChanges().RetrieveGetAccessStorage().Peek();
                if (getAccessStorage) {
                    componentRef.details_.state.GetChanges().PushGetAccessStorage(getAccessStorage);
                }
                let value;
                if (isGet) {
                    value = get(componentRef.proxy_, prop.split('.'), componentRef);
                }
                else {
                    value = call(componentRef.proxy_, prop.split('.'), componentRef, ...args);
                }
                if (getAccessStorage) {
                    componentRef.details_.state.GetChanges().PopGetAccessStorage();
                }
                return value;
            };
            let tie = (name, prop, component, proxy, bidirectional) => {
                let componentRef = proxy.details_.state.FindComponent(component);
                if (!componentRef) {
                    return;
                }
                let info = reduce(componentRef.proxy_, prop.split('.'), componentRef);
                if (!info) {
                    return;
                }
                watch(info[1], info[0], (value) => {
                    let targetInfo = reduce(proxy.proxy_, name.split('.'), proxy);
                    if (!targetInfo) {
                        return false;
                    }
                    targetInfo[0].proxy_[targetInfo[1]] = value;
                    return true;
                });
                if (!bidirectional) {
                    return;
                }
                let targetInfo = reduce(proxy.proxy_, name.split('.'), proxy);
                if (!targetInfo) {
                    return;
                }
                watch(targetInfo[1], targetInfo[0], (value) => {
                    let sourceInfo = reduce(componentRef.proxy_, prop.split('.'), componentRef);
                    if (!sourceInfo) {
                        return false;
                    }
                    sourceInfo[0].proxy_[sourceInfo[1]] = value;
                    return true;
                });
            };
            addRootKey('window', (proxy) => {
                return window;
            });
            addRootKey('document', (proxy) => {
                return document;
            });
            addRootKey('console', (proxy) => {
                return console;
            });
            addRootKey('event', (proxy) => {
                return new Value(() => {
                    return proxy.details_.state.GetEventContext();
                });
            });
            addRootKey('self', (proxy) => {
                return new Value(() => {
                    return proxy.GetContextElement();
                });
            });
            addRootKey('root', (proxy) => {
                return new Value(() => {
                    return proxy.details_.state.GetRootElement();
                });
            });
            addRootKey('parent', (proxy) => {
                return new Value(() => {
                    let contextElement = proxy.GetContextElement();
                    return ((contextElement && contextElement != proxy.details_.state.GetRootElement()) ? contextElement.parentElement : null);
                });
            });
            addRootKey('ancestor', (proxy) => {
                return (index) => {
                    let contextElement = proxy.GetContextElement();
                    if (!contextElement) {
                        return null;
                    }
                    let rootElement = proxy.details_.state.GetRootElement(), ancestor = contextElement;
                    for (; 0 <= index; --index) {
                        if (ancestor === rootElement) {
                            return null;
                        }
                        ancestor = ancestor.parentElement;
                    }
                    return ancestor;
                };
            });
            addRootKey('ancestors', (proxy) => {
                return new Value(() => {
                    let contextElement = proxy.GetContextElement();
                    if (!contextElement) {
                        return [];
                    }
                    let list = new Array();
                    let rootElement = proxy.details_.state.GetRootElement(), ancestor = contextElement;
                    while (true) {
                        if (ancestor === rootElement) {
                            break;
                        }
                        ancestor = ancestor.parentElement;
                        list.push(ancestor);
                    }
                    return list;
                });
            });
            addRootKey('child', (proxy) => {
                return (index) => {
                    let contextElement = proxy.GetContextElement();
                    if (!contextElement || contextElement.childElementCount <= index) {
                        return null;
                    }
                    return contextElement.children[index];
                };
            });
            addRootKey('children', (proxy) => {
                return new Value(() => {
                    let contextElement = proxy.GetContextElement();
                    if (!contextElement) {
                        return [];
                    }
                    let list = new Array();
                    let children = contextElement.children;
                    for (let i = 0; i < children.length; ++i) {
                        list.push(children[i]);
                    }
                    return list;
                });
            });
            addRootKey('component', (proxy) => {
                return (id) => {
                    let component = proxy.details_.state.FindComponent(id);
                    return (component ? component.GetProxy() : null);
                };
            });
            addRootKey('get', (proxy) => {
                return (prop, component) => {
                    return getOrCall(prop, component, true, proxy);
                };
            });
            addRootKey('call', (proxy) => {
                return (prop, component, ...args) => {
                    return getOrCall(prop, component, false, proxy, ...args);
                };
            });
            addRootKey('tie', (proxy) => {
                return (name, prop, component) => {
                    tie(name, prop, component, proxy, false);
                };
            });
            addRootKey('btie', (proxy) => {
                return (name, prop, component) => {
                    tie(name, prop, component, proxy, true);
                };
            });
            addRootKey('locals', (proxy) => {
                return new Value(() => {
                    return getLocals(proxy.GetContextElement(), proxy);
                });
            });
            addRootKey('localsFor', (proxy) => {
                return (element) => {
                    let rootElement = proxy.details_.state.GetRootElement();
                    if (element && element !== rootElement && !rootElement.contains(element)) {
                        return null;
                    }
                    return getLocals(element, proxy);
                };
            });
            addRootKey('raw', (proxy) => {
                return (target) => {
                    return Proxy.GetNonProxy(target);
                };
            });
            addRootKey('watch', (proxy) => {
                return (target, callback) => {
                    let isInitial = true;
                    watch(target, proxy, (value) => {
                        if (isInitial) {
                            isInitial = false;
                            return true;
                        }
                        return (callback.call(proxy.GetProxy(), value) !== false);
                    });
                };
            });
            addRootKey('when', (proxy) => {
                return (target, callback) => {
                    watch(target, proxy, (value) => {
                        return (!value || callback.call(proxy.GetProxy(), value) !== false);
                    });
                };
            });
            addRootKey('once', (proxy) => {
                return (target, callback) => {
                    watch(target, proxy, (value) => {
                        if (!value) {
                            return true;
                        }
                        callback.call(proxy.GetProxy(), value);
                        return false;
                    });
                };
            });
        }
        static GetExternalSpecialKey() {
            return '__AlpineLiteSpecial__';
        }
    }
    Proxy.specialKeys_ = new Map();
    AlpineLite.Proxy = Proxy;
    (function () {
        Proxy.AddCoreSpecialKeys();
    })();
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
        static Evaluate(expression, state, elementContext) {
            expression = expression.trim();
            if (expression === '') {
                return null;
            }
            let result = null;
            let valueContext = (state ? state.GetValueContext() : null);
            if (state && elementContext) {
                state.PushElementContext(elementContext);
            }
            else if (state) {
                elementContext = state.GetElementContext();
            }
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
                result = null;
                state.ReportError(err, `AlpineLite.Evaluator.Value(${expression})`);
            }
            finally {
                if (state && elementContext) {
                    state.PopElementContext();
                }
            }
            return result;
        }
        static Interpolate(expression, state, elementContext) {
            return expression.replace(/\{\{(.+?)\}\}/g, ($0, $1) => {
                return (Evaluator.Evaluate($1, state, elementContext) || '');
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
        HandlerReturn[HandlerReturn["SkipBulk"] = 3] = "SkipBulk";
    })(HandlerReturn = AlpineLite.HandlerReturn || (AlpineLite.HandlerReturn = {}));
    //Handler begin
    class Handler {
        static AddDirectiveHandler(directive, handler) {
            this.directiveHandlers_[directive] = handler;
        }
        static GetDirectiveHandler(directive) {
            return ((directive in this.directiveHandlers_) ? this.directiveHandlers_[directive] : null);
        }
        static AddBulkDirectiveHandler(handler) {
            this.bulkDirectiveHandlers_.push(handler);
        }
        static AddBulkDirectiveHandlerInFront(handler) {
            this.bulkDirectiveHandlers_.unshift(handler);
        }
        static HandleDirective(directive, element, state) {
            for (let i = 0; i < this.bulkDirectiveHandlers_.length; ++i) {
                let result = this.bulkDirectiveHandlers_[i](directive, element, state);
                if (result == HandlerReturn.SkipBulk) {
                    break;
                }
                if (result != HandlerReturn.Nil) { //Handled or rejected
                    return result;
                }
            }
            if (directive.key in this.directiveHandlers_) { //Call handler
                let result = this.directiveHandlers_[directive.key](directive, element, state);
                if (result != HandlerReturn.Nil) {
                    return result;
                }
            }
            let key = Handler.GetExternalHandlerKey();
            if ((key in element) && directive.key in element[key]) {
                return element[key][directive.key](directive, element, state);
            }
            return HandlerReturn.Nil;
        }
        static GetExternalHandlerKey() {
            return '__AlpineLiteHandler__';
        }
    }
    Handler.directiveHandlers_ = new Map();
    Handler.bulkDirectiveHandlers_ = new Array();
    AlpineLite.Handler = Handler;
    //Processor begin
    class Processor {
        constructor(state) {
            this.state_ = null;
            this.state_ = state;
        }
        All(element, options) {
            if (!Processor.Check(element, options)) { //Check failed -- ignore
                return;
            }
            let isTemplate = (element.tagName == 'TEMPLATE');
            if (!isTemplate && (options === null || options === void 0 ? void 0 : options.checkTemplate) && element.closest('template')) { //Inside template -- ignore
                return;
            }
            this.One(element);
            if (isTemplate) { //Don't process template content
                return;
            }
            let children = element.children;
            for (let i = 0; i < children.length; ++i) { //Process children
                this.All(children[i]);
            }
        }
        One(element, options) {
            if (!Processor.Check(element, options)) { //Check failed -- ignore
                return;
            }
            let isTemplate = (element.tagName == 'TEMPLATE');
            if (!isTemplate && (options === null || options === void 0 ? void 0 : options.checkTemplate) && element.closest('template')) { //Inside template -- ignore
                return;
            }
            Processor.TraverseDirectives(element, (directive) => {
                return this.DispatchDirective(directive, element);
            }, (attribute) => {
                // this.state_.TrapGetAccess((change: IChange | IBubbledChange): void => {
                //     attribute.value = Evaluator.Interpolate(attribute.value, this.state_, elementNode);
                // }, true);
                return true;
            });
        }
        DispatchDirective(directive, element) {
            let result;
            try {
                this.state_.PushElementContext(element);
                result = Handler.HandleDirective(directive, element, this.state_);
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
        static Check(element, options) {
            if ((element === null || element === void 0 ? void 0 : element.nodeType) !== 1) { //Not an HTMLElement
                return false;
            }
            if ((options === null || options === void 0 ? void 0 : options.checkDocument) && !document.contains(element)) { //Node is not contained inside the document
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
                }, true);
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
            let attr = directive.parts.splice(1).join('-');
            let key = (directive.key.substr(4, 1).toLowerCase() + directive.key.substr(5)); //Skip 'attr'
            let isBoolean = (booleanAttributes.indexOf(key) != -1);
            let isDisabled = (isBoolean && key == 'disabled');
            state.TrapGetAccess((change) => {
                if (isBoolean) {
                    if (Evaluator.Evaluate(directive.value, state, element)) {
                        if (isDisabled && element.tagName === 'A') {
                            element.classList.add(CoreBulkHandler.GetDisabledClassKey());
                        }
                        else {
                            element.setAttribute(attr, attr);
                        }
                    }
                    else if (isDisabled && element.tagName === 'A') {
                        element.classList.remove(CoreBulkHandler.GetDisabledClassKey());
                    }
                    else {
                        element.removeAttribute(attr);
                    }
                }
                else {
                    element.setAttribute(attr, Evaluator.Evaluate(directive.value, state, element));
                }
            }, true);
            return HandlerReturn.Handled;
        }
        static Style(directive, element, state) {
            if (directive.parts[0] !== 'style') {
                return HandlerReturn.Nil;
            }
            let key = (directive.key.substr(5, 1).toLowerCase() + directive.key.substr(6)); //Skip 'style'
            if (!(key in element.style)) { //Unrecognized style
                return HandlerReturn.Nil;
            }
            state.TrapGetAccess((change) => {
                element.style[key] = Evaluator.Evaluate(directive.value, state, element);
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
                        let result = Evaluator.Evaluate(directive.value, state, element);
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
                        let result = Evaluator.Evaluate(directive.value, state, element);
                        if (typeof result === 'function') { //Call function
                            result(event);
                        }
                    },
                    element: element
                }, state);
            }
        }
        static AddAll() {
            Handler.AddBulkDirectiveHandler(CoreBulkHandler.Attr);
            Handler.AddBulkDirectiveHandler(CoreBulkHandler.Style);
            Handler.AddBulkDirectiveHandler(CoreBulkHandler.Event);
        }
        static GetDisabledClassKey() {
            return '__AlpineLiteDisabled__';
        }
    }
    CoreBulkHandler.outsideEventsHandlers_ = new Map();
    AlpineLite.CoreBulkHandler = CoreBulkHandler;
    (function () {
        CoreBulkHandler.AddAll();
    })();
    //CoreHandler begin
    class CoreHandler {
        static Cloak(directive, element, state) {
            return HandlerReturn.Handled;
        }
        static Data(directive, element, state) {
            let context = state.GetValueContext();
            if (!context) {
                return HandlerReturn.Handled;
            }
            let data = Evaluator.Evaluate(directive.value, state, element);
            if (typeof data === 'function') {
                data = data();
            }
            let targetType = typeof data;
            if (!data || targetType === 'string' || targetType === 'function' || targetType !== 'object') {
                return HandlerReturn.Handled;
            }
            if (data instanceof Node || data instanceof DOMTokenList) {
                return HandlerReturn.Handled;
            }
            for (let key in data) { //Copy entries
                context[key] = data[key];
            }
            return HandlerReturn.Handled;
        }
        static Init(directive, element, state) {
            let result = Evaluator.Evaluate(directive.value, state, element);
            if (typeof result === 'function') { //Call function
                result();
            }
            return HandlerReturn.Handled;
        }
        static Uninit(directive, element, state) {
            element[CoreHandler.GetUninitKey()] = () => {
                let result = Evaluator.Evaluate(directive.value, state, element);
                if (typeof result === 'function') { //Call function
                    result();
                }
            };
            return HandlerReturn.Handled;
        }
        static Bind(directive, element, state) {
            state.TrapGetAccess((change) => {
                let result = Evaluator.Evaluate(directive.value, state, element);
                if (typeof result === 'function') { //Call function
                    result();
                }
            }, true);
            return HandlerReturn.Handled;
        }
        static Locals(directive, element, state) {
            let result = Evaluator.Evaluate(directive.value, state, element);
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
                proxy = Proxy.Create({
                    target: result,
                    name: state.GetElementId(element),
                    parent: null,
                    element: element,
                    state: state
                });
            }
            element[Proxy.GetProxyKey()] = {
                raw: result,
                proxy: proxy
            };
            return HandlerReturn.Handled;
        }
        static Id(directive, element, state) {
            Evaluator.Evaluate(`(${directive.value})='${state.GetElementId(element)}'`, state, element);
            return HandlerReturn.Handled;
        }
        static Ref(directive, element, state) {
            if (element.tagName === 'TEMPLATE') {
                Evaluator.Evaluate(`(${directive.value})=this.content`, state, element);
            }
            else {
                Evaluator.Evaluate(`(${directive.value})=this`, state, element);
            }
            return HandlerReturn.Handled;
        }
        static Class(directive, element, state) {
            state.TrapGetAccess((change) => {
                let entries = Evaluator.Evaluate(directive.value, state, element);
                for (let key in entries) {
                    if (entries[key]) {
                        if (!element.classList.contains(key)) {
                            element.classList.add(key);
                        }
                    }
                    else {
                        element.classList.remove(key);
                    }
                }
            }, true);
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
                let result = Evaluator.Evaluate(directive.value, state, element);
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
                Evaluator.Evaluate(`(${directive.value})=${getValue()}`, state, element);
            }
            let onEvent = (event) => {
                if (!options.callback || options.callback()) {
                    Evaluator.Evaluate(`(${directive.value})=${getValue()}`, state, element);
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
                let result = Evaluator.Evaluate(directive.value, state, element);
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
                let result = Evaluator.Evaluate(directive.value, state, element);
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
        static AddAll() {
            Handler.AddDirectiveHandler('cloak', CoreHandler.Cloak);
            Handler.AddDirectiveHandler('data', CoreHandler.Data);
            Handler.AddDirectiveHandler('init', CoreHandler.Init);
            Handler.AddDirectiveHandler('uninit', CoreHandler.Uninit);
            Handler.AddDirectiveHandler('bind', CoreHandler.Bind);
            Handler.AddDirectiveHandler('locals', CoreHandler.Locals);
            Handler.AddDirectiveHandler('id', CoreHandler.Id);
            Handler.AddDirectiveHandler('ref', CoreHandler.Ref);
            Handler.AddDirectiveHandler('class', CoreHandler.Class);
            Handler.AddDirectiveHandler('text', CoreHandler.Text);
            Handler.AddDirectiveHandler('html', CoreHandler.Html);
            Handler.AddDirectiveHandler('input', CoreHandler.Input);
            Handler.AddDirectiveHandler('model', CoreHandler.Model);
            Handler.AddDirectiveHandler('show', CoreHandler.Show);
            Handler.AddDirectiveHandler('if', CoreHandler.If);
        }
        static GetUninitKey() {
            return '__AlpineLiteUninit__';
        }
    }
    AlpineLite.CoreHandler = CoreHandler;
    (function () {
        CoreHandler.AddAll();
    })();
    //Bootstrap begin [a-zA-z]+?\.AlpineLite\.
    class Bootstrap {
        constructor(externalCallbacks) {
            this.dataRegions_ = new Array();
            this.externalCallbacks_ = (externalCallbacks || {});
            if (!this.externalCallbacks_.componentFinder) {
                this.externalCallbacks_.componentFinder = (id) => {
                    if (!id) {
                        return null;
                    }
                    for (let i = 0; i < this.dataRegions_.length; ++i) {
                        if (this.dataRegions_[i].element.id === id || this.dataRegions_[i].element.dataset['id'] === id) {
                            return this.dataRegions_[i].data;
                        }
                    }
                    return null;
                };
            }
        }
        Attach(anchors = ['data-x-data', 'x-data']) {
            anchors.forEach((anchor) => {
                document.querySelectorAll(`[${anchor}]`).forEach((element) => {
                    let attributeValue = element.getAttribute(anchor);
                    if (attributeValue === undefined) { //Probably contained inside another region
                        return;
                    }
                    let state = new State(new Changes(), element, this.externalCallbacks_);
                    let name = `__ar${this.dataRegions_.length}__`;
                    let proxyData = Proxy.Create({
                        target: {},
                        name: name,
                        parent: null,
                        element: null,
                        state: state
                    });
                    let processor = new Processor(state);
                    let observer = new MutationObserver((mutations) => {
                        mutations.forEach((mutation) => {
                            mutation.removedNodes.forEach((node) => {
                                if ((node === null || node === void 0 ? void 0 : node.nodeType) !== 1) {
                                    return;
                                }
                                this.dataRegions_.forEach((region) => {
                                    region.state.GetChanges().RemoveListeners(node);
                                });
                                let uninitKey = CoreHandler.GetUninitKey();
                                if (uninitKey in node) { //Execute uninit callback
                                    node[uninitKey]();
                                    delete node[uninitKey];
                                }
                                CoreBulkHandler.RemoveOutsideEventHandlers(node);
                            });
                            mutation.addedNodes.forEach((node) => {
                                if ((node === null || node === void 0 ? void 0 : node.nodeType) !== 1) {
                                    return;
                                }
                                processor.All(node, {
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
                        observer: observer
                    });
                    processor.All(element);
                    observer.observe(element, {
                        childList: true,
                        subtree: true,
                        characterData: false,
                    });
                });
            });
        }
    }
    AlpineLite.Bootstrap = Bootstrap;
})(AlpineLite || (AlpineLite = {}));
