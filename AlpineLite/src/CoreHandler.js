import * as ProxyScope from './Proxy.js';
import * as HandlerScope from './Handler.js';
import * as EvaluatorScope from './Evaluator.js';
export var AlpineLite;
(function (AlpineLite) {
    class CoreHandler {
        static Cloak(directive, element, state) {
            return HandlerScope.AlpineLite.HandlerReturn.Handled;
        }
        static Data(directive, element, state) {
            return HandlerScope.AlpineLite.HandlerReturn.Handled;
        }
        static Locals(directive, element, state) {
            let result = EvaluatorScope.AlpineLite.Evaluator.Evaluate(directive.value, state);
            if (typeof result === 'function') { //Call function
                result = result();
            }
            let proxy = ProxyScope.AlpineLite.Proxy.Create({
                target: result,
                name: state.GetElementId(element),
                parent: null,
                element: element,
                state: state
            });
            if (!proxy) {
                state.ReportError('Invalid target for locals', 'AlpineLite.CoreHandler.Locals');
            }
            element[ProxyScope.AlpineLite.Proxy.GetProxyKey()] = {
                raw: result,
                proxy: proxy
            };
            return HandlerScope.AlpineLite.HandlerReturn.Handled;
        }
        static Id(directive, element, state) {
            EvaluatorScope.AlpineLite.Evaluator.Evaluate(`(${directive.value})='${state.GetElementId(element)}'`, state);
            return HandlerScope.AlpineLite.HandlerReturn.Handled;
        }
        static Ref(directive, element, state) {
            if (element.tagName === 'TEMPLATE') {
                EvaluatorScope.AlpineLite.Evaluator.Evaluate(`(${directive.value})=this.content`, state);
            }
            else {
                EvaluatorScope.AlpineLite.Evaluator.Evaluate(`(${directive.value})=this`, state);
            }
            return HandlerScope.AlpineLite.HandlerReturn.Handled;
        }
        static Text(directive, element, state) {
            CoreHandler.Text_(directive, element, state, {
                isHtml: false,
                callback: null
            });
            return HandlerScope.AlpineLite.HandlerReturn.Handled;
        }
        static Html(directive, element, state) {
            CoreHandler.Text_(directive, element, state, {
                isHtml: true,
                callback: null
            });
            return HandlerScope.AlpineLite.HandlerReturn.Handled;
        }
        static Text_(directive, element, state, options) {
            let callback;
            let getValue = () => {
                let result = EvaluatorScope.AlpineLite.Evaluator.Evaluate(directive.value, state);
                return ((typeof result === 'function') ? result() : result);
            };
            if (options.isHtml) {
                callback = (change) => {
                    element.innerHTML = getValue();
                };
            }
            else if (element.tagName === 'INPUT') {
                let inputElement = element;
                if (inputElement.type === 'checkbox' || inputElement.type === 'radio') {
                    callback = (change) => {
                        inputElement.checked = !!getValue();
                    };
                }
                else {
                    callback = (change) => {
                        inputElement.value = getValue();
                    };
                }
            }
            else if (element.tagName === 'TEXTAREA') {
                callback = (change) => {
                    element.value = getValue();
                };
            }
            else if (element.tagName === 'SELECT') {
                callback = (change) => {
                    element.value = getValue();
                };
            }
            else { //Unknown element
                callback = (change) => {
                    element.innerText = getValue();
                };
            }
            state.TrapGetAccess((change) => {
                if (options.callback && options.callback()) {
                    callback(change);
                }
            }, true);
        }
        static Input(directive, element, state) {
            CoreHandler.Input_(directive, element, state, {
                preEvaluate: true,
                callback: null
            });
            return HandlerScope.AlpineLite.HandlerReturn.Handled;
        }
        static Model(directive, element, state) {
            let doneInput = false;
            CoreHandler.Input_(directive, element, state, {
                preEvaluate: false,
                callback: () => {
                    doneInput = true;
                    return true;
                }
            });
            CoreHandler.Text_(directive, element, state, {
                isHtml: false,
                callback: () => {
                    if (doneInput) {
                        doneInput = false;
                        return false;
                    }
                    return true;
                }
            });
            return HandlerScope.AlpineLite.HandlerReturn.Handled;
        }
        static Input_(directive, element, state, options) {
            let getValue;
            let isCheckable = false;
            if (element.tagName === 'INPUT') {
                let inputElement = element;
                if (inputElement.type === 'checkbox' || inputElement.type === 'radio') {
                    getValue = () => {
                        return 'this.checked';
                    };
                }
                else {
                    getValue = () => {
                        return 'this.value';
                    };
                }
                isCheckable = true;
            }
            else if (element.tagName === 'TEXTAREA' || element.tagName === 'SELECT') {
                getValue = () => {
                    return 'this.value';
                };
            }
            else { //Unsupported
                state.ReportError(`'${element.tagName}' is not supported`, 'AlpineLite.CoreHandler.Input');
                return;
            }
            if (options.preEvaluate) {
                EvaluatorScope.AlpineLite.Evaluator.Evaluate(`(${directive.value})=${getValue()}`, state);
            }
            let onEvent = (event) => {
                if (options.callback && options.callback()) {
                    EvaluatorScope.AlpineLite.Evaluator.Evaluate(`(${directive.value})=${getValue()}`, state);
                }
            };
            element.addEventListener('input', onEvent);
            if (!isCheckable && element.tagName !== 'SELECT') {
                element.addEventListener('keydown', onEvent);
                element.addEventListener('paste', onEvent);
                element.addEventListener('cut', onEvent);
            }
        }
        static Show(directive, element, state) {
            let getValue = () => {
                let result = EvaluatorScope.AlpineLite.Evaluator.Evaluate(directive.value, state);
                return ((typeof result === 'function') ? result() : result);
            };
            let previousDisplay = element.style.display;
            if (previousDisplay === 'none') {
                previousDisplay = 'block';
            }
            state.TrapGetAccess((change) => {
                if (getValue()) {
                    element.style.display = previousDisplay;
                }
                else {
                    element.style.display = 'none';
                }
            }, true);
            return HandlerScope.AlpineLite.HandlerReturn.Handled;
        }
        static If(directive, element, state) {
            let isInserted = true;
            let marker = document.createElement('x-placeholder');
            let getValue = () => {
                let result = EvaluatorScope.AlpineLite.Evaluator.Evaluate(directive.value, state);
                return ((typeof result === 'function') ? result() : result);
            };
            let attributes = new Map();
            for (let i = 0; i < element.attributes.length; ++i) { //Copy attributes
                if (element.attributes[i].name !== directive.original) {
                    attributes[element.attributes[i].name] = element.attributes[i].value;
                }
            }
            element.parentElement.insertBefore(marker, element);
            state.TrapGetAccess((change) => {
                let value = getValue();
                if (value && !isInserted) {
                    for (let name in attributes) { //Insert copied attributes
                        element.setAttribute(name, attributes[name]);
                    }
                    marker.parentElement.insertBefore(element, marker);
                    isInserted = true;
                }
                else if (!value && isInserted) {
                    isInserted = false;
                    element.parentElement.removeChild(element);
                }
            }, true);
            if (!isInserted) {
                element.removeAttribute(directive.original);
                for (let name in attributes) { //Remove copied attributes
                    element.removeAttribute(name);
                }
                return HandlerScope.AlpineLite.HandlerReturn.Rejected;
            }
            return HandlerScope.AlpineLite.HandlerReturn.Handled;
        }
    }
    AlpineLite.CoreHandler = CoreHandler;
})(AlpineLite || (AlpineLite = {}));
