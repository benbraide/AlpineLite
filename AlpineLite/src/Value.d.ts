export declare namespace AlpineLite {
    class Value {
        private callback_;
        constructor(callback: (valueContext?: any, elementContext?: HTMLElement) => any);
        Get(valueContext?: any, elementContext?: HTMLElement): any;
    }
}
