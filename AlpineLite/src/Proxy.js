import * as ValueScope from './Value.js';
let AlpineLiteJSProxy = Proxy;
export var AlpineLite;
(function (AlpineLite) {
    class ProxyNoResult {
    }
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
                    if (element) {
                        let value = Proxy.Get(element, name, !(prop in target), self.details_.state);
                        if (!(value instanceof ProxyNoResult)) { //Value returned
                            return Proxy.ResolveValue(value, element);
                        }
                    }
                    if (!self.details_.parent) {
                        if (name === '$') {
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
                set: function (target, prop, value) {
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
                deleteProperty: function (target, prop) {
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
            let value = Proxy.Get(element.parentElement, name, false, state);
            if (!always || !(value instanceof ProxyNoResult)) { //Value returned or 'always' disabled
                return value;
            }
            if (changes) {
                changes.AddGetAccess(name, element[pk].proxy.GetPath(name));
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
            if (Proxy.Set(element.parentElement, name, value, false, state)) {
                return true;
            }
            if (!always) {
                return false;
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
            return Proxy.Delete(element.parentElement, name, state);
        }
        static GetNonProxy(target) {
            if (target instanceof Proxy) {
                return Proxy.GetNonProxy(target.details_.target);
            }
            return target;
        }
        static ResolveValue(value, element) {
            if (value instanceof ValueScope.AlpineLite.Value) {
                return value.Get();
            }
            return value;
        }
        static GetProxyKey() {
            return '__AlpineLiteProxy__';
        }
    }
    AlpineLite.Proxy = Proxy;
})(AlpineLite || (AlpineLite = {}));
