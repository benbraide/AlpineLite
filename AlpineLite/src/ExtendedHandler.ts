namespace AlpineLite{
    interface StateCallbackInfo{
        active: Array<(event: Event) => void>;
        stopped: Array<() => void>;
        activeValidCheck: boolean;
        reportInitial: boolean;
    };

    interface ObserveCallbackInfo{
        increment: Array<(ratio: number, prevRatio: number) => void>;
        decrement: Array<(ratio: number, prevRatio: number) => void>;
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
                options = (options as () => {}).call(state.GetValueContext());
            }

            let callbackInfo: StateCallbackInfo = {
                active: new Array<(event: Event) => void>(),
                stopped: new Array<() => void>(),
                activeValidCheck: false,
                reportInitial: false
            };

            let stoppedDelay = 750;
            if (options && typeof options === 'object'){
                if (('stoppedDelay' in options) && options['stoppedDelay']){
                    stoppedDelay = options['stoppedDelay'];
                }

                if (('activeValidCheck' in options) && options['activeValidCheck']){
                    callbackInfo.activeValidCheck = true;
                }

                if (('reportInitial' in options) && options['reportInitial']){
                    callbackInfo.reportInitial = true;
                }
            }

            let map = (element[Handler.GetExternalHandlerKey()] = (element[Handler.GetExternalHandlerKey()] || {}));
            map['dirty'] = (directive: ProcessorDirective, element: HTMLElement, state: State) => {
                return ExtendedHandler.HandleDirty(directive, element, state, callbackInfo);
            };

            map['typing'] = (directive: ProcessorDirective, element: HTMLElement, state: State) => {
                return ExtendedHandler.HandleTyping(directive, element, state, callbackInfo);
            };

            map['stoppedTyping'] = (directive: ProcessorDirective, element: HTMLElement, state: State) => {
                return ExtendedHandler.HandleStoppedTyping(directive, element, state, callbackInfo);
            };

            map['valid'] = (directive: ProcessorDirective, element: HTMLElement, state: State) => {
                return ExtendedHandler.HandleValid(directive, element, state, callbackInfo);
            };

            map['invalid'] = (directive: ProcessorDirective, element: HTMLElement, state: State) => {
                return ExtendedHandler.HandleInvalid(directive, element, state, callbackInfo);
            };
            
            let counter = 0;
            let eventCallback = (event: Event) => {
                let checkpoint = ++counter;
                setTimeout(() => {
                    if (checkpoint == counter){
                        callbackInfo.stopped.forEach((callback: () => void): void => {
                            callback();
                        });
                    }
                }, stoppedDelay);
                
                callbackInfo.active.forEach((callback: (event: Event) => void): void => {
                    callback(event);
                });
            };

            element.addEventListener('keydown', eventCallback);
            element.addEventListener('input', eventCallback);
            element.addEventListener('paste', eventCallback);
            element.addEventListener('cut', eventCallback);
            
            return HandlerReturn.Handled;
        }

        public static Observe(directive: ProcessorDirective, element: HTMLElement, state: State): HandlerReturn{
            let options = Evaluator.Evaluate(directive.value, state, element);
            if (typeof options === 'function'){
                options = (options as () => {}).call(state.GetValueContext());
            }

            let callbackInfo: ObserveCallbackInfo = {
                increment: new Array<(ratio: number, prevRatio: number) => void>(),
                decrement: new Array<(ratio: number, prevRatio: number) => void>()
            };
            
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

            ExtendedHandler.ObserveWith(element, (ratio: number, prevRatio: number, isIncrement: boolean) => {
                if (isIncrement){//Increment
                    callbackInfo.increment.forEach((callback: (ratio: number, prevRatio: number) => void) => {
                        callback(ratio, prevRatio);
                    });
                }
                else{//Decrement
                    callbackInfo.decrement.forEach((callback: (ratio: number, prevRatio: number) => void) => {
                        callback(ratio, prevRatio);
                    });
                }
            }, observerOptions);

            let map = (element[Handler.GetExternalHandlerKey()] = (element[Handler.GetExternalHandlerKey()] || {}));
            map['increment'] = (directive: ProcessorDirective, element: HTMLElement, state: State) => {
                return ExtendedHandler.HandleIncrement(directive, element, state, callbackInfo);
            };

            map['decrement'] = (directive: ProcessorDirective, element: HTMLElement, state: State) => {
                return ExtendedHandler.HandleDecrement(directive, element, state, callbackInfo);
            };
            
            return HandlerReturn.Handled;
        }

        public static HandleDirty(directive: ProcessorDirective, element: HTMLElement, state: State, callbackInfo: StateCallbackInfo): HandlerReturn{
            let isDirty = false;
            callbackInfo.active.push((event: Event): void => {
                if (!isDirty){
                    isDirty = true;
                    let result = Evaluator.Evaluate(directive.value, state, element);
                    if (typeof result === 'function'){
                        (result as () => {}).call(state.GetValueContext());
                    }
                }
            });

            return HandlerReturn.Handled;
        }

        public static HandleTyping(directive: ProcessorDirective, element: HTMLElement, state: State, callbackInfo: StateCallbackInfo): HandlerReturn{
            let isTyping = false;
            callbackInfo.active.push((event: Event): void => {
                if (isTyping){
                    return;
                }

                isTyping = true;
                let result = Evaluator.Evaluate(directive.value, state, element);
                if (typeof result === 'function'){
                    (result as () => {}).call(state.GetValueContext());
                }
            });

            callbackInfo.stopped.push((): void => {
                isTyping = false;
            });
            
            return HandlerReturn.Handled;
        }

        public static HandleStoppedTyping(directive: ProcessorDirective, element: HTMLElement, state: State, callbackInfo: StateCallbackInfo): HandlerReturn{
            callbackInfo.stopped.push((): void => {
                let result = Evaluator.Evaluate(directive.value, state, element);
                if (typeof result === 'function'){
                    (result as () => {}).call(state.GetValueContext());
                }
            });

            return HandlerReturn.Handled;
        }

        public static HandleValid(directive: ProcessorDirective, element: HTMLElement, state: State, callbackInfo: StateCallbackInfo): HandlerReturn{
            if (element.tagName !== 'INPUT'){
                return HandlerReturn.Nil;
            }
            
            let wasValid = (element as HTMLInputElement).checkValidity();
            if (wasValid && callbackInfo.reportInitial){
                let result = Evaluator.Evaluate(directive.value, state, element);
                if (typeof result === 'function'){
                    (result as () => {}).call(state.GetValueContext());
                }
            }
            
            callbackInfo[callbackInfo.activeValidCheck ? 'active' : 'stopped'].push((): void => {
                let isValid = (element as HTMLInputElement).checkValidity();
                if (!isValid){
                    wasValid = false;
                    return;
                }

                if (wasValid){
                    return;
                }
                
                wasValid = true;
                let result = Evaluator.Evaluate(directive.value, state, element);
                if (typeof result === 'function'){
                    (result as () => {}).call(state.GetValueContext());
                }
            });

            return HandlerReturn.Handled;
        }

        public static HandleInvalid(directive: ProcessorDirective, element: HTMLElement, state: State, callbackInfo: StateCallbackInfo): HandlerReturn{
            if (element.tagName !== 'INPUT'){
                return HandlerReturn.Nil;
            }
            
            let wasValid = (element as HTMLInputElement).checkValidity();
            if (!wasValid && callbackInfo.reportInitial){
                let result = Evaluator.Evaluate(directive.value, state, element);
                if (typeof result === 'function'){
                    (result as () => {}).call(state.GetValueContext());
                }
            }
            
            callbackInfo[callbackInfo.activeValidCheck ? 'active' : 'stopped'].push((): void => {
                let isValid = (element as HTMLInputElement).checkValidity();
                if (isValid){
                    wasValid = true;
                    return;
                }

                if (!wasValid){
                    return;
                }
                
                wasValid = false;
                let result = Evaluator.Evaluate(directive.value, state, element);
                if (typeof result === 'function'){
                    (result as () => {}).call(state.GetValueContext());
                }
            });

            return HandlerReturn.Handled;
        }

        public static HandleIncrement(directive: ProcessorDirective, element: HTMLElement, state: State, callbackInfo: ObserveCallbackInfo): HandlerReturn{
            callbackInfo.increment.push((ratio: number, prevRatio: number): void => {
                let result = Evaluator.Evaluate(directive.value, state, element);
                if (typeof result === 'function'){
                    (result as (ratio: number, prevRatio: number) => {}).call(state.GetValueContext(), ratio, prevRatio);
                }
            });

            return HandlerReturn.Handled;
        }

        public static HandleDecrement(directive: ProcessorDirective, element: HTMLElement, state: State, callbackInfo: ObserveCallbackInfo): HandlerReturn{
            callbackInfo.decrement.push((ratio: number, prevRatio: number): void => {
                let result = Evaluator.Evaluate(directive.value, state, element);
                if (typeof result === 'function'){
                    (result as (ratio: number, prevRatio: number) => {}).call(state.GetValueContext(), ratio, prevRatio);
                }
            });
            
            return HandlerReturn.Handled;
        }

        public static ObserveWith(element: HTMLElement, callback: (ratio: number, prevRatio: number, isIncrement: boolean) => void, options: IntersectionObserverInit): void{
            let previousRatio = 0.0;
            let observer = new IntersectionObserver((entries: IntersectionObserverEntry[]) => {
                entries.forEach((entry: IntersectionObserverEntry) => {
                    callback(entry.intersectionRatio, previousRatio, (entry.isIntersecting && previousRatio < entry.intersectionRatio));
                    previousRatio = entry.intersectionRatio;
                });
            }, options);

            ExtendedHandler.observers_.push(observer);
            observer.observe(element);
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
