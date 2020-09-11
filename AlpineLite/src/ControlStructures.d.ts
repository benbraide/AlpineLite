export declare namespace AlpineLite {
    type ConditionHandler = (isHandled: boolean) => boolean;
    class ConditionGroup {
        private handlers_;
        AddHandler(handler: ConditionHandler): void;
        CallHandlers(): void;
        GetCount(): number;
    }
}
