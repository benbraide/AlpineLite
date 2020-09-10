"use strict";
exports.__esModule = true;
var EvaluatorScope = require("../src/Evaluator");
var StateScope = require("../src/State");
var chai_1 = require("chai");
describe('Evaluator', function () {
    var map = {
        name: 'John Smith',
        email: 'john.smith@server.com',
        age: 45,
        weight: 108.9
    };
    it('Should evaluate', function () {
        var state = new StateScope.AlpineLite.State(null, null);
        state.PushValueContext(map);
        chai_1.expect(EvaluatorScope.AlpineLite.Evaluator.Evaluate('age + 54', state)).to.equal(99);
        chai_1.expect(EvaluatorScope.AlpineLite.Evaluator.Evaluate('name + " Junior"', state)).to.equal('John Smith Junior');
        chai_1.expect(EvaluatorScope.AlpineLite.Evaluator.Evaluate('age == 54', state))["false"];
        chai_1.expect(EvaluatorScope.AlpineLite.Evaluator.Evaluate('age == 45', state))["true"];
        var evaluator = new EvaluatorScope.AlpineLite.Evaluator(state);
        chai_1.expect(evaluator.Evaluate('`${name} (${age}), ${email}, ${weight}lb`')).to.equal('John Smith (45), john.smith@server.com, 108.9lb');
    });
    it('Should interpolate', function () {
        var state = new StateScope.AlpineLite.State(null, null);
        state.PushValueContext(map);
        chai_1.expect(EvaluatorScope.AlpineLite.Evaluator.Interpolate('{{name}} ({{age}}), {{email}}, {{weight}}lb', state)).to.equal('John Smith (45), john.smith@server.com, 108.9lb');
    });
});
