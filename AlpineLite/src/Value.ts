export namespace AlpineLite{
    export class Value{
        constructor(private callback_: (proxy?: any) => any, private silent_: boolean = true){}

        public Get(state: any, proxy?: any): any{
            return this.callback_(proxy);
        }

        public isSilent(): boolean{
            return this.silent_;
        }
    }
}
