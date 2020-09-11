import * as HandlerScope from './Handler.js';
import * as EvaluatorScope from './Evaluator.js';
export var AlpineLite;
(function (AlpineLite) {
    class CoreBulkHandler {
        static AddOutsideEventHandler(eventName, info, state) {
            if (!(eventName in CoreBulkHandler.outsideEventsHandlers_)) {
                CoreBulkHandler.outsideEventsHandlers_[eventName] = new Array();
                document.addEventListener(eventName, (event) => {
                    state.PushEventContext(event);
                    let handlers = CoreBulkHandler.outsideEventsHandlers_[eventName];
                    handlers.forEach((info) => {
                        if (event.target !== info.element && !info.element.contains(event.target)) {
                            try {
                                info.handler(event); //Event is outside element
                            }
                            catch (err) {
                                state.ReportError(err, `AlpineLite.CoreHandler.AddOutsideEventHandler._Trigger_.${eventName}`);
                            }
                        }
                    });
                    state.PopEventContext();
                });
            }
            CoreBulkHandler.outsideEventsHandlers_[eventName].push(info);
        }
        static Attr(directive, element, state) {
            const booleanAttributes = [
                'allowfullscreen', 'allowpaymentrequest', 'async', 'autofocus', 'autoplay', 'checked', 'controls',
                'default', 'defer', 'disabled', 'formnovalidate', 'hidden', 'ismap', 'itemscope', 'loop', 'multiple', 'muted',
                'nomodule', 'novalidate', 'open', 'playsinline', 'readonly', 'required', 'reversed', 'selected',
            ];
            if (directive.parts[0] !== 'attr') {
                return HandlerScope.AlpineLite.HandlerReturn.Nil;
            }
            let isBoolean = (booleanAttributes.indexOf(directive.key) != -1);
            let isDisabled = (isBoolean && directive.key == 'disabled');
            state.TrapGetAccess((change) => {
                if (isBoolean) {
                    if (EvaluatorScope.AlpineLite.Evaluator.Evaluate(directive.value, state)) {
                        if (isDisabled && element.tagName === 'A') {
                            element.classList.add(CoreBulkHandler.GetDisabledClassKey());
                        }
                        else {
                            element.setAttribute(directive.parts[1], directive.parts[1]);
                        }
                    }
                    else if (isDisabled && element.tagName === 'A') {
                        element.classList.remove(CoreBulkHandler.GetDisabledClassKey());
                    }
                    else {
                        element.removeAttribute(directive.parts[1]);
                    }
                }
                else {
                    element.setAttribute(directive.parts[1], EvaluatorScope.AlpineLite.Evaluator.Evaluate(directive.value, state));
                }
            }, true);
            return HandlerScope.AlpineLite.HandlerReturn.Handled;
        }
        static Event(directive, element, state) {
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
            let eventParts = new Array();
            for (let i = 0; i < directive.parts.length; ++i) {
                let part = directive.parts[i];
                if (part in markers) {
                    if (0 < eventParts.length) { //Malformed
                        return HandlerScope.AlpineLite.HandlerReturn.Nil;
                    }
                    markers[part] = true;
                    eventParts = new Array();
                }
                else { //Part of event
                    eventParts.push(part);
                }
            }
            if (eventParts.length == 0) { //Malformed
                return HandlerScope.AlpineLite.HandlerReturn.Nil;
            }
            let eventName = eventParts.join('-');
            if (!markers.on && knownEvents.indexOf(eventName) == -1) { //Malformed
                return HandlerScope.AlpineLite.HandlerReturn.Nil;
            }
            if (!markers.outside) {
                element.addEventListener(eventName, (event) => {
                    if (markers.prevented) {
                        event.preventDefault();
                    }
                    if (markers.stopped) {
                        event.stopPropagation();
                    }
                    state.PushEventContext(event);
                    try {
                        let result = EvaluatorScope.AlpineLite.Evaluator.Evaluate(directive.value, state);
                        if (typeof result === 'function') { //Call function
                            result(event);
                        }
                    }
                    catch (err) {
                        state.ReportError(err, `AlpineLite.CoreBulkHandler.Event._Trigger_.${eventName}`);
                    }
                    state.PopEventContext();
                });
            }
            else { //Listen for event outside element
                CoreBulkHandler.AddOutsideEventHandler(eventName, {
                    handler: (event) => {
                        let result = EvaluatorScope.AlpineLite.Evaluator.Evaluate(directive.value, state);
                        if (typeof result === 'function') { //Call function
                            result(event);
                        }
                    },
                    element: element
                }, state);
            }
        }
        static AddAll(handler) {
            handler.AddBulkDirectiveHandler(CoreBulkHandler.Attr);
            handler.AddBulkDirectiveHandler(CoreBulkHandler.Event);
        }
        static GetDisabledClassKey() {
            return '__AlpineLiteDisabled__';
        }
    }
    CoreBulkHandler.outsideEventsHandlers_ = new Map();
    AlpineLite.CoreBulkHandler = CoreBulkHandler;
})(AlpineLite || (AlpineLite = {}));
