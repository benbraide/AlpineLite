import * as StateScope from './State'

export namespace AlpineLite{
    export enum HandlerReturn{
        Nil,
        Handled,
        Rejected,
        SkipBulk,
        QuitAll,
    }

    export interface ProcessorDirective{
        original: string;
        parts: Array<string>;
        raw: string;
        key: string;
        value: string;
    }
    
    export type DirectiveHandler = (directive: ProcessorDirective, element: HTMLElement, state: StateScope.AlpineLite.State) => HandlerReturn;
    
    export class Handler{
        private static directiveHandlers_ = new Map<string, DirectiveHandler>();
        private static bulkDirectiveHandlers_ = new Array<DirectiveHandler>();

        public static AddDirectiveHandler(directive: string, handler: DirectiveHandler): void{
            this.directiveHandlers_[directive] = handler;
        }

        public static GetDirectiveHandler(directive: string): DirectiveHandler{
            return ((directive in this.directiveHandlers_) ? this.directiveHandlers_[directive] : null);
        }

        public static AddBulkDirectiveHandler(handler: DirectiveHandler): void{
            this.bulkDirectiveHandlers_.push(handler);
        }

        public static AddBulkDirectiveHandlerInFront(handler: DirectiveHandler): void{
            this.bulkDirectiveHandlers_.unshift(handler);
        }

        public static HandleDirective(directive: ProcessorDirective, element: HTMLElement, state: StateScope.AlpineLite.State): HandlerReturn{
            if (directive.key in this.directiveHandlers_){//Call handler
                let result = this.directiveHandlers_[directive.key](directive, element, state);
                if (result != HandlerReturn.Nil){
                    return result;
                }
            }
            
            let key = Handler.GetExternalHandlerKey();
            if ((key in element) && directive.key in element[key]){
                let result = (element[key][directive.key] as DirectiveHandler)(directive, element, state);
                if (result != HandlerReturn.Nil){
                    return result;
                }
            }
            
            for (let i = 0; i < this.bulkDirectiveHandlers_.length; ++i){
                let result = this.bulkDirectiveHandlers_[i](directive, element, state);
                if (result == HandlerReturn.SkipBulk){
                    break;
                }
                
                if (result != HandlerReturn.Nil){//Handled or rejected
                    return result;
                }
            }
            
            return HandlerReturn.Nil;
        }

        public static GetExternalHandlerKey(): string{
            return '__AlpineLiteHandler__';
        }

        public static GetAttributeChangeKey(): string{
            return '__AlpineLiteAttributeChange__';
        }
    }
}
