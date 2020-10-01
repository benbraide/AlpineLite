declare namespace AlpineLite {
    class ExtendedHandler {
        private static observers_;
        static State(directive: ProcessorDirective, element: HTMLElement, state: State): HandlerReturn;
        static Observe(directive: ProcessorDirective, element: HTMLElement, state: State): HandlerReturn;
        static LazyLoad(directive: ProcessorDirective, element: HTMLElement, state: State): HandlerReturn;
        static ConditionalLoad(directive: ProcessorDirective, element: HTMLElement, state: State): HandlerReturn;
        static XHRLoad(directive: ProcessorDirective, element: HTMLElement, state: State): HandlerReturn;
        static XHRReplace(directive: ProcessorDirective, element: HTMLElement, state: State): HandlerReturn;
        static AttrChange(directive: ProcessorDirective, element: HTMLElement, state: State): HandlerReturn;
        static GetObserveOptions(options: Map<string, any>): IntersectionObserverInit;
        static ObserveWith(options: IntersectionObserverInit, element: HTMLElement, callback: (entry: IntersectionObserverEntry | false) => boolean): void;
        static FetchLoad(element: HTMLElement, url: string): void;
        static AddAll(): void;
    }
}
