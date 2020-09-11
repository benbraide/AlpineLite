import * as StackScope from './Stack';
export declare namespace AlpineLite {
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
    interface ChangeCallbackInfo {
        callback: ChangeCallbackType;
        element: HTMLElement;
    }
    type GetAccessStorage = Record<string, string>;
    class Changes {
        private listeners_;
        private list_;
        private getAccessStorage_;
        constructor(msDelay?: number);
        Add(item: IChange | IBubbledChange): void;
        AddGetAccess(name: string, path: string): void;
        AddListener(path: string, callback: ChangeCallbackType, element: HTMLElement): void;
        RemoveListener(path: string, callback: ChangeCallbackType): void;
        RemoveListeners(element: HTMLElement): void;
        PushGetAccessStorage(storage: GetAccessStorage): void;
        PopGetAccessStorage(): GetAccessStorage;
        RetrieveGetAccessStorage(): StackScope.AlpineLite.Stack<GetAccessStorage>;
    }
}
