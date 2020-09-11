"use strict";

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var __createBinding = void 0 && (void 0).__createBinding || (Object.create ? function (o, m, k, k2) {
  if (k2 === undefined) k2 = k;
  Object.defineProperty(o, k2, {
    enumerable: true,
    get: function get() {
      return m[k];
    }
  });
} : function (o, m, k, k2) {
  if (k2 === undefined) k2 = k;
  o[k2] = m[k];
});

var __setModuleDefault = void 0 && (void 0).__setModuleDefault || (Object.create ? function (o, v) {
  Object.defineProperty(o, "default", {
    enumerable: true,
    value: v
  });
} : function (o, v) {
  o["default"] = v;
});

var __importStar = void 0 && (void 0).__importStar || function (mod) {
  if (mod && mod.__esModule) return mod;
  var result = {};
  if (mod != null) for (var k in mod) {
    if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
  }

  __setModuleDefault(result, mod);

  return result;
};

define(["require", "exports", "./Value.js"], function (require, exports, ValueScope) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.AlpineLite = void 0;
  ValueScope = __importStar(ValueScope);
  var AlpineLiteJSProxy = Proxy;
  var AlpineLite;

  (function (AlpineLite) {
    var ProxyNoResult = function ProxyNoResult() {
      _classCallCheck(this, ProxyNoResult);
    };

    var Proxy =
    /*#__PURE__*/
    function () {
      function Proxy(details) {
        _classCallCheck(this, Proxy);

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

      _createClass(Proxy, [{
        key: "Uninit",
        value: function Uninit(element) {
          this.details_.parent = null;
          this.details_.element = null;
        }
      }, {
        key: "Init_",
        value: function Init_() {
          if (!this.details_.target) {
            return;
          }

          var self = this;
          var handler = {
            get: function get(target, prop) {
              var _a;

              if (_typeof(prop) === 'symbol' || typeof prop === 'string' && prop === 'prototype') {
                return Reflect.get(target, prop);
              }

              var element = self.details_.restricted ? self.details_.element : self.GetContextElement();
              var name = prop.toString();

              if (element) {
                var _value = Proxy.Get(element, name, !(prop in target), self.details_.state);

                if (!(_value instanceof ProxyNoResult)) {
                  //Value returned
                  return Proxy.ResolveValue(_value, element);
                }
              }

              if (!self.details_.parent) {
                if (name === '$') {}
              }

              var baseValue = prop in target ? Reflect.get(target, prop) : null;
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
            set: function set(target, prop, value) {
              if (_typeof(prop) === 'symbol' || typeof prop === 'string' && prop === 'prototype') {
                return Reflect.set(target, prop, value);
              }

              var exists = prop in target;
              var nonProxyValue = Proxy.GetNonProxy(value);
              var element = self.details_.restricted ? self.details_.element : self.GetContextElement();

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
            deleteProperty: function deleteProperty(target, prop) {
              if (_typeof(prop) === 'symbol' || typeof prop === 'string' && prop === 'prototype') {
                return Reflect.deleteProperty(target, prop);
              }

              var exists = prop in target;
              var element = self.details_.restricted ? self.details_.element : self.GetContextElement();

              if (element && Proxy.Delete(self.GetContextElement(), prop.toString(), self.details_.state)) {
                return true;
              }

              if (self.details_.parent) {
                self.details_.parent.Alert_('delete', self.details_.name, exists, {
                  name: prop,
                  value: target[prop]
                }, false);
              }

              delete target[prop];

              if (prop in self.proxies_) {
                self.proxies_[prop].details_.parent = null;
                delete self.proxies_[prop];
              }

              return true;
            },
            has: function has(target, prop) {
              return _typeof(prop) !== 'symbol' || Reflect.has(target, prop);
            }
          };
          this.proxy_ = new AlpineLiteJSProxy(this.details_.target, handler);

          if (this.details_.parent) {
            this.details_.parent.proxies_[this.details_.name] = this;
          }
        }
      }, {
        key: "Alert_",
        value: function Alert_(type, name, exists, value, alertChildren) {
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
        }
      }, {
        key: "BubbleAlert_",
        value: function BubbleAlert_(change) {
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
        }
      }, {
        key: "AlertChildren_",
        value: function AlertChildren_(change) {
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
        }
      }, {
        key: "IsRoot",
        value: function IsRoot() {
          return !this.details_.parent;
        }
      }, {
        key: "GetPath",
        value: function GetPath() {
          var append = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';

          if (append !== '') {
            append = '.' + append;
          }

          return this.details_.parent ? this.details_.parent.GetPath(this.details_.name + append) : this.details_.name + append;
        }
      }, {
        key: "GetPathList",
        value: function GetPathList() {
          if (!this.details_.parent) {
            return [this.details_.name];
          }

          var list = this.details_.parent.GetPathList();
          list.push(this.details_.name);
          return list;
        }
      }, {
        key: "GetContextElement",
        value: function GetContextElement() {
          return this.details_.parent || !this.details_.state ? null : this.details_.element || this.details_.state.GetElementContext();
        }
      }, {
        key: "GetProxy",
        value: function GetProxy() {
          return this.proxy_;
        }
      }, {
        key: "GetChildProxy",
        value: function GetChildProxy(name) {
          return name in this.proxies_ ? this.proxies_[name] : null;
        }
      }], [{
        key: "Create",
        value: function Create(details) {
          if (details.parent && details.name in details.parent.proxies_) {
            //Use previously created proxy
            return details.parent.proxies_[details.name];
          }

          var target = details.target;

          var targetType = _typeof(target);

          if (!target || targetType === 'string' || targetType === 'function' || targetType !== 'object') {
            return null;
          }

          return new Proxy(details);
        }
      }, {
        key: "Get",
        value: function Get(element, name, always, state) {
          if (!element) {
            return new ProxyNoResult();
          }

          var pk = Proxy.GetProxyKey();
          var initialized = pk in element;
          var changes = state === null || state === void 0 ? void 0 : state.GetChanges();

          if (initialized && name in element[pk]) {
            var _value2 = Proxy.Create({
              target: element[pk].raw[name],
              name: name,
              parent: element[pk].proxy,
              element: null,
              state: state
            });

            if (changes) {
              changes.AddGetAccess(name, element[pk].proxy.GetPath(name));
            }

            if (_value2 === null) {
              return element[pk].raw[name];
            }

            return _value2;
          }

          var value = Proxy.Get(element.parentElement, name, false, state);

          if (!always || !(value instanceof ProxyNoResult)) {
            //Value returned or 'always' disabled
            return value;
          }

          if (changes) {
            changes.AddGetAccess(name, element[pk].proxy.GetPath(name));
          }

          if (!initialized) {
            //Initialize
            var raw = {
              name: null
            };
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
          } else {
            element[pk].raw[name] = null;

            if (changes) {
              changes.AddGetAccess(name, element[pk].proxy.GetPath(name));
            }
          }

          return null;
        }
      }, {
        key: "Set",
        value: function Set(element, name, value, always, state) {
          if (!element) {
            return false;
          }

          var pk = Proxy.GetProxyKey();
          var initialized = pk in element;

          if (initialized && name in element[pk]) {
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

          if (!initialized) {
            //Initialize
            var raw = {
              name: value
            };
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
          } else {
            element[pk].raw[name] = value;
            element[pk].proxy.Alert_('set', name, true, value, true);
          }

          return true;
        }
      }, {
        key: "Delete",
        value: function Delete(element, name, state) {
          if (!element) {
            return false;
          }

          var pk = Proxy.GetProxyKey();
          var initialized = pk in element;

          if (initialized && name in element[pk]) {
            var raw = element[pk].raw;
            var proxy = element[pk].proxy;

            if (proxy.details_.parent) {
              proxy.details_.parent.Alert_('delete', proxy.details_.name, true, {
                name: name,
                value: raw[name]
              }, false);
            }

            delete proxy[name];
            delete raw[name];
            return true;
          }

          return Proxy.Delete(element.parentElement, name, state);
        }
      }, {
        key: "GetNonProxy",
        value: function GetNonProxy(target) {
          if (target instanceof Proxy) {
            return Proxy.GetNonProxy(target.details_.target);
          }

          return target;
        }
      }, {
        key: "ResolveValue",
        value: function ResolveValue(value, element) {
          if (value instanceof ValueScope.AlpineLite.Value) {
            return value.Get();
          }

          return value;
        }
      }, {
        key: "GetProxyKey",
        value: function GetProxyKey() {
          return '__AlpineLiteProxy__';
        }
      }]);

      return Proxy;
    }();

    AlpineLite.Proxy = Proxy;
  })(AlpineLite = exports.AlpineLite || (exports.AlpineLite = {}));
});