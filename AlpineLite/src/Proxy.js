"use strict";
exports.__esModule = true;
exports.AlpineLite = void 0;
var ValueScope = require("./Value");
var AlpineLiteJSProxy = Proxy;
var AlpineLite;
(function (AlpineLite) {
    var ProxyNoResult = /** @class */ (function () {
        function ProxyNoResult() {
        }
        return ProxyNoResult;
    }());
    var Proxy = /** @class */ (function () {
        function Proxy(details) {
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
        Proxy.prototype.Uninit = function (element) {
            this.details_.parent = null;
            this.details_.element = null;
        };
        Proxy.prototype.Init_ = function () {
            if (!this.details_.target) {
                return;
            }
            var self = this;
            var handler = {
                get: function (target, prop) {
                    var _a;
                    if (typeof prop === 'symbol' || (typeof prop === 'string' && prop === 'prototype')) {
                        return Reflect.get(target, prop);
                    }
                    var element = (self.details_.restricted ? self.details_.element : self.GetContextElement());
                    var name = prop.toString();
                    if (element) {
                        var value_1 = Proxy.Get(element, name, !(prop in target), self.details_.state);
                        if (!(value_1 instanceof ProxyNoResult)) { //Value returned
                            return Proxy.ResolveValue(value_1, element);
                        }
                    }
                    if (!self.details_.parent) {
                        if (name === '$') {
                        }
                    }
                    var baseValue = ((prop in target) ? Reflect.get(target, prop) : null);
                    var value = Proxy.Create({
                        target: baseValue,
                        name: name,
                        parent: self,
                        element: null,
                        state: self.details_.state
                    });
                    var changes = (_a = self.details_.state) === null || _a === void 0 ? void 0 : _a.GetChanges();
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
                    var exists = (prop in target);
                    var nonProxyValue = Proxy.GetNonProxy(value);
                    var element = (self.details_.restricted ? self.details_.element : self.GetContextElement());
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
                    var exists = (prop in target);
                    var element = (self.details_.restricted ? self.details_.element : self.GetContextElement());
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
                has: function (target, prop) {
                    return (typeof prop !== 'symbol' || Reflect.has(target, prop));
                }
            };
            this.proxy_ = new AlpineLiteJSProxy(this.details_.target, handler);
            if (this.details_.parent) {
                this.details_.parent.proxies_[this.details_.name] = this;
            }
        };
        Proxy.prototype.Alert_ = function (type, name, exists, value, alertChildren) {
            var _a;
            var change = {
                type: type,
                name: name,
                path: this.GetPath(name),
                exists: exists,
                value: value
            };
            var changes = (_a = this.details_.state) === null || _a === void 0 ? void 0 : _a.GetChanges();
            if (changes) {
                changes.Add(change);
            }
            if (this.details_.parent) {
                this.details_.parent.BubbleAlert_(change);
            }
            if (alertChildren) {
                this.AlertChildren_(change);
            }
        };
        Proxy.prototype.BubbleAlert_ = function (change) {
            var _a;
            var changes = (_a = this.details_.state) === null || _a === void 0 ? void 0 : _a.GetChanges();
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
        };
        Proxy.prototype.AlertChildren_ = function (change) {
            var _a;
            var changes = (_a = this.details_.state) === null || _a === void 0 ? void 0 : _a.GetChanges();
            if (!changes) {
                return;
            }
            for (var name in this.proxies_) {
                if (changes) {
                    changes.Add({
                        original: change,
                        name: this.proxies_[name].details_.name,
                        path: this.proxies_[name].GetPath()
                    });
                }
                this.proxies_[name].AlertChildren_(change);
            }
        };
        Proxy.prototype.IsRoot = function () {
            return !this.details_.parent;
        };
        Proxy.prototype.GetPath = function (append) {
            if (append === void 0) { append = ''; }
            if (append !== '') {
                append = ('.' + append);
            }
            return (this.details_.parent ? this.details_.parent.GetPath(this.details_.name + append) : (this.details_.name + append));
        };
        Proxy.prototype.GetPathList = function () {
            if (!this.details_.parent) {
                return [this.details_.name];
            }
            var list = this.details_.parent.GetPathList();
            list.push(this.details_.name);
            return list;
        };
        Proxy.prototype.GetContextElement = function () {
            return ((this.details_.parent || !this.details_.state) ? null : (this.details_.element || this.details_.state.GetElementContext()));
        };
        Proxy.prototype.GetProxy = function () {
            return this.proxy_;
        };
        Proxy.prototype.GetChildProxy = function (name) {
            return ((name in this.proxies_) ? this.proxies_[name] : null);
        };
        Proxy.Create = function (details) {
            if (details.parent && (details.name in details.parent.proxies_)) { //Use previously created proxy
                return details.parent.proxies_[details.name];
            }
            var target = details.target;
            var targetType = typeof target;
            if (!target || targetType === 'string' || targetType === 'function' || targetType !== 'object') {
                return null;
            }
            return new Proxy(details);
        };
        Proxy.Get = function (element, name, always, state) {
            if (!element) {
                return new ProxyNoResult();
            }
            var pk = Proxy.GetProxyKey();
            var initialized = (pk in element);
            var changes = state === null || state === void 0 ? void 0 : state.GetChanges();
            if (initialized && (name in element[pk])) {
                var value_2 = Proxy.Create({
                    target: element[pk].raw[name],
                    name: name,
                    parent: element[pk].proxy,
                    element: null,
                    state: state
                });
                if (changes) {
                    changes.AddGetAccess(name, element[pk].proxy.GetPath(name));
                }
                if (value_2 === null) {
                    return element[pk].raw[name];
                }
                return value_2;
            }
            var value = Proxy.Get(element.parentElement, name, false, state);
            if (!always || !(value instanceof ProxyNoResult)) { //Value returned or 'always' disabled
                return value;
            }
            if (changes) {
                changes.AddGetAccess(name, element[pk].proxy.GetPath(name));
            }
            if (!initialized) { //Initialize
                var raw = { name: null };
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
        };
        Proxy.Set = function (element, name, value, always, state) {
            if (!element) {
                return false;
            }
            var pk = Proxy.GetProxyKey();
            var initialized = (pk in element);
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
                var raw = { name: value };
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
        };
        Proxy.Delete = function (element, name, state) {
            if (!element) {
                return false;
            }
            var pk = Proxy.GetProxyKey();
            var initialized = (pk in element);
            if (initialized && (name in element[pk])) {
                var raw = element[pk].raw;
                var proxy = element[pk].proxy;
                if (proxy.details_.parent) {
                    proxy.details_.parent.Alert_('delete', proxy.details_.name, true, { name: name, value: raw[name] }, false);
                }
                delete proxy[name];
                delete raw[name];
                return true;
            }
            return Proxy.Delete(element.parentElement, name, state);
        };
        Proxy.GetNonProxy = function (target) {
            if (target instanceof Proxy) {
                return Proxy.GetNonProxy(target.details_.target);
            }
            return target;
        };
        Proxy.ResolveValue = function (value, element) {
            if (value instanceof ValueScope.AlpineLite.Value) {
                return value.Get();
            }
            return value;
        };
        Proxy.GetProxyKey = function () {
            return '__AlpineLiteProxy__';
        };
        return Proxy;
    }());
    AlpineLite.Proxy = Proxy;
})(AlpineLite = exports.AlpineLite || (exports.AlpineLite = {}));
