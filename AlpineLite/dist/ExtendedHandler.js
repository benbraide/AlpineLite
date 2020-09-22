"use strict";
var AlpineLite;
(function (AlpineLite) {
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
    ;
    class ExtendedHandler {
        static State(directive, element, state) {
            let isText = false, isForm = false;
            if (element.tagName === 'INPUT') {
                let type = element.type;
                isText = (type === 'text' || type === 'password' || type === 'email' || type === 'search' || type === 'number' || type === 'tel' || type === 'url');
            }
            else if (element.tagName === 'TEXTAREA') {
                isText = true;
            }
            else if (element.tagName === 'FORM') {
                isForm = true;
            }
            else if (element.tagName !== 'SELECT') {
                return AlpineLite.HandlerReturn.Nil;
            }
            let options = AlpineLite.Evaluator.Evaluate(directive.value, state, element);
            if (typeof options === 'function') {
                options = options.call(state.GetValueContext());
            }
            let callbackInfo = {
                activeValidCheck: false,
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
            }
            let map = (element[AlpineLite.CoreBulkHandler.GetEventExpansionKey()] = (element[AlpineLite.CoreBulkHandler.GetEventExpansionKey()] || {}));
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
            if (isForm) {
                let inputs = element.querySelectorAll('input');
                let textAreas = element.querySelectorAll('textarea');
                let selects = element.querySelectorAll('select');
                let totalCount = (inputs.length + textAreas.length + selects.length), dirtyCount = 0, typingCount = 0, validCount = 0;
                element.addEventListener(InputDirtyEvent.type, (event) => {
                    if (++dirtyCount == 1) {
                        callbackInfo.isDirty = true;
                    }
                    else {
                        event.stopImmediatePropagation();
                    }
                });
                element.addEventListener(InputCleanEvent.type, (event) => {
                    if (--dirtyCount == 0) {
                        callbackInfo.isDirty = false;
                    }
                    else {
                        event.stopImmediatePropagation();
                    }
                });
                element.addEventListener(InputResetDirtyEvent.type, (event) => {
                    if (event.target !== element) { //Bubbled
                        return;
                    }
                    inputs.forEach((elem) => {
                        elem.dispatchEvent(InputResetDirtyEvent);
                    });
                    textAreas.forEach((elem) => {
                        elem.dispatchEvent(InputResetDirtyEvent);
                    });
                    selects.forEach((elem) => {
                        elem.dispatchEvent(InputResetDirtyEvent);
                    });
                });
                element.addEventListener(InputTypingEvent.type, (event) => {
                    if (++typingCount == 1) {
                        callbackInfo.isTyping = true;
                    }
                    else {
                        event.stopImmediatePropagation();
                    }
                });
                element.addEventListener(InputStoppedTypingEvent.type, (event) => {
                    if (--typingCount == 0) {
                        callbackInfo.isTyping = false;
                    }
                    else {
                        event.stopImmediatePropagation();
                    }
                });
                element.addEventListener(InputValidEvent.type, (event) => {
                    if (++validCount == totalCount) {
                        callbackInfo.isValid = true;
                    }
                    else {
                        event.stopImmediatePropagation();
                    }
                });
                element.addEventListener(InputInvalidEvent.type, (event) => {
                    --validCount;
                    if (callbackInfo.isValid) {
                        callbackInfo.isValid = false;
                    }
                    else {
                        event.stopImmediatePropagation();
                    }
                });
                let childOptions = JSON.stringify({
                    stoppedDelay: stoppedDelay,
                    activeValidCheck: callbackInfo.activeValidCheck
                });
                inputs.forEach((elem) => {
                    ExtendedHandler.State({
                        original: null,
                        parts: null,
                        raw: null,
                        key: null,
                        value: childOptions
                    }, elem, state);
                    if (elem.checkValidity()) {
                        ++validCount;
                    }
                });
                textAreas.forEach((elem) => {
                    ExtendedHandler.State({
                        original: null,
                        parts: null,
                        raw: null,
                        key: null,
                        value: childOptions
                    }, elem, state);
                    if (elem.checkValidity()) {
                        ++validCount;
                    }
                });
                selects.forEach((elem) => {
                    ExtendedHandler.State({
                        original: null,
                        parts: null,
                        raw: null,
                        key: null,
                        value: childOptions
                    }, elem, state);
                    if (elem.checkValidity()) {
                        ++validCount;
                    }
                });
                return AlpineLite.HandlerReturn.Handled;
            }
            let counter = 0;
            let eventCallback = (event) => {
                let checkpoint = ++counter;
                setTimeout(() => {
                    if (checkpoint != counter) {
                        return;
                    }
                    if (isText && callbackInfo.isTyping) {
                        callbackInfo.isTyping = false;
                        element.dispatchEvent(InputStoppedTypingEvent);
                    }
                    let isValid = element.checkValidity();
                    if (isValid != callbackInfo.isValid) {
                        callbackInfo.isValid = isValid;
                        if (!callbackInfo.activeValidCheck) {
                            element.dispatchEvent(isValid ? InputValidEvent : InputInvalidEvent);
                        }
                    }
                }, stoppedDelay);
                if (isText && !callbackInfo.isTyping) {
                    callbackInfo.isTyping = true;
                    element.dispatchEvent(InputTypingEvent);
                }
                if (!callbackInfo.isDirty) {
                    callbackInfo.isDirty = true;
                    element.dispatchEvent(InputDirtyEvent);
                }
                if (callbackInfo.activeValidCheck) {
                    let isValid = element.checkValidity();
                    if (isValid != callbackInfo.isValid) {
                        callbackInfo.isValid = isValid;
                        element.dispatchEvent(isValid ? InputValidEvent : InputInvalidEvent);
                    }
                }
            };
            if (isText) {
                element.addEventListener('input', eventCallback);
                element.addEventListener('paste', eventCallback);
                element.addEventListener('cut', eventCallback);
            }
            else {
                element.addEventListener('change', eventCallback);
            }
            element.addEventListener(InputResetDirtyEvent.type, (event) => {
                callbackInfo.isDirty = false;
            });
            return AlpineLite.HandlerReturn.Handled;
        }
        static Observe(directive, element, state) {
            let options = AlpineLite.Evaluator.Evaluate(directive.value, state, element);
            if (typeof options === 'function') {
                options = options.call(state.GetValueContext());
            }
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
            let map = (element[AlpineLite.CoreBulkHandler.GetEventExpansionKey()] = (element[AlpineLite.CoreBulkHandler.GetEventExpansionKey()] || {}));
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
            let observer = new IntersectionObserver((entries) => {
                entries.forEach((entry) => {
                    let isIntersecting = (!('isIntersecting' in entry) ? (0 < entry.intersectionRatio) : entry.isIntersecting);
                    if (!isIntersecting) { //Hidden
                        element.dispatchEvent(ObservedDecrementEvent);
                        element.dispatchEvent(ObservedHidden);
                        previousRatio = 0;
                    }
                    else if (previousRatio < entry.intersectionRatio) { //Increment
                        if (previousRatio == 0) { //Visible
                            element.dispatchEvent(ObservedVisible);
                        }
                        element.dispatchEvent(ObservedIncrementEvent);
                        previousRatio = entry.intersectionRatio;
                    }
                    else { //Decrement
                        element.dispatchEvent(ObservedDecrementEvent);
                        previousRatio = entry.intersectionRatio;
                    }
                });
            }, observerOptions);
            ExtendedHandler.observers_.push(observer);
            observer.observe(element);
            return AlpineLite.HandlerReturn.Handled;
        }
        static AddAll() {
            AlpineLite.Handler.AddDirectiveHandler('state', ExtendedHandler.State);
            AlpineLite.Handler.AddDirectiveHandler('observe', ExtendedHandler.Observe);
        }
    }
    ExtendedHandler.observers_ = new Array();
    AlpineLite.ExtendedHandler = ExtendedHandler;
    (function () {
        ExtendedHandler.AddAll();
    })();
})(AlpineLite || (AlpineLite = {}));
