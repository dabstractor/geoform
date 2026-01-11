# Vitest vi.spyOn() Patterns for Console.Error Suppression

## Overview

This document documents the best practices for using `vi.spyOn()` to suppress `console.error` during Vitest tests, including patterns for setup/teardown, differences between mocking approaches, and common pitfalls to avoid.

## 1. beforeEach/afterEach Setup Patterns

### Current Pattern (Found in Codebase)

The project currently uses a direct assignment pattern:

```typescript
// src/components/__tests__/FormErrorBoundary.test.tsx (lines 23-31)
const originalError = console.error;

beforeEach(() => {
  console.error = vi.fn();
});

afterEach(() => {
  console.error = originalError;
});
```

### Recommended Vitest Pattern with vi.spyOn()

The Vitest-recommended approach uses `vi.spyOn()` with proper restoration:

```typescript
import { vi, beforeEach, afterEach } from 'vitest';

let errorSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  // Spy on console.error and suppress its output
  errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {
    // Do nothing - effectively suppresses the error
  });
});

afterEach(() => {
  // Restore the original console.error implementation
  errorSpy.mockRestore();
});
```

### Enhanced Pattern with Assertion Control

For cases where you want to suppress some errors but assert on others:

```typescript
import { vi, beforeEach, afterEach } from 'vitest';

let errorSpy: ReturnType<typeof vi.spyOn>;
let suppressedErrors: any[] = [];

beforeEach(() => {
  errorSpy = vi.spyOn(console, 'error');

  // Capture errors but suppress output unless they contain specific patterns
  errorSpy.mockImplementation((...args) => {
    // Only capture errors that match suppression criteria
    if (!shouldSuppressError(args)) {
      suppressedErrors.push(args);
    }
  });
});

afterEach(() => {
  errorSpy.mockRestore();
  suppressedErrors = []; // Clear captured errors
});

// Helper function to determine which errors to suppress
function shouldSuppressError(args: any[]): boolean {
  const message = args[0]?.toString() || '';
  // Suppress common React warnings in tests
  return (
    message.includes('Warning: ')) ||
    message.includes('ReactDOM.render is deprecated') ||
    message.includes('Component will receive')
  );
}
```

## 2. vi.spyOn() vs vi.fn() Comparison

### vi.fn() - Function Mocking

```typescript
// Creates a mock function
const mockError = vi.fn();
console.error = mockError;

// Check if it was called
expect(mockError).toHaveBeenCalled();
expect(mockError).toHaveBeenCalledWith('Expected error message');
```

**Pros:**
- Simple to use
- Full control over mock behavior
- Easy assertion checking

**Cons:**
- Replaces the entire function (not just spies on it)
- Loses original function reference
- Manual restoration required

### vi.spyOn() - Spying (Recommended)

```typescript
// Spies on existing function without replacing it
const errorSpy = vi.spyOn(console, 'error');
errorSpy.mockImplementation(() => {}); // Suppress output

// Can still check calls
expect(errorSpy).toHaveBeenCalled();
expect(errorSpy).toHaveBeenCalledWith('Expected error message');

// Restore original implementation
errorSpy.mockRestore();
```

**Pros:**
- Preserves original function reference
- More precise control
- Better for console methods
- Automatic cleanup with mockRestore()

**Cons:**
- Slightly more verbose
- Requires explicit restoration

### When to Use Which

| Use Case | Recommended Approach |
|----------|----------------------|
| Suppressing console.error | **vi.spyOn()** with mockImplementation |
| Mocking custom functions | **vi.fn()** |
| Need to assert call count | **Both work, vi.spyOn() is cleaner** |
| Need to modify function behavior | **vi.fn()** |
| Testing that function was called | **Both work equally well** |

**Vitest Recommendation:** For console methods, prefer `vi.spyOn()` as it's more semantically correct and preserves the original function reference.

## 3. Restoration Methods

### mockRestore()

```typescript
const errorSpy = vi.spyOn(console, 'error');
// ... test code
errorSpy.mockRestore(); // Restores original function
```

**Characteristics:**
- Restores only the specific spied function
- Must be called manually on each spy
- More granular control
- Safer when multiple spies exist

### vi.restoreAllMocks()

```typescript
vi.spyOn(console, 'error');
// ... test code
vi.restoreAllMocks(); // Restores ALL mocks
```

**Characteristics:**
- Restores all mocks globally
- Automatically called between tests (with globals: true)
- Less granular control
- Can accidentally restore unrelated mocks

### Best Practices for Restoration

1. **Manual Restoration (Recommended):**
```typescript
let errorSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  errorSpy.mockRestore();
});
```

2. **Combined with Global Setup (If Needed):**
```typescript
// vitest.setup.ts
afterAll(() => {
  // Only restore if not handled in individual tests
  vi.restoreAllMocks();
});
```

3. **Using vi.clearAllMocks() for Call Count Reset:**
```typescript
afterEach(() => {
  errorSpy.mockRestore();
  // Use if you want to reset call counts without restoring
  // vi.clearAllMocks();
});
```

