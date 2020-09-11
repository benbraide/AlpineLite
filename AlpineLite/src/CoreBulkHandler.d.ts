import * as StateScope from './State';
import * as HandlerScope from './Handler';
export declare namespace AlpineLite {
    interface OutsideEventHandlerInfo {
        handler: (event: Event) => void;
        element: HTMLElement;
    }
    class CoreBulkHandler {
        private static outsideEventsHandlers_;
        static AddOutsideEventHandler(eventName: string, info: OutsideEventHandlerInfo, state: StateScope.AlpineLite.State): void;
        static Attr(directive: HandlerScope.AlpineLite.ProcessorDirective, element: HTMLElement, state: StateScope.AlpineLite.State): HandlerScope.AlpineLite.HandlerReturn;
        static Event(directive: HandlerScope.AlpineLite.ProcessorDirective, element: HTMLElement, state: StateScope.AlpineLite.State): HandlerScope.AlpineLite.HandlerReturn;
        static AddAll(handler: HandlerScope.AlpineLite.Handler): void;
        static GetDisabledClassKey(): string;
    }
}
