import * as StateScope from './State.js'

export namespace AlpineLite{
    export class Evaluator{
        private state_: StateScope.AlpineLite.State = null;

        constructor(state: StateScope.AlpineLite.State){
            this.state_ = state;
        }

        public GetState(): StateScope.AlpineLite.State{
            return this.state_;
        }

        public Evaluate(expression: string): any{
            return Evaluator.Evaluate(expression, this.state_);
        }

        public EvaluateWith(expression: string, elementContext: HTMLElement, valueContext?: any): any{
            if (!this.state_){
                return null;
            }

            this.state_.PushElementContext(elementContext);
            if (valueContext){
                this.state_.PushValueContext(valueContext);
            }

            let value = Evaluator.Evaluate(expression, this.state_);
            if (valueContext){
                this.state_.PopValueContext();
            }

            this.state_.PopElementContext();
            return value;
        }
        
        public Interpolate(expression: string): string{
            return Evaluator.Interpolate(expression, this.state_);
        }

        public InterpolateWith(expression: string, elementContext: HTMLElement, valueContext?: any): string{
            if (!this.state_){
                return '';
            }

            this.state_.PushElementContext(elementContext);
            if (valueContext){
                this.state_.PushValueContext(valueContext);
            }

            let value = Evaluator.Interpolate(expression, this.state_);
            if (valueContext){
                this.state_.PopValueContext();
            }

            this.state_.PopElementContext();
            return value;
        }
        
        public static Evaluate(expression: string, state: StateScope.AlpineLite.State): any{
            expression = expression.trim();
            if (expression === ''){
                return null;
            }

            let result: any = null;
            let elementContext = (state ? state.GetElementContext() : null);
            let valueContext = (state ? state.GetValueContext() : null);
            
            try{
                if (valueContext){
                    result = (new Function(Evaluator.GetContextKey(), `
                        with (${Evaluator.GetContextKey()}){
                            return (${expression});
                        };
                    `)).bind(elementContext)(valueContext);
                }
                else{
                    result = (new Function(`
                        return (${expression});
                    `))();
                }
            }
            catch (err){
                state.ReportError(err, `AlpineLite.Evaluator.Value(${expression})`);
            }

            return result;
        }

        public static Interpolate(expression: string, state: StateScope.AlpineLite.State): string{
            return expression.replace(/\{\{(.+?)\}\}/g, ($0: string, $1: string) => {
                return (Evaluator.Evaluate($1, state) || '');
            });
        }

        public static GetContextKey(): string{
            return '__AlpineLiteContext__';
        }
    }
}
