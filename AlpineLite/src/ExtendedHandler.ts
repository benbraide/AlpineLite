namespace AlpineLite{
    const InputDirtyEvent = new Event('alpine.input.dirty');

    const InputTypingEvent = new Event('alpine.input.typing');
    const InputStoppedTypingEvent = new Event('alpine.input.stopped.typing');
    
    const InputValidEvent = new Event('alpine.input.valid');
    const InputInvalidEvent = new Event('alpine.input.invalid');
    
    const ObservedIncrementEvent = new Event('alpine.observed.increment');
    const ObservedDecrementEvent = new Event('alpine.observed.decrement');
    
    const ObservedVisible = new Event('alpine.observed.visible');
    const ObservedHidden = new Event('alpine.observed.hidden');
    
    interface StateCallbackInfo{
        activeValidCheck: boolean;
        isDirty: boolean;
        isTyping: boolean;
        isValid: boolean;
    };

    export class ExtendedHandler{
        private static observers_ = new Array<IntersectionObserver>();
        
        public static State(directive: ProcessorDirective, element: HTMLElement, state: State): HandlerReturn{
            if (element.tagName !== 'INPUT' && element.tagName !== 'TEXTAREA'){
                return HandlerReturn.Nil;
            }
            
            let type = ((element.tagName === 'INPUT') ? (element as HTMLInputElement).type : 'text');
            if (type !== 'text' && type !== 'password' && type !== 'email' && type !== 'search' && type !== 'number' && type !== 'tel' && type !== 'url'){
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

            let specialKeyMap = (element[Proxy.GetExternalSpecialKey()] = (element[Proxy.GetExternalSpecialKey()] || {}));
            specialKeyMap['$isDirty'] = (proxy: Proxy) => {
                if (!proxy.IsRoot() || proxy.GetDetails().element){//Root required
                    return new ProxyNoResult();
                }
                
                return new Value(() => {
                    return callbackInfo.isDirty;
                });
            };

            specialKeyMap['$isTyping'] = (proxy: Proxy) => {
                if (!proxy.IsRoot() || proxy.GetDetails().element){//Root required
                    return new ProxyNoResult();
                }
                
                return new Value(() => {
                    return callbackInfo.isTyping;
                });
            };

            specialKeyMap['$isValid'] = (proxy: Proxy) => {
                if (!proxy.IsRoot() || proxy.GetDetails().element){//Root required
                    return new ProxyNoResult();
                }
                
                return new Value(() => {
                    return callbackInfo.isValid;
                });
            };
            
            let counter = 0;
            let eventCallback = (event: Event) => {
                let checkpoint = ++counter;
                setTimeout(() => {
                    if (checkpoint != counter){
                        return;
                    }

                    if (callbackInfo.isTyping){
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

                if (!callbackInfo.isTyping){
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

            element.addEventListener('input', eventCallback);
            element.addEventListener('paste', eventCallback);
            element.addEventListener('cut', eventCallback);
            
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
    }//Implement lazy loading and correct scroll to top; Bind functions returned when handling directives

    (function(){
        ExtendedHandler.AddAll();
    })();
}
