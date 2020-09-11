export declare namespace AlpineLite {
    class Stack<T> {
        private list_;
        Push(value: T): void;
        Pop(): T;
        Peek(): T;
        IsEmpty(): boolean;
    }
}
