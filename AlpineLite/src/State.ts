import * as StackScope from './Stack.js'
import * as ValueScope from './Value.js'
import * as ChangesScope from './Changes.js'

export namespace AlpineLite{
    export interface Context{
        element: HTMLElement;
    }

    export enum StateFlag{
        StaticBind,
        DebugEnabled,
    }
    
    export class State{
        private changes_: ChangesScope.AlpineLite.Changes = null;
        private elementId_: number = 0;
        private rootElement_: HTMLElement;
        private elementContext_ = new StackScope.AlpineLite.Stack<HTMLElement>();
        private valueContext_ = new StackScope.AlpineLite.Stack<object>();
        private eventContext_ = new StackScope.AlpineLite.Stack<Event>();
        private localKeys_ = new Array<Record<string, ValueScope.AlpineLite.Value>>();
        private flags_ = new Map<StateFlag, StackScope.AlpineLite.Stack<any>>();
        
        constructor(changes: ChangesScope.AlpineLite.Changes, rootElement: HTMLElement){
            this.changes_ = changes;
            this.rootElement_ = rootElement;
            this.localKeys_['$locals'] = new ValueScope.AlpineLite.Value((valueContext: any) => {
                return null;
            });
        }

        public GenerateElementId(): number{
            return ++this.elementId_;
        }

        public GetElementId(element: HTMLElement): string{
            let id = element.getAttribute(State.GetIdKey());
            if (!id){//Not initialized
                id = this.GenerateElementId().toString();
                element.setAttribute(State.GetIdKey(), id);
            }

            return id;
        }

        public GetChanges(): ChangesScope.AlpineLite.Changes{
            return this.changes_;
        }

        public GetRootElement(): HTMLElement{
            return this.rootElement_;
        }

        public GetAncestorElement(target: HTMLElement, index: number): HTMLElement{
            if (!target || target === this.rootElement_){
                return null;
            }

            let ancestor = target;
            for (; 0 < index && ancestor && ancestor !== this.rootElement_; --index){
                ancestor = ancestor.parentElement;
            }

            return ((0 < index) ? null : ancestor);
        }

        public PushElementContext(element: HTMLElement): void{
            this.elementContext_.Push(element);
        }

        public PopElementContext(): HTMLElement{
            return this.elementContext_.Pop();
        }

        public GetElementContext(): HTMLElement{
            return this.elementContext_.Peek();
        }

        public PushValueContext(Value: object): void{
            this.valueContext_.Push(Value);
        }

        public PopValueContext(): object{
            return this.valueContext_.Pop();
        }

        public GetValueContext(): object{
            return this.valueContext_.Peek();
        }

        public PushEventContext(Value: Event): void{
            this.eventContext_.Push(Value);
        }

        public PopEventContext(): Event{
            return this.eventContext_.Pop();
        }

        public GetEventContext(): Event{
            return this.eventContext_.Peek();
        }

        public GetLocal(name: string): ValueScope.AlpineLite.Value{
            return ((name in this.localKeys_) ? this.localKeys_[name] : null);
        }

        public PushFlag(key: StateFlag, Value: any): void{
            if (!(key in this.flags_)){
                this.flags_[key] = new StackScope.AlpineLite.Stack<any>();
            }
            
            this.flags_[key].Push(Value);
        }

        public PopFlag(key: StateFlag): any{
            return ((key in this.flags_) ? this.flags_[key].Pop() : null);
        }

        public GetFlag(key: StateFlag): any{
            return ((key in this.flags_) ? this.flags_[key].Peek() : null);
        }

        public ReportError(value: any, ref?: any): void{
            console.error(value, ref);
        }

        public ReportWarning(value: any, ref?: any, isDebug: boolean = true): void{
            if (!isDebug || this.GetFlag(StateFlag.DebugEnabled)){
                console.warn(value, ref);
            }
        }

        public TrapGetAccess(callback: ChangesScope.AlpineLite.ChangeCallbackType, changeCallback?: ChangesScope.AlpineLite.ChangeCallbackType | boolean, element?: HTMLElement): void{
            let getAccessStorage: ChangesScope.AlpineLite.GetAccessStorage = {};
            if (changeCallback && !this.GetFlag(StateFlag.StaticBind)){//Listen for get events
                this.changes_.PushGetAccessStorage(getAccessStorage);
            }

            try{
                callback(null);
            }
            catch (err){
               this.ReportError(err, 'AlpineLine.State.TrapAccess');
            }

            if (!changeCallback || this.GetFlag(StateFlag.StaticBind)){
                return;
            }
            
            this.changes_.PopGetAccessStorage();//Stop listening for get events
            let paths = Object.keys(getAccessStorage);

            if (paths.length == 0){
                return;
            }

            let onChange = (change: ChangesScope.AlpineLite.IChange | ChangesScope.AlpineLite.IBubbledChange): void => {
                let newGetAccessStorage: ChangesScope.AlpineLite.GetAccessStorage = {};
                try{
                    this.changes_.PushGetAccessStorage(newGetAccessStorage);
                    if (changeCallback === true){
                        callback(change);
                    }
                    else{
                        changeCallback(change);
                    }
                }
                catch (err){
                   this.ReportError(err, 'AlpineLine.State.TrapAccess.onChange');
                }

                this.changes_.PopGetAccessStorage();//Stop listening for get events
                Object.keys(newGetAccessStorage).forEach((path: string): void => {//Listen for changes on accessed paths
                    if (!(path in getAccessStorage)){//New path
                        getAccessStorage[path] = '';
                        this.changes_.AddListener(path, onChange, element);
                    }
                });
            };

            paths.forEach((path: string): void => {//Listen for changes on accessed paths
                this.changes_.AddListener(path, onChange, element);
            });
        }

        public static GetIdKey(): string{
            return '__AlpineLiteId__';
        }
    }
}
