import * as StateScope from './State';
export declare namespace AlpineLite {
    class Evaluator {
        private state_;
        constructor(state: StateScope.AlpineLite.State);
        GetState(): StateScope.AlpineLite.State;
        Evaluate(expression: string): any;
        EvaluateWith(expression: string, elementContext: HTMLElement, valueContext?: any): any;
        Interpolate(expression: string): string;
        InterpolateWith(expression: string, elementContext: HTMLElement, valueContext?: any): string;
        static Evaluate(expression: string, state: StateScope.AlpineLite.State): any;
        static Interpolate(expression: string, state: StateScope.AlpineLite.State): string;
        static GetContextKey(): string;
    }
}
