import { describe, it, expect } from 'vitest';
import type {
  FormProps,
  DeferredPromise,
  StackEntry,
  OpenFormOptions,
  InternalStackEntry,
  FormStackState,
  FormStackActions,
  FormStackAction,
  FormStackReducerState,
} from '../index';

/**
 * Type-level tests to verify type definitions compile correctly.
 * These tests verify that:
 * 1. All types are exported and importable
 * 2. Generic constraints work as expected
 * 3. Type inference functions correctly
 */
describe('Type Definitions', () => {
  describe('FormProps<T>', () => {
    it('should accept form component with typed value', () => {
      // Verify FormProps works with typed value
      const mockProps: FormProps<{ name: string }> = {
        onSubmit: (value) => {
          // TypeScript infers value as { name: string }
          expect(typeof value.name).toBe('string');
        },
        onCancel: () => {},
      };

      mockProps.onSubmit({ name: 'test' });
    });

    it('should use unknown as default generic', () => {
      // FormProps without generic uses unknown
      const defaultProps: FormProps = {
        onSubmit: (_value) => {},
        onCancel: () => {},
      };

      expect(typeof defaultProps.onSubmit).toBe('function');
    });
  });

  describe('DeferredPromise<T>', () => {
    it('should have promise, resolve, and reject', () => {
      // Verify structure compiles
      const createMockDeferred = (): DeferredPromise<string> => ({
        promise: Promise.resolve('test'),
        resolve: (_value: string | undefined) => {},
        reject: (_reason?: unknown) => {},
      });

      const deferred = createMockDeferred();
      expect(deferred.promise).toBeInstanceOf(Promise);
    });
  });

  describe('StackEntry', () => {
    it('should have id and optional label', () => {
      const entry: StackEntry = { id: 'test' };
      const entryWithLabel: StackEntry = { id: 'test', label: 'Test Label' };

      expect(entry.id).toBe('test');
      expect(entryWithLabel.label).toBe('Test Label');
    });
  });

  describe('OpenFormOptions<T>', () => {
    it('should require id and component', () => {
      const MockForm = (_props: FormProps<{ data: string }>) => null;

      const options: OpenFormOptions<{ data: string }> = {
        id: 'test-form',
        component: MockForm,
      };

      expect(options.id).toBe('test-form');
    });
  });

  describe('FormStackAction', () => {
    it('should be a discriminated union', () => {
      // Type narrowing test
      const handleAction = (action: FormStackAction) => {
        switch (action.type) {
          case 'PUSH_FORM':
            // TypeScript knows action.entry exists here
            return action.entry.id;
          case 'POP_FORM':
            // TypeScript knows no payload here
            return 'popped';
          case 'POP_TO_INDEX':
            // TypeScript knows action.index exists here
            return action.index;
        }
      };

      const result = handleAction({ type: 'POP_FORM' });
      expect(result).toBe('popped');
    });
  });

  describe('FormStackState', () => {
    it('should have readonly stack', () => {
      const state: FormStackState = {
        stack: [{ id: 'form-1' }],
      };

      expect(state.stack).toHaveLength(1);
      // Verifying readonly constraint at compile time:
      // The stack property is typed as readonly StackEntry[]
      // which prevents mutation methods like push, pop, etc.
      expect(state.stack[0]?.id).toBe('form-1');
    });
  });

  describe('FormStackActions', () => {
    it('should have openForm, closeForm, and popToIndex methods', () => {
      // Type-level test to verify interface structure
      const mockActions: FormStackActions = {
        openForm: async <T>(_options: OpenFormOptions<T>) =>
          undefined as T | undefined,
        closeForm: () => {},
        popToIndex: (_index: number) => {},
      };

      expect(typeof mockActions.openForm).toBe('function');
      expect(typeof mockActions.closeForm).toBe('function');
      expect(typeof mockActions.popToIndex).toBe('function');
    });
  });

  describe('FormStackReducerState', () => {
    it('should have mutable internal stack', () => {
      // Internal state allows mutation (unlike public FormStackState)
      const internalState: FormStackReducerState = {
        stack: [],
      };

      expect(internalState.stack).toHaveLength(0);
    });
  });

  describe('InternalStackEntry<T>', () => {
    it('should extend StackEntry with internal properties', () => {
      const MockForm = (_props: FormProps<string>) => null;

      const entry: InternalStackEntry<string> = {
        id: 'form-1',
        label: 'Test Form',
        component: MockForm,
        confirmOnCancel: true,
        deferred: {
          promise: Promise.resolve('value'),
          resolve: (_v: string | undefined) => {},
          reject: (_r?: unknown) => {},
        },
      };

      expect(entry.id).toBe('form-1');
      expect(entry.confirmOnCancel).toBe(true);
    });
  });
});
