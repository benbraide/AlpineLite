export namespace AlpineLite{
    export type ConditionHandler = (isHandled: boolean) => boolean;
    
    export class ConditionGroup{
        private handlers_ = new Array<ConditionHandler>();

        public AddHandler(handler: ConditionHandler): void{
            this.handlers_.push(handler);
        }

        public CallHandlers(): void{
            let isHandled = false;
            this.handlers_.forEach((handler: ConditionHandler): void => {
                isHandled = (handler(isHandled) || isHandled);
            });
        }

        public GetCount(): number{
            return this.handlers_.length;
        }
    }
}
