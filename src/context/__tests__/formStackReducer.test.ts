import { describe, it, expect } from 'vitest';
import { formStackReducer, initialFormStackState } from '../formStackReducer';
import type { FormStackReducerState, FormStackAction, InternalStackEntry } from '../../types';

// Helper to create mock stack entries
const createMockEntry = (id: string, label?: string): InternalStackEntry<unknown> => ({
  id,
  label,
  component: () => null,
  confirmOnCancel: false,
  deferred: {
    promise: Promise.resolve(undefined),
    resolve: () => {},
    reject: () => {},
  },
});

describe('formStackReducer', () => {
  describe('initial state', () => {
    it('should have empty stack', () => {
      expect(initialFormStackState.stack).toEqual([]);
    });
  });

  describe('PUSH_FORM action', () => {
    it('should add entry to empty stack', () => {
      // Arrange
      const state: FormStackReducerState = { stack: [] };
      const entry = createMockEntry('form-1', 'Form 1');
      const action: FormStackAction = { type: 'PUSH_FORM', entry };

      // Act
      const result = formStackReducer(state, action);

      // Assert
      expect(result.stack).toHaveLength(1);
      expect(result.stack[0]!.id).toBe('form-1');
    });

    it('should append entry to existing stack', () => {
      // Arrange
      const existingEntry = createMockEntry('form-1');
      const state: FormStackReducerState = { stack: [existingEntry] };
      const newEntry = createMockEntry('form-2', 'Form 2');
      const action: FormStackAction = { type: 'PUSH_FORM', entry: newEntry };

      // Act
      const result = formStackReducer(state, action);

      // Assert
      expect(result.stack).toHaveLength(2);
      expect(result.stack[1]!.id).toBe('form-2');
    });

    it('should not mutate original state', () => {
      // Arrange
      const state: FormStackReducerState = { stack: [] };
      const originalStack = state.stack;
      const entry = createMockEntry('form-1');
      const action: FormStackAction = { type: 'PUSH_FORM', entry };

      // Act
      const result = formStackReducer(state, action);

      // Assert
      expect(result.stack).not.toBe(originalStack);
      expect(originalStack).toHaveLength(0);
    });
  });

  describe('POP_FORM action', () => {
    it('should remove last entry from stack', () => {
      // Arrange
      const entries = [createMockEntry('form-1'), createMockEntry('form-2')];
      const state: FormStackReducerState = { stack: entries };
      const action: FormStackAction = { type: 'POP_FORM' };

      // Act
      const result = formStackReducer(state, action);

      // Assert
      expect(result.stack).toHaveLength(1);
      expect(result.stack[0]!.id).toBe('form-1');
    });

    it('should return unchanged state when stack is empty', () => {
      // Arrange
      const state: FormStackReducerState = { stack: [] };
      const action: FormStackAction = { type: 'POP_FORM' };

      // Act
      const result = formStackReducer(state, action);

      // Assert
      expect(result).toBe(state);
    });

    it('should not mutate original state', () => {
      // Arrange
      const entries = [createMockEntry('form-1'), createMockEntry('form-2')];
      const state: FormStackReducerState = { stack: entries };
      const originalStack = state.stack;
      const action: FormStackAction = { type: 'POP_FORM' };

      // Act
      const result = formStackReducer(state, action);

      // Assert
      expect(result.stack).not.toBe(originalStack);
      expect(originalStack).toHaveLength(2);
    });
  });

  describe('POP_TO_INDEX action', () => {
    it('should keep entries up to and including index', () => {
      // Arrange
      const entries = [
        createMockEntry('form-1'),
        createMockEntry('form-2'),
        createMockEntry('form-3'),
      ];
      const state: FormStackReducerState = { stack: entries };
      const action: FormStackAction = { type: 'POP_TO_INDEX', index: 0 };

      // Act
      const result = formStackReducer(state, action);

      // Assert
      expect(result.stack).toHaveLength(1);
      expect(result.stack[0]!.id).toBe('form-1');
    });

    it('should handle middle index correctly', () => {
      // Arrange
      const entries = [
        createMockEntry('form-1'),
        createMockEntry('form-2'),
        createMockEntry('form-3'),
      ];
      const state: FormStackReducerState = { stack: entries };
      const action: FormStackAction = { type: 'POP_TO_INDEX', index: 1 };

      // Act
      const result = formStackReducer(state, action);

      // Assert
      expect(result.stack).toHaveLength(2);
      expect(result.stack[1]!.id).toBe('form-2');
    });

    it('should return unchanged state for negative index less than -1', () => {
      // Arrange
      const entries = [createMockEntry('form-1')];
      const state: FormStackReducerState = { stack: entries };
      const action: FormStackAction = { type: 'POP_TO_INDEX', index: -2 };

      // Act
      const result = formStackReducer(state, action);

      // Assert
      expect(result).toBe(state);
    });

    it('should clear the entire stack for index -1 (close all sentinel)', () => {
      // Arrange
      const entries = [createMockEntry('form-1'), createMockEntry('form-2')];
      const state: FormStackReducerState = { stack: entries };
      const action: FormStackAction = { type: 'POP_TO_INDEX', index: -1 };

      // Act
      const result = formStackReducer(state, action);

      // Assert
      expect(result.stack).toEqual([]);
    });

    it('should return unchanged state for out-of-bounds index', () => {
      // Arrange
      const entries = [createMockEntry('form-1')];
      const state: FormStackReducerState = { stack: entries };
      const action: FormStackAction = { type: 'POP_TO_INDEX', index: 5 };

      // Act
      const result = formStackReducer(state, action);

      // Assert
      expect(result).toBe(state);
    });

    it('should not mutate original state', () => {
      // Arrange
      const entries = [createMockEntry('form-1'), createMockEntry('form-2')];
      const state: FormStackReducerState = { stack: entries };
      const originalStack = state.stack;
      const action: FormStackAction = { type: 'POP_TO_INDEX', index: 0 };

      // Act
      const result = formStackReducer(state, action);

      // Assert
      expect(result.stack).not.toBe(originalStack);
      expect(originalStack).toHaveLength(2);
    });
  });
});
