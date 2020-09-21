namespace AlpineLite{
    interface InputCallbackInfo{
        active: Array<(event: Event) => void>;
        stopped: Array<() => void>;
        activeValidCheck: boolean;
        reportInitial: boolean;
    };
    
    export class ExtendedHandler{
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

            let callbackInfo: InputCallbackInfo = {
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

            element[Handler.GetExternalHandlerKey()] = {
                dirty: (directive: ProcessorDirective, element: HTMLElement, state: State) => {
                    return ExtendedHandler.HandleDirty(directive, element, state, callbackInfo);
                },
                typing: (directive: ProcessorDirective, element: HTMLElement, state: State) => {
                    return ExtendedHandler.HandleTyping(directive, element, state, callbackInfo);
                },
                stoppedTyping: (directive: ProcessorDirective, element: HTMLElement, state: State) => {
                    return ExtendedHandler.HandleStoppedTyping(directive, element, state, callbackInfo);
                },
                valid: (directive: ProcessorDirective, element: HTMLElement, state: State) => {
                    return ExtendedHandler.HandleValid(directive, element, state, callbackInfo);
                },
                invalid: (directive: ProcessorDirective, element: HTMLElement, state: State) => {
                    return ExtendedHandler.HandleInvalid(directive, element, state, callbackInfo);
                }
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

        public static HandleDirty(directive: ProcessorDirective, element: HTMLElement, state: State, callbackInfo: InputCallbackInfo): HandlerReturn{
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

        public static HandleTyping(directive: ProcessorDirective, element: HTMLElement, state: State, callbackInfo: InputCallbackInfo): HandlerReturn{
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

        public static HandleStoppedTyping(directive: ProcessorDirective, element: HTMLElement, state: State, callbackInfo: InputCallbackInfo): HandlerReturn{
            callbackInfo.stopped.push((): void => {
                let result = Evaluator.Evaluate(directive.value, state, element);
                if (typeof result === 'function'){
                    (result as () => {})();
                }
            });

            return HandlerReturn.Handled;
        }

        public static HandleValid(directive: ProcessorDirective, element: HTMLElement, state: State, callbackInfo: InputCallbackInfo): HandlerReturn{
            if (element.tagName !== 'INPUT'){
                return HandlerReturn.Nil;
            }
            
            let wasValid = (element as HTMLInputElement).checkValidity();
            if (wasValid && callbackInfo.reportInitial){
                let result = Evaluator.Evaluate(directive.value, state, element);
                if (typeof result === 'function'){
                    (result as () => {})();
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
                    (result as () => {})();
                }
            });

            return HandlerReturn.Handled;
        }

        public static HandleInvalid(directive: ProcessorDirective, element: HTMLElement, state: State, callbackInfo: InputCallbackInfo): HandlerReturn{
            if (element.tagName !== 'INPUT'){
                return HandlerReturn.Nil;
            }
            
            let wasValid = (element as HTMLInputElement).checkValidity();
            if (!wasValid && callbackInfo.reportInitial){
                let result = Evaluator.Evaluate(directive.value, state, element);
                if (typeof result === 'function'){
                    (result as () => {})();
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
                    (result as () => {})();
                }
            });

            return HandlerReturn.Handled;
        }

        public static AddAll(){
            Handler.AddDirectiveHandler('state', ExtendedHandler.State);
        }
    }

    (function(){
        ExtendedHandler.AddAll();
    })();
}
