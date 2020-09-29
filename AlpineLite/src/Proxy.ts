import * as StateScope from './State'
import * as ValueScope from './Value'
import * as ChangesScope from './Changes'
import * as EvaluatorScope from './Evaluator'

let AlpineLiteJSProxy = Proxy;

export namespace AlpineLite{
    export interface ProxyDetails{
        target: object;
        name: string;
        parent: Proxy;
        element: HTMLElement;
        state: StateScope.AlpineLite.State;
        restricted?: boolean;
        noAlert?: boolean;
    }

    export interface ProxyMap{
        [key: string]: Proxy;
    }

    export class ProxyNoResult{}

    export class ProxyStopPropagation{
        constructor(public value: any){}
    }

    export type ProxySpecialKeyHandler = (proxy: Proxy, result?: any) => {};

    export enum ProxyRequireType{
        Nil,
        Required,
        MustBeAbsent
    }
    
    export class Proxy{
        private details_: ProxyDetails;
        private proxies_: ProxyMap = {};
        private proxy_: object = null;
        private static specialKeys_ = new Map<string, Array<ProxySpecialKeyHandler>>();

        constructor(details: ProxyDetails){
            this.details_ = details;
            if (!this.details_.parent && !this.details_.name){
                this.details_.name = 'root';
            }

            if (this.details_.parent && this.details_.element){
                this.details_.element = null;
            }

            this.Init_();
        }

        public Uninit(element: HTMLElement): void{
            this.details_.parent = null;
            this.details_.element = null;
        }

        private Init_(): void{
            if (!this.details_.target){
                return;
            }

            let self = this;
            let handler = {
                get(target: object, prop: string | number | symbol): any{
                    if (typeof prop === 'symbol' || (typeof prop === 'string' && prop === 'prototype')){
                        return Reflect.get(target, prop);
                    }
                    
                    let name = prop.toString();
                    if (name === '__AlpineLiteTarget__'){
                        return target;
                    }

                    if (name === '__AlpineLitePath__'){
                        return self.GetPath();
                    }

                    let element = (self.details_.restricted ? self.details_.element : self.GetContextElement());
                    let keyResult = Proxy.HandleSpecialKey(name, self);

                    if (!(keyResult instanceof ProxyNoResult)){//Value returned
                        return Proxy.ResolveValue(keyResult, self);
                    }
                    
                    if (element && !self.details_.element && !(prop in target)){
                        let value = Proxy.Get(element, name, false, self.details_.state);
                        if (!(value instanceof ProxyNoResult)){//Value returned
                            return Proxy.ResolveValue(value, self);
                        }
                    }

                    let baseValue = Proxy.ResolveValue(((prop in target) ? Reflect.get(target, prop) : null), self);
                    let value = Proxy.Create({
                        target: baseValue,
                        name: name,
                        parent: self,
                        element: null,
                        state: self.details_.state
                    });

                    let changes = self.details_.state?.GetChanges();
                    if (changes){
                        changes.AddGetAccess(name, self.GetPath(name));
                    }

                    if (value){
                        return value.proxy_;
                    }

                    return baseValue;
                },
                set(target: object, prop: string | number | symbol, value: any): boolean{
                    if (typeof prop === 'symbol' || (typeof prop === 'string' && prop === 'prototype')){
                        return Reflect.set(target, prop, value);
                    }

                    let exists = (prop in target);
                    let nonProxyValue = Proxy.GetNonProxy(value);
                    let element = (self.details_.restricted ? self.details_.element : self.GetContextElement());
                    
                    if (element && !self.details_.element && !exists && Proxy.Set(self.GetContextElement(), prop.toString(), nonProxyValue, false, self.details_.state)){
                        return true;
                    }

                    target[prop] = nonProxyValue;
                    if (prop in self.proxies_){
                        self.proxies_[prop].details_.parent = null;
                        delete self.proxies_[prop];
                    }

                    self.Alert_('set', prop.toString(), exists, value, true);

                    return true;
                },
                deleteProperty(target: object, prop: string | number | symbol): boolean{
                    if (typeof prop === 'symbol' || (typeof prop === 'string' && prop === 'prototype')){
                        return Reflect.deleteProperty(target, prop);
                    }

                    let exists = (prop in target);
                    let element = (self.details_.restricted ? self.details_.element : self.GetContextElement());
                    
                    if (element && !self.details_.element && !exists && Proxy.Delete(self.GetContextElement(), prop.toString(), self.details_.state)){
                        return true;
                    }

                    if (self.details_.parent){
                        self.details_.parent.Alert_('delete', self.details_.name, exists, { name: prop, value: target[prop] }, false);
                    }

                    delete target[prop];
                    if (prop in self.proxies_){
                        self.proxies_[prop].details_.parent = null;
                        delete self.proxies_[prop];
                    }

                    return true;
                },
                has(target: object, prop: (string | number | symbol)): boolean{
                    return (typeof prop !== 'symbol' || Reflect.has(target, prop));
                },
            };

            this.proxy_ = new AlpineLiteJSProxy(this.details_.target, handler);
            if (this.details_.parent){
                this.details_.parent.proxies_[this.details_.name] = this;
            }
        }

