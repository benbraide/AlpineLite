import * as StateScope from './State'
import * as HandlerScope from './Handler'
import * as ChangesScope from './Changes'
import * as EvaluatorScope from './Evaluator'

export namespace AlpineLite{
    export interface OutsideEventHandlerInfo{
        handler: (event: Event) => void,
        element: HTMLElement
    }
    
    export class CoreBulkHandler{
        private static outsideEventsHandlers_ = new Map<string, Array<OutsideEventHandlerInfo>>();

        public static AddOutsideEventHandler(eventName: string, info: OutsideEventHandlerInfo, state: StateScope.AlpineLite.State): void{
            if (!(eventName in CoreBulkHandler.outsideEventsHandlers_)){
                CoreBulkHandler.outsideEventsHandlers_[eventName] = new Array<OutsideEventHandlerInfo>();
                state.GetRootElement().addEventListener(eventName, (event: Event) => {
                    state.PushEventContext(event);
                    
                    let handlers: Array<OutsideEventHandlerInfo> = CoreBulkHandler.outsideEventsHandlers_[eventName];
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
                }, true);
            }

            CoreBulkHandler.outsideEventsHandlers_[eventName].push(info);
        }

        public static RemoveOutsideEventHandlers(element: HTMLElement, checkTemplate: boolean = true): void{
            let isTemplate = (element.tagName == 'TEMPLATE');
            if (!isTemplate && checkTemplate && element.closest('template')){//Inside template -- ignore
                return;
            }
            
            for (let eventName in CoreBulkHandler.outsideEventsHandlers_){
                let list: Array<OutsideEventHandlerInfo> = CoreBulkHandler.outsideEventsHandlers_[eventName];
                for (let i = list.length; 0 < i; --i){//Check list for matching element
                    if (list[i - 1].element === element){
                        list.splice((i - 1), 1);
                    }
                }
            }
        }
        
        public static Attr(directive: HandlerScope.AlpineLite.ProcessorDirective, element: HTMLElement, state: StateScope.AlpineLite.State): HandlerScope.AlpineLite.HandlerReturn{
            const booleanAttributes: Array<string> = [
                'allowfullscreen', 'allowpaymentrequest', 'async', 'autofocus', 'autoplay', 'checked', 'controls',
                'default', 'defer', 'disabled', 'formnovalidate', 'hidden', 'ismap', 'itemscope', 'loop', 'multiple', 'muted',
                'nomodule', 'novalidate', 'open', 'playsinline', 'readonly', 'required', 'reversed', 'selected',
            ];

            if (directive.parts[0] !== 'attr'){
                return HandlerScope.AlpineLite.HandlerReturn.Nil;
            }

            let attr = directive.parts.splice(1).join('-');
            let key = (directive.key.substr(4, 1).toLowerCase() +  directive.key.substr(5));//Skip 'attr'
            
            let isBoolean = (booleanAttributes.indexOf(key) != -1);
            let isDisabled = (isBoolean && key == 'disabled');

            state.TrapGetAccess((change: ChangesScope.AlpineLite.IChange | ChangesScope.AlpineLite.IBubbledChange): void => {
                if (isBoolean){
                    if (EvaluatorScope.AlpineLite.Evaluator.Evaluate(directive.value, state, element)){
                        if (isDisabled && element.tagName === 'A'){
                            element.classList.add(CoreBulkHandler.GetDisabledClassKey());
                        }
                        else{
                            element.setAttribute(attr, attr);
                        }
                    }
                    else if (isDisabled && element.tagName === 'A'){
                        element.classList.remove(CoreBulkHandler.GetDisabledClassKey());
                    }
                    else{
                        element.removeAttribute(attr);
                    }
                }
                else{
                    element.setAttribute(attr, EvaluatorScope.AlpineLite.Evaluator.Evaluate(directive.value, state, element));
                }
            }, true);

            return HandlerScope.AlpineLite.HandlerReturn.Handled;
        }

        public static Style(directive: HandlerScope.AlpineLite.ProcessorDirective, element: HTMLElement, state: StateScope.AlpineLite.State): HandlerScope.AlpineLite.HandlerReturn{
            if (directive.parts[0] !== 'style'){
                return HandlerScope.AlpineLite.HandlerReturn.Nil;
            }

            let key = (directive.key.substr(5, 1).toLowerCase() +  directive.key.substr(6));//Skip 'style'
            if (!(key in element.style)){//Unrecognized style
                return HandlerScope.AlpineLite.HandlerReturn.Nil;
            }

            state.TrapGetAccess((change: ChangesScope.AlpineLite.IChange | ChangesScope.AlpineLite.IBubbledChange): void => {
                element.style[key] = EvaluatorScope.AlpineLite.Evaluator.Evaluate(directive.value, state, element);
            }, true);

            return HandlerScope.AlpineLite.HandlerReturn.Handled;
        }
        
        public static Event(directive: HandlerScope.AlpineLite.ProcessorDirective, element: HTMLElement, state: StateScope.AlpineLite.State): HandlerScope.AlpineLite.HandlerReturn{
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
                        let result = EvaluatorScope.AlpineLite.Evaluator.Evaluate(directive.value, state, element);
                        if (typeof result === 'function'){//Call function
                            (result as (event: Event) => void)(event);
                        }
                    }
                    catch (err){
                        state.ReportError(err, `AlpineLite.CoreBulkHandler.Event._Trigger_.${eventName}`);
                    }

                    state.PopEventContext();
                });
            }
            else{//Listen for event outside element
                CoreBulkHandler.AddOutsideEventHandler(eventName, {
                    handler: (event: Event) => {
                        let result = EvaluatorScope.AlpineLite.Evaluator.Evaluate(directive.value, state, element);
                        if (typeof result === 'function'){//Call function
                            (result as (event: Event) => void)(event);
                        }
                    },
                    element: element
                }, state);
            }
        }

        public static AddAll(){
            HandlerScope.AlpineLite.Handler.AddBulkDirectiveHandler(CoreBulkHandler.Attr);
            HandlerScope.AlpineLite.Handler.AddBulkDirectiveHandler(CoreBulkHandler.Style);
            HandlerScope.AlpineLite.Handler.AddBulkDirectiveHandler(CoreBulkHandler.Event);
        }

        public static GetDisabledClassKey(): string{
            return '__AlpineLiteDisabled__';
        }
    }

    (function(){
        CoreBulkHandler.AddAll();
    })();
}
