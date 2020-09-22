namespace AlpineLite{
    const InputDirtyEvent = new CustomEvent('alpine.input.dirty', { bubbles: true });
    const InputCleanEvent = new CustomEvent('alpine.input.clean', { bubbles: true });

    const InputResetDirtyEvent = new Event('alpine.input.reset.dirty');

    const InputTypingEvent = new CustomEvent('alpine.input.typing', { bubbles: true });
    const InputStoppedTypingEvent = new CustomEvent('alpine.input.stopped.typing', { bubbles: true });
    
    const InputValidEvent = new CustomEvent('alpine.input.valid', { bubbles: true });
    const InputInvalidEvent = new CustomEvent('alpine.input.invalid', { bubbles: true });
    
    const ObservedIncrementEvent = new CustomEvent('alpine.observed.increment', { bubbles: true });
    const ObservedDecrementEvent = new CustomEvent('alpine.observed.decrement', { bubbles: true });
    
    const ObservedVisible = new CustomEvent('alpine.observed.visible', { bubbles: true });
    const ObservedHidden = new CustomEvent('alpine.observed.hidden', { bubbles: true });
    
    interface StateCallbackInfo{
        activeValidCheck: boolean;
        isDirty: boolean;
        isTyping: boolean;
        isValid: boolean;
    };

    export class ExtendedHandler{
        private static observers_ = new Array<IntersectionObserver>();
        
        public static State(directive: ProcessorDirective, element: HTMLElement, state: State): HandlerReturn{
            let isText: boolean = false, isForm: boolean = false;
            if (element.tagName === 'INPUT'){
                let type = (element as HTMLInputElement).type;
                isText = (type === 'text' || type === 'password' || type === 'email' || type === 'search' || type === 'number' || type === 'tel' || type === 'url');
            }
            else if (element.tagName === 'TEXTAREA'){
                isText = true;
            }
            else if (element.tagName === 'FORM'){
                isForm = true;
            }
            else if (element.tagName !== 'SELECT'){
                return HandlerReturn.Nil;
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
            map['dirty'] = () => {
                return 'alpine.input.dirty';
            };

            map['input.dirty'] = () => {
                return 'alpine.input.dirty';
            };

            map['clean'] = () => {
                return 'alpine.input.clean';
            };

            map['input.clean'] = () => {
                return 'alpine.input.clean';
            };

            map['typing'] = () => {
                return 'alpine.input.typing';
            };

            map['input.typing'] = () => {
                return 'alpine.input.typing';
            };

            map['stopped.typing'] = () => {
                return 'alpine.input.stopped.typing';
            };

            map['input.stopped.typing'] = () => {
                return 'alpine.input.stopped.typing';
            };

            map['valid'] = () => {
                return 'alpine.input.valid';
            };

            map['input.valid'] = () => {
                return 'alpine.input.valid';
            };

            map['invalid'] = () => {
                return 'alpine.input.invalid';
            };

            map['input.invalid'] = () => {
                return 'alpine.input.invalid';
            };
            
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
                return new Event('alpine.input.reset.dirty');
            });

            if (isForm){
                let inputs = element.querySelectorAll('input');
                let textAreas = element.querySelectorAll('textarea');
                let selects = element.querySelectorAll('select');
                
                let totalCount = (inputs.length + textAreas.length + selects.length), dirtyCount = 0, typingCount = 0, validCount = 0;
                element.addEventListener(InputDirtyEvent.type, (event: Event) => {
                    if (++dirtyCount == 1){
                        callbackInfo.isDirty = true;
                    }
                    else{
                        event.stopImmediatePropagation();
                    }
                });

                element.addEventListener(InputCleanEvent.type, (event: Event) => {
                    if (--dirtyCount == 0){
                        callbackInfo.isDirty = false;
                    }
                    else{
                        event.stopImmediatePropagation();
                    }
                });

                element.addEventListener(InputResetDirtyEvent.type, (event: Event) => {
                    if (event.target !== element){//Bubbled
                        return;
                    }
                    
                    inputs.forEach((elem: HTMLInputElement) => {
                        elem.dispatchEvent(InputResetDirtyEvent);
                    });

                    textAreas.forEach((elem: HTMLTextAreaElement) => {
                        elem.dispatchEvent(InputResetDirtyEvent);
                    });

                    selects.forEach((elem: HTMLSelectElement) => {
                        elem.dispatchEvent(InputResetDirtyEvent);
                    });
                });
                
                element.addEventListener(InputTypingEvent.type, (event: Event) => {
                    if (++typingCount == 1){
                        callbackInfo.isTyping = true;
                    }
                    else{
                        event.stopImmediatePropagation();
                    }
                });

                element.addEventListener(InputStoppedTypingEvent.type, (event: Event) => {
                    if (--typingCount == 0){
                        callbackInfo.isTyping = false;
                    }
                    else{
                        event.stopImmediatePropagation();
                    }
                });

                element.addEventListener(InputValidEvent.type, (event: Event) => {
                    if (++validCount == totalCount){
                        callbackInfo.isValid = true;
                    }
                    else{
                        event.stopImmediatePropagation();
                    }
                });

                element.addEventListener(InputInvalidEvent.type, (event: Event) => {
                    --validCount;
                    if (callbackInfo.isValid){
                        callbackInfo.isValid = false;
                    }
                    else{
                        event.stopImmediatePropagation();
                    }
                });
                
                let childOptions = JSON.stringify({
                    stoppedDelay: stoppedDelay,
                    activeValidCheck: callbackInfo.activeValidCheck
                });
                
                inputs.forEach((elem: HTMLInputElement) => {
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
                        element.dispatchEvent(InputStoppedTypingEvent);
                    }

                    let isValid = (element as HTMLInputElement).checkValidity();
                    if (isValid != callbackInfo.isValid){
                        callbackInfo.isValid = isValid;
                        if (!callbackInfo.activeValidCheck){
                            element.dispatchEvent(isValid ? InputValidEvent : InputInvalidEvent);
                        }
                    }
                }, stoppedDelay);

                if (isText && !callbackInfo.isTyping){
                    callbackInfo.isTyping = true;
                    element.dispatchEvent(InputTypingEvent);
                }

                if (!callbackInfo.isDirty){
                    callbackInfo.isDirty = true;
                    element.dispatchEvent(InputDirtyEvent);
                }

                if (callbackInfo.activeValidCheck){
                    let isValid = (element as HTMLInputElement).checkValidity();
                    if (isValid != callbackInfo.isValid){
                        callbackInfo.isValid = isValid;
                        element.dispatchEvent(isValid ? InputValidEvent : InputInvalidEvent);
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

            element.addEventListener(InputResetDirtyEvent.type, (event: Event) => {
                if (callbackInfo.isDirty){
                    callbackInfo.isDirty = false;
                    element.dispatchEvent(InputCleanEvent);
                }
            });
            
            return HandlerReturn.Handled;
        }

        public static Observe(directive: ProcessorDirective, element: HTMLElement, state: State): HandlerReturn{
            let options = Evaluator.Evaluate(directive.value, state, element);
            if (typeof options === 'function'){
                options = (options as () => void).call(state.GetValueContext());
            }

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

            let map = (element[CoreBulkHandler.GetEventExpansionKey()] = (element[CoreBulkHandler.GetEventExpansionKey()] || {}));
            map['increment'] = () => {
                return 'alpine.observed.increment';
            };

            map['observed.increment'] = () => {
                return 'alpine.observed.increment';
            };

            map['decrement'] = () => {
                return 'alpine.observed.decrement';
            };

            map['observed.decrement'] = () => {
                return 'alpine.observed.decrement';
            };

            map['visible'] = () => {
                return 'alpine.observed.visible';
            };

            map['observed.visible'] = () => {
                return 'alpine.observed.visible';
            };

            map['hidden'] = () => {
                return 'alpine.observed.hidden';
            };

            map['observed.hidden'] = () => {
                return 'alpine.observed.hidden';
            };

            let previousRatio = 0;
            let observer = new IntersectionObserver((entries: IntersectionObserverEntry[]) => {
                entries.forEach((entry: IntersectionObserverEntry) => {
                    let isIntersecting = (!('isIntersecting' in entry) ? (0 < (entry as IntersectionObserverEntry).intersectionRatio) : entry.isIntersecting);
                    if (!isIntersecting){//Hidden
                        element.dispatchEvent(ObservedDecrementEvent);
                        element.dispatchEvent(ObservedHidden);
                        previousRatio = 0;
                    }
                    else if (previousRatio < entry.intersectionRatio){//Increment
                        if (previousRatio == 0){//Visible
                            element.dispatchEvent(ObservedVisible);
                        }

                        element.dispatchEvent(ObservedIncrementEvent);
                        previousRatio = entry.intersectionRatio;
                    }
                    else{//Decrement
                        element.dispatchEvent(ObservedDecrementEvent);
                        previousRatio = entry.intersectionRatio;
                    }
                });
            }, observerOptions);

            ExtendedHandler.observers_.push(observer);
            observer.observe(element);

            return HandlerReturn.Handled;
        }

        public static AddAll(){
            Handler.AddDirectiveHandler('state', ExtendedHandler.State);
            Handler.AddDirectiveHandler('observe', ExtendedHandler.Observe);
        }
    }

    (function(){
        ExtendedHandler.AddAll();
    })();
}
