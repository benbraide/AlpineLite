export var AlpineLite;
(function (AlpineLite) {
    class Evaluator {
        constructor(state) {
            this.state_ = null;
            this.state_ = state;
        }
        GetState() {
            return this.state_;
        }
        Evaluate(expression) {
            return Evaluator.Evaluate(expression, this.state_);
        }
        EvaluateWith(expression, elementContext, valueContext) {
            if (!this.state_) {
                return null;
            }
            this.state_.PushElementContext(elementContext);
            if (valueContext) {
                this.state_.PushValueContext(valueContext);
            }
            let value = Evaluator.Evaluate(expression, this.state_);
            if (valueContext) {
                this.state_.PopValueContext();
            }
            this.state_.PopElementContext();
            return value;
        }
        Interpolate(expression) {
            return Evaluator.Interpolate(expression, this.state_);
        }
        InterpolateWith(expression, elementContext, valueContext) {
            if (!this.state_) {
                return '';
            }
            this.state_.PushElementContext(elementContext);
            if (valueContext) {
                this.state_.PushValueContext(valueContext);
            }
            let value = Evaluator.Interpolate(expression, this.state_);
            if (valueContext) {
                this.state_.PopValueContext();
            }
            this.state_.PopElementContext();
            return value;
        }
        static Evaluate(expression, state) {
            expression = expression.trim();
            if (expression === '') {
                return null;
            }
            let result = null;
            let elementContext = (state ? state.GetElementContext() : null);
            let valueContext = (state ? state.GetValueContext() : null);
            try {
                if (valueContext) {
                    result = (new Function(Evaluator.GetContextKey(), `
                        with (${Evaluator.GetContextKey()}){
                            return (${expression});
                        };
                    `)).bind(elementContext)(valueContext);
                }
                else {
                    result = (new Function(`
                        return (${expression});
                    `))();
                }
            }
            catch (err) {
                state.ReportError(err, `AlpineLite.Evaluator.Value(${expression})`);
            }
            return result;
        }
        static Interpolate(expression, state) {
            return expression.replace(/\{\{(.+?)\}\}/g, ($0, $1) => {
                return (Evaluator.Evaluate($1, state) || '');
            });
        }
        static GetContextKey() {
            return '__AlpineLiteContext__';
        }
    }
    AlpineLite.Evaluator = Evaluator;
})(AlpineLite || (AlpineLite = {}));