        private Alert_(type: string, name: string, exists: boolean, value: any, alertChildren: boolean): void{
            if (this.details_.noAlert){
                return;
            }
            
            let change : ChangesScope.AlpineLite.IChange = {
                type: type,
                name: name,
                path: this.GetPath(name),
                exists: exists,
                value: value
            }

            let changes = this.details_.state?.GetChanges();
            if (changes){
                changes.Add(change);
            }
            
            if (this.details_.parent){
                this.details_.parent.BubbleAlert_(change);
            }

            if (alertChildren){
                this.AlertChildren_(change);
            }
        }

        private BubbleAlert_(change : ChangesScope.AlpineLite.IChange): void{
            let changes = this.details_.state?.GetChanges();
            if (changes){
                changes.Add({
                    original: change,
                    name: this.details_.name,
                    path: this.GetPath(),
                    isAncestor: false
                });
            }

            if (this.details_.parent){
                this.details_.parent.BubbleAlert_(change);
            }
        }

        private AlertChildren_(change : ChangesScope.AlpineLite.IChange): void{
            let changes = this.details_.state?.GetChanges();
            if (!changes){
                return;
            }
            
            for (let name in this.proxies_){
                if (changes){
                    changes.Add({
                        original: change,
                        name: this.proxies_[name].details_.name,
                        path: this.proxies_[name].GetPath(),
                        isAncestor: true
                    });
                }

                this.proxies_[name].AlertChildren_(change);
            }
        }

        public IsRoot(): boolean{
            return !this.details_.parent;
        }

        public GetDetails(): ProxyDetails{
            return this.details_;
        }

        public GetPath(append: string = ''): string{
            if (append !== ''){
                append = ('.' + append);
            }

            return (this.details_.parent ? this.details_.parent.GetPath(this.details_.name + append) : (this.details_.name + append));
        }

        public GetPathList(): string[]{
            if (!this.details_.parent){
                return [this.details_.name];
            }

            let list = this.details_.parent.GetPathList();
            list.push(this.details_.name);

            return list;
        }

        public GetContextElement(): HTMLElement{
            return ((this.details_.parent || !this.details_.state) ? null : (this.details_.element || this.details_.state.GetElementContext()));
        }

        public GetProxy(): object{
            return this.proxy_;
        }

        public GetChildProxy(name: string): Proxy{
            return ((name in this.proxies_) ? this.proxies_[name] : null);
        }

        public static Create(details: ProxyDetails): Proxy{
            if (details.parent && (details.name in details.parent.proxies_)){//Use previously created proxy
                return details.parent.proxies_[details.name];
            }

            let target = details.target;
            let targetType = typeof target;
            
            if (!target || targetType === 'string' || targetType === 'function' || targetType !== 'object'){
                return null;
            }

            if (target instanceof Node || target instanceof DOMTokenList || target instanceof Event || target instanceof ProxyNoResult || target instanceof ValueScope.AlpineLite.Value){
                return null;
            }

            return new Proxy(details);
        }

