declare namespace AlpineLite {
    class ExtendedHandler {
        private static observers_;
        static State(directive: ProcessorDirective, element: HTMLElement, state: State): HandlerReturn;
        static Observe(directive: ProcessorDirective, element: HTMLElement, state: State): HandlerReturn;
        static LazyLoad(directive: ProcessorDirective, element: HTMLElement, state: State): HandlerReturn;
        static ConditionalLoad(directive: ProcessorDirective, element: HTMLElement, state: State): HandlerReturn;
        static FetchLoad(element: HTMLElement, url: string): void;
        static AddAll(): void;
    }
}
