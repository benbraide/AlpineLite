import * as StateScope from './State'
import * as ProxyScope from './Proxy'
import * as HandlerScope from './Handler'
import * as ChangesScope from './Changes'
import * as EvaluatorScope from './Evaluator'
import * as PlaceholderElementScope from './PlaceholderElement'

export namespace AlpineLite{
    interface TextHandlerOptions{
        isHtml: boolean,
        callback: () => boolean,
    }
    
    interface InputHandlerOptions{
        preEvaluate: boolean,
        callback: () => boolean,
    }
    
    export class CoreHandler{
        public static Cloak(directive: HandlerScope.AlpineLite.ProcessorDirective, element: HTMLElement, state: StateScope.AlpineLite.State): HandlerScope.AlpineLite.HandlerReturn{
            return HandlerScope.AlpineLite.HandlerReturn.Handled;
        }

        public static Data(directive: HandlerScope.AlpineLite.ProcessorDirective, element: HTMLElement, state: StateScope.AlpineLite.State): HandlerScope.AlpineLite.HandlerReturn{
            let context = state.GetValueContext();
            if (!context){
                return HandlerScope.AlpineLite.HandlerReturn.Handled;
            }
            
            let data = EvaluatorScope.AlpineLite.Evaluator.Evaluate(directive.value, state, element);
            if (typeof data === 'function'){
                data = (data as () => void)();
            }

            let targetType = typeof data;
            if (!data || targetType === 'string' || targetType === 'function' || targetType !== 'object'){
                return HandlerScope.AlpineLite.HandlerReturn.Handled;
            }

            if (data instanceof Node || data instanceof DOMTokenList){
                return HandlerScope.AlpineLite.HandlerReturn.Handled;
            }

            for (let key in data){//Copy entries
                context[key] = data[key];
            }
            
            return HandlerScope.AlpineLite.HandlerReturn.Handled;
        }

        public static Init(directive: HandlerScope.AlpineLite.ProcessorDirective, element: HTMLElement, state: StateScope.AlpineLite.State): HandlerScope.AlpineLite.HandlerReturn{
            let result = EvaluatorScope.AlpineLite.Evaluator.Evaluate(directive.value, state, element);
            if (typeof result === 'function'){//Call function
                (result as () => any)();
            }
            
            return HandlerScope.AlpineLite.HandlerReturn.Handled;
        }

        public static Uninit(directive: HandlerScope.AlpineLite.ProcessorDirective, element: HTMLElement, state: StateScope.AlpineLite.State): HandlerScope.AlpineLite.HandlerReturn{
            element[CoreHandler.GetUninitKey()] = () => {
                let result = EvaluatorScope.AlpineLite.Evaluator.Evaluate(directive.value, state, element);
                if (typeof result === 'function'){//Call function
                    (result as () => any)();
                }
            };

            return HandlerScope.AlpineLite.HandlerReturn.Handled;
        }

        public static Bind(directive: HandlerScope.AlpineLite.ProcessorDirective, element: HTMLElement, state: StateScope.AlpineLite.State): HandlerScope.AlpineLite.HandlerReturn{
            state.TrapGetAccess((change: ChangesScope.AlpineLite.IChange | ChangesScope.AlpineLite.IBubbledChange): void => {
                let result = EvaluatorScope.AlpineLite.Evaluator.Evaluate(directive.value, state, element);
                if (typeof result === 'function'){//Call function
                    (result as () => any)();
                }
            }, true);

            return HandlerScope.AlpineLite.HandlerReturn.Handled;
        }

