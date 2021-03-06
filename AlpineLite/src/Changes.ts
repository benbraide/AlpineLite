import * as StackScope from './Stack'

export namespace AlpineLite{
    export interface IChange{
        type: string;
        name: string;
        path: string;
        targetName: string;
        targetPath: string;
        exists: boolean;
        value: any;
    }

    export interface IBubbledChange{
        original: IChange;
        name: string;
        path: string;
        isAncestor: boolean;
    }

    export type ChangeCallbackType = (change: IChange | IBubbledChange) => void;
    export interface ChangeCallbackInfo{
        callback: ChangeCallbackType;
        element: HTMLElement;
        key: string;
    }

    export interface GetAccessStorageInfo{
        name: string;
        ref: Changes;
    }

    export type GetAccessStorage = Record<string, GetAccessStorageInfo>;
    
    export class Changes{
        private listeners_: Record<string, Array<ChangeCallbackInfo>> = {};
        private list_ = new Array<IChange | IBubbledChange>();
        private getAccessStorage_ = new StackScope.AlpineLite.Stack<GetAccessStorage>();
        private lastGetAccessPath_ = new StackScope.AlpineLite.Stack<string>();
        private isScheduled_: boolean = false;

        private Schedule_(): void{
            if (this.isScheduled_){
                return;
            }
            
            this.isScheduled_ = true;
            setTimeout(() => {//Schedule changes
                this.isScheduled_ = false;
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
            }, 0);
        }

        public Add(item: IChange | IBubbledChange): void{
            this.list_.push(item);
            this.Schedule_();
        }

        public AddGetAccess(name: string, path: string): void{
            let storage = this.getAccessStorage_.Peek();
            if (!storage){
                return;
            }
            
            let lastGetAccessPath = this.lastGetAccessPath_.Peek();
            if (lastGetAccessPath !== null){
                if (path == `${lastGetAccessPath}.${name}`){//Deeper access
                    delete storage[lastGetAccessPath];
                }

                this.lastGetAccessPath_.Pop();
            }

            this.lastGetAccessPath_.Push(path);
            storage[path] = {
                name: name,
                ref: this
            };
        }

        public AddListener(path: string, callback: ChangeCallbackType, element?: HTMLElement, key?: string): void{
            if (!(path in this.listeners_)){
                this.listeners_[path] = new Array<ChangeCallbackInfo>();
            }
            
            this.listeners_[path].push({
                callback: callback,
                element: element,
                key: key
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

        public RemoveListeners(target: HTMLElement | string): void{
            let isKey = (typeof target === 'string');
            for (let path in this.listeners_){
                for (let i = this.listeners_[path].length; i > 0; --i){
                    if (isKey && this.listeners_[path][i - 1].key === target){
                        this.listeners_[path].slice((i - 1), 1);
                    }
                    else if (!isKey && this.listeners_[path][i - 1].element === target){
                        this.listeners_[path].slice((i - 1), 1);
                    }
                }
            }
        }

        public PushGetAccessStorage(storage: GetAccessStorage): void{
            this.getAccessStorage_.Push(storage);
            this.lastGetAccessPath_.Push('');
        }

        public PopGetAccessStorage(): GetAccessStorage{
            this.lastGetAccessPath_.Pop();
            return this.getAccessStorage_.Pop();
        }

        public RetrieveGetAccessStorage(): StackScope.AlpineLite.Stack<GetAccessStorage>{
            return this.getAccessStorage_;
        }
    }
}
