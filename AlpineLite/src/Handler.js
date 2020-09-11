export var AlpineLite;
(function (AlpineLite) {
    let HandlerReturn;
    (function (HandlerReturn) {
        HandlerReturn[HandlerReturn["Nil"] = 0] = "Nil";
        HandlerReturn[HandlerReturn["Handled"] = 1] = "Handled";
        HandlerReturn[HandlerReturn["Rejected"] = 2] = "Rejected";
    })(HandlerReturn = AlpineLite.HandlerReturn || (AlpineLite.HandlerReturn = {}));
    class Handler {
        constructor() {
            this.directiveHandlers_ = new Map();
            this.bulkDirectiveHandlers_ = new Array();
        }
        AddDirectiveHandler(directive, handler) {
            this.directiveHandlers_[directive] = handler;
        }
        AddBulkDirectiveHandler(handler) {
            this.bulkDirectiveHandlers_.push(handler);
        }
        HandleDirective(directive, element, state) {
            for (let i = 0; i < this.bulkDirectiveHandlers_.length; ++i) {
                let result = this.bulkDirectiveHandlers_[i](directive, element, state);
                if (result != HandlerReturn.Nil) { //Handled or rejected
                    return result;
                }
            }
            if (directive.key in this.directiveHandlers_) { //Call handler
                return this.directiveHandlers_[directive.key](directive, element, state);
            }
            return HandlerReturn.Nil;
        }
    }
    AlpineLite.Handler = Handler;
})(AlpineLite || (AlpineLite = {}));
