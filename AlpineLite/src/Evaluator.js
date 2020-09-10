"use strict";
exports.__esModule = true;
exports.AlpineLite = void 0;
var AlpineLite;
(function (AlpineLite) {
    var Evaluator = /** @class */ (function () {
        function Evaluator(state) {
            this.state_ = null;
            this.state_ = state;
        }
        Evaluator.prototype.GetState = function () {
            return this.state_;
        };
        Evaluator.prototype.Evaluate = function (expression) {
            return Evaluator.Evaluate(expression, this.state_);
        };
        Evaluator.prototype.EvaluateWith = function (expression, elementContext, valueContext) {
            if (!this.state_) {
                return null;
            }
            this.state_.PushElementContext(elementContext);
            if (valueContext) {
                this.state_.PushValueContext(valueContext);
            }
            var value = Evaluator.Evaluate(expression, this.state_);
            if (valueContext) {
                this.state_.PopValueContext();
            }
            this.state_.PopElementContext();
            return value;
        };
        Evaluator.prototype.Interpolate = function (expression) {
            return Evaluator.Interpolate(expression, this.state_);
        };
        Evaluator.prototype.InterpolateWith = function (expression, elementContext, valueContext) {
            if (!this.state_) {
                return '';
            }
            this.state_.PushElementContext(elementContext);
            if (valueContext) {
                this.state_.PushValueContext(valueContext);
            }
            var value = Evaluator.Interpolate(expression, this.state_);
            if (valueContext) {
                this.state_.PopValueContext();
            }
            this.state_.PopElementContext();
            return value;
        };
        Evaluator.Evaluate = function (expression, state) {
            expression = expression.trim();
            if (expression === '') {
                return null;
            }
            var result = null;
            var elementContext = (state ? state.GetElementContext() : null);
            var valueContext = (state ? state.GetValueContext() : null);
            try {
                if (valueContext) {
                    result = (new Function(Evaluator.GetContextKey(), "\n                        with (" + Evaluator.GetContextKey() + "){\n                            return (" + expression + ");\n                        };\n                    ")).bind(elementContext)(valueContext);
                }
                else {
                    result = (new Function("\n                        return (" + expression + ");\n                    "))();
                }
            }
            catch (err) {
                state.ReportError(err, "AlpineLite.Evaluator.Value(" + expression + ")");
            }
            return result;
        };
        Evaluator.Interpolate = function (expression, state) {
            return expression.replace(/\{\{(.+?)\}\}/g, function ($0, $1) {
                return (Evaluator.Evaluate($1, state) || '');
            });
        };
        Evaluator.GetContextKey = function () {
            return '__AlpineLiteContext__';
        };
        return Evaluator;
    }());
    AlpineLite.Evaluator = Evaluator;
})(AlpineLite = exports.AlpineLite || (exports.AlpineLite = {}));
