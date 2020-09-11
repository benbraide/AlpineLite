export var AlpineLite;
(function (AlpineLite) {
    class ConditionGroup {
        constructor() {
            this.handlers_ = new Array();
        }
        AddHandler(handler) {
            this.handlers_.push(handler);
        }
        CallHandlers() {
            let isHandled = false;
            this.handlers_.forEach((handler) => {
                isHandled = (handler(isHandled) || isHandled);
            });
        }
        GetCount() {
            return this.handlers_.length;
        }
    }
    AlpineLite.ConditionGroup = ConditionGroup;
})(AlpineLite || (AlpineLite = {}));
