let AlpineLiteJSProxy = Proxy;

namespace AlpineLite{
    //Stack begin
    export class Stack<T>{
        private list_: Array<T> = new Array<T>();

        public Push(value: T): void{
            this.list_.push(value);
        }

        public Pop(): T{
            return this.list_.pop();
        }

        public Peek(): T{
            return ((this.list_.length == 0) ? null : this.list_[this.list_.length - 1]);
        }

        public IsEmpty(): boolean{
            return (this.list_.length == 0);
        }
    }

    //Value begin
    export class Value{
        private callback_: (valueContext?: any, elementContext?: HTMLElement) => any;

        constructor(callback: (valueContext?: any, elementContext?: HTMLElement) => any){
            this.callback_ = callback;
        }

        public Get(valueContext?: any, elementContext?: HTMLElement): any{
            return this.callback_(valueContext, elementContext);
        }
    }
    
    //Changes interfaces
    interface IChange{
        type: string;
        name: string;
        path: string;
        exists: boolean;
        value: any;
    }

    interface IBubbledChange{
        original: IChange;
        name: string;
        path: string;
    }

    type ChangeCallbackType = (change: IChange | IBubbledChange) => void;
    interface ChangeCallbackInfo{
        callback: ChangeCallbackType;
        element: HTMLElement;
        key: string;
    }

    type GetAccessStorage = Record<string, string>;
    
    //Changes begin
    export class Changes{
        private listeners_: Record<string, Array<ChangeCallbackInfo>> = {};
        private list_ = new Array<IChange | IBubbledChange>();
        private getAccessStorage_ = new Stack<GetAccessStorage>();

        constructor(msDelay: number = 10){
            this.listeners_ = {};
            if (0 < msDelay){
                setInterval(() => {//Periodically watch for changes
                    if (this.list_.length == 0){
                        return;
                    }
                    
                    let list = this.list_;
                    this.list_ = new Array<IChange | IBubbledChange>();
            
                    for (let item of list){//Traverse changes
                        if (item.path in this.listeners_){
                            for (let listener of this.listeners_[item.path]){//Traverse listeners
                                listener.callback(item);
                            }
                        }
                    }
                }, msDelay);
            }
        }

        public Add(item: IChange | IBubbledChange): void{
            this.list_.push(item);
        }

        public AddGetAccess(name: string, path: string): void{
            let storage = this.getAccessStorage_.Peek();
            if (storage){
                storage[path] = name;
            }
        }

        public AddListener(path: string, callback: ChangeCallbackType, element?: HTMLElement, key?: string): void{
            if (!(path in this.listeners_)){
                this.listeners_[path] = new Array<ChangeCallbackInfo>();
            }
            
            this.listeners_[path].push({
                callback: callback,
                element: element,
                key: key
            });
        }

        public RemoveListener(path: string, callback: ChangeCallbackType): void{
            if (!(path in this.listeners_)){
                return;
            }
            
           if (!callback){
                delete this.listeners_[path];
                return;
            }

            for (let i = 0; i < this.listeners_[path].length; ++i){
                if (this.listeners_[path][i].callback === callback){
                    this.listeners_[path].slice(i, 1);
                    break;
                }
            }
        }

        public RemoveListeners(target: HTMLElement | string): void{
            let isKey = (typeof target === 'string');
            for (let path in this.listeners_){
                for (let i = this.listeners_[path].length; i > 0; --i){
                    if (isKey && this.listeners_[path][i - 1].key === target){
                        this.listeners_[path].slice((i - 1), 1);
                    }
                    else if (!isKey && this.listeners_[path][i - 1].element === target){
                        this.listeners_[path].slice((i - 1), 1);
                    }
                }
            }
        }

        public PushGetAccessStorage(storage: GetAccessStorage): void{
            this.getAccessStorage_.Push(storage);
        }

        public PopGetAccessStorage(): GetAccessStorage{
            return this.getAccessStorage_.Pop();
        }

        public RetrieveGetAccessStorage(): Stack<GetAccessStorage>{
            return this.getAccessStorage_;
        }
    }

    //State interfaces
    interface Context{
        element: HTMLElement;
    }

    export enum StateFlag{
        StaticBind,
        DebugEnabled,
    }
    
    //State begin
    export class State{
        private elementId_: number = 0;
        private elementContext_ = new Stack<HTMLElement>();
        private valueContext_ = new Stack<object>();
        private eventContext_ = new Stack<Event>();
        private localKeys_ = new Array<Record<string, Value>>();
        private flags_ = new Map<StateFlag, Stack<any>>();
        
        constructor(private changes_: Changes, private rootElement_: HTMLElement, private componentFinder_: (id: string) => any){
            this.localKeys_['$locals'] = new Value((valueContext: any) => {
                return null;
            });
        }

