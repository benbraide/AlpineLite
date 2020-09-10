"use strict";
exports.__esModule = true;
var StackScope = require("../src/Stack");
var chai_1 = require("chai");
describe('Stack object', function () {
    it('Should be empty on creation', function () {
        var stack = new StackScope.AlpineLite.Stack();
        chai_1.expect(stack.IsEmpty())["true"];
    });
    it('Should push an item', function () {
        var stack = new StackScope.AlpineLite.Stack();
        stack.Push(9);
        chai_1.expect(stack.IsEmpty())["false"];
        chai_1.expect(stack.Peek()).to.equal(9);
    });
    it('Should pop an item', function () {
        var stack = new StackScope.AlpineLite.Stack();
        stack.Push(9);
        chai_1.expect(stack.IsEmpty())["false"];
        chai_1.expect(stack.Pop()).to.equal(9);
        chai_1.expect(stack.IsEmpty())["true"];
    });
    it('Should push and pop items', function () {
        var stack = new StackScope.AlpineLite.Stack();
        stack.Push(9);
        chai_1.expect(stack.IsEmpty())["false"];
        stack.Push(18);
        chai_1.expect(stack.IsEmpty())["false"];
        chai_1.expect(stack.Pop()).to.equal(18);
        chai_1.expect(stack.IsEmpty())["false"];
        chai_1.expect(stack.Pop()).to.equal(9);
        chai_1.expect(stack.IsEmpty())["true"];
    });
});
