import * as Changes from './Changes'
import * as StateScope from './State'
import * as HandlerScope from './Handler'
import * as EvaluatorScope from './Evaluator'

export namespace AlpineLite{
    export interface OutsideEventHandlerInfo{
        handler: (event: Event) => void,
        element: HTMLElement
    }
    
    export class CoreBulkHandler{
        private outsideEventsHandlers_ = new Map<string, Array<OutsideEventHandlerInfo>>();

        constructor(handler: HandlerScope.AlpineLite.Handler){
            handler.AddBulkDirectiveHandler(this.Attr);
            handler.AddBulkDirectiveHandler(this.Event);
        }
        
        public AddOutsideEventHandler(eventName: string, info: OutsideEventHandlerInfo, state: StateScope.AlpineLite.State): void{
            if (!(eventName in this.outsideEventsHandlers_)){
                this.outsideEventsHandlers_[eventName] = new Array<OutsideEventHandlerInfo>();
                document.addEventListener(eventName, (event: Event) => {
                    state.PushEventContext(event);
                    
                    let handlers: Array<OutsideEventHandlerInfo> = this.outsideEventsHandlers_[eventName];
                    handlers.forEach((info: OutsideEventHandlerInfo): void => {
                        if (event.target !== info.element && !info.element.contains(event.target as HTMLElement)){
                            try{
                                info.handler(event);//Event is outside element
                            }
                            catch (err){
                                state.ReportError(err, `AlpineLite.CoreHandler.AddOutsideEventHandler._Trigger_.${eventName}`);
                            }
                        }
                    });

                    state.PopEventContext();
                });
            }

            this.outsideEventsHandlers_[eventName].push(info);
        }
        
        public Attr(directive: HandlerScope.AlpineLite.ProcessorDirective, element: HTMLElement, state: StateScope.AlpineLite.State): HandlerScope.AlpineLite.HandlerReturn{
            const booleanAttributes: Array<string> = [
                'allowfullscreen', 'allowpaymentrequest', 'async', 'autofocus', 'autoplay', 'checked', 'controls',
                'default', 'defer', 'disabled', 'formnovalidate', 'hidden', 'ismap', 'itemscope', 'loop', 'multiple', 'muted',
                'nomodule', 'novalidate', 'open', 'playsinline', 'readonly', 'required', 'reversed', 'selected',
            ];

            if (directive.parts[0] !== 'attr'){
                return HandlerScope.AlpineLite.HandlerReturn.Nil;
            }

            let isBoolean = (booleanAttributes.indexOf(directive.key) != -1);
            let isDisabled = (isBoolean && directive.key == 'disabled');

            state.TrapGetAccess((change: Changes.AlpineLite.IChange | Changes.AlpineLite.IBubbledChange): void => {
                if (isBoolean){
                    if (EvaluatorScope.AlpineLite.Evaluator.Evaluate(directive.value, state)){
                        if (isDisabled && element.tagName === 'A'){
                            element.classList.add(CoreBulkHandler.GetDisabledClassKey());
                        }
                        else{
                            element.setAttribute(directive.parts[1], directive.parts[1]);
                        }
                    }
                    else if (isDisabled && element.tagName === 'A'){
                        element.classList.remove(CoreBulkHandler.GetDisabledClassKey());
                    }
                    else{
                        element.removeAttribute(directive.parts[1]);
                    }
                }
                else{
                    element.setAttribute(directive.parts[1], EvaluatorScope.AlpineLite.Evaluator.Evaluate(directive.value, state));
                }
            }, true);

            return HandlerScope.AlpineLite.HandlerReturn.Handled;
        }

        public Event(directive: HandlerScope.AlpineLite.ProcessorDirective, element: HTMLElement, state: StateScope.AlpineLite.State): HandlerScope.AlpineLite.HandlerReturn{
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

            let eventParts = new Array<string>();
            for (let i = 0; i < directive.parts.length; ++i){
                let part = directive.parts[i];
                if (part in markers){
                    if (0 < eventParts.length){//Malformed
                        return HandlerScope.AlpineLite.HandlerReturn.Nil;
                    }
                    
                    markers[part] = true;
                    eventParts = new Array<string>();
                }
                else{//Part of event
                    eventParts.push(part);
                }
            }

            if (eventParts.length == 0){//Malformed
                return HandlerScope.AlpineLite.HandlerReturn.Nil;
            }

            let eventName = eventParts.join('-');
            if (!markers.on && knownEvents.indexOf(eventName) == -1){//Malformed
                return HandlerScope.AlpineLite.HandlerReturn.Nil;   
            }

            if (!markers.outside){
                element.addEventListener(eventName, (event: Event): void => {
                    if (markers.prevented){
                        event.preventDefault();
                    }

                    if (markers.stopped){
                        event.stopPropagation();
                    }

                    state.PushEventContext(event);
                    try{
                        let result = EvaluatorScope.AlpineLite.Evaluator.Evaluate(directive.value, state);
                        if (typeof result === 'function'){//Call function
                            (result as (event: Event) => void)(event);
                        }
                    }
                    catch (err){
                        state.ReportError(err, `AlpineLite.CoreHandler.BulkEvent._Trigger_.${eventName}`);
                    }

                    state.PopEventContext();
                });
            }
            else{//Listen for event outside element
                this.AddOutsideEventHandler(eventName, {
                    handler: (event: Event) => {
                        let result = EvaluatorScope.AlpineLite.Evaluator.Evaluate(directive.value, state);
                        if (typeof result === 'function'){//Call function
                            (result as (event: Event) => void)(event);
                        }
                    },
                    element: element
                }, state);
            }
        }

        public static GetDisabledClassKey(): string{
            return '__AlpineLiteDisabled__';
        }
    }
}
