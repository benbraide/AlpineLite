import * as StateScope from './State';
import * as HandlerScope from './Handler';
export declare namespace AlpineLite {
    class CoreHandler {
        static Cloak(directive: HandlerScope.AlpineLite.ProcessorDirective, element: HTMLElement, state: StateScope.AlpineLite.State): HandlerScope.AlpineLite.HandlerReturn;
        static Data(directive: HandlerScope.AlpineLite.ProcessorDirective, element: HTMLElement, state: StateScope.AlpineLite.State): HandlerScope.AlpineLite.HandlerReturn;
        static Locals(directive: HandlerScope.AlpineLite.ProcessorDirective, element: HTMLElement, state: StateScope.AlpineLite.State): HandlerScope.AlpineLite.HandlerReturn;
        static Id(directive: HandlerScope.AlpineLite.ProcessorDirective, element: HTMLElement, state: StateScope.AlpineLite.State): HandlerScope.AlpineLite.HandlerReturn;
        static Ref(directive: HandlerScope.AlpineLite.ProcessorDirective, element: HTMLElement, state: StateScope.AlpineLite.State): HandlerScope.AlpineLite.HandlerReturn;
        static Text(directive: HandlerScope.AlpineLite.ProcessorDirective, element: HTMLElement, state: StateScope.AlpineLite.State): HandlerScope.AlpineLite.HandlerReturn;
        static Html(directive: HandlerScope.AlpineLite.ProcessorDirective, element: HTMLElement, state: StateScope.AlpineLite.State): HandlerScope.AlpineLite.HandlerReturn;
        private static Text_;
        static Input(directive: HandlerScope.AlpineLite.ProcessorDirective, element: HTMLElement, state: StateScope.AlpineLite.State): HandlerScope.AlpineLite.HandlerReturn;
        static Model(directive: HandlerScope.AlpineLite.ProcessorDirective, element: HTMLElement, state: StateScope.AlpineLite.State): HandlerScope.AlpineLite.HandlerReturn;
        private static Input_;
        static Show(directive: HandlerScope.AlpineLite.ProcessorDirective, element: HTMLElement, state: StateScope.AlpineLite.State): HandlerScope.AlpineLite.HandlerReturn;
        static If(directive: HandlerScope.AlpineLite.ProcessorDirective, element: HTMLElement, state: StateScope.AlpineLite.State): HandlerScope.AlpineLite.HandlerReturn;
    }
}
