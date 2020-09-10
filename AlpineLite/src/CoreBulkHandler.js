"use strict";
exports.__esModule = true;
exports.AlpineLite = void 0;
var HandlerScope = require("./Handler");
var EvaluatorScope = require("./Evaluator");
var AlpineLite;
(function (AlpineLite) {
    var CoreBulkHandler = /** @class */ (function () {
        function CoreBulkHandler(handler) {
            this.outsideEventsHandlers_ = new Map();
            handler.AddBulkDirectiveHandler(this.Attr);
            handler.AddBulkDirectiveHandler(this.Event);
        }
        CoreBulkHandler.prototype.AddOutsideEventHandler = function (eventName, info, state) {
            var _this = this;
            if (!(eventName in this.outsideEventsHandlers_)) {
                this.outsideEventsHandlers_[eventName] = new Array();
                document.addEventListener(eventName, function (event) {
                    state.PushEventContext(event);
                    var handlers = _this.outsideEventsHandlers_[eventName];
                    handlers.forEach(function (info) {
                        if (event.target !== info.element && !info.element.contains(event.target)) {
                            try {
                                info.handler(event); //Event is outside element
                            }
                            catch (err) {
                                state.ReportError(err, "AlpineLite.CoreHandler.AddOutsideEventHandler._Trigger_." + eventName);
                            }
                        }
                    });
                    state.PopEventContext();
                });
            }
            this.outsideEventsHandlers_[eventName].push(info);
        };
        CoreBulkHandler.prototype.Attr = function (directive, element, state) {
            var booleanAttributes = [
                'allowfullscreen', 'allowpaymentrequest', 'async', 'autofocus', 'autoplay', 'checked', 'controls',
                'default', 'defer', 'disabled', 'formnovalidate', 'hidden', 'ismap', 'itemscope', 'loop', 'multiple', 'muted',
                'nomodule', 'novalidate', 'open', 'playsinline', 'readonly', 'required', 'reversed', 'selected',
            ];
            if (directive.parts[0] !== 'attr') {
                return HandlerScope.AlpineLite.HandlerReturn.Nil;
            }
            var isBoolean = (booleanAttributes.indexOf(directive.key) != -1);
            var isDisabled = (isBoolean && directive.key == 'disabled');
            state.TrapGetAccess(function (change) {
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
        };
        CoreBulkHandler.prototype.Event = function (directive, element, state) {
            var knownEvents = [
                'blur', 'change', 'click', 'contextmenu', 'context-menu', 'dblclick', 'dbl-click', 'focus', 'focusin', 'focus-in', 'focusout', 'focus-out',
                'hover', 'keydown', 'key-down', 'keyup', 'key-up', 'mousedown', 'mouse-down', 'mouseenter', 'mouse-enter', 'mouseleave', 'mouse-leave',
                'mousemove', 'mouse-move', 'mouseout', 'mouse-out', 'mouseover', 'mouse-over', 'mouseup', 'mouse-up', 'scroll', 'submit',
            ];
            var markers = {
                'on': false,
                'outside': false,
                'prevented': false,
                'stopped': false
            };
            var eventParts = new Array();
            for (var i = 0; i < directive.parts.length; ++i) {
                var part = directive.parts[i];
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
            var eventName = eventParts.join('-');
            if (!markers.on && knownEvents.indexOf(eventName) == -1) { //Malformed
                return HandlerScope.AlpineLite.HandlerReturn.Nil;
            }
            if (!markers.outside) {
                element.addEventListener(eventName, function (event) {
                    if (markers.prevented) {
                        event.preventDefault();
                    }
                    if (markers.stopped) {
                        event.stopPropagation();
                    }
                    state.PushEventContext(event);
                    try {
                        var result = EvaluatorScope.AlpineLite.Evaluator.Evaluate(directive.value, state);
                        if (typeof result === 'function') { //Call function
                            result(event);
                        }
                    }
                    catch (err) {
                        state.ReportError(err, "AlpineLite.CoreHandler.BulkEvent._Trigger_." + eventName);
                    }
                    state.PopEventContext();
                });
            }
            else { //Listen for event outside element
                this.AddOutsideEventHandler(eventName, {
                    handler: function (event) {
                        var result = EvaluatorScope.AlpineLite.Evaluator.Evaluate(directive.value, state);
                        if (typeof result === 'function') { //Call function
                            result(event);
                        }
                    },
                    element: element
                }, state);
            }
        };
        CoreBulkHandler.GetDisabledClassKey = function () {
            return '__AlpineLiteDisabled__';
        };
        return CoreBulkHandler;
    }());
    AlpineLite.CoreBulkHandler = CoreBulkHandler;
})(AlpineLite = exports.AlpineLite || (exports.AlpineLite = {}));