        public FindComponent(id: string): any{
            return (this.componentFinder_ ? this.componentFinder_(id) : null);
        }

        public GenerateElementId(): number{
            return ++this.elementId_;
        }

        public GetElementId(element: HTMLElement): string{
            if (!element){
                return '';
            }
            
            let id = element.getAttribute(State.GetIdKey());
            if (!id){//Not initialized
                id = this.GenerateElementId().toString();
                element.setAttribute(State.GetIdKey(), id);
            }

            return id;
        }

        public GetChanges(): Changes{
            return this.changes_;
        }

        public GetRootElement(): HTMLElement{
            return this.rootElement_;
        }

        public GetAncestorElement(target: HTMLElement, index: number): HTMLElement{
            if (!target || target === this.rootElement_){
                return null;
            }

            let ancestor = target;
            for (; 0 < index && ancestor && ancestor !== this.rootElement_; --index){
                ancestor = ancestor.parentElement;
            }

            return ((0 < index) ? null : ancestor);
        }

        public PushElementContext(element: HTMLElement): void{
            this.elementContext_.Push(element);
        }

        public PopElementContext(): HTMLElement{
            return this.elementContext_.Pop();
        }

        public GetElementContext(): HTMLElement{
            return this.elementContext_.Peek();
        }

        public PushValueContext(Value: object): void{
            this.valueContext_.Push(Value);
        }

        public PopValueContext(): object{
            return this.valueContext_.Pop();
        }

        public GetValueContext(): object{
            return this.valueContext_.Peek();
        }

        public PushEventContext(Value: Event): void{
            this.eventContext_.Push(Value);
        }

        public PopEventContext(): Event{
            return this.eventContext_.Pop();
        }

        public GetEventContext(): Event{
            return this.eventContext_.Peek();
        }

        public GetLocal(name: string): Value{
            return ((name in this.localKeys_) ? this.localKeys_[name] : null);
        }

        public PushFlag(key: StateFlag, Value: any): void{
            if (!(key in this.flags_)){
                this.flags_[key] = new Stack<any>();
            }
            
            this.flags_[key].Push(Value);
        }

        public PopFlag(key: StateFlag): any{
            return ((key in this.flags_) ? this.flags_[key].Pop() : null);
        }

        public GetFlag(key: StateFlag): any{
            return ((key in this.flags_) ? this.flags_[key].Peek() : null);
        }

        public ReportError(value: any, ref?: any): void{
            console.error(value, ref);
        }

        public ReportWarning(value: any, ref?: any, isDebug: boolean = true): void{
            if (!isDebug || this.GetFlag(StateFlag.DebugEnabled)){
                console.warn(value, ref);
            }
        }

        public TrapGetAccess(callback: ChangeCallbackType, changeCallback?: ChangeCallbackType | boolean, element?: HTMLElement, key?: string): void{
            let getAccessStorage: GetAccessStorage = {};
            if (changeCallback && !this.GetFlag(StateFlag.StaticBind)){//Listen for get events
                this.changes_.PushGetAccessStorage(getAccessStorage);
            }

            try{
                callback(null);
            }
            catch (err){
               this.ReportError(err, 'AlpineLine.State.TrapAccess');
            }

            if (!changeCallback || this.GetFlag(StateFlag.StaticBind)){
                return;
            }
            
            this.changes_.PopGetAccessStorage();//Stop listening for get events
            let paths = Object.keys(getAccessStorage);

            if (paths.length == 0){
                return;
            }

            let onChange = (change: IChange | IBubbledChange): void => {
                let newGetAccessStorage: GetAccessStorage = {};
                try{
                    this.changes_.PushGetAccessStorage(newGetAccessStorage);
                    if (changeCallback === true){
                        callback(change);
                    }
                    else{
                        changeCallback(change);
                    }
                }
                catch (err){
                   this.ReportError(err, 'AlpineLine.State.TrapAccess.onChange');
                }

                this.changes_.PopGetAccessStorage();//Stop listening for get events
                Object.keys(newGetAccessStorage).forEach((path: string): void => {//Listen for changes on accessed paths
                    if (!(path in getAccessStorage)){//New path
                        getAccessStorage[path] = '';
                        this.changes_.AddListener(path, onChange, element, key);
                    }
                });
            };

            paths.forEach((path: string): void => {//Listen for changes on accessed paths
                this.changes_.AddListener(path, onChange, element, key);
            });
        }

        public static GetIdKey(): string{
            return '__alpineliteid__';
        }
    }

    //Proxy interfaces
    interface ProxyDetails{
        target: object;
        name: string;
        parent: Proxy;
        element: HTMLElement;
        state: State;
        restricted?: boolean;
    }

    interface ProxyMap{
        [key: string]: Proxy;
    }

    //Proxy types
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
    
