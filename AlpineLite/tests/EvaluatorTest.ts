import * as EvaluatorScope from '../src/Evaluator'
import * as StateScope from '../src/State'

import { expect, assert } from 'chai';

describe('Evaluator', () => {
    let map = {
        name: 'John Smith',
        email: 'john.smith@server.com',
        age: 45,
        weight: 108.9
    };

    it('Should evaluate', () => {
        let state = new StateScope.AlpineLite.State(null, null);
        state.PushValueContext(map);

        expect(EvaluatorScope.AlpineLite.Evaluator.Evaluate('age + 54', state)).to.equal(99);
        expect(EvaluatorScope.AlpineLite.Evaluator.Evaluate('name + " Junior"', state)).to.equal('John Smith Junior');

        expect(EvaluatorScope.AlpineLite.Evaluator.Evaluate('age == 54', state)).false;
        expect(EvaluatorScope.AlpineLite.Evaluator.Evaluate('age == 45', state)).true;

        let evaluator = new EvaluatorScope.AlpineLite.Evaluator(state);
        expect(evaluator.Evaluate('`${name} (${age}), ${email}, ${weight}lb`')).to.equal('John Smith (45), john.smith@server.com, 108.9lb');
    });

    it('Should interpolate', () => {
        let state = new StateScope.AlpineLite.State(null, null);
        state.PushValueContext(map);

        expect(EvaluatorScope.AlpineLite.Evaluator.Interpolate('{{name}} ({{age}}), {{email}}, {{weight}}lb', state)).to.equal('John Smith (45), john.smith@server.com, 108.9lb');
    });
});