        public static Get(element: HTMLElement, name: string, always: boolean, state: StateScope.AlpineLite.State): any{
            if (!element){
                return new ProxyNoResult();
            }

            let pk = Proxy.GetProxyKey();
            let initialized = (pk in element);
            let changes = state?.GetChanges();

            if (initialized && (name in element[pk].raw)){
                let value = Proxy.Create({
                    target: element[pk].raw[name],
                    name: name,
                    parent: element[pk].proxy,
                    element: null,
                    state: state
                });

                if (changes){
                    changes.AddGetAccess(name, element[pk].proxy.GetPath(name));
                }

                if (value === null){
                    return element[pk].raw[name];
                }
                
                return value;
            }

            let value: any;
            if (element === state?.GetRootElement()){
                value = new ProxyNoResult();
            }
            else{
                value = Proxy.Get(element.parentElement, name, false, state);
            }

            if (!always || !(value instanceof ProxyNoResult)){//Value returned or 'always' disabled
                return value;
            }
            
            if (!initialized){//Initialize
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
            else{
                element[pk].raw[name] = null;
                if (changes){
                    changes.AddGetAccess(name, element[pk].proxy.GetPath(name));
                }
            }

            if (changes){
                changes.AddGetAccess(name, element[pk].proxy.GetPath(name));
            }

            return null;
        }

        public static Set(element: HTMLElement, name: string, value: any, always: boolean, state: StateScope.AlpineLite.State): boolean{
            if (!element){
                return false;
            }

            let pk = Proxy.GetProxyKey();
            let initialized = (pk in element);

            if (initialized && (name in element[pk].raw)){
                element[pk].raw[name] = value;
                (element[pk].proxy as Proxy).Alert_('set', name, true, value, true);
                return true;
            }

            let result: boolean;
            if (element === state?.GetRootElement()){
                result = false;
            }
            else{
                result = Proxy.Set(element.parentElement, name, value, false, state);
            }

            if (!always || result){
                return result;
            }
            
            if (!initialized){//Initialize
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
            else{
                element[pk].raw[name] = value;
                (element[pk].proxy as Proxy).Alert_('set', name, true, value, true);
            }

            return true;
        }

        public static Delete(element: HTMLElement, name: string, state: StateScope.AlpineLite.State): boolean{
            if (!element){
                return false;
            }

            let pk = Proxy.GetProxyKey();
            let initialized = (pk in element);

            if (initialized && (name in element[pk].raw)){
                let raw = element[pk].raw;
                let proxy = (element[pk].proxy as Proxy);

                if (proxy.details_.parent){
                    proxy.details_.parent.Alert_('delete', proxy.details_.name, true, { name: name, value: raw[name] }, false);
                }

                delete proxy[name];
                delete raw[name];

                return true;
            }

            if (element === state?.GetRootElement()){
                return false;
            }
            
            return Proxy.Delete(element.parentElement, name, state);
        }

        public static GetNonProxy(target: any): any{
            if (target instanceof Proxy){
                return Proxy.GetNonProxy(target.details_.target);
            }

            return target;
        }

        public static GetBaseValue(target: any): any{
            target = Proxy.GetNonProxy(target);
            if (!target || typeof target !== 'object'){
                return target;
            }

            return (('__AlpineLiteTarget__' in target) ? target['__AlpineLiteTarget__'] : target);
        }

        public static ResolveValue(value: any, proxy: Proxy): any{
            if (!(value instanceof ValueScope.AlpineLite.Value)){
                return value;
            }
            
            let baseValue = (value as ValueScope.AlpineLite.Value).Get();
            let proxyValue = Proxy.Create({
                target: baseValue,
                name: name,
                parent: null,
                element: null,
                state: proxy.details_.state,
                restricted: false,
                noAlert: true
            });

            if (proxyValue){
                return proxyValue.proxy_;
            }

            return baseValue;
        }

        public static GetProxyKey(): string{
            return '__AlpineLiteProxy__';
        }

        public static AddSpecialKey(key: string, handler: ProxySpecialKeyHandler): void{
            key = ('$' + key);
            if (!(key in Proxy.specialKeys_)){
                Proxy.specialKeys_[key] = new Array<ProxySpecialKeyHandler>();
            }

            (Proxy.specialKeys_[key] as Array<ProxySpecialKeyHandler>).push(handler);
        }

        public static HandleSpecialKey(name: string, proxy: Proxy): any{
            let externalKey = Proxy.GetExternalSpecialKey();
            let contextElement = proxy.GetContextElement();

            if (contextElement && typeof contextElement === 'object' && (externalKey in contextElement)){
                let externalCallbacks = contextElement[externalKey];
                if (name in externalCallbacks){
                    let result = Proxy.ResolveValue((externalCallbacks[name] as (proxy: Proxy) => any)(proxy), proxy);
                    if (!(result instanceof ProxyNoResult)){
                        return result;
                    }
                }
            }
            
            if (!(name in Proxy.specialKeys_)){
                return new ProxyNoResult();
            }

            let result: any = new ProxyNoResult();
            let handlers: Array<ProxySpecialKeyHandler> = Proxy.specialKeys_[name];
            
            for (let i = 0; i < handlers.length; ++i){
                result = Proxy.ResolveValue((handlers[i])(proxy, result), proxy);
                if (result instanceof ProxyStopPropagation){
                    return (result as ProxyStopPropagation).value;
                }
            }

            return result;
        }

        public static AddCoreSpecialKeys(): void{
            let addKey = (key: string, callback: (proxy: Proxy, result?: any) => {}, requireRoot: ProxyRequireType, requireElement: ProxyRequireType) => {
                Proxy.AddSpecialKey(key, (proxy: Proxy, result?: any): any => {
                    if (requireRoot == ProxyRequireType.Required && proxy.details_.parent){
                        return new ProxyNoResult();
                    }

                    if (requireRoot == ProxyRequireType.MustBeAbsent && !proxy.details_.parent){
                        return new ProxyNoResult();
                    }

                    if (requireElement == ProxyRequireType.Required && !proxy.details_.element){
                        return new ProxyNoResult();
                    }

                    if (requireElement == ProxyRequireType.MustBeAbsent && proxy.details_.element){
                        return new ProxyNoResult();
                    }
                    
                    return callback(proxy, result);
                });
            };

            let addRootKey = (key: string, callback: (proxy: Proxy, result?: any) => {}) => {
                addKey(key, callback, ProxyRequireType.Required, ProxyRequireType.MustBeAbsent);
            };
            
            let addElementKey = (key: string, callback: (proxy: Proxy, result?: any) => {}) => {
                addKey(key, callback, ProxyRequireType.Nil, ProxyRequireType.Required);
            };

            let addAnyKey = (key: string, callback: (proxy: Proxy, result?: any) => {}) => {
                addKey(key, callback, ProxyRequireType.Nil, ProxyRequireType.Nil);
            };

            let getLocals = (element: HTMLElement, proxy: Proxy) => {
                if (!element){
                    return null;
                }

                let pk = Proxy.GetProxyKey();
                if (pk in element){//Initialized
                    return (element[pk].proxy as Proxy).GetProxy();
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

            let getProp = (prop: string, target: any, proxy: Proxy): [Proxy, any] => {
                if (typeof target !== 'object' || !(prop in target)){
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

            let reduce = (target: any, parts: Array<string>, proxy: Proxy): [Proxy, string] => {
                if (parts.length == 0){
                    return null;
                }

                if (parts.length == 1){
                    return [proxy, parts[0]];
                }

                let info = getProp(parts[0], target, proxy);
                if (!info[0]){
                    return null;
                }

                return reduce(info[0].proxy_, parts.splice(1), info[0]);
            };

            let get = (target: any, parts: Array<string>, proxy: Proxy) => {
                let info = reduce(target, parts, proxy);
                if (!info){
                    return null;
                }

                return getProp(info[1], info[0].proxy_, info[0])[1];
            };

            let call = (target: any, parts: Array<string>, proxy: Proxy, ...args: any[]) => {
                let info = reduce(target, parts, proxy);
                if (!info){
                    return null;
                }

                let callback = info[0].proxy_[info[1]];
                if (typeof callback !== 'function'){
                    return null;
                }

                return (callback as (...fargs: any[]) => any).call(info[0].proxy_, ...args);
            };

            let getOrCall = (prop: string, component: string, isGet: boolean, proxy: Proxy, ...args: any[]): any => {
                let componentRef = (proxy.details_.state.FindComponent(component) as Proxy);
                if (!componentRef){
                    return null;
                }

                let getAccessStorage = proxy.details_.state.GetChanges().RetrieveGetAccessStorage().Peek();
                if (getAccessStorage){
                    componentRef.details_.state.GetChanges().PushGetAccessStorage(getAccessStorage);
                }

                let value: any;
                if (isGet){
                    value = get(componentRef.proxy_, prop.split('.'), componentRef);
                }
                else{
                    value = call(componentRef.proxy_, prop.split('.'), componentRef, ...args);
                }

                if (getAccessStorage){
                    componentRef.details_.state.GetChanges().PopGetAccessStorage();
                }

                return value;
            };
            
            let tie = (name: string, prop: string, component: string, proxy: Proxy, bidirectional: boolean): void => {
                let componentRef = (proxy.details_.state.FindComponent(component) as Proxy);
                if (!componentRef){
                    return;
                }

                let info = reduce(componentRef.proxy_, prop.split('.'), componentRef);
                if (!info){
                    return;
                }

                Proxy.Watch(info[1], info[0].GetContextElement(), info[0].details_.state, (value: any): boolean => {
                    let targetInfo = reduce(proxy.proxy_, name.split('.'), proxy);
                    if (!targetInfo){
                        return false;
                    }

                    targetInfo[0].proxy_[targetInfo[1]] = value;
                    return true;
                });

                if (!bidirectional){
                    return;
                }

                let targetInfo = reduce(proxy.proxy_, name.split('.'), proxy);
                if (!targetInfo){
                    return;
                }

                Proxy.Watch(targetInfo[1], targetInfo[0].GetContextElement(), targetInfo[0].details_.state, (value: any): boolean => {
                    let sourceInfo = reduce(componentRef.proxy_, prop.split('.'), componentRef);
                    if (!sourceInfo){
                        return false;
                    }

                    sourceInfo[0].proxy_[sourceInfo[1]] = value;
                    return true;
                });
            };

            addRootKey('window', (proxy: Proxy): any => {
                return window;
            });
            
            addRootKey('document', (proxy: Proxy): any => {
                return document;
            });
            
            addRootKey('console', (proxy: Proxy): any => {
                return console;
            });
            
            addRootKey('event', (proxy: Proxy): any => {
                return new ValueScope.AlpineLite.Value(() => {
                    return proxy.details_.state.GetEventContext();
                });
            });

            addRootKey('dispatchEvent', (proxy: Proxy): any => {
                return (element: HTMLElement, event: Event, nextCycle: boolean = true) => {
                    if (nextCycle){
                        setTimeout(() => {
                            element.dispatchEvent(event);
                        }, 0);
                    }
                    else{
                        element.dispatchEvent(event);
                    }
                };
            });

            addRootKey('self', (proxy: Proxy): any => {
                return new ValueScope.AlpineLite.Value(() => {
                    return proxy.GetContextElement();
                });
            });

            addRootKey('root', (proxy: Proxy): any => {
                return new ValueScope.AlpineLite.Value(() => {
                    return proxy.details_.state.GetRootElement();
                });
            });

            addRootKey('parent', (proxy: Proxy): any => {
                return new ValueScope.AlpineLite.Value(() => {
                    let contextElement = proxy.GetContextElement();
                    return ((contextElement && contextElement != proxy.details_.state.GetRootElement()) ? contextElement.parentElement : null);
                });
            });

            addRootKey('ancestor', (proxy: Proxy): any => {
                return (index: number) => {
                    let contextElement = proxy.GetContextElement();
                    if (!contextElement){
                        return null;
                    }

                    let rootElement = proxy.details_.state.GetRootElement(), ancestor: HTMLElement = contextElement;
                    for (; 0 <= index; --index){
                        if (ancestor === rootElement){
                            return null;
                        }

                        ancestor = ancestor.parentElement;
                    }
                    
                    return ancestor;
                };
            });

            addRootKey('ancestors', (proxy: Proxy): any => {
                return new ValueScope.AlpineLite.Value(() => {
                    let contextElement = proxy.GetContextElement();
                    if (!contextElement){
                        return [];
                    }

                    let list = new Array<HTMLElement>();
                    let rootElement = proxy.details_.state.GetRootElement(), ancestor: HTMLElement = contextElement;

                    while (true){
                        if (ancestor === rootElement){
                            break;
                        }

                        ancestor = ancestor.parentElement;
                        list.push(ancestor);
                    }
                    
                    return list;
                });
            });

            addRootKey('child', (proxy: Proxy): any => {
                return (index: number) => {
                    let contextElement = proxy.GetContextElement();
                    if (!contextElement || contextElement.childElementCount <= index){
                        return null;
                    }

                    return contextElement.children[index];
                };
            });

            addRootKey('children', (proxy: Proxy): any => {
                return new ValueScope.AlpineLite.Value(() => {
                    let contextElement = proxy.GetContextElement();
                    if (!contextElement){
                        return [];
                    }

                    let list = new Array<HTMLElement>();
                    let children = contextElement.children;

                    for (let i = 0; i < children.length; ++i){
                        list.push((children[i] as HTMLElement));
                    }
                    
                    return list;
                });
            });

            addRootKey('', (proxy: Proxy): any => {
                return new ValueScope.AlpineLite.Value(() => {
                    return proxy.GetProxy();
                });
            });

            addRootKey('component', (proxy: Proxy): any => {
                return (id: string): any => {
                    let component = (proxy.details_.state.FindComponent(id) as Proxy);
                    return (component ? component.GetProxy() : null);
                };
            });

            addRootKey('get', (proxy: Proxy): any => {
                return (prop: string, component: string): any => {
                    return getOrCall(prop, component, true, proxy);
                };
            });

            addRootKey('call', (proxy: Proxy): any => {
                return (prop: string, component: string, ...args: any[]): any => {
                    return getOrCall(prop, component, false, proxy, ...args);
                };
            });

            addRootKey('tie', (proxy: Proxy): any => {
                return (name: string, prop: string, component: string): void => {
                    tie(name, prop, component, proxy, false);
                };
            });

            addRootKey('btie', (proxy: Proxy): any => {
                return (name: string, prop: string, component: string): void => {
                    tie(name, prop, component, proxy, true);
                };
            });

            addRootKey('locals', (proxy: Proxy): any => {
                return new ValueScope.AlpineLite.Value(() => {
                    return getLocals(proxy.GetContextElement(), proxy);
                });
            });

            addRootKey('localsFor', (proxy: Proxy): any => {
                return (element: HTMLElement) => {
                    let rootElement = proxy.details_.state.GetRootElement();
                    if (element && element !== rootElement && !rootElement.contains(element)){
                        return null;
                    }
                    
                    return getLocals(element, proxy);
                };
            });

            addRootKey('raw', (proxy: Proxy): any => {
                return (target: any) => {
                    return Proxy.GetNonProxy(target);
                };
            });

            addRootKey('watch', (proxy: Proxy): any => {
                return (target: string, callback: (value: any) => {}) => {
                    let isInitial = true;
                    Proxy.Watch(target, proxy.GetContextElement(), proxy.details_.state, (value: any): boolean => {
                        if (isInitial){
                            isInitial = false;
                            return true;
                        }
                        
                        return (callback.call(proxy.GetProxy(), value) !== false);
                    });
                };
            });

            addRootKey('when', (proxy: Proxy): any => {
                return (target: string, callback: (value: any) => {}) => {
                    Proxy.Watch(target, proxy.GetContextElement(), proxy.details_.state, (value: any): boolean => {
                        return (!value || callback.call(proxy.GetProxy(), value) !== false);
                    });
                };
            });

            addRootKey('once', (proxy: Proxy): any => {
                return (target: string, callback: (value: any) => {}) => {
                    Proxy.Watch(target, proxy.GetContextElement(), proxy.details_.state, (value: any): boolean => {
                        if (!value){
                            return true;
                        }

                        callback.call(proxy.GetProxy(), value);
                        return false;
                    });
                };
            });
        }

        public static Watch(target: string, element: HTMLElement, state: StateScope.AlpineLite.State, callback: (value: any) => boolean){
            let stoppedWatching = false;
            let previousValue: any = null;

            let key = state.GetElementId(element);
            if (key !== ''){
                key += '_watch';
            }
            
            state.TrapGetAccess((change: ChangesScope.AlpineLite.IChange | ChangesScope.AlpineLite.IBubbledChange): void => {
                previousValue = EvaluatorScope.AlpineLite.Evaluator.Evaluate(target, state, element);
                previousValue = state.DeepCopy(Proxy.GetBaseValue(previousValue));
                stoppedWatching = !callback(previousValue);
            }, (change: ChangesScope.AlpineLite.IChange | ChangesScope.AlpineLite.IBubbledChange): void => {
                if (stoppedWatching){
                    if (key !== ''){
                        state.GetChanges().RemoveListeners(key);
                        key = '';
                    }

                    return;
                }
                
                let value = EvaluatorScope.AlpineLite.Evaluator.Evaluate(target, state, element);
                if (state.IsEqual(value, previousValue)){
                    return;
                }
                
                if (key !== ''){
                    state.GetChanges().RemoveListeners(key);
                    key = '';
                }
                
                previousValue = state.DeepCopy(Proxy.GetBaseValue(value));
                stoppedWatching = !callback(value);
            }, null, key);
        }

        public static GetExternalSpecialKey(): string{
            return '__AlpineLiteSpecial__';
        }
    }

    (function(){
        Proxy.AddCoreSpecialKeys();
    })();
}
