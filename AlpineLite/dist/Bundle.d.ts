declare let AlpineLiteJSProxy: ProxyConstructor;
declare namespace AlpineLite {
    export class Stack<T> {
        private list_;
        Push(value: T): void;
        Pop(): T;
        Peek(): T;
        IsEmpty(): boolean;
    }
    export class Value {
        private callback_;
        constructor(callback: (valueContext?: any, elementContext?: HTMLElement) => any);
        Get(valueContext?: any, elementContext?: HTMLElement): any;
    }
    interface IChange {
        type: string;
        name: string;
        path: string;
        exists: boolean;
        value: any;
    }
    interface IBubbledChange {
        original: IChange;
        name: string;
        path: string;
    }
    type ChangeCallbackType = (change: IChange | IBubbledChange) => void;
    interface GetAccessStorageInfo {
        name: string;
        ref: Changes;
    }
    type GetAccessStorage = Record<string, GetAccessStorageInfo>;
    export class Changes {
        private listeners_;
        private list_;
        private getAccessStorage_;
        private isScheduled_;
        private Schedule_;
        Add(item: IChange | IBubbledChange): void;
        AddGetAccess(name: string, path: string): void;
        AddListener(path: string, callback: ChangeCallbackType, element?: HTMLElement, key?: string): void;
        RemoveListener(path: string, callback: ChangeCallbackType): void;
        RemoveListeners(target: HTMLElement | string): void;
        PushGetAccessStorage(storage: GetAccessStorage): void;
        PopGetAccessStorage(): GetAccessStorage;
        RetrieveGetAccessStorage(): Stack<GetAccessStorage>;
    }
    export enum StateFlag {
        StaticBind = 0,
        DebugEnabled = 1
    }
    interface ExternalCallbacks {
        componentFinder?: (id: string) => any;
        isEqual?: (first: any, second: any) => boolean;
        deepCopy?: (target: any) => any;
    }
    export class State {
        private changes_;
        private rootElement_;
        private externalCallbacks_;
        private elementId_;
        private elementContext_;
        private valueContext_;
        private eventContext_;
        private localKeys_;
        private flags_;
        constructor(changes_: Changes, rootElement_: HTMLElement, externalCallbacks_: ExternalCallbacks);
        FindComponent(id: string): any;
        IsEqual(first: any, second: any): boolean;
        DeepCopy(target: any): any;
        GenerateElementId(): number;
        GetElementId(element: HTMLElement): string;
        GetChanges(): Changes;
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
        GetLocal(name: string): Value;
        PushFlag(key: StateFlag, Value: any): void;
        PopFlag(key: StateFlag): any;
        GetFlag(key: StateFlag): any;
        ReportError(value: any, ref?: any): void;
        ReportWarning(value: any, ref?: any, isDebug?: boolean): void;
        TrapGetAccess(callback: ChangeCallbackType, changeCallback?: ChangeCallbackType | boolean, element?: HTMLElement, key?: string): void;
        static GetIdKey(): string;
    }
    interface ProxyDetails {
        target: object;
        name: string;
        parent: Proxy;
        element: HTMLElement;
        state: State;
        restricted?: boolean;
    }
    export class ProxyNoResult {
    }
    export class ProxyStopPropagation {
        value: any;
        constructor(value: any);
    }
    export type ProxySpecialKeyHandler = (proxy: Proxy, result?: any) => {};
    export enum ProxyRequireType {
        Nil = 0,
        Required = 1,
        MustBeAbsent = 2
    }
    export class Proxy {
        private details_;
        private proxies_;
        private proxy_;
        private static specialKeys_;
        constructor(details: ProxyDetails);
        Uninit(element: HTMLElement): void;
        private Init_;
        private Alert_;
        private BubbleAlert_;
        private AlertChildren_;
        IsRoot(): boolean;
        GetDetails(): ProxyDetails;
        GetPath(append?: string): string;
        GetPathList(): string[];
        GetContextElement(): HTMLElement;
        GetProxy(): object;
        GetChildProxy(name: string): Proxy;
        static Create(details: ProxyDetails): Proxy;
        static Get(element: HTMLElement, name: string, always: boolean, state: State): any;
        static Set(element: HTMLElement, name: string, value: any, always: boolean, state: State): boolean;
        static Delete(element: HTMLElement, name: string, state: State): boolean;
        static GetNonProxy(target: any): any;
        static GetBaseValue(target: any): any;
        static ResolveValue(value: any): any;
        static GetProxyKey(): string;
        static AddSpecialKey(key: string, handler: ProxySpecialKeyHandler): void;
        static HandleSpecialKey(name: string, proxy: Proxy): any;
        static AddCoreSpecialKeys(): void;
        static GetExternalSpecialKey(): string;
    }
    export class Evaluator {
        private state_;
        constructor(state: State);
        GetState(): State;
        Evaluate(expression: string): any;
        EvaluateWith(expression: string, elementContext: HTMLElement, valueContext?: any): any;
        Interpolate(expression: string): string;
        InterpolateWith(expression: string, elementContext: HTMLElement, valueContext?: any): string;
        static Evaluate(expression: string, state: State, elementContext?: HTMLElement): any;
        static Interpolate(expression: string, state: State, elementContext?: HTMLElement): string;
        static GetContextKey(): string;
    }
    export enum HandlerReturn {
        Nil = 0,
        Handled = 1,
        Rejected = 2,
        SkipBulk = 3
    }
    export interface ProcessorDirective {
        original: string;
        parts: Array<string>;
        raw: string;
        key: string;
        value: string;
    }
    type DirectiveHandler = (directive: ProcessorDirective, element: HTMLElement, state: State) => HandlerReturn;
    export class Handler {
        private static directiveHandlers_;
        private static bulkDirectiveHandlers_;
        static AddDirectiveHandler(directive: string, handler: DirectiveHandler): void;
        static GetDirectiveHandler(directive: string): DirectiveHandler;
        static AddBulkDirectiveHandler(handler: DirectiveHandler): void;
        static AddBulkDirectiveHandlerInFront(handler: DirectiveHandler): void;
        static HandleDirective(directive: ProcessorDirective, element: HTMLElement, state: State): HandlerReturn;
        static GetExternalHandlerKey(): string;
    }
    interface ProcessorOptions {
        checkTemplate?: boolean;
        checkDocument?: boolean;
    }
    export class Processor {
        private state_;
        constructor(state: State);
        All(element: HTMLElement, options?: ProcessorOptions): void;
        One(element: HTMLElement, options?: ProcessorOptions): void;
        DispatchDirective(directive: ProcessorDirective, element: HTMLElement): boolean;
        static Check(element: HTMLElement, options: ProcessorOptions): boolean;
        static GetHTMLElement(node: Node): HTMLElement;
        static TraverseDirectives(element: HTMLElement, callback: (directive: ProcessorDirective) => boolean, noMatchCallback?: (attribute: Attr) => boolean): void;
        static GetDirective(attribute: Attr): ProcessorDirective;
        static GetCamelCaseDirectiveName(name: string): string;
        static GetElementId(element: HTMLElement, state: State): string;
        static GetIdKey(): string;
    }
    export class PlaceholderElement extends HTMLElement {
        static Register(): void;
    }
    type ConditionHandler = (isHandled: boolean) => boolean;
    export class ConditionGroup {
        private handlers_;
        AddHandler(handler: ConditionHandler): void;
        CallHandlers(): void;
        GetCount(): number;
    }
    interface OutsideEventHandlerInfo {
        handler: (event: Event) => void;
        element: HTMLElement;
    }
    export class CoreBulkHandler {
        private static outsideEventsHandlers_;
        static AddOutsideEventHandler(eventName: string, info: OutsideEventHandlerInfo, state: State): void;
        static RemoveOutsideEventHandlers(element: HTMLElement, checkTemplate?: boolean): void;
        static Attr(directive: ProcessorDirective, element: HTMLElement, state: State): HandlerReturn;
        static Style(directive: ProcessorDirective, element: HTMLElement, state: State): HandlerReturn;
        static Event(directive: ProcessorDirective, element: HTMLElement, state: State): HandlerReturn;
        static AddAll(): void;
        static GetDisabledClassKey(): string;
        static GetEventExpansionKey(): string;
    }
    export class CoreHandler {
        static Cloak(directive: ProcessorDirective, element: HTMLElement, state: State): HandlerReturn;
        static Data(directive: ProcessorDirective, element: HTMLElement, state: State): HandlerReturn;
        static Init(directive: ProcessorDirective, element: HTMLElement, state: State): HandlerReturn;
        static Uninit(directive: ProcessorDirective, element: HTMLElement, state: State): HandlerReturn;
        static Bind(directive: ProcessorDirective, element: HTMLElement, state: State): HandlerReturn;
        static Locals(directive: ProcessorDirective, element: HTMLElement, state: State): HandlerReturn;
        static Id(directive: ProcessorDirective, element: HTMLElement, state: State): HandlerReturn;
        static Ref(directive: ProcessorDirective, element: HTMLElement, state: State): HandlerReturn;
        static Class(directive: ProcessorDirective, element: HTMLElement, state: State): HandlerReturn;
        static Text(directive: ProcessorDirective, element: HTMLElement, state: State): HandlerReturn;
        static Html(directive: ProcessorDirective, element: HTMLElement, state: State): HandlerReturn;
        private static Text_;
        static Input(directive: ProcessorDirective, element: HTMLElement, state: State): HandlerReturn;
        static Model(directive: ProcessorDirective, element: HTMLElement, state: State): HandlerReturn;
        private static Input_;
        static Show(directive: ProcessorDirective, element: HTMLElement, state: State): HandlerReturn;
        static If(directive: ProcessorDirective, element: HTMLElement, state: State): HandlerReturn;
        static AddAll(): void;
        static GetUninitKey(): string;
    }
    export class Bootstrap {
        private dataRegions_;
        private externalCallbacks_;
        constructor(externalCallbacks: ExternalCallbacks);
        Attach(anchors?: Array<string>): void;
    }
    export {};
}
