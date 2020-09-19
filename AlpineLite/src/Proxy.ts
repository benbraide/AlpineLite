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
                    
                    let element = (self.details_.restricted ? self.details_.element : self.GetContextElement());
                    let name = prop.toString();

                    let keyResult = Proxy.HandleSpecialKey(name, self);
                    if (!(keyResult instanceof ProxyNoResult)){//Value returned
                        return Proxy.ResolveValue(keyResult);
                    }
                    
                    if (element && !self.details_.element){
                        let value = Proxy.Get(element, name, !(prop in target), self.details_.state);
                        if (!(value instanceof ProxyNoResult)){//Value returned
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
                    
                    if (element && !self.details_.element && Proxy.Set(self.GetContextElement(), prop.toString(), nonProxyValue, !exists, self.details_.state)){
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
                    
                    if (element && !self.details_.element && Proxy.Delete(self.GetContextElement(), prop.toString(), self.details_.state)){
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
                    path: this.GetPath()
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
                        path: this.proxies_[name].GetPath()
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

        public static ResolveValue(value: any): any{
            if (value instanceof ValueScope.AlpineLite.Value){
                return (value as ValueScope.AlpineLite.Value).Get();
            }
            
            return value;
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
            if (!(name in Proxy.specialKeys_)){
                return new ProxyNoResult();
            }

            let result: any = new ProxyNoResult();
            let handlers: Array<ProxySpecialKeyHandler> = Proxy.specialKeys_[name];
            
            for (let i = 0; i < handlers.length; ++i){
                result = Proxy.ResolveValue((handlers[i])(proxy, result));
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

            let isEqual = (first: any, second: any) => {
                let firstType = (typeof first), secondType = (typeof second);
                if (firstType !== secondType){
                    return false;
                }

                if (Array.isArray(first)){
                    if (first.length != second.length){
                        return false;
                    }

                    for (let i = 0; i < first.length; ++i){
                        if (!isEqual(first[i], second[i])){
                            return false;
                        }
                    }

                    return true;
                }

                if (firstType === 'object'){
                    let firstKeys = Object.keys(first), secondKeys = Object.keys(second);
                    if (!isEqual(firstKeys, secondKeys)){
                        return false;
                    }

                    for (let i = 0; i < firstKeys.length; ++i){
                        if (!isEqual(first[firstKeys[i]], second[firstKeys[i]])){
                            return false;
                        }
                    }

                    return true;
                }
                
                return (first === second);
            };

            let watch = (target: string, proxy: Proxy, callback: (value: any) => {}) => {
                let stoppedWatching = false;
                let previousValue: any = null;

                let contextElement = proxy.GetContextElement();
                let key = proxy.details_.state.GetElementId(contextElement);

                if (key !== ''){
                    key += '_watch';
                }
                
                proxy.details_.state.TrapGetAccess((change: ChangesScope.AlpineLite.IChange | ChangesScope.AlpineLite.IBubbledChange): void => {
                    previousValue = EvaluatorScope.AlpineLite.Evaluator.Evaluate(target, proxy.details_.state, contextElement);
                    stoppedWatching = !callback(previousValue);
                }, (change: ChangesScope.AlpineLite.IChange | ChangesScope.AlpineLite.IBubbledChange): void => {
                    if (stoppedWatching){
                        if (key !== ''){
                            proxy.details_.state.GetChanges().RemoveListeners(key);
                            key = '';
                        }

                        return;
                    }
                    
                    let value = EvaluatorScope.AlpineLite.Evaluator.Evaluate(target, proxy.details_.state, contextElement);
                    if (isEqual(value, previousValue)){
                        return;
                    }
                    
                    if (key !== ''){
                        proxy.details_.state.GetChanges().RemoveListeners(key);
                        key = '';
                    }
                    
                    previousValue = value;
                    stoppedWatching = !callback(value);
                }, null, key);
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

            addRootKey('component', (proxy: Proxy): any => {
                return (id: string): any => {
                    return proxy.details_.state.FindComponent(id);
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

            addRootKey('watch', (proxy: Proxy): any => {
                return (target: string, callback: (value: any) => {}) => {
                    let isInitial = true;
                    watch(target, proxy, (value: any): boolean => {
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
                    watch(target, proxy, (value: any): boolean => {
                        return (!value || callback.call(proxy.GetProxy(), value) !== false);
                    });
                };
            });

            addRootKey('once', (proxy: Proxy): any => {
                return (target: string, callback: (value: any) => {}) => {
                    watch(target, proxy, (value: any): boolean => {
                        if (!value){
                            return true;
                        }

                        callback.call(proxy.GetProxy(), value);
                        return false;
                    });
                };
            });

            addAnyKey('get', (proxy: Proxy): any => {
                return (prop: string): any => {
                    let baseValue = ((prop in proxy.details_.target) ? Reflect.get(proxy.details_.target, prop) : null);
                    let value = Proxy.Create({
                        target: baseValue,
                        name: prop,
                        parent: proxy,
                        element: null,
                        state: proxy.details_.state
                    });

                    let changes = proxy.details_.state?.GetChanges();
                    if (changes){
                        changes.AddGetAccess(prop, proxy.GetPath(prop));
                    }

                    if (value){
                        return value.proxy_;
                    }

                    return baseValue;
                };
            });

            addAnyKey('set', (proxy: Proxy): any => {
                return (prop: string, value: any): boolean => {
                    let exists = (prop in proxy.details_.target);
                    
                    proxy.details_.target[prop] = Proxy.GetNonProxy(value);
                    if (prop in proxy.proxies_){
                        proxy.proxies_[prop].details_.parent = null;
                        delete proxy.proxies_[prop];
                    }

                    proxy.Alert_('set', prop.toString(), exists, value, true);

                    return true;
                };
            });

            addAnyKey('delete', (proxy: Proxy): any => {
                return (prop: string): boolean => {
                    let exists = (prop in proxy.details_.target);
                    
                    if (proxy.details_.parent){
                        proxy.details_.parent.Alert_('delete', proxy.details_.name, exists, { name: prop, value: proxy.details_.target[prop] }, false);
                    }

                    delete proxy.details_.target[prop];
                    if (prop in proxy.proxies_){
                        proxy.proxies_[prop].details_.parent = null;
                        delete proxy.proxies_[prop];
                    }

                    return true;
                };
            });
        }
    }
}
