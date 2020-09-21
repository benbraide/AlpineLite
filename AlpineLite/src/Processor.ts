import * as StateScope from './State'
import * as HandlerScope from './Handler'
import * as ChangesScope from './Changes'
import * as EvaluatorScope from './Evaluator'

export namespace AlpineLite{
    export interface ProcessorOptions{
        checkTemplate?: boolean;
        checkDocument?: boolean;
    }
    
    export class Processor{
        private state_: StateScope.AlpineLite.State = null;

        constructor(state: StateScope.AlpineLite.State){
            this.state_ = state;
        }

        public All(element: HTMLElement, options?: ProcessorOptions): void{
            if (!Processor.Check(element, options)){//Check failed -- ignore
                return;
            }

            let isTemplate = (element.tagName == 'TEMPLATE');
            if (!isTemplate && options?.checkTemplate && element.closest('template')){//Inside template -- ignore
                return;
            }

            this.One(element);
            if (isTemplate){//Don't process template content
                return;
            }

            let children = element.children;
            for (let i = 0; i < children.length; ++i){//Process children
                this.All(children[i] as HTMLElement);
            }
        }

        public One(element: HTMLElement, options?: ProcessorOptions): void{
            if (!Processor.Check(element, options)){//Check failed -- ignore
                return;
            }

            let isTemplate = (element.tagName == 'TEMPLATE');
            if (!isTemplate && options?.checkTemplate && element.closest('template')){//Inside template -- ignore
                return;
            }
            
            Processor.TraverseDirectives(element, (directive: HandlerScope.AlpineLite.ProcessorDirective): boolean => {
                return this.DispatchDirective(directive, element);
            }, (attribute: Attr): boolean => {//Check for data binding inside attribute
                // this.state_.TrapGetAccess((change: ChangesScope.AlpineLite.IChange | ChangesScope.AlpineLite.IBubbledChange): void => {
                //     attribute.value = EvaluatorScope.AlpineLite.Evaluator.Interpolate(attribute.value, this.state_, elementNode);
                // }, true);
                return true;
            });
        }

        public DispatchDirective(directive: HandlerScope.AlpineLite.ProcessorDirective, element: HTMLElement): boolean{
            let result: HandlerScope.AlpineLite.HandlerReturn;
            try{
                this.state_.PushElementContext(element);
                result = HandlerScope.AlpineLite.Handler.HandleDirective(directive, element, this.state_);
                this.state_.PopElementContext();
            }
            catch (err){
                this.state_.PopElementContext();
                this.state_.ReportError(err, `AlpineLite.Processor.DispatchDirective._Handle_.${directive.key}`);
                return true;
            }
            
            if (result == HandlerScope.AlpineLite.HandlerReturn.Nil){//Not handled
                if (1 < directive.parts.length && directive.parts[0] === 'static'){
                    this.state_.PushFlag(StateScope.AlpineLite.StateFlag.StaticBind, true);
                    try{
                        let newDirective: HandlerScope.AlpineLite.ProcessorDirective = {
                            original: directive.original,
                            parts: directive.parts.splice(1),
                            raw: '',
                            key: '',
                            value: directive.value
                        };

                        newDirective.raw = newDirective.parts.join('-');
                        newDirective.key = Processor.GetCamelCaseDirectiveName(newDirective.raw);
                        
                        if (this.DispatchDirective(newDirective, element)){
                            result = HandlerScope.AlpineLite.HandlerReturn.Handled;
                        }
                        else{
                            result = HandlerScope.AlpineLite.HandlerReturn.Rejected;
                        }
                    }
                    catch (err){
                        this.state_.ReportError(err, `AlpineLite.Processor.DispatchDirective._Handle_.${directive.key}`);
                    }

                    this.state_.PopFlag(StateScope.AlpineLite.StateFlag.StaticBind);
                }
                else{
                    this.state_.ReportWarning(`'${directive.original}': Handler not found. Skipping...`, `AlpineLite.Processor.DispatchDirective._Handle_.${directive.key}`);
                }
            }

            if (result == HandlerScope.AlpineLite.HandlerReturn.Rejected){
                return false;
            }

            element.removeAttribute(directive.original);
            if (result == HandlerScope.AlpineLite.HandlerReturn.Handled){
                Processor.GetElementId(element, this.state_);
            }
            
            return true;
        }

        public static Check(element: HTMLElement, options: ProcessorOptions): boolean{
            if (element?.nodeType !== 1){//Not an HTMLElement
                return false;
            }
            
            if (options?.checkDocument && !document.contains(element)){//Node is not contained inside the document
                return false;
            }

            return true;
        }

        public static GetHTMLElement(node: Node): HTMLElement{
            return ((node.nodeType == 1) ? (node as HTMLElement) : node.parentElement);
        }

        public static TraverseDirectives(element: HTMLElement, callback: (directive: HandlerScope.AlpineLite.ProcessorDirective) => boolean, noMatchCallback?: (attribute: Attr) => boolean): void{
            let attributes = new Array<Attr>();
            for (let i = 0; i < element.attributes.length; ++i){//Duplicate attributes
                attributes.push(element.attributes[i]);
            }

            for (let i = 0; i < attributes.length; ++i){//Traverse attributes
                let directive = Processor.GetDirective(attributes[i]);
                if (!directive && noMatchCallback && !noMatchCallback(attributes[i])){
                    return;
                }

                if (directive && !callback(directive)){
                    return;
                }
            }
        }

        public static GetDirective(attribute: Attr): HandlerScope.AlpineLite.ProcessorDirective{
            let matches = attribute.name.match(/^(data-)?x-(.+)$/);
            if (!matches || matches.length != 3 || !matches[2]){//Not a directive
                return null;
            }

            return {
                original: attribute.name,
                parts: matches[2].split('-'),
                raw: matches[2],
                key: Processor.GetCamelCaseDirectiveName(matches[2]),
                value: attribute.value
            };
        }

        public static GetCamelCaseDirectiveName(name: string): string{
            return name.replace(/-([^-])/g, ($0: string, $1: string) => {
                return ($1.charAt(0).toUpperCase() + $1.slice(1));
            });
        }

        public static GetElementId(element: HTMLElement, state: StateScope.AlpineLite.State): string{
            return state.GetElementId(element);
        }

        public static GetIdKey(): string{
            return StateScope.AlpineLite.State.GetIdKey();
        }
    }
}
