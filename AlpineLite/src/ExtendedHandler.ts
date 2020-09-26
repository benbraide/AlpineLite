namespace AlpineLite{
    const InputDirtyEvent = 'alpinelite.input.dirty';
    const InputCleanEvent = 'alpinelite.input.clean';

    const InputResetDirtyEvent = 'alpinelite.input.reset.dirty';

    const InputTypingEvent = 'alpinelite.input.typing';
    const InputStoppedTypingEvent = 'alpinelite.input.stopped.typing';
    
    const InputValidEvent = 'alpinelite.input.valid';
    const InputInvalidEvent = 'alpinelite.input.invalid';
    
    const ObservedIncrementEvent = 'alpinelite.observed.increment';
    const ObservedDecrementEvent = 'alpinelite.observed.decrement';
    
    const ObservedVisibleEvent = 'alpinelite.observed.visible';
    const ObservedHiddenEvent = 'alpinelite.observed.hidden';

    const ObservedUnsupportedEvent = 'alpinelite.observed.unsupported';
    const LazyLoadedEvent = 'alpinelite.lazy.loaded';
    
    interface StateCallbackInfo{
        activeValidCheck: boolean;
        isDirty: boolean;
        isTyping: boolean;
        isValid: boolean;
    }

    export class ExtendedHandler{
        private static observers_ = new Array<IntersectionObserver>();
        
        public static State(directive: ProcessorDirective, element: HTMLElement, state: State): HandlerReturn{
            let isText: boolean = false, isUnknown: boolean = false;
            if (element.tagName === 'INPUT'){
                let type = (element as HTMLInputElement).type;
                isText = (type === 'text' || type === 'password' || type === 'email' || type === 'search' || type === 'number' || type === 'tel' || type === 'url');
            }
            else if (element.tagName === 'TEXTAREA'){
                isText = true;
            }
            else if (element.tagName !== 'SELECT'){
                isUnknown = true;
            }
            
            let options = Evaluator.Evaluate(directive.value, state, element);
            if (typeof options === 'function'){
                options = (options as () => void).call(state.GetValueContext());
            }

            let callbackInfo: StateCallbackInfo = {
                activeValidCheck: false,
                isDirty: false,
                isTyping: false,
                isValid: (element as HTMLInputElement).checkValidity()
            };

            let stoppedDelay = 750;
            if (options && typeof options === 'object'){
                if (('stoppedDelay' in options) && options['stoppedDelay']){
                    stoppedDelay = options['stoppedDelay'];
                }

                if (('activeValidCheck' in options) && options['activeValidCheck']){
                    callbackInfo.activeValidCheck = true;
                }
            }

            let map = (element[CoreBulkHandler.GetEventExpansionKey()] = (element[CoreBulkHandler.GetEventExpansionKey()] || {}));
            map['dirty'] = () => InputDirtyEvent;
            map['input.dirty'] = () => InputDirtyEvent;

            map['clean'] = () => InputCleanEvent;
            map['input.clean'] = () => InputCleanEvent;

            map['typing'] = () => InputTypingEvent;
            map['input.typing'] = () => InputTypingEvent;

            map['stopped.typing'] = () => InputStoppedTypingEvent;
            map['input.stopped.typing'] = () => InputStoppedTypingEvent;

            map['valid'] = () => InputValidEvent;
            map['input.valid'] = () => InputValidEvent;

            map['invalid'] = () => InputInvalidEvent;
            map['input.invalid'] = () => InputInvalidEvent;
            
            let locals: {
                raw: any;
                proxy: Proxy;
            };

            let proxyKey = Proxy.GetProxyKey();
            if (!(proxyKey in element)){
                let raw = {};
                let localProxy = Proxy.Create({
                    target: raw,
                    name: state.GetElementId(element),
                    parent: null,
                    element: element,
                    state: state
                });

                element[proxyKey] = {
                    raw: raw,
                    proxy: localProxy
                };
            }
            
            locals = element[proxyKey];
            locals.raw['$isDirty'] = new Value(() => {
                return callbackInfo.isDirty;
            });

            locals.raw['$isTyping'] = new Value(() => {
                return callbackInfo.isTyping;
            });

            locals.raw['$isValid'] = new Value(() => {
                return callbackInfo.isValid;
            });

            locals.raw['$resetDirtyEvent'] = new Value(() => {
                return new Event('alpinelite.input.reset.dirty');
            });

            if (isUnknown){
                let inputs = element.querySelectorAll('input');
                let textAreas = element.querySelectorAll('textarea');
                let selects = element.querySelectorAll('select');
                
                element.addEventListener(InputResetDirtyEvent, (event: Event) => {
                    if (event.target !== element){//Bubbled
                        return;
                    }
                    
                    inputs.forEach((elem: HTMLInputElement) => {
                        elem.dispatchEvent(new Event(InputResetDirtyEvent));
                    });

                    textAreas.forEach((elem: HTMLTextAreaElement) => {
                        elem.dispatchEvent(new Event(InputResetDirtyEvent));
                    });

                    selects.forEach((elem: HTMLSelectElement) => {
                        elem.dispatchEvent(new Event(InputResetDirtyEvent));
                    });
                });
                
                let totalCount = (inputs.length + textAreas.length + selects.length), dirtyCount = 0, typingCount = 0, validCount = 0;
                let eventHandlers = new Map<string, (event: Event) => void>();

                eventHandlers[InputDirtyEvent] = (event: Event) => {
                    if (++dirtyCount == 1){
                        callbackInfo.isDirty = true;
                        element.dispatchEvent(new Event(InputDirtyEvent));
                    }
                };
                
                eventHandlers[InputCleanEvent] = (event: Event) => {
                    if (--dirtyCount == 0){
                        callbackInfo.isDirty = false;
                        element.dispatchEvent(new Event(InputCleanEvent));
                    }
                };
                
                eventHandlers[InputTypingEvent] = (event: Event) => {
                    if (++typingCount == 1){
                        callbackInfo.isTyping = true;
                        element.dispatchEvent(new Event(InputTypingEvent));
                    }
                };
                
                eventHandlers[InputStoppedTypingEvent] = (event: Event) => {
                    if (--typingCount == 0){
                        callbackInfo.isTyping = false;
                        element.dispatchEvent(new Event(InputStoppedTypingEvent));
                    }
                };
                
                eventHandlers[InputValidEvent] = (event: Event) => {
                    if (++validCount == totalCount){
                        callbackInfo.isValid = true;
                        element.dispatchEvent(new Event(InputValidEvent));
                    }
                };
                
                eventHandlers[InputInvalidEvent] = (event: Event) => {
                    --validCount;
                    if (callbackInfo.isValid){
                        callbackInfo.isValid = false;
                        element.dispatchEvent(new Event(InputInvalidEvent));
                    }
                };
                
                let childOptions = JSON.stringify({
                    stoppedDelay: stoppedDelay,
                    activeValidCheck: callbackInfo.activeValidCheck
                });
                
                inputs.forEach((elem: HTMLInputElement) => {
                    for (let event in eventHandlers){
                        elem.addEventListener(event, eventHandlers[event]);
                    }
                    
                    ExtendedHandler.State({
                        original: null,
                        parts: null,
                        raw: null,
                        key: null,
                        value: childOptions
                    }, elem, state);

                    if (elem.checkValidity()){
                        ++validCount;
                    }
                });

                textAreas.forEach((elem: HTMLTextAreaElement) => {
                    for (let event in eventHandlers){
                        elem.addEventListener(event, eventHandlers[event]);
                    }
                    
                    ExtendedHandler.State({
                        original: null,
                        parts: null,
                        raw: null,
                        key: null,
                        value: childOptions
                    }, elem, state);

                    if (elem.checkValidity()){
                        ++validCount;
                    }
                });

                selects.forEach((elem: HTMLSelectElement) => {
                    for (let event in eventHandlers){
                        elem.addEventListener(event, eventHandlers[event]);
                    }
                    
                    ExtendedHandler.State({
                        original: null,
                        parts: null,
                        raw: null,
                        key: null,
                        value: childOptions
                    }, elem, state);

                    if (elem.checkValidity()){
                        ++validCount;
                    }
                });
                
                return HandlerReturn.Handled;
            }
            
            let counter = 0;
            let eventCallback = (event: Event) => {
                let checkpoint = ++counter;
                setTimeout(() => {
                    if (checkpoint != counter){
                        return;
                    }

                    if (isText && callbackInfo.isTyping){
                        callbackInfo.isTyping = false;
                        element.dispatchEvent(new Event(InputStoppedTypingEvent));
                    }

                    let isValid = (element as HTMLInputElement).checkValidity();
                    if (isValid != callbackInfo.isValid){
                        callbackInfo.isValid = isValid;
                        if (!callbackInfo.activeValidCheck){
                            element.dispatchEvent(new Event(isValid ? InputValidEvent : InputInvalidEvent));
                        }
                    }
                }, stoppedDelay);

                if (isText && !callbackInfo.isTyping){
                    callbackInfo.isTyping = true;
                    element.dispatchEvent(new Event(InputTypingEvent));
                }

                if (!callbackInfo.isDirty){
                    callbackInfo.isDirty = true;
                    element.dispatchEvent(new Event(InputDirtyEvent));
                }

                if (callbackInfo.activeValidCheck){
                    let isValid = (element as HTMLInputElement).checkValidity();
                    if (isValid != callbackInfo.isValid){
                        callbackInfo.isValid = isValid;
                        element.dispatchEvent(new Event(isValid ? InputValidEvent : InputInvalidEvent));
                    }
                }
            };

            if (isText){
                element.addEventListener('input', eventCallback);
                element.addEventListener('paste', eventCallback);
                element.addEventListener('cut', eventCallback);
            }
            else{
                element.addEventListener('change', eventCallback);
            }

            element.addEventListener(InputResetDirtyEvent, (event: Event) => {
                if (callbackInfo.isDirty){
                    callbackInfo.isDirty = false;
                    element.dispatchEvent(new Event(InputCleanEvent));
                }
            });
            
            return HandlerReturn.Handled;
        }

        public static Observe(directive: ProcessorDirective, element: HTMLElement, state: State): HandlerReturn{
            let map = (element[CoreBulkHandler.GetEventExpansionKey()] = (element[CoreBulkHandler.GetEventExpansionKey()] || {}));

            let options = Evaluator.Evaluate(directive.value, state, element);
            if (typeof options === 'function'){
                options = (options as () => Map<string, any>).call(state.GetValueContext());
            }

            map['unsupported'] = () => ObservedUnsupportedEvent;
            map['observed.unsupported'] = () => ObservedUnsupportedEvent;
            
            map['increment'] = () => ObservedIncrementEvent;
            map['observed.increment'] = () => ObservedIncrementEvent;

            map['decrement'] = () => ObservedDecrementEvent;
            map['observed.decrement'] = () => ObservedDecrementEvent;

            map['visible'] = () => ObservedVisibleEvent;
            map['observed.visible'] = () => ObservedVisibleEvent;

            map['hidden'] = () => ObservedHiddenEvent;
            map['observed.hidden'] = () => ObservedHiddenEvent;

            let previousRatio = 0;
            ExtendedHandler.ObserveWith(ExtendedHandler.GetObserveOptions(options), element, (entry: IntersectionObserverEntry | false): boolean => {
                if (entry instanceof IntersectionObserverEntry){
                    let isIntersecting = (!('isIntersecting' in entry) ? (0 < (entry as IntersectionObserverEntry).intersectionRatio) : entry.isIntersecting);
                    if (!isIntersecting){//Hidden
                        element.dispatchEvent(new Event(ObservedDecrementEvent));
                        element.dispatchEvent(new Event(ObservedHiddenEvent));
                        previousRatio = 0;
                    }
                    else if (previousRatio < entry.intersectionRatio){//Increment
                        if (previousRatio == 0){//Visible
                            element.dispatchEvent(new Event(ObservedVisibleEvent));
                        }
    
                        element.dispatchEvent(new Event(ObservedIncrementEvent));
                        previousRatio = entry.intersectionRatio;
                    }
                    else{//Decrement
                        element.dispatchEvent(new Event(ObservedDecrementEvent));
                        previousRatio = entry.intersectionRatio;
                    }
                }
                else{//Not supported
                    setTimeout(() => {
                        element.dispatchEvent(new Event(ObservedUnsupportedEvent));
                    }, 0);
                }

                return true;
            });

            return HandlerReturn.Handled;
        }

        public static LazyLoad(directive: ProcessorDirective, element: HTMLElement, state: State): HandlerReturn{
            let options = Evaluator.Evaluate(directive.value, state, element);
            if (typeof options === 'function'){
                options = (options as () => Map<string, any>).call(state.GetValueContext());
            }

            if (!options){
                return HandlerReturn.Nil;
            }

            if (typeof options !== 'object'){
                options = {
                    threshold: 0.5,
                    url: options
                };
            }
            else if (!('url' in options) || !options['url']){
                return HandlerReturn.Nil;
            }

            if (!('threshold' in options)){
                options['threshold'] = 0.5;
            }

            let map = (element[CoreBulkHandler.GetEventExpansionKey()] = (element[CoreBulkHandler.GetEventExpansionKey()] || {}));
            
            map['unsupported'] = () => ObservedUnsupportedEvent;
            map['observed.unsupported'] = () => ObservedUnsupportedEvent;
            
            map['loaded'] = () => LazyLoadedEvent;
            map['lazy.loaded'] = () => LazyLoadedEvent;

            ExtendedHandler.ObserveWith(ExtendedHandler.GetObserveOptions(options), element, (entry: IntersectionObserverEntry | false): boolean => {
                if (!(entry instanceof IntersectionObserverEntry)){
                    setTimeout(() => {
                        element.dispatchEvent(new Event(ObservedUnsupportedEvent));
                    }, 0);
                }
                else if ((entry as IntersectionObserverEntry).isIntersecting){//Not supported
                    ExtendedHandler.FetchLoad(element, options['url']);
                    return false;
                }

                return true;
            });
            
            return HandlerReturn.Handled;
        }

        public static ConditionalLoad(directive: ProcessorDirective, element: HTMLElement, state: State): HandlerReturn{
            let options = Evaluator.Evaluate(directive.value, state, element);
            if (typeof options === 'function'){
                options = (options as () => void).call(state.GetValueContext());
            }

            if (!options || typeof options !== 'object' || !('condition' in options) || !('url' in options)){
                return HandlerReturn.Nil;
            }

            let map = (element[CoreBulkHandler.GetEventExpansionKey()] = (element[CoreBulkHandler.GetEventExpansionKey()] || {}));
            map['loaded'] = () => LazyLoadedEvent;
            map['lazy.loaded'] = () => LazyLoadedEvent;

            let condition = options['condition'];
            if (typeof condition === 'string'){
                Proxy.Watch(condition, element, state, (value: any): boolean => {//Once
                    if (!value){
                        return true;
                    }
    
                    ExtendedHandler.FetchLoad(element, options['url']);
                    return false;
                });
            }
            else if (condition){
                ExtendedHandler.FetchLoad(element, options['url']);
            }
            
            return HandlerReturn.Handled;
        }

        public static XHRLoad(directive: ProcessorDirective, element: HTMLElement, state: State): HandlerReturn{
            let map = (element[CoreBulkHandler.GetEventExpansionKey()] = (element[CoreBulkHandler.GetEventExpansionKey()] || {}));
            
            map['loaded'] = () => LazyLoadedEvent;
            map['lazy.loaded'] = () => LazyLoadedEvent;

            let previousUrl = null;
            state.TrapGetAccess((change: IChange | IBubbledChange): void => {
                let url = Evaluator.Evaluate(directive.value, state, element);
                if (typeof url === 'function'){//Call function
                    url = (url as () => any).call(state.GetValueContext());
                }

                if (url !== previousUrl){
                    if (url === '::reload::'){
                        url = previousUrl;
                    }
                    else{
                        previousUrl = url;
                    }

                    ExtendedHandler.FetchLoad(element, url);
                }
            }, true);
            
            return HandlerReturn.Handled;
        }

        public static AttrChange(directive: ProcessorDirective, element: HTMLElement, state: State): HandlerReturn{
            if (directive.key !== 'attrChange'){
                return HandlerReturn.Nil;
            }

            let locals: {
                raw: any;
                proxy: Proxy;
            };

            let proxyKey = Proxy.GetProxyKey(), attrName: string = null;
            if (!(proxyKey in element)){
                let raw = {};
                let localProxy = Proxy.Create({
                    target: raw,
                    name: state.GetElementId(element),
                    parent: null,
                    element: element,
                    state: state
                });

                element[proxyKey] = {
                    raw: raw,
                    proxy: localProxy
                };
            }
            
            locals = element[proxyKey];
            locals.raw['$attr'] = new Value(() => {
                return attrName;
            });

            let listeners = (element[Handler.GetAttributeChangeKey()] = (element[Handler.GetAttributeChangeKey()] || []));
            listeners.push((attr: string) => {
                attrName = attr;
                
                let result = Evaluator.Evaluate(directive.value, state, element);
                if (typeof result === 'function'){//Call function
                    (result as (name: string) => any).call(state.GetValueContext(), attr);
                }
            });
            
            return HandlerReturn.Handled;
        }

        public static GetObserveOptions(options: Map<string, any>): IntersectionObserverInit{
            let observerOptions: IntersectionObserverInit = {
                root: null,
                rootMargin: '0px',
                threshold: 0
            };

            if (options && typeof options === 'object'){
                if ('root' in options){
                    observerOptions.root = options['root'];
                    if (typeof observerOptions.root === 'string'){
                        observerOptions.root = document.querySelector(observerOptions.root as string);
                    }
                }

                if ('rootMargin' in options){
                    observerOptions.rootMargin = options['rootMargin'];
                }

                if ('threshold' in options){
                    observerOptions.threshold = options['threshold'];
                }
            }

            return observerOptions;
        }
        
        public static ObserveWith(options: IntersectionObserverInit, element: HTMLElement, callback: (entry: IntersectionObserverEntry | false) => boolean): void{
            if (!('IntersectionObserver' in window)){
                callback(false);
                return;
            }

            let observer = new IntersectionObserver((entries: IntersectionObserverEntry[]) => {
                entries.forEach((entry: IntersectionObserverEntry) => {
                    if (!callback(entry)){
                        observer.unobserve(element);
                        for (let i = 0; i < ExtendedHandler.observers_.length; ++i){
                            if (ExtendedHandler.observers_[i] === observer){
                                ExtendedHandler.observers_.splice(i, 1);
                                break;
                            }
                        }
                    }
                });
            }, options);

            ExtendedHandler.observers_.push(observer);
            observer.observe(element);
        }

        public static FetchLoad(element: HTMLElement, url: string): void{
            if (!url){
                return;
            }

            let emptyElement = () => {
                while (element.firstChild){
                    element.removeChild(element.firstChild);
                }
            };
            
            if (url === '::destroy::'){
                if (element.tagName === 'IMG' || element.tagName === 'IFRAME'){
                    (element as HTMLImageElement).src = '';
                }
                else{
                    emptyElement();
                }
            }
            else if (element.tagName === 'IMG' || element.tagName === 'IFRAME'){
                let loadHandler = (event: Event) => {
                    element.removeEventListener('load', loadHandler);
                    element.dispatchEvent(new Event(LazyLoadedEvent));
                };

                element.addEventListener('load', loadHandler);
                (element as HTMLImageElement).src = url;
            }
            else if (element.tagName === 'SELECT'){
                fetch(url)
                .then((response) => response.json())
                .then((data) => {
                    emptyElement();

                    (data as Array<{key: string, value: string}>).forEach((entry) => {
                        let option: HTMLOptionElement = document.createElement('option');
                        
                        option.value = entry.key;
                        option.textContent = entry.value;

                        element.appendChild(option);
                    });
                    
                    element.dispatchEvent(new Event(LazyLoadedEvent));
                    element.dispatchEvent(new Event('change'));
                });
            }
            else{//Generic
                fetch(url)
                .then((response) => response.text())
                .then((data) => {
                    emptyElement();
                    element.innerHTML = data;
                    element.dispatchEvent(new Event(LazyLoadedEvent));
                });
            }
        }

        public static AddAll(){
            Handler.AddDirectiveHandler('state', ExtendedHandler.State);
            Handler.AddDirectiveHandler('observe', ExtendedHandler.Observe);
            Handler.AddDirectiveHandler('lazyLoad', ExtendedHandler.LazyLoad);
            Handler.AddDirectiveHandler('conditionalLoad', ExtendedHandler.ConditionalLoad);
            Handler.AddDirectiveHandler('xhrLoad', ExtendedHandler.XHRLoad);
            Handler.AddDirectiveHandler('attrChange', ExtendedHandler.AttrChange);
        }
    }

    (function(){
        ExtendedHandler.AddAll();
    })();
}
