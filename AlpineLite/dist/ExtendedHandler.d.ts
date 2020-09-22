declare namespace AlpineLite {
    interface StateCallbackInfo {
        handlers: Array<(event?: Event) => void>;
        activeValidCheck: boolean;
        reportInitial: boolean;
        isDirty: boolean;
        isTyping: boolean;
        isValid: boolean;
    }
    interface ObserveCallbackInfo {
        increment: Array<(ratio: number, prevRatio: number) => void>;
        decrement: Array<(ratio: number, prevRatio: number) => void>;
    }
    export class ExtendedHandler {
        private static observers_;
        static State(directive: ProcessorDirective, element: HTMLElement, state: State): HandlerReturn;
        static Observe(directive: ProcessorDirective, element: HTMLElement, state: State): HandlerReturn;
        static HandleDirty(directive: ProcessorDirective, element: HTMLElement, state: State, callbackInfo: StateCallbackInfo): HandlerReturn;
        static HandleTyping(directive: ProcessorDirective, element: HTMLElement, state: State, callbackInfo: StateCallbackInfo): HandlerReturn;
        static HandleStoppedTyping(directive: ProcessorDirective, element: HTMLElement, state: State, callbackInfo: StateCallbackInfo): HandlerReturn;
        static HandleValid(directive: ProcessorDirective, element: HTMLElement, state: State, callbackInfo: StateCallbackInfo): HandlerReturn;
        static HandleInvalid(directive: ProcessorDirective, element: HTMLElement, state: State, callbackInfo: StateCallbackInfo): HandlerReturn;
        static HandleIncrement(directive: ProcessorDirective, element: HTMLElement, state: State, callbackInfo: ObserveCallbackInfo): HandlerReturn;
        static HandleDecrement(directive: ProcessorDirective, element: HTMLElement, state: State, callbackInfo: ObserveCallbackInfo): HandlerReturn;
        static ObserveWith(element: HTMLElement, callback: (ratio: number, prevRatio: number, isIncrement: boolean) => void, options: IntersectionObserverInit): void;
        static AddAll(): void;
    }
    export {};
}