## 4. Common Pitfalls and Anti-Patterns

### Anti-Pattern 1: Not Restoring Console Methods

```typescript
// ❌ BAD - Leaks mocks between tests
beforeEach(() => {
  console.error = vi.fn();
});
// Missing afterEach restoration
```

### Anti-Pattern 2: Using vi.fn() for Console Methods

```typescript
// ❌ BAD - Loses original function reference
console.error = vi.fn();
// Original console.error is lost forever
```

### Anti-Pattern 3: Conditional Restoration

```typescript
// ❌ BAD - Unpredictable test behavior
if (someCondition) {
  errorSpy.mockRestore();
}
// Tests may or may not be cleaned up
```

### Anti-Pattern 4: Nested Spy Creation

```typescript
// ❌ BAD - Creates multiple spies without proper cleanup
beforeEach(() => {
  const spy1 = vi.spyOn(console, 'error');
  const spy2 = vi.spyOn(console, 'warn');
  // No restoration tracked
});
```

### Anti-Pattern 5: Overly Broad Suppression

```typescript
// ❌ BAD - Suppresses ALL errors, including test failures
vi.spyOn(console, 'error').mockImplementation(() => {});
// Might hide legitimate test errors
```

### Best Practice Pattern

```typescript
// ✅ GOOD - Proper setup and teardown
describe('ComponentUnderTest', () => {
  let errorSpy: ReturnType<typeof vi.spyOn>;
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // Only suppress specific error types
    errorSpy = vi.spyOn(console, 'error')
      .mockImplementation((...args) => {
        const message = args[0]?.toString() || '';
        if (shouldSuppressError(message)) {
          return; // Suppress
        }
        // Call original for non-suppressed errors
        console.error(...args);
      });

    warnSpy = vi.spyOn(console, 'warn')
      .mockImplementation((...args) => {
        const message = args[0]?.toString() || '';
        if (shouldSuppressWarning(message)) {
          return; // Suppress
        }
        console.warn(...args);
      });
  });

  afterEach(() => {
    errorSpy.mockRestore();
    warnSpy.mockRestore();
  });

  it('should work without console noise', () => {
    // Test code here
  });
});
```

## 5. Vitest-Specific Gotchas

### Difference from Jest

1. **Automatic Restoration:**
   - Vitest: `vi.restoreAllMocks()` is called automatically between tests when `globals: true`
   - Jest: Requires manual restoration or `afterEach(() => jest.clearAllMocks())`

2. **Mock Implementation:**
   ```typescript
   // Vitest
   vi.spyOn(console, 'error').mockImplementation(() => {});

   // Jest
   jest.spyOn(console, 'error').mockImplementation(() => {});
   ```

3. **TypeScript Support:**
   - Vitest has better TypeScript inference for spy types
   - `vi.spyOn()` returns properly typed mock instances

### Vitest Configuration Impact

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    globals: true, // Affects automatic mock restoration
    environment: 'jsdom', // Affects console behavior
  },
});
```

### Console Method Differences in jsdom

When using `environment: 'jsdom'`, console methods behave differently:

```typescript
// In jsdom environment
console.error('test'); // Still outputs to browser console

// In node environment
console.error('test'); // Outputs to process.stderr
```

### Async Test Considerations

```typescript
// ❌ BAD - Async tests need special handling
it('async test', async () => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  await someAsyncOperation();
  // Mock might be restored before async operation completes
});

// ✅ GOOD - Use async/await properly
it('async test', async () => {
  const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  try {
    await someAsyncOperation();
  } finally {
    errorSpy.mockRestore();
  }
});
```

## 6. Official Vitest Documentation Links

### Key Documentation Sections

- [**Mocking Guide**](https://vitest.dev/guide/mocking) - Official mocking documentation
  - [Spy on Object Methods](https://vitest.dev/guide/mocking#spy-on-an-object-returned-from-a-function)
  - [Mock Implementations](https://vitest.dev/guide/mocking#mock-an-exported-function)
  - [Global Variables](https://vitest.dev/guide/mocking#mock-a-global-variable)

- [**API Reference**](https://vitest.dev/api/) - Complete API documentation
  - [vi.spyOn()](https://vitest.dev/api/vi#visspyon)
  - [vi.fn()](https://vitest.dev/api/vi#vifn)
  - [vi.restoreAllMocks()](https://vitest.dev/api/vi#virestoreallmocks)

### Official Examples

```typescript
// From Vitest documentation
vi.spyOn(Math, 'random').mockReturnValue(0.5);

// Spy on console methods
const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
// ... test code
errorSpy.mockRestore();
```

## 8. Complete Example Implementation

```typescript
// src/__tests__/utils/consoleSuppression.test.tsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from '@testing-library/react';

