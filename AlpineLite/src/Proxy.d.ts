import * as StateScope from './State';
export declare namespace AlpineLite {
    interface ProxyDetails {
        target: object;
        name: string;
        parent: Proxy;
        element: HTMLElement;
        state: StateScope.AlpineLite.State;
        restricted?: boolean;
    }
    interface ProxyMap {
        [key: string]: Proxy;
    }
    class Proxy {
        private details_;
        private proxies_;
        private proxy_;
        constructor(details: ProxyDetails);
        Uninit(element: HTMLElement): void;
        private Init_;
        private Alert_;
        private BubbleAlert_;
        private AlertChildren_;
        IsRoot(): boolean;
        GetPath(append?: string): string;
        GetPathList(): string[];
        GetContextElement(): HTMLElement;
        GetProxy(): object;
        GetChildProxy(name: string): Proxy;
        static Create(details: ProxyDetails): Proxy;
        static Get(element: HTMLElement, name: string, always: boolean, state: StateScope.AlpineLite.State): any;
        static Set(element: HTMLElement, name: string, value: any, always: boolean, state: StateScope.AlpineLite.State): boolean;
        static Delete(element: HTMLElement, name: string, state: StateScope.AlpineLite.State): boolean;
        static GetNonProxy(target: any): any;
        static ResolveValue(value: any, element: HTMLElement): any;
        static GetProxyKey(): string;
    }
}
