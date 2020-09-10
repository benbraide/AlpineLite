import * as StackScope from '../src/Stack'
import { expect } from 'chai';

describe('Stack object', () => {
    it('Should be empty on creation', () => {
        let stack = new StackScope.AlpineLite.Stack<number>();
        expect(stack.IsEmpty()).true;
    });

    it('Should push an item', () => {
        let stack = new StackScope.AlpineLite.Stack<number>();

        stack.Push(9);
        expect(stack.IsEmpty()).false;
        
        expect(stack.Peek()).to.equal(9);
    });

    it('Should pop an item', () => {
        let stack = new StackScope.AlpineLite.Stack<number>();

        stack.Push(9);
        expect(stack.IsEmpty()).false;
        
        expect(stack.Pop()).to.equal(9);
        expect(stack.IsEmpty()).true;
    });

    it('Should push and pop items', () => {
        let stack = new StackScope.AlpineLite.Stack<number>();

        stack.Push(9);
        expect(stack.IsEmpty()).false;

        stack.Push(18);
        expect(stack.IsEmpty()).false;
        
        expect(stack.Pop()).to.equal(18);
        expect(stack.IsEmpty()).false;

        expect(stack.Pop()).to.equal(9);
        expect(stack.IsEmpty()).true;
    });
});
