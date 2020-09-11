import * as StateScope from './State';
export declare namespace AlpineLite {
    enum HandlerReturn {
        Nil = 0,
        Handled = 1,
        Rejected = 2
    }
    interface ProcessorDirective {
        original: string;
        parts: Array<string>;
        raw: string;
        key: string;
        value: string;
    }
    type DirectiveHandler = (directive: ProcessorDirective, element: HTMLElement, state: StateScope.AlpineLite.State) => HandlerReturn;
    class Handler {
        private directiveHandlers_;
        private bulkDirectiveHandlers_;
        AddDirectiveHandler(directive: string, handler: DirectiveHandler): void;
        AddBulkDirectiveHandler(handler: DirectiveHandler): void;
        HandleDirective(directive: ProcessorDirective, element: HTMLElement, state: StateScope.AlpineLite.State): HandlerReturn;
    }
}