// Error suppression utilities
export const createConsoleSuppression = () => {
  let errorSpy: ReturnType<typeof vi.spyOn>;
  let warnSpy: ReturnType<typeof vi.spyOn>;
  let infoSpy: ReturnType<typeof vi.spyOn>;
  let suppressedErrors: any[] = [];
  let suppressedWarnings: any[] = [];

  const setup = () => {
    errorSpy = vi.spyOn(console, 'error')
      .mockImplementation((...args) => {
        const message = args[0]?.toString() || '';
        if (shouldSuppressError(message)) {
          suppressedErrors.push(args);
          return;
        }
        console.error(...args);
      });

    warnSpy = vi.spyOn(console, 'warn')
      .mockImplementation((...args) => {
        const message = args[0]?.toString() || '';
        if (shouldSuppressWarning(message)) {
          suppressedWarnings.push(args);
          return;
        }
        console.warn(...args);
      });

    infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
  };

  const cleanup = () => {
    errorSpy?.mockRestore();
    warnSpy?.mockRestore();
    infoSpy?.mockRestore();
    suppressedErrors = [];
    suppressedWarnings = [];
  };

  const getSuppressedErrors = () => suppressedErrors;
  const getSuppressedWarnings = () => suppressedWarnings;

  return { setup, cleanup, getSuppressedErrors, getSuppressedWarnings };
};

// Suppression criteria
const shouldSuppressError = (message: string): boolean => {
  return (
    message.includes('Warning: ')) ||
    message.includes('ReactDOM.render is deprecated') ||
    message.includes('Warning: ReactDOM.hydrate is deprecated') ||
    message.includes('Uncaught Error: A component is changing an uncontrolled input') ||
    message.includes('Warning: Failed prop type')
  );
};

const shouldSuppressWarning = (message: string): boolean => {
  return (
    message.includes('Warning: ')) ||
    message.includes('ReactDOM.render is deprecated')
  );
};

describe('Component with console suppression', () => {
  const { setup, cleanup, getSuppressedErrors, getSuppressedWarnings } = createConsoleSuppression();

  beforeEach(() => {
    setup();
  });

  afterEach(() => {
    cleanup();
  });

  it('should suppress expected warnings', () => {
    render(<ComponentThatCausesWarnings />);

    const suppressed = getSuppressedErrors();
    expect(suppressed.length).toBeGreaterThan(0);

    // Verify suppressed errors are the expected ones
    const suppressedMessages = suppressed.map(args => args[0]);
    expect(suppressedMessages).toContain(expect.stringContaining('Warning: '));
  });

  it('should not suppress unexpected errors', () => {
    render(<ComponentThatThrows />);

    // Check that our function was called for unexpected errors
    expect(console.error).toHaveBeenCalled();
  });
});
```

## 7. Performance Considerations

### Memory Usage

- Each `vi.spyOn()` creates a new mock instance
- Clean up spies to prevent memory leaks
- Use `vi.restoreAllMocks()` periodically in long test suites

### Call Stack Depth

- Deeply nested spies can impact performance
- Consider global suppression for entire test suites when appropriate

### Benchmarking

```typescript
// Performance test for console suppression
describe('Console suppression performance', () => {
  it('should be performant with many errors', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const start = performance.now();
    for (let i = 0; i < 1000; i++) {
      console.error('Test error', i);
    }
    const end = performance.now();

    errorSpy.mockRestore();

    expect(end - start).toBeLessThan(10); // Should complete quickly
  });
});
```

## 8. Migration from Current Pattern

### Current to Recommended Migration

```typescript
// From (current pattern):
const originalError = console.error;

beforeEach(() => {
  console.error = vi.fn();
});

afterEach(() => {
  console.error = originalError;
});

// To (recommended pattern):
let errorSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  errorSpy.mockRestore();
});
```

### Batch Migration Script

```typescript
// migrate-console-suppression.js
import fs from 'fs';
import path from 'path';

const migrationPattern = (content) => {
  return content.replace(
    /const originalError = console\.error;\s*\n\s*beforeEach\(\s*\(\)\s*=>\s*{\s*console\.error = vi\.fn\(\);\s*}\);\s*\n\s*afterEach\(\s*\(\)\s*=>\s*{\s*console\.error = originalError;\s*}\);/g,
    `let errorSpy: ReturnType<typeof vi.spyOn>;\n\n  beforeEach(() => {\n    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});\n  });\n\n  afterEach(() => {\n    errorSpy.mockRestore();\n  });`
  );
};

// Apply to all test files
// ...
```

## 9. Summary

- **Use `vi.spyOn()`** for console methods - it's semantically correct and preserves original references
- **Always restore spies** in `afterEach` or `afterAll` hooks
- **Be selective** about which errors to suppress - don't hide legitimate test failures
- **Prefer manual restoration** (`mockRestore()`) over global restoration for better control
- **Consider TypeScript support** - Vitest provides better type inference than Jest

This approach provides a robust, maintainable way to handle console.error suppression in Vitest tests while maintaining test reliability and preventing false positives.

## Additional Resources

- [Vitest GitHub Repository](https://github.com/vitest-dev/vitest) - Source code and issue tracking
- [Vitest Discord Community](https://chat.vitest.dev/) - Community support
- [Vitest Browser Mode Documentation](https://vitest.dev/guide/browser) - Browser-specific testing considerations