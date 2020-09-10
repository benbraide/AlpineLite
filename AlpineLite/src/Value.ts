export namespace AlpineLite{
    export class Value{
        private callback_: (valueContext?: any, elementContext?: HTMLElement) => any;

        constructor(callback: (valueContext?: any, elementContext?: HTMLElement) => any){
            this.callback_ = callback;
        }

        public Get(valueContext?: any, elementContext?: HTMLElement): any{
            return this.callback_(valueContext, elementContext);
        }
    }
}
