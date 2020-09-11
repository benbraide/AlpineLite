import * as StateScope from './State';
import * as HandlerScope from './Handler';
export declare namespace AlpineLite {
    interface ProcessorOptions {
        checkTemplate?: boolean;
        checkDocument?: boolean;
    }
    class Processor {
        private state_;
        private handler_;
        constructor(state: StateScope.AlpineLite.State, handler: HandlerScope.AlpineLite.Handler);
        All(node: Node, options?: ProcessorOptions): void;
        One(node: Node, options?: ProcessorOptions): void;
        DispatchDirective(directive: HandlerScope.AlpineLite.ProcessorDirective, element: HTMLElement): boolean;
        static Check(node: Node, options: ProcessorOptions): boolean;
        static GetHTMLElement(node: Node): HTMLElement;
        static TraverseDirectives(element: HTMLElement, callback: (directive: HandlerScope.AlpineLite.ProcessorDirective) => boolean, noMatchCallback?: (attribute: Attr) => boolean): void;
        static GetDirective(attribute: Attr): HandlerScope.AlpineLite.ProcessorDirective;
        static GetCamelCaseDirectiveName(name: string): string;
        static GetElementId(element: HTMLElement, state: StateScope.AlpineLite.State): string;
        static GetIdKey(): string;
    }
}
