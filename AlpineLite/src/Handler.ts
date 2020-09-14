import * as StateScope from './State'

export namespace AlpineLite{
    export enum HandlerReturn{
        Nil,
        Handled,
        Rejected,
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
        private directiveHandlers_ = new Map<string, DirectiveHandler>();
        private bulkDirectiveHandlers_ = new Array<DirectiveHandler>();

        public AddDirectiveHandler(directive: string, handler: DirectiveHandler): void{
            this.directiveHandlers_[directive] = handler;
        }

        public AddBulkDirectiveHandler(handler: DirectiveHandler): void{
            this.bulkDirectiveHandlers_.push(handler);
        }

        public HandleDirective(directive: ProcessorDirective, element: HTMLElement, state: StateScope.AlpineLite.State): HandlerReturn{
            for (let i = 0; i < this.bulkDirectiveHandlers_.length; ++i){
                let result = this.bulkDirectiveHandlers_[i](directive, element, state);
                if (result != HandlerReturn.Nil){//Handled or rejected
                    return result;
                }
            }

            if (directive.key in this.directiveHandlers_){//Call handler
                return this.directiveHandlers_[directive.key](directive, element, state);
            }
            
            return HandlerReturn.Nil;
        }
    }
}