        public static Locals(directive: HandlerScope.AlpineLite.ProcessorDirective, element: HTMLElement, state: StateScope.AlpineLite.State): HandlerScope.AlpineLite.HandlerReturn{
            let result = EvaluatorScope.AlpineLite.Evaluator.Evaluate(directive.value, state, element);
            if (typeof result === 'function'){//Call function
                result = (result as () => any)();
            }

            let proxy = ProxyScope.AlpineLite.Proxy.Create({
                target: result,
                name: state.GetElementId(element),
                parent: null,
                element: element,
                state: state
            });

            if (!proxy){
                proxy = ProxyScope.AlpineLite.Proxy.Create({
                    target: {},
                    name: state.GetElementId(element),
                    parent: null,
                    element: element,
                    state: state
                });
            }

            element[ProxyScope.AlpineLite.Proxy.GetProxyKey()] = {
                raw: result,
                proxy: proxy
            };
            
            return HandlerScope.AlpineLite.HandlerReturn.Handled;
        }

        public static Id(directive: HandlerScope.AlpineLite.ProcessorDirective, element: HTMLElement, state: StateScope.AlpineLite.State): HandlerScope.AlpineLite.HandlerReturn{
            EvaluatorScope.AlpineLite.Evaluator.Evaluate(`(${directive.value})='${state.GetElementId(element)}'`, state, element);
            return HandlerScope.AlpineLite.HandlerReturn.Handled;
        }

        public static Ref(directive: HandlerScope.AlpineLite.ProcessorDirective, element: HTMLElement, state: StateScope.AlpineLite.State): HandlerScope.AlpineLite.HandlerReturn{
            if (element.tagName === 'TEMPLATE'){
                EvaluatorScope.AlpineLite.Evaluator.Evaluate(`(${directive.value})=this.content`, state, element);
            }
            else{
                EvaluatorScope.AlpineLite.Evaluator.Evaluate(`(${directive.value})=this`, state, element);
            }

            return HandlerScope.AlpineLite.HandlerReturn.Handled;
        }

        public static Class(directive: HandlerScope.AlpineLite.ProcessorDirective, element: HTMLElement, state: StateScope.AlpineLite.State): HandlerScope.AlpineLite.HandlerReturn{
            state.TrapGetAccess((change: ChangesScope.AlpineLite.IChange | ChangesScope.AlpineLite.IBubbledChange): void => {
                let entries = EvaluatorScope.AlpineLite.Evaluator.Evaluate(directive.value, state, element);
                for (let key in entries){
                    if (entries[key]){
                        if (!element.classList.contains(key)){
                            element.classList.add(key);
                        }
                    }
                    else{
                        element.classList.remove(key);
                    }
                }
            }, true);
            
            return HandlerScope.AlpineLite.HandlerReturn.Handled;
        }

        public static Text(directive: HandlerScope.AlpineLite.ProcessorDirective, element: HTMLElement, state: StateScope.AlpineLite.State): HandlerScope.AlpineLite.HandlerReturn{
            CoreHandler.Text_(directive, element, state, {
                isHtml: false,
                callback: null
            });

            return HandlerScope.AlpineLite.HandlerReturn.Handled;
        }

        public static Html(directive: HandlerScope.AlpineLite.ProcessorDirective, element: HTMLElement, state: StateScope.AlpineLite.State): HandlerScope.AlpineLite.HandlerReturn{
            CoreHandler.Text_(directive, element, state, {
                isHtml: true,
                callback: null
            });

            return HandlerScope.AlpineLite.HandlerReturn.Handled;
        }

