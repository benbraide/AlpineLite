"use strict";
var AlpineLite;
(function (AlpineLite) {
    ;
    ;
    class ExtendedHandler {
        static State(directive, element, state) {
            if (element.tagName !== 'INPUT' && element.tagName !== 'TEXTAREA') {
                return AlpineLite.HandlerReturn.Nil;
            }
            let type = ((element.tagName === 'INPUT') ? element.type : 'text');
            if (type !== 'text' && type !== 'password' && type !== 'email' && type !== 'search' && type !== 'number' && type !== 'tel' && type !== 'url') {
                return AlpineLite.HandlerReturn.Nil;
            }
            let options = AlpineLite.Evaluator.Evaluate(directive.value, state, element);
            if (typeof options === 'function') {
                options = options.call(state.GetValueContext());
            }
            let callbackInfo = {
                handlers: new Array(),
                activeValidCheck: false,
                reportInitial: false,
                isDirty: false,
                isTyping: false,
                isValid: element.checkValidity()
            };
            let stoppedDelay = 750;
            if (options && typeof options === 'object') {
                if (('stoppedDelay' in options) && options['stoppedDelay']) {
                    stoppedDelay = options['stoppedDelay'];
                }
                if (('activeValidCheck' in options) && options['activeValidCheck']) {
                    callbackInfo.activeValidCheck = true;
                }
                if (('reportInitial' in options) && options['reportInitial']) {
                    callbackInfo.reportInitial = true;
                }
            }
            let map = (element[AlpineLite.Handler.GetExternalHandlerKey()] = (element[AlpineLite.Handler.GetExternalHandlerKey()] || {}));
            map['dirty'] = (directive, element, state) => {
                return ExtendedHandler.HandleDirty(directive, element, state, callbackInfo);
            };
            map['typing'] = (directive, element, state) => {
                return ExtendedHandler.HandleTyping(directive, element, state, callbackInfo);
            };
            map['stoppedTyping'] = (directive, element, state) => {
                return ExtendedHandler.HandleStoppedTyping(directive, element, state, callbackInfo);
            };
            map['valid'] = (directive, element, state) => {
                return ExtendedHandler.HandleValid(directive, element, state, callbackInfo);
            };
            map['invalid'] = (directive, element, state) => {
                return ExtendedHandler.HandleInvalid(directive, element, state, callbackInfo);
            };
            let specialKeyMap = (element[AlpineLite.Proxy.GetExternalSpecialKey()] = (element[AlpineLite.Proxy.GetExternalSpecialKey()] || {}));
            specialKeyMap['$isDirty'] = (proxy) => {
                if (!proxy.IsRoot() || proxy.GetDetails().element) { //Root required
                    return new AlpineLite.ProxyNoResult();
                }
                return new AlpineLite.Value(() => {
                    return callbackInfo.isDirty;
                });
            };
            specialKeyMap['$isTyping'] = (proxy) => {
                if (!proxy.IsRoot() || proxy.GetDetails().element) { //Root required
                    return new AlpineLite.ProxyNoResult();
                }
                return new AlpineLite.Value(() => {
                    return callbackInfo.isTyping;
                });
            };
            specialKeyMap['$isValid'] = (proxy) => {
                if (!proxy.IsRoot() || proxy.GetDetails().element) { //Root required
                    return new AlpineLite.ProxyNoResult();
                }
                return new AlpineLite.Value(() => {
                    return callbackInfo.isValid;
                });
            };
            let counter = 0;
            let eventCallback = (event) => {
                let checkpoint = ++counter;
                setTimeout(() => {
                    if (checkpoint == counter) {
                        callbackInfo.isTyping = false;
                        callbackInfo.handlers.forEach((callback) => {
                            callback();
                        });
                    }
                }, stoppedDelay);
                callbackInfo.isDirty = true;
                callbackInfo.isTyping = true;
                callbackInfo.isValid = element.checkValidity();
                callbackInfo.handlers.forEach((callback) => {
                    callback(event);
                });
            };
            element.addEventListener('keydown', eventCallback);
            element.addEventListener('input', eventCallback);
            element.addEventListener('paste', eventCallback);
            element.addEventListener('cut', eventCallback);
            return AlpineLite.HandlerReturn.Handled;
        }
        static Observe(directive, element, state) {
            let options = AlpineLite.Evaluator.Evaluate(directive.value, state, element);
            if (typeof options === 'function') {
                options = options.call(state.GetValueContext());
            }
            let callbackInfo = {
                increment: new Array(),
                decrement: new Array()
            };
            let observerOptions = {
                root: null,
                rootMargin: '0px',
                threshold: 0
            };
            if (options && typeof options === 'object') {
                if ('root' in options) {
                    observerOptions.root = options['root'];
                    if (typeof observerOptions.root === 'string') {
                        observerOptions.root = document.querySelector(observerOptions.root);
                    }
                }
                if ('rootMargin' in options) {
                    observerOptions.rootMargin = options['rootMargin'];
                }
                if ('threshold' in options) {
                    observerOptions.threshold = options['threshold'];
                }
            }
            ExtendedHandler.ObserveWith(element, (ratio, prevRatio, isIncrement) => {
                if (isIncrement) { //Increment
                    callbackInfo.increment.forEach((callback) => {
                        callback(ratio, prevRatio);
                    });
                }
                else { //Decrement
                    callbackInfo.decrement.forEach((callback) => {
                        callback(ratio, prevRatio);
                    });
                }
            }, observerOptions);
            let map = (element[AlpineLite.Handler.GetExternalHandlerKey()] = (element[AlpineLite.Handler.GetExternalHandlerKey()] || {}));
            map['increment'] = (directive, element, state) => {
                return ExtendedHandler.HandleIncrement(directive, element, state, callbackInfo);
            };
            map['decrement'] = (directive, element, state) => {
                return ExtendedHandler.HandleDecrement(directive, element, state, callbackInfo);
            };
            return AlpineLite.HandlerReturn.Handled;
        }
        static HandleDirty(directive, element, state, callbackInfo) {
            let wasDirty = false;
            callbackInfo.handlers.push((event) => {
                if (!wasDirty && callbackInfo.isDirty) {
                    wasDirty = true;
                    let result = AlpineLite.Evaluator.Evaluate(directive.value, state, element);
                    if (typeof result === 'function') {
                        result.call(state.GetValueContext());
                    }
                }
            });
            return AlpineLite.HandlerReturn.Handled;
        }
        static HandleTyping(directive, element, state, callbackInfo) {
            let wasTyping = false;
            callbackInfo.handlers.push((event) => {
                if (!wasTyping && callbackInfo.isTyping) {
                    wasTyping = true;
                    let result = AlpineLite.Evaluator.Evaluate(directive.value, state, element);
                    if (typeof result === 'function') {
                        result.call(state.GetValueContext());
                    }
                }
            });
            return AlpineLite.HandlerReturn.Handled;
        }
        static HandleStoppedTyping(directive, element, state, callbackInfo) {
            callbackInfo.handlers.push(() => {
                if (!callbackInfo.isTyping) {
                    let result = AlpineLite.Evaluator.Evaluate(directive.value, state, element);
                    if (typeof result === 'function') {
                        result.call(state.GetValueContext());
                    }
                }
            });
            return AlpineLite.HandlerReturn.Handled;
        }
        static HandleValid(directive, element, state, callbackInfo) {
            if (element.tagName !== 'INPUT') {
                return AlpineLite.HandlerReturn.Nil;
            }
            let wasValid = callbackInfo.isValid;
            if (wasValid && callbackInfo.reportInitial) {
                let result = AlpineLite.Evaluator.Evaluate(directive.value, state, element);
                if (typeof result === 'function') {
                    result.call(state.GetValueContext());
                }
            }
            callbackInfo.handlers.push(() => {
                if (!callbackInfo.isValid) {
                    wasValid = false;
                    return;
                }
                if (wasValid || callbackInfo.isTyping != callbackInfo.activeValidCheck) {
                    return;
                }
                wasValid = true;
                let result = AlpineLite.Evaluator.Evaluate(directive.value, state, element);
                if (typeof result === 'function') {
                    result.call(state.GetValueContext());
                }
            });
            return AlpineLite.HandlerReturn.Handled;
        }
        static HandleInvalid(directive, element, state, callbackInfo) {
            if (element.tagName !== 'INPUT') {
                return AlpineLite.HandlerReturn.Nil;
            }
            let wasValid = callbackInfo.isValid;
            if (!wasValid && callbackInfo.reportInitial) {
                let result = AlpineLite.Evaluator.Evaluate(directive.value, state, element);
                if (typeof result === 'function') {
                    result.call(state.GetValueContext());
                }
            }
            callbackInfo.handlers.push(() => {
                if (callbackInfo.isValid) {
                    wasValid = false;
                    return;
                }
                if (!wasValid || callbackInfo.isTyping != callbackInfo.activeValidCheck) {
                    return;
                }
                wasValid = false;
                let result = AlpineLite.Evaluator.Evaluate(directive.value, state, element);
                if (typeof result === 'function') {
                    result.call(state.GetValueContext());
                }
            });
            return AlpineLite.HandlerReturn.Handled;
        }
        static HandleIncrement(directive, element, state, callbackInfo) {
            callbackInfo.increment.push((ratio, prevRatio) => {
                let result = AlpineLite.Evaluator.Evaluate(directive.value, state, element);
                if (typeof result === 'function') {
                    result.call(state.GetValueContext(), ratio, prevRatio);
                }
            });
            return AlpineLite.HandlerReturn.Handled;
        }
        static HandleDecrement(directive, element, state, callbackInfo) {
            callbackInfo.decrement.push((ratio, prevRatio) => {
                let result = AlpineLite.Evaluator.Evaluate(directive.value, state, element);
                if (typeof result === 'function') {
                    result.call(state.GetValueContext(), ratio, prevRatio);
                }
            });
            return AlpineLite.HandlerReturn.Handled;
        }
        static ObserveWith(element, callback, options) {
            let previousRatio = 0.0;
            let observer = new IntersectionObserver((entries) => {
                entries.forEach((entry) => {
                    callback(entry.intersectionRatio, previousRatio, (entry.isIntersecting && previousRatio < entry.intersectionRatio));
                    previousRatio = entry.intersectionRatio;
                });
            }, options);
            ExtendedHandler.observers_.push(observer);
            observer.observe(element);
        }
        static AddAll() {
            AlpineLite.Handler.AddDirectiveHandler('state', ExtendedHandler.State);
            AlpineLite.Handler.AddDirectiveHandler('observe', ExtendedHandler.Observe);
        }
    } //Implement lazy loading and correct scroll to top; Bind functions returned when handling directives
    ExtendedHandler.observers_ = new Array();
    AlpineLite.ExtendedHandler = ExtendedHandler;
    (function () {
        ExtendedHandler.AddAll();
    })();
})(AlpineLite || (AlpineLite = {}));
