"use strict";
exports.__esModule = true;
exports.AlpineLite = void 0;
var AlpineLite;
(function (AlpineLite) {
    var HandlerReturn;
    (function (HandlerReturn) {
        HandlerReturn[HandlerReturn["Nil"] = 0] = "Nil";
        HandlerReturn[HandlerReturn["Handled"] = 1] = "Handled";
        HandlerReturn[HandlerReturn["Rejected"] = 2] = "Rejected";
    })(HandlerReturn = AlpineLite.HandlerReturn || (AlpineLite.HandlerReturn = {}));
    var Handler = /** @class */ (function () {
        function Handler() {
            this.directiveHandlers_ = new Map();
            this.bulkDirectiveHandlers_ = new Array();
        }
        Handler.prototype.AddDirectiveHandler = function (directive, handler) {
            this.directiveHandlers_[directive] = handler;
        };
        Handler.prototype.AddBulkDirectiveHandler = function (handler) {
            this.bulkDirectiveHandlers_.push(handler);
        };
        Handler.prototype.HandleDirective = function (directive, element, state) {
            for (var i = 0; i < this.bulkDirectiveHandlers_.length; ++i) {
                var result = this.bulkDirectiveHandlers_[i](directive, element, state);
                if (result != HandlerReturn.Nil) { //Handled or rejected
                    return result;
                }
            }
            if (directive.key in this.directiveHandlers_) { //Call handler
                return this.directiveHandlers_[directive.key](directive, element, state);
            }
            return HandlerReturn.Nil;
        };
        return Handler;
    }());
    AlpineLite.Handler = Handler;
})(AlpineLite = exports.AlpineLite || (exports.AlpineLite = {}));
