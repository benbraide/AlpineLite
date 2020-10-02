export namespace AlpineLite{
    export interface ElementScope{
        element: HTMLElement;
        locals: Map<string, any>;
        uninitCallbacks: Array<() => void>;
    }
    
    export interface Region{
        elementScopes: Map<string, ElementScope>;
        proxies: Map<string, any>;
    }
}