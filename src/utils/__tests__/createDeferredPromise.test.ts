import { describe, it, expect } from 'vitest';
import { createDeferredPromise } from '../createDeferredPromise';

describe('createDeferredPromise', () => {
  describe('structure', () => {
    it('should return an object with promise, resolve, and reject', () => {
      // Arrange & Act
      const deferred = createDeferredPromise<string>();

      // Assert
      expect(deferred).toHaveProperty('promise');
      expect(deferred).toHaveProperty('resolve');
      expect(deferred).toHaveProperty('reject');
      expect(deferred.promise).toBeInstanceOf(Promise);
      expect(typeof deferred.resolve).toBe('function');
      expect(typeof deferred.reject).toBe('function');
    });
  });

  describe('resolve', () => {
    it('should resolve promise with value', async () => {
      // Arrange
      const deferred = createDeferredPromise<string>();

      // Act
      deferred.resolve('test value');
      const result = await deferred.promise;

      // Assert
      expect(result).toBe('test value');
    });

    it('should resolve promise with undefined (cancel case)', async () => {
      // Arrange
      const deferred = createDeferredPromise<string>();

      // Act
      deferred.resolve(undefined);
      const result = await deferred.promise;

      // Assert
      expect(result).toBeUndefined();
    });

    it('should resolve with complex object', async () => {
      // Arrange
      interface User {
        id: string;
        name: string;
      }
      const deferred = createDeferredPromise<User>();
      const user: User = { id: '1', name: 'Test User' };

      // Act
      deferred.resolve(user);
      const result = await deferred.promise;

      // Assert
      expect(result).toEqual(user);
    });

    it('should only resolve once (first value wins)', async () => {
      // Arrange
      const deferred = createDeferredPromise<string>();

      // Act
      deferred.resolve('first');
      deferred.resolve('second');
      const result = await deferred.promise;

      // Assert
      expect(result).toBe('first');
    });
  });

  describe('reject', () => {
    it('should reject promise with error', async () => {
      // Arrange
      const deferred = createDeferredPromise<string>();
      const error = new Error('test error');

      // Act
      deferred.reject(error);

      // Assert
      await expect(deferred.promise).rejects.toThrow('test error');
    });

    it('should reject promise with string reason', async () => {
      // Arrange
      const deferred = createDeferredPromise<string>();

      // Act
      deferred.reject('something went wrong');

      // Assert
      await expect(deferred.promise).rejects.toBe('something went wrong');
    });

    it('should not resolve after rejection', async () => {
      // Arrange
      const deferred = createDeferredPromise<string>();
      const error = new Error('rejected');

      // Act
      deferred.reject(error);
      deferred.resolve('value');

      // Assert
      await expect(deferred.promise).rejects.toThrow('rejected');
    });
  });

  describe('generic type safety', () => {
    it('should work with number type', async () => {
      // Arrange
      const deferred = createDeferredPromise<number>();

      // Act
      deferred.resolve(42);
      const result = await deferred.promise;

      // Assert
      expect(result).toBe(42);
    });

    it('should work with array type', async () => {
      // Arrange
      const deferred = createDeferredPromise<string[]>();

      // Act
      deferred.resolve(['a', 'b', 'c']);
      const result = await deferred.promise;

      // Assert
      expect(result).toEqual(['a', 'b', 'c']);
    });
  });
});
