import * as ValueScope from './Value';
import * as ChangesScope from './Changes';
export declare namespace AlpineLite {
    interface Context {
        element: HTMLElement;
    }
    enum StateFlag {
        StaticBind = 0,
        DebugEnabled = 1
    }
    class State {
        private changes_;
        private elementId_;
        private rootElement_;
        private elementContext_;
        private valueContext_;
        private eventContext_;
        private localKeys_;
        private flags_;
        constructor(changes: ChangesScope.AlpineLite.Changes, rootElement: HTMLElement);
        GenerateElementId(): number;
        GetElementId(element: HTMLElement): string;
        GetChanges(): ChangesScope.AlpineLite.Changes;
        GetRootElement(): HTMLElement;
        GetAncestorElement(target: HTMLElement, index: number): HTMLElement;
        PushElementContext(element: HTMLElement): void;
        PopElementContext(): HTMLElement;
        GetElementContext(): HTMLElement;
        PushValueContext(Value: object): void;
        PopValueContext(): object;
        GetValueContext(): object;
        PushEventContext(Value: Event): void;
        PopEventContext(): Event;
        GetEventContext(): Event;
        GetLocal(name: string): ValueScope.AlpineLite.Value;
        PushFlag(key: StateFlag, Value: any): void;
        PopFlag(key: StateFlag): any;
        GetFlag(key: StateFlag): any;
        ReportError(value: any, ref?: any): void;
        ReportWarning(value: any, ref?: any, isDebug?: boolean): void;
        TrapGetAccess(callback: ChangesScope.AlpineLite.ChangeCallbackType, changeCallback?: ChangesScope.AlpineLite.ChangeCallbackType | boolean, element?: HTMLElement): void;
        static GetIdKey(): string;
    }
}