    //Proxy begin
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
            let change : IChange = {
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

        private BubbleAlert_(change : IChange): void{
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

        private AlertChildren_(change : IChange): void{
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

        public static Get(element: HTMLElement, name: string, always: boolean, state: State): any{
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

        public static Set(element: HTMLElement, name: string, value: any, always: boolean, state: State): boolean{
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

        public static Delete(element: HTMLElement, name: string, state: State): boolean{
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
            if (value instanceof Value){
                return (value as Value).Get();
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
                
                proxy.details_.state.TrapGetAccess((change: IChange | IBubbledChange): void => {
                    previousValue = Evaluator.Evaluate(target, proxy.details_.state, contextElement);
                    stoppedWatching = !callback(previousValue);
                }, (change: IChange | IBubbledChange): void => {
                    if (stoppedWatching){
                        if (key !== ''){
                            proxy.details_.state.GetChanges().RemoveListeners(key);
                            key = '';
                        }

                        return;
                    }
                    
                    let value = Evaluator.Evaluate(target, proxy.details_.state, contextElement);
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
                return new Value(() => {
                    return proxy.details_.state.GetEventContext();
                });
            });

            addRootKey('component', (proxy: Proxy): any => {
                return (id: string): any => {
                    return proxy.details_.state.FindComponent(id);
                };
            });

            addRootKey('locals', (proxy: Proxy): any => {
                return new Value(() => {
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

    //Evaluator begin
    export class Evaluator{
        private state_: State = null;

        constructor(state: State){
            this.state_ = state;
        }

        public GetState(): State{
            return this.state_;
        }

        public Evaluate(expression: string): any{
            return Evaluator.Evaluate(expression, this.state_);
        }

        public EvaluateWith(expression: string, elementContext: HTMLElement, valueContext?: any): any{
            if (!this.state_){
                return null;
            }

            this.state_.PushElementContext(elementContext);
            if (valueContext){
                this.state_.PushValueContext(valueContext);
            }

            let value = Evaluator.Evaluate(expression, this.state_);
            if (valueContext){
                this.state_.PopValueContext();
            }

            this.state_.PopElementContext();
            return value;
        }
        
        public Interpolate(expression: string): string{
            return Evaluator.Interpolate(expression, this.state_);
        }

        public InterpolateWith(expression: string, elementContext: HTMLElement, valueContext?: any): string{
            if (!this.state_){
                return '';
            }

            this.state_.PushElementContext(elementContext);
            if (valueContext){
                this.state_.PushValueContext(valueContext);
            }

            let value = Evaluator.Interpolate(expression, this.state_);
            if (valueContext){
                this.state_.PopValueContext();
            }

            this.state_.PopElementContext();
            return value;
        }
        
        public static Evaluate(expression: string, state: State, elementContext?: HTMLElement): any{
            expression = expression.trim();
            if (expression === ''){
                return null;
            }

            let result: any = null;
            let valueContext = (state ? state.GetValueContext() : null);

            if (!elementContext){
                elementContext = (state ? state.GetElementContext() : null);
            }
            
            try{
                if (valueContext){
                    result = (new Function(Evaluator.GetContextKey(), `
                        with (${Evaluator.GetContextKey()}){
                            return (${expression});
                        };
                    `)).bind(elementContext)(valueContext);
                }
                else{
                    result = (new Function(`
                        return (${expression});
                    `))();
                }
            }
            catch (err){
                state.ReportError(err, `AlpineLite.Evaluator.Value(${expression})`);
            }

            return result;
        }

        public static Interpolate(expression: string, state: State, elementContext?: HTMLElement): string{
            return expression.replace(/\{\{(.+?)\}\}/g, ($0: string, $1: string) => {
                return (Evaluator.Evaluate($1, state, elementContext) || '');
            });
        }

        public static GetContextKey(): string{
            return '__AlpineLiteContext__';
        }
    }

    //Handler interfaces
    enum HandlerReturn{
        Nil,
        Handled,
        Rejected,
    }

    interface ProcessorDirective{
        original: string;
        parts: Array<string>;
        raw: string;
        key: string;
        value: string;
    }
    
    type DirectiveHandler = (directive: ProcessorDirective, element: HTMLElement, state: State) => HandlerReturn;
    
    //Handler begin
    export class Handler{
        private directiveHandlers_ = new Map<string, DirectiveHandler>();
        private bulkDirectiveHandlers_ = new Array<DirectiveHandler>();

        public AddDirectiveHandler(directive: string, handler: DirectiveHandler): void{
            this.directiveHandlers_[directive] = handler;
        }

        public AddBulkDirectiveHandler(handler: DirectiveHandler): void{
            this.bulkDirectiveHandlers_.push(handler);
        }

        public HandleDirective(directive: ProcessorDirective, element: HTMLElement, state: State): HandlerReturn{
            for (let i = 0; i < this.bulkDirectiveHandlers_.length; ++i){
                let result = this.bulkDirectiveHandlers_[i](directive, element, state);
                if (result != HandlerReturn.Nil){//Handled or rejected
                    return result;
                }
            }

            if (directive.key in this.directiveHandlers_){//Call handler
                return this.directiveHandlers_[directive.key](directive, element, state);
            }
            
            return HandlerReturn.Nil;
        }
    }

    //Processor interfaces
    interface ProcessorOptions{
        checkTemplate?: boolean;
        checkDocument?: boolean;
    }
    
    //Processor begin
    export class Processor{
        private state_: State = null;
        private handler_: Handler = null;

        constructor(state: State, handler: Handler){
            this.state_ = state;
            this.handler_ = handler;
        }

        public All(node: Node, options?: ProcessorOptions): void{
            if (!Processor.Check(node, options)){//Check failed -- ignore
                return;
            }

            let isTemplate = (node.nodeType == 1 && (node as HTMLElement).tagName == 'TEMPLATE');
            if (!isTemplate && options?.checkTemplate && Processor.GetHTMLElement(node).closest('template')){//Inside template -- ignore
                return;
            }

            this.One(node);
            if (isTemplate || node.nodeType == 3){//Don't process template content OR node is text node (no content)
                return;
            }

            node.childNodes.forEach((node: Node) => {//Process content
                this.All(node);
            });
        }

        public One(node: Node, options?: ProcessorOptions): void{
            if (!Processor.Check(node, options)){//Check failed -- ignore
                return;
            }

            let isTemplate = (node.nodeType == 1 && (node as HTMLElement).tagName == 'TEMPLATE');
            if (!isTemplate && options?.checkTemplate && Processor.GetHTMLElement(node).closest('template')){//Inside template -- ignore
                return;
            }
            
            if (node.nodeType == 3){//Text node
                return;
            }

            let elementNode = (node as HTMLElement);
            Processor.TraverseDirectives(elementNode, (directive: ProcessorDirective): boolean => {
                return this.DispatchDirective(directive, elementNode);
            }, (attribute: Attr): boolean => {//Check for data binding inside attribute
                return true;
            });
        }

        public DispatchDirective(directive: ProcessorDirective, element: HTMLElement): boolean{
            let result: HandlerReturn;
            try{
                this.state_.PushElementContext(element);
                result = this.handler_.HandleDirective(directive, element, this.state_);
                this.state_.PopElementContext();
            }
            catch (err){
                this.state_.PopElementContext();
                this.state_.ReportError(err, `AlpineLite.Processor.DispatchDirective._Handle_.${directive.key}`);
                return true;
            }
            
            if (result == HandlerReturn.Nil){//Not handled
                if (1 < directive.parts.length && directive.parts[0] === 'static'){
                    this.state_.PushFlag(StateFlag.StaticBind, true);
                    try{
                        let newDirective: ProcessorDirective = {
                            original: directive.original,
                            parts: directive.parts.splice(1),
                            raw: '',
                            key: '',
                            value: directive.value
                        };

                        newDirective.raw = newDirective.parts.join('-');
                        newDirective.key = Processor.GetCamelCaseDirectiveName(newDirective.raw);
                        
                        if (this.DispatchDirective(newDirective, element)){
                            result = HandlerReturn.Handled;
                        }
                        else{
                            result = HandlerReturn.Rejected;
                        }
                    }
                    catch (err){
                        this.state_.ReportError(err, `AlpineLite.Processor.DispatchDirective._Handle_.${directive.key}`);
                    }

                    this.state_.PopFlag(StateFlag.StaticBind);
                }
                else{
                    this.state_.ReportWarning(`'${directive.original}': Handler not found. Skipping...`, `AlpineLite.Processor.DispatchDirective._Handle_.${directive.key}`);
                }
            }

            if (result == HandlerReturn.Rejected){
                return false;
            }

            element.removeAttribute(directive.original);
            if (result == HandlerReturn.Handled){
                Processor.GetElementId(element, this.state_);
            }
            
            return true;
        }

        public static Check(node: Node, options: ProcessorOptions): boolean{
            if (node.nodeType != 1 && node.nodeType != 3){//Node is not an element or a text node
                return false;
            }

            if (options?.checkDocument && !document.contains(node)){//Node is not contained inside the document
                return false;
            }

            return true;
        }

        public static GetHTMLElement(node: Node): HTMLElement{
            return ((node.nodeType == 1) ? (node as HTMLElement) : node.parentElement);
        }

        public static TraverseDirectives(element: HTMLElement, callback: (directive: ProcessorDirective) => boolean, noMatchCallback?: (attribute: Attr) => boolean): void{
            let attributes = new Array<Attr>();
            for (let i = 0; i < element.attributes.length; ++i){//Duplicate attributes
                attributes.push(element.attributes[i]);
            }

            for (let i = 0; i < attributes.length; ++i){//Traverse attributes
                let directive = Processor.GetDirective(attributes[i]);
                if (!directive && noMatchCallback && !noMatchCallback(attributes[i])){
                    return;
                }

                if (directive && !callback(directive)){
                    return;
                }
            }
        }

        public static GetDirective(attribute: Attr): ProcessorDirective{
            let matches = attribute.name.match(/^(data-)?x-(.+)$/);
            if (!matches || matches.length != 3 || !matches[2]){//Not a directive
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

        public static GetCamelCaseDirectiveName(name: string): string{
            return name.replace(/-([^-])/g, ($0: string, $1: string) => {
                return ($1.charAt(0).toUpperCase() + $1.slice(1));
            });
        }

        public static GetElementId(element: HTMLElement, state: State): string{
            return state.GetElementId(element);
        }

        public static GetIdKey(): string{
            return State.GetIdKey();
        }
    }

    //PlaceholderElement begin
    export class PlaceholderElement extends HTMLElement{
        public static Register(): void{
            customElements.define('x-placeholder', PlaceholderElement);
        }
    }

    type ConditionHandler = (isHandled: boolean) => boolean;
    
    //ConditionGroup begin
    export class ConditionGroup{
        private handlers_ = new Array<ConditionHandler>();

        public AddHandler(handler: ConditionHandler): void{
            this.handlers_.push(handler);
        }

        public CallHandlers(): void{
            let isHandled = false;
            this.handlers_.forEach((handler: ConditionHandler): void => {
                isHandled = (handler(isHandled) || isHandled);
            });
        }

        public GetCount(): number{
            return this.handlers_.length;
        }
    }

    //CoreBulkHandler interfaces
    interface OutsideEventHandlerInfo{
        handler: (event: Event) => void,
        element: HTMLElement
    }
    
    //CoreBulkHandler begin
    export class CoreBulkHandler{
        private static outsideEventsHandlers_ = new Map<string, Array<OutsideEventHandlerInfo>>();

        public static AddOutsideEventHandler(eventName: string, info: OutsideEventHandlerInfo, state: State): void{
            if (!(eventName in CoreBulkHandler.outsideEventsHandlers_)){
                CoreBulkHandler.outsideEventsHandlers_[eventName] = new Array<OutsideEventHandlerInfo>();
                document.addEventListener(eventName, (event: Event) => {
                    state.PushEventContext(event);
                    
                    let handlers: Array<OutsideEventHandlerInfo> = CoreBulkHandler.outsideEventsHandlers_[eventName];
                    handlers.forEach((info: OutsideEventHandlerInfo): void => {
                        if (event.target !== info.element && !info.element.contains(event.target as HTMLElement)){
                            try{
                                info.handler(event);//Event is outside element
                            }
                            catch (err){
                                state.ReportError(err, `AlpineLite.CoreHandler.AddOutsideEventHandler._Trigger_.${eventName}`);
                            }
                        }
                    });

                    state.PopEventContext();
                }, true);
            }

            CoreBulkHandler.outsideEventsHandlers_[eventName].push(info);
        }

        public static RemoveOutsideEventHandlers(element: HTMLElement, checkTemplate: boolean = true): void{
            let isTemplate = (element.tagName == 'TEMPLATE');
            if (!isTemplate && checkTemplate && element.closest('template')){//Inside template -- ignore
                return;
            }
            
            for (let eventName in CoreBulkHandler.outsideEventsHandlers_){
                let list: Array<OutsideEventHandlerInfo> = CoreBulkHandler.outsideEventsHandlers_[eventName];
                for (let i = list.length; 0 < i; --i){//Check list for matching element
                    if (list[i - 1].element === element){
                        list.splice((i - 1), 1);
                    }
                }
            }
        }
        
        public static Attr(directive: ProcessorDirective, element: HTMLElement, state: State): HandlerReturn{
            const booleanAttributes: Array<string> = [
                'allowfullscreen', 'allowpaymentrequest', 'async', 'autofocus', 'autoplay', 'checked', 'controls',
                'default', 'defer', 'disabled', 'formnovalidate', 'hidden', 'ismap', 'itemscope', 'loop', 'multiple', 'muted',
                'nomodule', 'novalidate', 'open', 'playsinline', 'readonly', 'required', 'reversed', 'selected',
            ];

            if (directive.parts[0] !== 'attr'){
                return HandlerReturn.Nil;
            }

            let isBoolean = (booleanAttributes.indexOf(directive.key) != -1);
            let isDisabled = (isBoolean && directive.key == 'disabled');

            state.TrapGetAccess((change: IChange | IBubbledChange): void => {
                if (isBoolean){
                    if (Evaluator.Evaluate(directive.value, state, element)){
                        if (isDisabled && element.tagName === 'A'){
                            element.classList.add(CoreBulkHandler.GetDisabledClassKey());
                        }
                        else{
                            element.setAttribute(directive.parts[1], directive.parts[1]);
                        }
                    }
                    else if (isDisabled && element.tagName === 'A'){
                        element.classList.remove(CoreBulkHandler.GetDisabledClassKey());
                    }
                    else{
                        element.removeAttribute(directive.parts[1]);
                    }
                }
                else{
                    element.setAttribute(directive.parts[1], Evaluator.Evaluate(directive.value, state, element));
                }
            }, true);

            return HandlerReturn.Handled;
        }

        public static Event(directive: ProcessorDirective, element: HTMLElement, state: State): HandlerReturn{
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

            let eventParts = new Array<string>();
            for (let i = 0; i < directive.parts.length; ++i){
                let part = directive.parts[i];
                if (part in markers){
                    if (0 < eventParts.length){//Malformed
                        return HandlerReturn.Nil;
                    }
                    
                    markers[part] = true;
                    eventParts = new Array<string>();
                }
                else{//Part of event
                    eventParts.push(part);
                }
            }

            if (eventParts.length == 0){//Malformed
                return HandlerReturn.Nil;
            }

            let eventName = eventParts.join('-');
            if (!markers.on && knownEvents.indexOf(eventName) == -1){//Malformed
                return HandlerReturn.Nil;   
            }

            if (!markers.outside){
                element.addEventListener(eventName, (event: Event): void => {
                    if (markers.prevented){
                        event.preventDefault();
                    }

                    if (markers.stopped){
                        event.stopPropagation();
                    }

                    state.PushEventContext(event);
                    try{
                        let result = Evaluator.Evaluate(directive.value, state, element);
                        if (typeof result === 'function'){//Call function
                            (result as (event: Event) => void)(event);
                        }
                    }
                    catch (err){
                        state.ReportError(err, `AlpineLite.CoreBulkHandler.Event._Trigger_.${eventName}`);
                    }

                    state.PopEventContext();
                });
            }
            else{//Listen for event outside element
                CoreBulkHandler.AddOutsideEventHandler(eventName, {
                    handler: (event: Event) => {
                        let result = Evaluator.Evaluate(directive.value, state, element);
                        if (typeof result === 'function'){//Call function
                            (result as (event: Event) => void)(event);
                        }
                    },
                    element: element
                }, state);
            }
        }

        public static AddAll(handler: Handler){
            handler.AddBulkDirectiveHandler(CoreBulkHandler.Attr);
            handler.AddBulkDirectiveHandler(CoreBulkHandler.Event);
        }

        public static GetDisabledClassKey(): string{
            return '__AlpineLiteDisabled__';
        }
    }

    //CoreHandler interfaces
    interface TextHandlerOptions{
        isHtml: boolean,
        callback: () => boolean,
    }
    
    interface InputHandlerOptions{
        preEvaluate: boolean,
        callback: () => boolean,
    }
    
    //CoreHandler begin
    export class CoreHandler{
        public static Cloak(directive: ProcessorDirective, element: HTMLElement, state: State): HandlerReturn{
            return HandlerReturn.Handled;
        }

        public static Data(directive: ProcessorDirective, element: HTMLElement, state: State): HandlerReturn{
            return HandlerReturn.Handled;
        }

        public static Init(directive: ProcessorDirective, element: HTMLElement, state: State): HandlerReturn{
            let result = Evaluator.Evaluate(directive.value, state, element);
            if (typeof result === 'function'){//Call function
                (result as () => any)();
            }
            
            return HandlerReturn.Handled;
        }

        public static Uninit(directive: ProcessorDirective, element: HTMLElement, state: State): HandlerReturn{
            element[CoreHandler.GetUninitKey()] = () => {
                let result = Evaluator.Evaluate(directive.value, state, element);
                if (typeof result === 'function'){//Call function
                    (result as () => any)();
                }
            };

            return HandlerReturn.Handled;
        }

        public static Bind(directive: ProcessorDirective, element: HTMLElement, state: State): HandlerReturn{
            state.TrapGetAccess((change: IChange | IBubbledChange): void => {
                let result = Evaluator.Evaluate(directive.value, state, element);
                if (typeof result === 'function'){//Call function
                    (result as () => any)();
                }
            }, true);

            return HandlerReturn.Handled;
        }

        public static Locals(directive: ProcessorDirective, element: HTMLElement, state: State): HandlerReturn{
            let result = Evaluator.Evaluate(directive.value, state, element);
            if (typeof result === 'function'){//Call function
                result = (result as () => any)();
            }

            let proxy = Proxy.Create({
                target: result,
                name: state.GetElementId(element),
                parent: null,
                element: element,
                state: state
            });

            if (!proxy){
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

        public static Id(directive: ProcessorDirective, element: HTMLElement, state: State): HandlerReturn{
            Evaluator.Evaluate(`(${directive.value})='${state.GetElementId(element)}'`, state, element);
            return HandlerReturn.Handled;
        }

        public static Ref(directive: ProcessorDirective, element: HTMLElement, state: State): HandlerReturn{
            if (element.tagName === 'TEMPLATE'){
                Evaluator.Evaluate(`(${directive.value})=this.content`, state, element);
            }
            else{
                Evaluator.Evaluate(`(${directive.value})=this`, state, element);
            }

            return HandlerReturn.Handled;
        }

        public static Text(directive: ProcessorDirective, element: HTMLElement, state: State): HandlerReturn{
            CoreHandler.Text_(directive, element, state, {
                isHtml: false,
                callback: null
            });

            return HandlerReturn.Handled;
        }

        public static Html(directive: ProcessorDirective, element: HTMLElement, state: State): HandlerReturn{
            CoreHandler.Text_(directive, element, state, {
                isHtml: true,
                callback: null
            });

            return HandlerReturn.Handled;
        }

        private static Text_(directive: ProcessorDirective, element: HTMLElement, state: State, options: TextHandlerOptions): void{
            let callback: (change: IChange | IBubbledChange) => void;
            let getValue = (): any => {
                let result = Evaluator.Evaluate(directive.value, state, element);
                return ((typeof result === 'function') ? (result as () => any)() : result);
            };
            
            if (options.isHtml){
                callback = (change: IChange | IBubbledChange): void => {
                    element.innerHTML = getValue();
                };
            }
            else if (element.tagName === 'INPUT'){
                let inputElement = (element as HTMLInputElement);
                if (inputElement.type === 'checkbox' || inputElement.type === 'radio'){
                    callback = (change: IChange | IBubbledChange): void => {
                        inputElement.checked = !!getValue();
                    };
                }
                else{
                    callback = (change: IChange | IBubbledChange): void => {
                        inputElement.value = getValue();
                    };
                }
            }
            else if (element.tagName === 'TEXTAREA'){
                callback = (change: IChange | IBubbledChange): void => {
                    (element as HTMLTextAreaElement).value = getValue();
                };
            }
            else if (element.tagName === 'SELECT'){
                callback = (change: IChange | IBubbledChange): void => {
                    (element as HTMLSelectElement).value = getValue();
                };
            }
            else{//Unknown element
                callback = (change: IChange | IBubbledChange): void => {
                    element.innerText = getValue();
                };
            }

            state.TrapGetAccess((change: IChange | IBubbledChange): void => {
                if (!options.callback || options.callback()){
                    callback(change);
                }
            }, true);
        }

        public static Input(directive: ProcessorDirective, element: HTMLElement, state: State): HandlerReturn{
            CoreHandler.Input_(directive, element, state, {
                preEvaluate: true,
                callback: null
            });

            return HandlerReturn.Handled;
        }

        public static Model(directive: ProcessorDirective, element: HTMLElement, state: State): HandlerReturn{
            let doneInput = false;
            CoreHandler.Input_(directive, element, state, {
                preEvaluate: false,
                callback: (): boolean => {
                    doneInput = true;
                    return true;
                }
            });

            CoreHandler.Text_(directive, element, state, {
                isHtml: false,
                callback: (): boolean => {
                    if (doneInput){
                        doneInput = false;
                        return false;
                    }

                    return true;
                }
            });
            
            return HandlerReturn.Handled;
        }

        private static Input_(directive: ProcessorDirective, element: HTMLElement, state: State, options: InputHandlerOptions): void{
            let getValue: () => string;
            let isCheckable: boolean = false;
            
            if (element.tagName === 'INPUT'){
                let inputElement = (element as HTMLInputElement);
                if (inputElement.type === 'checkbox' || inputElement.type === 'radio'){
                    getValue = (): string => {
                        return 'this.checked';
                    };
                }
                else{
                    getValue = (): string => {
                        return 'this.value';
                    };
                }

                isCheckable = true;
            }
            else if (element.tagName === 'TEXTAREA' || element.tagName === 'SELECT'){
                getValue = (): string => {
                    return 'this.value';
                };
            }
            else{//Unsupported
                state.ReportError(`'${element.tagName}' is not supported`, 'AlpineLite.CoreHandler.Input');
                return;
            }

            if (options.preEvaluate){
                Evaluator.Evaluate(`(${directive.value})=${getValue()}`, state, element);
            }

            let onEvent = (event: Event): void => {
                if (!options.callback || options.callback()){
                    Evaluator.Evaluate(`(${directive.value})=${getValue()}`, state, element);
                }
            };

            element.addEventListener('input', onEvent);
            if (!isCheckable && element.tagName !== 'SELECT'){
                element.addEventListener('keydown', onEvent);
                element.addEventListener('paste', onEvent);
                element.addEventListener('cut', onEvent);
            }
        }

        public static Show(directive: ProcessorDirective, element: HTMLElement, state: State): HandlerReturn{
            let getValue = (): any => {
                let result = Evaluator.Evaluate(directive.value, state, element);
                return ((typeof result === 'function') ? (result as () => any)() : result);
            };
            
            let previousDisplay = element.style.display;
            if (previousDisplay === 'none'){
                previousDisplay = 'block';
            }
            
            state.TrapGetAccess((change: IChange | IBubbledChange): void => {
                if (getValue()){
                    element.style.display = previousDisplay;
                }
                else{
                    element.style.display = 'none';
                }
            }, true);

            return HandlerReturn.Handled;
        }

        public static If(directive: ProcessorDirective, element: HTMLElement, state: State): HandlerReturn{
            let isInserted = true;
            let marker = document.createElement('x-placeholder');
            
            let getValue = (): any => {
                let result = Evaluator.Evaluate(directive.value, state, element);
                return ((typeof result === 'function') ? (result as () => any)() : result);
            };

            let attributes = new Map<string, string>();
            for (let i = 0; i < element.attributes.length; ++i){//Copy attributes
                if (element.attributes[i].name !== directive.original){
                    attributes[element.attributes[i].name] = element.attributes[i].value;
                }
            }
            
            element.parentElement.insertBefore(marker, element);
            state.TrapGetAccess((change: IChange | IBubbledChange): void => {
                let value = getValue();
                if (value && !isInserted){
                    for (let name in attributes){//Insert copied attributes
                        element.setAttribute(name, attributes[name]);
                    }

                    marker.parentElement.insertBefore(element, marker);
                    isInserted = true;
                }
                else if (!value && isInserted){
                    isInserted = false;
                    element.parentElement.removeChild(element);
                }
            }, true);

            if (!isInserted){
                element.removeAttribute(directive.original);
                for (let name in attributes){//Remove copied attributes
                    element.removeAttribute(name);
                }

                return HandlerReturn.Rejected;
            }

            return HandlerReturn.Handled;
        }

        public static AddAll(handler: Handler){
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

        public static GetUninitKey(): string{
            return '__AlpineLiteUninit__';
        }
    }

    //Bootstrap interfaces
    interface DataRegion{
        element: HTMLElement;
        data: Proxy;
        state: State;
        processor: Processor;
        handler: Handler;
        observer: MutationObserver;
    }
    
    //Bootstrap begin
    export class Bootstrap{
        private dataRegions_ = new Array<DataRegion>();

        public InitializeHandlers(handler: Handler): void{
            CoreHandler.AddAll(handler);
            CoreBulkHandler.AddAll(handler);
        }

        public Attach(msDelay: number = 10): void{
            this.Attach_('data-x-data', msDelay);
            this.Attach_('x-data', msDelay);
        }

        private Attach_(attr: string, msDelay: number): void{
            document.querySelectorAll(`[${attr}]`).forEach((element: Element): void => {
                let attributeValue = element.getAttribute(attr);
                if (attributeValue === undefined){//Probably contained inside another region
                    return;
                }
                
                let state = new State(new Changes(msDelay), (element as HTMLElement), (id: string): any => {
                    for (let i = 0; i < this.dataRegions_.length; ++i){
                        if (this.dataRegions_[i].element.id === id || this.dataRegions_[i].element.dataset['id'] === id){
                            return this.dataRegions_[i].data.GetProxy();
                        }
                    }

                    return null;
                });

                let data = Evaluator.Evaluate(attributeValue, state);
                if (typeof data === 'function'){
                    data = (data as () => {})();
                }
                
                let proxyData = Proxy.Create({
                    target: data,
                    name: null,
                    parent: null,
                    element: null,
                    state: state
                });

                if (!proxyData){
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

                let observer = new MutationObserver(function(mutations) {
                    mutations.forEach((mutation) => {
                        mutation.removedNodes.forEach((element: Node) => {
                            if (element.nodeType != 1){
                                return;
                            }
                            
                            let uninitKey = CoreHandler.GetUninitKey();
                            if (uninitKey in element){//Execute uninit callback
                                (element[uninitKey] as () => {})();
                                delete element[uninitKey];
                            }

                            CoreBulkHandler.RemoveOutsideEventHandlers(element as HTMLElement);
                        });

                        mutation.addedNodes.forEach((element: Node) => {
                            processor.All(element, {
                                checkTemplate: true,
                                checkDocument: false
                            });
                        });
                    });
                });
                
                state.PushValueContext(proxyData.GetProxy());
                this.dataRegions_.push({
                    element: (element as HTMLElement),
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
}
