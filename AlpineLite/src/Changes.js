import * as StackScope from './Stack.js';
export var AlpineLite;
(function (AlpineLite) {
    class Changes {
        constructor(msDelay = 10) {
            this.listeners_ = {};
            this.list_ = new Array();
            this.getAccessStorage_ = new StackScope.AlpineLite.Stack();
            this.listeners_ = {};
            if (0 < msDelay) {
                setInterval(() => {
                    if (this.list_.length == 0) {
                        return;
                    }
                    let list = this.list_;
                    this.list_ = new Array();
                    for (let item of list) { //Traverse changes
                        if (item.path in this.listeners_) {
                            for (let listener of this.listeners_[item.path]) { //Traverse listeners
                                listener.callback(item);
                            }
                        }
                    }
                }, msDelay);
            }
        }
        Add(item) {
            this.list_.push(item);
        }
        AddGetAccess(name, path) {
            let storage = this.getAccessStorage_.Peek();
            if (storage) {
                storage[path] = name;
            }
        }
        AddListener(path, callback, element) {
            this.listeners_[path].push({
                callback: callback,
                element: element
            });
        }
        RemoveListener(path, callback) {
            if (!callback) {
                delete this.listeners_[path];
                return;
            }
            for (let i = 0; i < this.listeners_[path].length; ++i) {
                if (this.listeners_[path][i].callback === callback) {
                    this.listeners_[path].slice(i, 1);
                    break;
                }
            }
        }
        RemoveListeners(element) {
            for (let path in this.listeners_) {
                for (let i = this.listeners_[path].length; i > 0; --i) {
                    if (this.listeners_[path][i - 1].element === element) {
                        this.listeners_[path].slice((i - 1), 1);
                    }
                }
            }
        }
        PushGetAccessStorage(storage) {
            this.getAccessStorage_.Push(storage);
        }
        PopGetAccessStorage() {
            return this.getAccessStorage_.Pop();
        }
        RetrieveGetAccessStorage() {
            return this.getAccessStorage_;
        }
    }
    AlpineLite.Changes = Changes;
})(AlpineLite || (AlpineLite = {}));
