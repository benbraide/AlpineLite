"use strict";
var AlpineLite;
(function (AlpineLite) {
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
    class ExtendedHandler {
        static State(directive, element, state) {
            let isText = false, isUnknown = false;
            if (element.tagName === 'INPUT') {
                let type = element.type;
                isText = (type === 'text' || type === 'password' || type === 'email' || type === 'search' || type === 'number' || type === 'tel' || type === 'url');
            }
            else if (element.tagName === 'TEXTAREA') {
                isText = true;
            }
            else if (element.tagName !== 'SELECT') {
                isUnknown = true;
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
            let locals;
            let proxyKey = AlpineLite.Proxy.GetProxyKey();
            if (!(proxyKey in element)) {
                let raw = {};
                let localProxy = AlpineLite.Proxy.Create({
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
            locals.raw['$isDirty'] = new AlpineLite.Value(() => {
                return callbackInfo.isDirty;
            });
            locals.raw['$isTyping'] = new AlpineLite.Value(() => {
                return callbackInfo.isTyping;
            });
            locals.raw['$isValid'] = new AlpineLite.Value(() => {
                return callbackInfo.isValid;
            });
            locals.raw['$resetDirtyEvent'] = new AlpineLite.Value(() => {
                return new Event('alpinelite.input.reset.dirty');
            });
            if (isUnknown) {
                let inputs = element.querySelectorAll('input');
                let textAreas = element.querySelectorAll('textarea');
                let selects = element.querySelectorAll('select');
                element.addEventListener(InputResetDirtyEvent, (event) => {
                    if (event.target !== element) { //Bubbled
                        return;
                    }
                    inputs.forEach((elem) => {
                        elem.dispatchEvent(new Event(InputResetDirtyEvent));
                    });
                    textAreas.forEach((elem) => {
                        elem.dispatchEvent(new Event(InputResetDirtyEvent));
                    });
                    selects.forEach((elem) => {
                        elem.dispatchEvent(new Event(InputResetDirtyEvent));
                    });
                });
                let totalCount = (inputs.length + textAreas.length + selects.length), dirtyCount = 0, typingCount = 0, validCount = 0;
                let eventHandlers = new Map();
                eventHandlers[InputDirtyEvent] = (event) => {
                    if (++dirtyCount == 1) {
                        callbackInfo.isDirty = true;
                        element.dispatchEvent(new Event(InputDirtyEvent));
                    }
                };
                eventHandlers[InputCleanEvent] = (event) => {
                    if (--dirtyCount == 0) {
                        callbackInfo.isDirty = false;
                        element.dispatchEvent(new Event(InputCleanEvent));
                    }
                };
                eventHandlers[InputTypingEvent] = (event) => {
                    if (++typingCount == 1) {
                        callbackInfo.isTyping = true;
                        element.dispatchEvent(new Event(InputTypingEvent));
                    }
                };
                eventHandlers[InputStoppedTypingEvent] = (event) => {
                    if (--typingCount == 0) {
                        callbackInfo.isTyping = false;
                        element.dispatchEvent(new Event(InputStoppedTypingEvent));
                    }
                };
                eventHandlers[InputValidEvent] = (event) => {
                    if (++validCount == totalCount) {
                        callbackInfo.isValid = true;
                        element.dispatchEvent(new Event(InputValidEvent));
                    }
                };
                eventHandlers[InputInvalidEvent] = (event) => {
                    --validCount;
                    if (callbackInfo.isValid) {
                        callbackInfo.isValid = false;
                        element.dispatchEvent(new Event(InputInvalidEvent));
                    }
                };
                let childOptions = JSON.stringify({
                    stoppedDelay: stoppedDelay,
                    activeValidCheck: callbackInfo.activeValidCheck
                });
                inputs.forEach((elem) => {
                    for (let event in eventHandlers) {
                        elem.addEventListener(event, eventHandlers[event]);
                    }
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
                    for (let event in eventHandlers) {
                        elem.addEventListener(event, eventHandlers[event]);
                    }
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
                    for (let event in eventHandlers) {
                        elem.addEventListener(event, eventHandlers[event]);
                    }
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
                        element.dispatchEvent(new Event(InputStoppedTypingEvent));
                    }
                    let isValid = element.checkValidity();
                    if (isValid != callbackInfo.isValid) {
                        callbackInfo.isValid = isValid;
                        if (!callbackInfo.activeValidCheck) {
                            element.dispatchEvent(new Event(isValid ? InputValidEvent : InputInvalidEvent));
                        }
                    }
                }, stoppedDelay);
                if (isText && !callbackInfo.isTyping) {
                    callbackInfo.isTyping = true;
                    element.dispatchEvent(new Event(InputTypingEvent));
                }
                if (!callbackInfo.isDirty) {
                    callbackInfo.isDirty = true;
                    element.dispatchEvent(new Event(InputDirtyEvent));
                }
                if (callbackInfo.activeValidCheck) {
                    let isValid = element.checkValidity();
                    if (isValid != callbackInfo.isValid) {
                        callbackInfo.isValid = isValid;
                        element.dispatchEvent(new Event(isValid ? InputValidEvent : InputInvalidEvent));
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
            element.addEventListener(InputResetDirtyEvent, (event) => {
                if (callbackInfo.isDirty) {
                    callbackInfo.isDirty = false;
                    element.dispatchEvent(new Event(InputCleanEvent));
                }
            });
            return AlpineLite.HandlerReturn.Handled;
        }
        static Observe(directive, element, state) {
            let map = (element[AlpineLite.CoreBulkHandler.GetEventExpansionKey()] = (element[AlpineLite.CoreBulkHandler.GetEventExpansionKey()] || {}));
            let options = AlpineLite.Evaluator.Evaluate(directive.value, state, element);
            if (typeof options === 'function') {
                options = options.call(state.GetValueContext());
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
            ExtendedHandler.ObserveWith(ExtendedHandler.GetObserveOptions(options), element, (entry) => {
                if (entry instanceof IntersectionObserverEntry) {
                    let isIntersecting = (!('isIntersecting' in entry) ? (0 < entry.intersectionRatio) : entry.isIntersecting);
                    if (!isIntersecting) { //Hidden
                        element.dispatchEvent(new Event(ObservedDecrementEvent));
                        element.dispatchEvent(new Event(ObservedHiddenEvent));
                        previousRatio = 0;
                    }
                    else if (previousRatio < entry.intersectionRatio) { //Increment
                        if (previousRatio == 0) { //Visible
                            element.dispatchEvent(new Event(ObservedVisibleEvent));
                        }
                        element.dispatchEvent(new Event(ObservedIncrementEvent));
                        previousRatio = entry.intersectionRatio;
                    }
                    else { //Decrement
                        element.dispatchEvent(new Event(ObservedDecrementEvent));
                        previousRatio = entry.intersectionRatio;
                    }
                }
                else { //Not supported
                    setTimeout(() => {
                        element.dispatchEvent(new Event(ObservedUnsupportedEvent));
                    }, 0);
                }
                return true;
            });
            return AlpineLite.HandlerReturn.Handled;
        }
        static LazyLoad(directive, element, state) {
            let options = AlpineLite.Evaluator.Evaluate(directive.value, state, element);
            if (typeof options === 'function') {
                options = options.call(state.GetValueContext());
            }
            if (!options) {
                return AlpineLite.HandlerReturn.Nil;
            }
            if (typeof options !== 'object') {
                options = {
                    threshold: 0.5,
                    url: options
                };
            }
            else if (!('url' in options) || !options['url']) {
                return AlpineLite.HandlerReturn.Nil;
            }
            if (!('threshold' in options)) {
                options['threshold'] = 0.5;
            }
            let map = (element[AlpineLite.CoreBulkHandler.GetEventExpansionKey()] = (element[AlpineLite.CoreBulkHandler.GetEventExpansionKey()] || {}));
            map['unsupported'] = () => ObservedUnsupportedEvent;
            map['observed.unsupported'] = () => ObservedUnsupportedEvent;
            map['loaded'] = () => LazyLoadedEvent;
            map['lazy.loaded'] = () => LazyLoadedEvent;
            ExtendedHandler.ObserveWith(ExtendedHandler.GetObserveOptions(options), element, (entry) => {
                if (!(entry instanceof IntersectionObserverEntry)) {
                    setTimeout(() => {
                        element.dispatchEvent(new Event(ObservedUnsupportedEvent));
                    }, 0);
                }
                else if (entry.isIntersecting) { //Not supported
                    ExtendedHandler.FetchLoad(element, options['url']);
                    return false;
                }
                return true;
            });
            return AlpineLite.HandlerReturn.Handled;
        }
        static ConditionalLoad(directive, element, state) {
            let options = AlpineLite.Evaluator.Evaluate(directive.value, state, element);
            if (typeof options === 'function') {
                options = options.call(state.GetValueContext());
            }
            if (!options || typeof options !== 'object' || !('condition' in options) || !('url' in options)) {
                return AlpineLite.HandlerReturn.Nil;
            }
            let map = (element[AlpineLite.CoreBulkHandler.GetEventExpansionKey()] = (element[AlpineLite.CoreBulkHandler.GetEventExpansionKey()] || {}));
            map['loaded'] = () => LazyLoadedEvent;
            map['lazy.loaded'] = () => LazyLoadedEvent;
            let condition = options['condition'];
            if (typeof condition === 'string') {
                AlpineLite.Proxy.Watch(condition, element, state, (value) => {
                    if (!value) {
                        return true;
                    }
                    ExtendedHandler.FetchLoad(element, options['url']);
                    return false;
                });
            }
            else if (condition) {
                ExtendedHandler.FetchLoad(element, options['url']);
            }
            return AlpineLite.HandlerReturn.Handled;
        }
        static XHRLoad(directive, element, state) {
            let map = (element[AlpineLite.CoreBulkHandler.GetEventExpansionKey()] = (element[AlpineLite.CoreBulkHandler.GetEventExpansionKey()] || {}));
            map['loaded'] = () => LazyLoadedEvent;
            map['lazy.loaded'] = () => LazyLoadedEvent;
            let previousUrl = null;
            state.TrapGetAccess((change) => {
                let url = AlpineLite.Evaluator.Evaluate(directive.value, state, element);
                if (typeof url === 'function') { //Call function
                    url = url.call(state.GetValueContext());
                }
                if (url !== previousUrl) {
                    if (url === '::reload::') {
                        url = previousUrl;
                    }
                    else {
                        previousUrl = url;
                    }
                    ExtendedHandler.FetchLoad(element, url);
                }
            }, true);
            return AlpineLite.HandlerReturn.Handled;
        }
        static AttrChange(directive, element, state) {
            if (directive.key !== 'attrChange') {
                return AlpineLite.HandlerReturn.Nil;
            }
            let locals;
            let proxyKey = AlpineLite.Proxy.GetProxyKey(), attrName = null;
            if (!(proxyKey in element)) {
                let raw = {};
                let localProxy = AlpineLite.Proxy.Create({
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
            locals.raw['$attr'] = new AlpineLite.Value(() => {
                return attrName;
            });
            let listeners = (element[AlpineLite.Handler.GetAttributeChangeKey()] = (element[AlpineLite.Handler.GetAttributeChangeKey()] || []));
            listeners.push((attr) => {
                attrName = attr;
                let result = AlpineLite.Evaluator.Evaluate(directive.value, state, element);
                if (typeof result === 'function') { //Call function
                    result.call(state.GetValueContext(), attr);
                }
            });
            return AlpineLite.HandlerReturn.Handled;
        }
        static GetObserveOptions(options) {
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
            return observerOptions;
        }
        static ObserveWith(options, element, callback) {
            if (!('IntersectionObserver' in window)) {
                callback(false);
                return;
            }
            let observer = new IntersectionObserver((entries) => {
                entries.forEach((entry) => {
                    if (!callback(entry)) {
                        observer.unobserve(element);
                        for (let i = 0; i < ExtendedHandler.observers_.length; ++i) {
                            if (ExtendedHandler.observers_[i] === observer) {
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
        static FetchLoad(element, url) {
            if (!url) {
                return;
            }
            let emptyElement = () => {
                while (element.firstChild) {
                    element.removeChild(element.firstChild);
                }
            };
            if (url === '::destroy::') {
                if (element.tagName === 'IMG' || element.tagName === 'IFRAME') {
                    element.src = '';
                }
                else {
                    emptyElement();
                }
            }
            else if (element.tagName === 'IMG' || element.tagName === 'IFRAME') {
                let loadHandler = (event) => {
                    element.removeEventListener('load', loadHandler);
                    element.dispatchEvent(new Event(LazyLoadedEvent));
                };
                element.addEventListener('load', loadHandler);
                element.src = url;
            }
            else if (element.tagName === 'SELECT') {
                fetch(url)
                    .then((response) => response.json())
                    .then((data) => {
                    emptyElement();
                    data.forEach((entry) => {
                        let option = document.createElement('option');
                        option.value = entry.key;
                        option.textContent = entry.value;
                        element.appendChild(option);
                    });
                    element.dispatchEvent(new Event(LazyLoadedEvent));
                    element.dispatchEvent(new Event('change'));
                });
            }
            else { //Generic
                fetch(url)
                    .then((response) => response.text())
                    .then((data) => {
                    emptyElement();
                    element.innerHTML = data;
                    element.dispatchEvent(new Event(LazyLoadedEvent));
                });
            }
        }
        static AddAll() {
            AlpineLite.Handler.AddDirectiveHandler('state', ExtendedHandler.State);
            AlpineLite.Handler.AddDirectiveHandler('observe', ExtendedHandler.Observe);
            AlpineLite.Handler.AddDirectiveHandler('lazyLoad', ExtendedHandler.LazyLoad);
            AlpineLite.Handler.AddDirectiveHandler('conditionalLoad', ExtendedHandler.ConditionalLoad);
            AlpineLite.Handler.AddDirectiveHandler('xhrLoad', ExtendedHandler.XHRLoad);
            AlpineLite.Handler.AddDirectiveHandler('attrChange', ExtendedHandler.AttrChange);
        }
    }
    ExtendedHandler.observers_ = new Array();
    AlpineLite.ExtendedHandler = ExtendedHandler;
    (function () {
        ExtendedHandler.AddAll();
    })();
})(AlpineLite || (AlpineLite = {}));