        private static Text_(directive: HandlerScope.AlpineLite.ProcessorDirective, element: HTMLElement, state: StateScope.AlpineLite.State, options: TextHandlerOptions): void{
            let callback: (change: ChangesScope.AlpineLite.IChange | ChangesScope.AlpineLite.IBubbledChange) => void;
            let getValue = (): any => {
                let result = EvaluatorScope.AlpineLite.Evaluator.Evaluate(directive.value, state, element);
                return ((typeof result === 'function') ? (result as () => any)() : result);
            };
            
            if (options.isHtml){
                callback = (change: ChangesScope.AlpineLite.IChange | ChangesScope.AlpineLite.IBubbledChange): void => {
                    element.innerHTML = getValue();
                };
            }
            else if (element.tagName === 'INPUT'){
                let inputElement = (element as HTMLInputElement);
                if (inputElement.type === 'checkbox' || inputElement.type === 'radio'){
                    callback = (change: ChangesScope.AlpineLite.IChange | ChangesScope.AlpineLite.IBubbledChange): void => {
                        inputElement.checked = !!getValue();
                    };
                }
                else{
                    callback = (change: ChangesScope.AlpineLite.IChange | ChangesScope.AlpineLite.IBubbledChange): void => {
                        inputElement.value = getValue();
                    };
                }
            }
            else if (element.tagName === 'TEXTAREA'){
                callback = (change: ChangesScope.AlpineLite.IChange | ChangesScope.AlpineLite.IBubbledChange): void => {
                    (element as HTMLTextAreaElement).value = getValue();
                };
            }
            else if (element.tagName === 'SELECT'){
                callback = (change: ChangesScope.AlpineLite.IChange | ChangesScope.AlpineLite.IBubbledChange): void => {
                    (element as HTMLSelectElement).value = getValue();
                };
            }
            else{//Unknown element
                callback = (change: ChangesScope.AlpineLite.IChange | ChangesScope.AlpineLite.IBubbledChange): void => {
                    element.innerText = getValue();
                };
            }

            state.TrapGetAccess((change: ChangesScope.AlpineLite.IChange | ChangesScope.AlpineLite.IBubbledChange): void => {
                if (!options.callback || options.callback()){
                    callback(change);
                }
            }, true);
        }

        public static Input(directive: HandlerScope.AlpineLite.ProcessorDirective, element: HTMLElement, state: StateScope.AlpineLite.State): HandlerScope.AlpineLite.HandlerReturn{
            CoreHandler.Input_(directive, element, state, {
                preEvaluate: true,
                callback: null
            });

            return HandlerScope.AlpineLite.HandlerReturn.Handled;
        }

        public static Model(directive: HandlerScope.AlpineLite.ProcessorDirective, element: HTMLElement, state: StateScope.AlpineLite.State): HandlerScope.AlpineLite.HandlerReturn{
            let doneInput = false;
            CoreHandler.Input_(directive, element, state, {
                preEvaluate: false,
                callback: (): boolean => {
                    doneInput = true;
                    return true;
                }
            });

            CoreHandler.Text_(directive, element, state, {
                isHtml: false,
                callback: (): boolean => {
                    if (doneInput){
                        doneInput = false;
                        return false;
                    }

                    return true;
                }
            });
            
            return HandlerScope.AlpineLite.HandlerReturn.Handled;
        }

        private static Input_(directive: HandlerScope.AlpineLite.ProcessorDirective, element: HTMLElement, state: StateScope.AlpineLite.State, options: InputHandlerOptions): void{
            let getValue: () => string;
            let isCheckable: boolean = false;
            
            if (element.tagName === 'INPUT'){
                let inputElement = (element as HTMLInputElement);
                if (inputElement.type === 'checkbox' || inputElement.type === 'radio'){
                    getValue = (): string => {
                        return 'this.checked';
                    };
                }
                else{
                    getValue = (): string => {
                        return 'this.value';
                    };
                }

                isCheckable = true;
            }
            else if (element.tagName === 'TEXTAREA' || element.tagName === 'SELECT'){
                getValue = (): string => {
                    return 'this.value';
                };
            }
            else{//Unsupported
                state.ReportError(`'${element.tagName}' is not supported`, 'AlpineLite.CoreHandler.Input');
                return;
            }

            if (options.preEvaluate){
                EvaluatorScope.AlpineLite.Evaluator.Evaluate(`(${directive.value})=${getValue()}`, state, element);
            }

            let onEvent = (event: Event): void => {
                if (!options.callback || options.callback()){
                    EvaluatorScope.AlpineLite.Evaluator.Evaluate(`(${directive.value})=${getValue()}`, state, element);
                }
            };

            element.addEventListener('input', onEvent);
            if (!isCheckable && element.tagName !== 'SELECT'){
                element.addEventListener('keydown', onEvent);
                element.addEventListener('paste', onEvent);
                element.addEventListener('cut', onEvent);
            }
        }

