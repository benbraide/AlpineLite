import * as StackScope from './Stack'

export namespace AlpineLite{
    export interface IChange{
        type: string;
        name: string;
        path: string;
        exists: boolean;
        value: any;
    }

    export interface IBubbledChange{
        original: IChange;
        name: string;
        path: string;
    }

    export type ChangeCallbackType = (change: IChange | IBubbledChange) => void;
    export interface ChangeCallbackInfo{
        callback: ChangeCallbackType;
        element: HTMLElement;
    }

    export type GetAccessStorage = Record<string, string>;
    
    export class Changes{
        private listeners_: Record<string, Array<ChangeCallbackInfo>> = {};
        private list_ = new Array<IChange | IBubbledChange>();
        private getAccessStorage_ = new StackScope.AlpineLite.Stack<GetAccessStorage>();

        constructor(msDelay: number = 10){
            this.listeners_ = {};
            if (0 < msDelay){
                setInterval(() => {//Periodically watch for changes
                    if (this.list_.length == 0){
                        return;
                    }
                    
                    let list = this.list_;
                    this.list_ = new Array<IChange | IBubbledChange>();
            
                    for (let item of list){//Traverse changes
                        if (item.path in this.listeners_){
                            for (let listener of this.listeners_[item.path]){//Traverse listeners
                                listener.callback(item);
                            }
                        }
                    }
                }, msDelay);
            }
        }

        public Add(item: IChange | IBubbledChange): void{
            this.list_.push(item);
        }

        public AddGetAccess(name: string, path: string): void{
            let storage = this.getAccessStorage_.Peek();
            if (storage){
                storage[path] = name;
            }
        }

        public AddListener(path: string, callback: ChangeCallbackType, element: HTMLElement): void{
            if (!(path in this.listeners_)){
                this.listeners_[path] = new Array<ChangeCallbackInfo>();
            }
            
            this.listeners_[path].push({
                callback: callback,
                element: element
            });
        }

        public RemoveListener(path: string, callback: ChangeCallbackType): void{
            if (!(path in this.listeners_)){
                return;
            }
            
           if (!callback){
                delete this.listeners_[path];
                return;
            }

            for (let i = 0; i < this.listeners_[path].length; ++i){
                if (this.listeners_[path][i].callback === callback){
                    this.listeners_[path].slice(i, 1);
                    break;
                }
            }
        }

        public RemoveListeners(element: HTMLElement): void{
            for (let path in this.listeners_){
                for (let i = this.listeners_[path].length; i > 0; --i){
                    if (this.listeners_[path][i - 1].element === element){
                        this.listeners_[path].slice((i - 1), 1);
                    }
                }
            }
        }

        public PushGetAccessStorage(storage: GetAccessStorage): void{
            this.getAccessStorage_.Push(storage);
        }

        public PopGetAccessStorage(): GetAccessStorage{
            return this.getAccessStorage_.Pop();
        }

        public RetrieveGetAccessStorage(): StackScope.AlpineLite.Stack<GetAccessStorage>{
            return this.getAccessStorage_;
        }
    }
}
