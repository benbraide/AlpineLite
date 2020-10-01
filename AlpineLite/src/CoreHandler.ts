import * as StateScope from './State'
import * as ProxyScope from './Proxy'
import * as ValueScope from './Value'
import * as HandlerScope from './Handler'
import * as ChangesScope from './Changes'
import * as EvaluatorScope from './Evaluator'
import * as ProcessorScope from './Processor'

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
                data = (data as () => void).call(state.GetValueContext());
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
                (result as () => any).call(state.GetValueContext());
            }
            
            return HandlerScope.AlpineLite.HandlerReturn.Handled;
        }

        public static Uninit(directive: HandlerScope.AlpineLite.ProcessorDirective, element: HTMLElement, state: StateScope.AlpineLite.State): HandlerScope.AlpineLite.HandlerReturn{
            let uninitList = (element[CoreHandler.GetUninitKey()] = (element[CoreHandler.GetUninitKey()] || []));
            uninitList.push(() => {
                let result = EvaluatorScope.AlpineLite.Evaluator.Evaluate(directive.value, state, element);
                if (typeof result === 'function'){//Call function
                    (result as () => any).call(state.GetValueContext());
                }
            });

            return HandlerScope.AlpineLite.HandlerReturn.Handled;
        }

        public static Bind(directive: HandlerScope.AlpineLite.ProcessorDirective, element: HTMLElement, state: StateScope.AlpineLite.State): HandlerScope.AlpineLite.HandlerReturn{
            state.TrapGetAccess((change: ChangesScope.AlpineLite.IChange | ChangesScope.AlpineLite.IBubbledChange): void => {
                let result = EvaluatorScope.AlpineLite.Evaluator.Evaluate(directive.value, state, element);
                if (typeof result === 'function'){//Call function
                    (result as () => any).call(state.GetValueContext());
                }
            }, true);

            return HandlerScope.AlpineLite.HandlerReturn.Handled;
        }

        public static Locals(directive: HandlerScope.AlpineLite.ProcessorDirective, element: HTMLElement, state: StateScope.AlpineLite.State): HandlerScope.AlpineLite.HandlerReturn{
            let result = EvaluatorScope.AlpineLite.Evaluator.Evaluate(directive.value, state, element);
            if (typeof result === 'function'){//Call function
                result = (result as () => any).call(state.GetValueContext());
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
                return ((typeof result === 'function') ? (result as () => any).call(state.GetValueContext()) : result);
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
                    isCheckable = true;
                    getValue = (): string => {
                        return 'this.checked';
                    };
                }
                else{
                    getValue = (): string => {
                        return 'this.value';
                    };
                }
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

            if (!isCheckable && element.tagName !== 'SELECT'){
                element.addEventListener('input', onEvent);
                element.addEventListener('paste', onEvent);
                element.addEventListener('cut', onEvent);
            }
            else{
                element.addEventListener('change', onEvent);
            }
        }

        public static Show(directive: HandlerScope.AlpineLite.ProcessorDirective, element: HTMLElement, state: StateScope.AlpineLite.State): HandlerScope.AlpineLite.HandlerReturn{
            let getValue = (): any => {
                let result = EvaluatorScope.AlpineLite.Evaluator.Evaluate(directive.value, state, element);
                return ((typeof result === 'function') ? (result as () => any).call(state.GetValueContext()) : result);
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
                return ((typeof result === 'function') ? (result as () => any).call(state.GetValueContext()) : result);
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

                return HandlerScope.AlpineLite.HandlerReturn.QuitAll;
            }

            return HandlerScope.AlpineLite.HandlerReturn.Handled;
        }

        public static Each(directive: HandlerScope.AlpineLite.ProcessorDirective, element: HTMLElement, state: StateScope.AlpineLite.State): HandlerScope.AlpineLite.HandlerReturn{
            let attributes = new Map<string, string>();
            for (let i = 0; i < element.attributes.length; ++i){//Copy attributes
                if (element.attributes[i].name !== directive.original && element.attributes[i].name !== StateScope.AlpineLite.State.GetIdKey()){
                    attributes[element.attributes[i].name] = element.attributes[i].value;
                }
            }

            element.removeAttribute(directive.original);
            for (let name in attributes){//Remove copied attributes
                element.removeAttribute(name);
            }

            let details = {
                marker: document.createElement('x-placeholder'),
                list: null,
                target: null,
                isArray: false,
                count: null,
                countProxy: null
            }

            element.parentElement.insertBefore(details.marker, element);
            element.parentElement.removeChild(element);
            
            let processor = new ProcessorScope.AlpineLite.Processor(state);
            let insert = (key?: string) => {
                let clone = (element.cloneNode(true) as HTMLElement);
                let locals: {
                    raw: any;
                    proxy: ProxyScope.AlpineLite.Proxy;
                };
    
                let proxyKey = ProxyScope.AlpineLite.Proxy.GetProxyKey();
                if (!(proxyKey in clone)){
                    let raw = {};
                    let localProxy = ProxyScope.AlpineLite.Proxy.Create({
                        target: raw,
                        name: state.GetElementId(clone),
                        parent: null,
                        element: clone,
                        state: state
                    });
    
                    clone[proxyKey] = {
                        raw: raw,
                        proxy: localProxy
                    };
                }
                
                locals = clone[proxyKey];
                let getIndex = (): number => {
                    for (let i = 0; i < details.list.length; ++i){
                        if (details.list[i] === clone){
                            return i;
                        }
                    }

                    return -1;
                };
                
                locals.raw['$each'] = new ValueScope.AlpineLite.Value(() => {
                    return {
                        count: new ValueScope.AlpineLite.Value(() => {
                            return (details.isArray ? (details.target as Array<any>).length : details.countProxy['value']);
                        }, true),
                        index: new ValueScope.AlpineLite.Value(() => {
                            return (details.isArray ? getIndex() : key);
                        }, true),
                        value: new ValueScope.AlpineLite.Value(() => {
                            return (details.isArray ? (details.target as Array<any>)[getIndex()] : (details.target as Map<string, any>)[key]);
                        }, true)
                    };
                }, true);
                
                if (!details.isArray){
                    let list = (details.list as Map<string, HTMLElement>);
                    if (key in list){//Remove previous
                        let previousClone = list[key];
                        previousClone.parentElement.removeChild(previousClone);
                    }

                    list[key] = clone;
                }
                else{
                    (details.list as Array<HTMLElement>).push(clone);
                }

                for (let name in attributes){//Insert copied attributes
                    clone.setAttribute(name, attributes[name]);
                }
                
                details.marker.parentElement.insertBefore(clone, details.marker);
                processor.All(clone);
            };

            let getValue = (): any => {
                let result = EvaluatorScope.AlpineLite.Evaluator.Evaluate(directive.value, state, element);
                return ((typeof result === 'function') ? (result as () => any).call(state.GetValueContext()) : result);
            };

            let build = () => {
                if (details.isArray){
                    for (let i = 0; i < (details.target as Array<any>).length; ++i){
                        insert();
                    }
                }
                else{
                    details.countProxy.value = Object.keys(details.target).length;
                    for (let key in details.target){
                        insert(key);
                    }
                }
            };

            let init = () => {
                details.target = getValue();
                if (Array.isArray(details.target)){
                    details.isArray = true;
                    details.list = new Array<HTMLElement>();
                }
                else if (typeof details.target === 'object'){
                    details.isArray = false;
                    details.list = new Map<string, HTMLElement>();

                    if (!details.count){
                        details.count = ProxyScope.AlpineLite.Proxy.Create({
                            target: {
                                value: 0
                            },
                            name: `${state.GetElementId(element)}_each_value`,
                            parent: null,
                            element: null,
                            state: state
                        });

                        details.countProxy = (details.count as ProxyScope.AlpineLite.Proxy).GetProxy();
                    }
                }
                else{
                    details.list = null;
                    details.isArray = false;
                }

                if (details.list){
                    build();
                    let name = (details.target.__AlpineLiteName__ as string), path = (details.target.__AlpineLitePath__ as string);
                    state.GetChanges().AddGetAccess(name, path);
                }
            };

            let purge = () => {
                if (details.isArray){
                    (details.list as Array<HTMLElement>).forEach((clone) => {
                        clone.parentElement.removeChild(clone);
                    });

                    details.list = new Array<HTMLElement>();
                }
                else{
                    for (let key in (details.list as Map<string, HTMLElement>)){
                        let clone = (details.list as Map<string, HTMLElement>)[key];
                        clone.parentElement.removeChild(clone);
                    }

                    details.list = new Map<string, HTMLElement>();
                    details.count = 0;
                }
            };

            let refresh = () => {
                purge();
                init();
            };

            state.TrapGetAccess((change: ChangesScope.AlpineLite.IChange | ChangesScope.AlpineLite.IBubbledChange): void => {
                init();
            }, (change: ChangesScope.AlpineLite.IChange | ChangesScope.AlpineLite.IBubbledChange): void => {
                if ('original' in change){//Bubbled
                    if ((change as ChangesScope.AlpineLite.IBubbledChange).isAncestor){
                        refresh();
                    }

                    return;
                }

                let nonBubbledChange = (change as ChangesScope.AlpineLite.IChange);
                if (!details.isArray){
                    if (nonBubbledChange.type === 'delete'){
                        let clone = (details.list as Map<string, HTMLElement>)[nonBubbledChange.targetName];
                        clone.parentElement.removeChild(clone);
                        details.countProxy.value = Object.keys(details.target).length;
                    }
                    else if (nonBubbledChange.type === 'set'){
                        details.countProxy.value = Object.keys(details.target).length;
                        insert(nonBubbledChange.targetName);
                    }
                    
                    return;
                }
                
                if (nonBubbledChange.type !== 'set' || nonBubbledChange.targetName !== 'length'){
                    return;
                }

                if ((details.target as Array<any>).length < details.list.length){//Item(s) removed
                    let count = (details.list.length - (details.target as Array<any>).length);
                    for (let i = 0; i < count; ++i){
                        let clone = details.list[details.list.length - 1];
                        clone.parentElement.removeChild(clone);
                        details.list.pop();
                    }
                }
                else if ((details.target as Array<any>).length > details.list.length){//Item(s) added
                    let count = ((details.target as Array<any>).length - details.list.length);
                    for (let i = 0; i < count; ++i){
                        insert();
                    }
                }
            });
            
            return HandlerScope.AlpineLite.HandlerReturn.QuitAll;
        }

        public static AddAll(){
            HandlerScope.AlpineLite.Handler.AddDirectiveHandler('cloak', CoreHandler.Cloak);
            HandlerScope.AlpineLite.Handler.AddDirectiveHandler('data', CoreHandler.Data);

            HandlerScope.AlpineLite.Handler.AddDirectiveHandler('init', CoreHandler.Init);
            HandlerScope.AlpineLite.Handler.AddDirectiveHandler('uninit', CoreHandler.Uninit);
            HandlerScope.AlpineLite.Handler.AddDirectiveHandler('bind', CoreHandler.Bind);

            HandlerScope.AlpineLite.Handler.AddDirectiveHandler('locals', CoreHandler.Locals);
            HandlerScope.AlpineLite.Handler.AddDirectiveHandler('id', CoreHandler.Id);
            HandlerScope.AlpineLite.Handler.AddDirectiveHandler('ref', CoreHandler.Ref);

            HandlerScope.AlpineLite.Handler.AddDirectiveHandler('class', CoreHandler.Class);
            HandlerScope.AlpineLite.Handler.AddDirectiveHandler('text', CoreHandler.Text);
            HandlerScope.AlpineLite.Handler.AddDirectiveHandler('html', CoreHandler.Html);

            HandlerScope.AlpineLite.Handler.AddDirectiveHandler('input', CoreHandler.Input);
            HandlerScope.AlpineLite.Handler.AddDirectiveHandler('model', CoreHandler.Model);

            HandlerScope.AlpineLite.Handler.AddDirectiveHandler('show', CoreHandler.Show);
            HandlerScope.AlpineLite.Handler.AddDirectiveHandler('if', CoreHandler.If);
            HandlerScope.AlpineLite.Handler.AddDirectiveHandler('each', CoreHandler.Each);
        }

        public static GetUninitKey(): string{
            return '__AlpineLiteUninit__';
        }
    }

    (function(){
        CoreHandler.AddAll();
    })();
}