        public static Show(directive: HandlerScope.AlpineLite.ProcessorDirective, element: HTMLElement, state: StateScope.AlpineLite.State): HandlerScope.AlpineLite.HandlerReturn{
            let getValue = (): any => {
                let result = EvaluatorScope.AlpineLite.Evaluator.Evaluate(directive.value, state, element);
                return ((typeof result === 'function') ? (result as () => any)() : result);
            };
            
            let previousDisplay = element.style.display;
            if (previousDisplay === 'none'){
                previousDisplay = 'block';
            }
            
            state.TrapGetAccess((change: ChangesScope.AlpineLite.IChange | ChangesScope.AlpineLite.IBubbledChange): void => {
                if (getValue()){
                    element.style.display = previousDisplay;
                }
                else{
                    element.style.display = 'none';
                }
            }, true);

            return HandlerScope.AlpineLite.HandlerReturn.Handled;
        }

        public static If(directive: HandlerScope.AlpineLite.ProcessorDirective, element: HTMLElement, state: StateScope.AlpineLite.State): HandlerScope.AlpineLite.HandlerReturn{
            let isInserted = true;
            let marker = document.createElement('x-placeholder');
            
            let getValue = (): any => {
                let result = EvaluatorScope.AlpineLite.Evaluator.Evaluate(directive.value, state, element);
                return ((typeof result === 'function') ? (result as () => any)() : result);
            };

            let attributes = new Map<string, string>();
            for (let i = 0; i < element.attributes.length; ++i){//Copy attributes
                if (element.attributes[i].name !== directive.original){
                    attributes[element.attributes[i].name] = element.attributes[i].value;
                }
            }
            
            element.parentElement.insertBefore(marker, element);
            state.TrapGetAccess((change: ChangesScope.AlpineLite.IChange | ChangesScope.AlpineLite.IBubbledChange): void => {
                let value = getValue();
                if (value && !isInserted){
                    for (let name in attributes){//Insert copied attributes
                        element.setAttribute(name, attributes[name]);
                    }

                    marker.parentElement.insertBefore(element, marker);
                    isInserted = true;
                }
                else if (!value && isInserted){
                    isInserted = false;
                    element.parentElement.removeChild(element);
                }
            }, true);

            if (!isInserted){
                element.removeAttribute(directive.original);
                for (let name in attributes){//Remove copied attributes
                    element.removeAttribute(name);
                }

                return HandlerScope.AlpineLite.HandlerReturn.Rejected;
            }

            return HandlerScope.AlpineLite.HandlerReturn.Handled;
        }

        public static AddAll(handler: HandlerScope.AlpineLite.Handler){
            handler.AddDirectiveHandler('cloak', CoreHandler.Cloak);
            handler.AddDirectiveHandler('data', CoreHandler.Data);

            handler.AddDirectiveHandler('init', CoreHandler.Init);
            handler.AddDirectiveHandler('uninit', CoreHandler.Uninit);
            handler.AddDirectiveHandler('bind', CoreHandler.Bind);

            handler.AddDirectiveHandler('locals', CoreHandler.Locals);
            handler.AddDirectiveHandler('id', CoreHandler.Id);
            handler.AddDirectiveHandler('ref', CoreHandler.Ref);

            handler.AddDirectiveHandler('class', CoreHandler.Class);
            handler.AddDirectiveHandler('text', CoreHandler.Text);
            handler.AddDirectiveHandler('html', CoreHandler.Html);

            handler.AddDirectiveHandler('input', CoreHandler.Input);
            handler.AddDirectiveHandler('model', CoreHandler.Model);

            handler.AddDirectiveHandler('show', CoreHandler.Show);
            handler.AddDirectiveHandler('if', CoreHandler.If);
        }

        public static GetUninitKey(): string{
            return '__AlpineLiteUninit__';
        }
    }
}
