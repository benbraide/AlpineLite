declare namespace AlpineLite {
    interface InputCallbackInfo {
        active: Array<(event: Event) => void>;
        stopped: Array<() => void>;
        activeValidCheck: boolean;
        reportInitial: boolean;
    }
    export class ExtendedHandler {
        static State(directive: ProcessorDirective, element: HTMLElement, state: State): HandlerReturn;
        static HandleDirty(directive: ProcessorDirective, element: HTMLElement, state: State, callbackInfo: InputCallbackInfo): HandlerReturn;
        static HandleTyping(directive: ProcessorDirective, element: HTMLElement, state: State, callbackInfo: InputCallbackInfo): HandlerReturn;
        static HandleStoppedTyping(directive: ProcessorDirective, element: HTMLElement, state: State, callbackInfo: InputCallbackInfo): HandlerReturn;
        static HandleValid(directive: ProcessorDirective, element: HTMLElement, state: State, callbackInfo: InputCallbackInfo): HandlerReturn;
        static HandleInvalid(directive: ProcessorDirective, element: HTMLElement, state: State, callbackInfo: InputCallbackInfo): HandlerReturn;
        static AddAll(): void;
    }
    export {};
}
