# React Testing Library + Vitest 2025: Comprehensive Best Practices Guide

**Research Date:** December 26, 2025
**Status:** Complete

## Table of Contents

1. [Setup Files Configuration](#setup-files-configuration)
2. [Testing Patterns](#testing-patterns)
3. [Dependencies and Versions](#dependencies-and-versions)
4. [Mock Strategies](#mock-strategies)
5. [Common Gotchas and Pitfalls](#common-gotchas-and-pitfalls)
6. [Complete Example Setup](#complete-example-setup)

---

## Setup Files Configuration

### Vitest Configuration File

**File:** `vite.config.ts` or `vitest.config.ts`

The most important aspect of Vitest setup is that it reads your Vite configuration automatically. You can create a dedicated Vitest configuration file for test-specific settings.

```typescript
/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,              // Use global test functions (describe, it, expect)
    environment: 'jsdom',       // Browser-like DOM environment
    setupFiles: './vitest.setup.ts',
    coverage: {
      provider: 'v8',           // Coverage provider (v8 or istanbul)
      reporter: ['text', 'json', 'html']
    }
  },
})
```

**Key Configuration Options:**

- `globals: true` - Makes test functions available globally without imports (describe, it, test, expect, beforeEach, afterEach, etc.)
- `environment: 'jsdom'` - Simulates a browser environment. Alternative: `'happy-dom'` for faster performance
- `setupFiles` - Path to file(s) that run before tests
- `coverage` - Configure code coverage settings

### Vitest Setup File

**File:** `vitest.setup.ts`

This file runs before any tests execute. It's used to:
- Import and extend Jest DOM matchers
- Set up global test utilities
- Configure cleanup behavior
- Set up mocking infrastructure

```typescript
import { expect, afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'

// Cleanup after each test to prevent memory leaks
afterEach(() => {
  cleanup()
})

// Optional: Reset all mocks after each test
afterEach(() => {
  vi.clearAllMocks()
})
```

**Alternative Simpler Approach (Using Modern Imports):**

```typescript
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'

afterEach(() => {
  cleanup()
})
```

### TypeScript Configuration

**File:** `tsconfig.json` or `tsconfig.app.json`

Add Vitest types to your TypeScript configuration to enable global test functions and avoid TypeScript errors:

```json
{
  "compilerOptions": {
    "types": ["vitest/globals"],
    "lib": ["ES2020", "DOM", "DOM.Iterable"]
  },
  "include": ["src", "vitest.setup.ts"]
}
```

**What This Does:**
- Allows TypeScript to recognize `describe`, `it`, `expect`, `beforeEach`, `afterEach` without imports
- Recognizes custom matchers from `@testing-library/jest-dom`

### Package.json Scripts

```json
{
  "scripts": {
    "test": "vitest",
    "test:watch": "vitest --watch",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage"
  },
  "devDependencies": {
    "vitest": "^2.0.0",
    "@vitejs/plugin-react": "^4.0.0",
    "jsdom": "^25.0.0",
    "@testing-library/react": "^16.0.0",
    "@testing-library/jest-dom": "^6.4.0",
    "@testing-library/user-event": "^14.5.0",
    "@testing-library/dom": "^10.0.0"
  }
}
```

### Environment Variables in Tests

If your tests reference environment variables, mock them in your setup file:

```typescript
// vitest.setup.ts
import { vi } from 'vitest'

vi.stubEnv('VITE_API_URL', 'https://api.test.local')
vi.stubEnv('VITE_APP_ENV', 'test')
```

---

## Testing Patterns

### 1. Testing React Hooks with `renderHook`

**Basic Hook Testing:**

```typescript
import { renderHook, act } from '@testing-library/react'
import { useCounter } from './useCounter'
import { describe, it, expect } from 'vitest'

describe('useCounter', () => {
  it('should increment counter', () => {
    const { result } = renderHook(() => useCounter())

    // Access hook return value via result.current
    expect(result.current.count).toBe(0)

    // Wrap state updates in act()
    act(() => {
      result.current.increment()
    })

    expect(result.current.count).toBe(1)
  })
})
```

**Important Note about `result.current`:**
You cannot destructure reactive properties from `result.current` as they will lose reactivity. Always access through `result.current`:

```typescript
// ✅ Correct
expect(result.current.count).toBe(1)

// ❌ Wrong - loses reactivity
const { count } = result.current
expect(count).toBe(1)  // Will fail
```

**Hook Testing with Props:**

```typescript
interface UseCounterProps {
  initialValue: number
}

describe('useCounter with initial value', () => {
  it('should start with initial value', () => {
    const { result, rerender } = renderHook(
      ({ initialValue }) => useCounter(initialValue),
      { initialProps: { initialValue: 5 } }
    )

    expect(result.current.count).toBe(5)

    // Update props and re-render
    rerender({ initialValue: 10 })
    expect(result.current.count).toBe(10)
  })
})
```

**Hook Cleanup with `unmount`:**

```typescript
describe('useEffect cleanup', () => {
  it('should clean up on unmount', () => {
    const { unmount } = renderHook(() => useTimer())

    unmount()  // Simulates component unmount, triggers cleanup

    // Verify cleanup happened
    expect(timerCleared).toBe(true)
  })
})
```

### 2. Testing Context Providers

**Testing Hooks That Use Context:**

```typescript
import { ReactNode } from 'react'
import { renderHook } from '@testing-library/react'
import { ThemeProvider } from './ThemeContext'
import { useTheme } from './useTheme'

describe('useTheme hook', () => {
  it('should return theme from context', () => {
    // Create a wrapper component that provides the context
    const wrapper = ({ children }: { children: ReactNode }) => (
      <ThemeProvider initialTheme="light">
        {children}
      </ThemeProvider>
    )

    const { result } = renderHook(() => useTheme(), { wrapper })

    expect(result.current.theme).toBe('light')
  })
})
```

**Testing Hooks with Multiple Providers:**

```typescript
const AllProviders = ({ children }: { children: ReactNode }) => (
  <ThemeProvider>
    <AuthProvider>
      <NotificationProvider>
        {children}
      </NotificationProvider>
    </AuthProvider>
  </ThemeProvider>
)

describe('Complex hook with multiple contexts', () => {
  it('should access all context values', () => {
    const { result } = renderHook(() => useAppState(), {
      wrapper: AllProviders
    })

    expect(result.current.theme).toBeDefined()
    expect(result.current.user).toBeDefined()
    expect(result.current.notifications).toBeDefined()
  })
})
```

### 3. Testing Async Operations and Promises

**Async Hooks with `waitFor`:**

```typescript
import { waitFor } from '@testing-library/react'
import { vi } from 'vitest'

describe('useAsyncData hook', () => {
  it('should load data from API', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      json: async () => ({ data: 'test data' })
    } as Response)

    const { result } = renderHook(() => useAsyncData())

    // Data is initially undefined
    expect(result.current.data).toBeUndefined()
    expect(result.current.loading).toBe(true)

    // Wait for async operation to complete
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.data).toEqual({ data: 'test data' })
  })
})
```

**Component with Async Operations:**

```typescript
import { render, screen, waitFor } from '@testing-library/react'

describe('AsyncDataComponent', () => {
  it('should display loaded data', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      json: async () => ({ items: ['item1', 'item2'] })
    } as Response)

    render(<AsyncDataComponent />)

    // Use findBy for elements that appear after async operations
    const items = await screen.findByRole('listitem')
    expect(items).toBeInTheDocument()
  })
})
```

**Using `findBy` vs `getBy` + `waitFor`:**

```typescript
// Option 1: Use findBy (returns a Promise)
const heading = await screen.findByRole('heading', { name: /loaded/i })

// Option 2: Use getBy + waitFor
await waitFor(() => {
  expect(screen.getByRole('heading', { name: /loaded/i })).toBeInTheDocument()
})
```

### 4. User Event Testing Patterns

**Recommended Setup Pattern:**

```typescript
import userEvent from '@testing-library/user-event'
import { render, screen } from '@testing-library/react'

// Setup function pattern (recommended approach)
async function setup(jsx: React.ReactElement) {
  return {
    user: userEvent.setup(),
    ...render(jsx),
  }
}

describe('Form Component', () => {
  it('should handle user interactions', async () => {
    const { user } = await setup(<LoginForm />)

    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)

    // All user-event methods are async and must be awaited
    await user.click(emailInput)
    await user.type(emailInput, 'user@example.com')

    await user.click(passwordInput)
    await user.type(passwordInput, 'password123')

    await user.click(screen.getByRole('button', { name: /sign in/i }))

    // Wait for async form submission
    expect(await screen.findByText(/welcome/i)).toBeInTheDocument()
  })
})
```

**Correct vs Incorrect Async Patterns:**

```typescript
// ✅ CORRECT - await all user-event calls
await user.click(button)
await user.type(input, 'text')

// ❌ WRONG - will cause act() warnings
user.click(button)  // Missing await
user.type(input, 'text')

// ✅ CORRECT - use findBy for async content
const element = await screen.findByText(/async content/i)

// ❌ WRONG - getBy won't wait
const element = screen.getByText(/async content/i)  // May fail if async
```

**Common User Interactions:**

```typescript
import userEvent from '@testing-library/user-event'

describe('User interactions', () => {
  it('should handle various interactions', async () => {
    const { user } = await setup(<InteractiveComponent />)

    // Clicking
    await user.click(screen.getByRole('button'))

    // Typing
    await user.type(screen.getByRole('textbox'), 'text')

    // Clearing input
    await user.clear(screen.getByRole('textbox'))

    // Tabbing
    await user.tab()

    // Keyboard shortcuts
    await user.keyboard('{Control>}a{/Control}')  // Ctrl+A

    // Selecting options
    await user.selectOptions(screen.getByRole('combobox'), ['option1', 'option2'])
  })
})
```

---

## Dependencies and Versions

### Latest Versions (as of December 2025)

| Package | Latest Version | Notes |
|---------|---|---|
| **vitest** | ^2.0.0+ | Core test framework |
| **@vitejs/plugin-react** | ^4.0.0+ | React support for Vite |
| **jsdom** | ^25.0.0+ | Full DOM environment (more complete) |
| **happy-dom** | Latest | Faster alternative to jsdom |
| **@testing-library/react** | ^16.x | React component testing utilities |
| **@testing-library/jest-dom** | ^6.4.0+ | Custom DOM matchers (toBeInTheDocument, etc.) |
| **@testing-library/user-event** | ^14.5.0+ | User interaction simulation |
| **@testing-library/dom** | ^10.0.0+ | Required with RTL v16+ |

### Installation Command

```bash
npm install --save-dev \
  vitest@^2.0.0 \
  @vitejs/plugin-react@^4.0.0 \
  jsdom@^25.0.0 \
  @testing-library/react@^16.0.0 \
  @testing-library/jest-dom@^6.4.0 \
  @testing-library/user-event@^14.5.0 \
  @testing-library/dom@^10.0.0 \
  @vitest/ui@^2.0.0
```

### Important Version Requirements

- **React 18+** is required for @testing-library/react v13+
- **Node.js 20+** is required for Vitest 2.0+
- **Vite 6.0+** is required for Vitest 2.0+
- **@testing-library/react v16+** requires @testing-library/dom as separate package

---

## Mock Strategies

### 1. Mocking Functions and Hooks

**Using `vi.spyOn()` for Custom Hooks:**

```typescript
import { vi } from 'vitest'
import * as useProductsHook from '../hooks/useProducts'

describe('Component using useProducts', () => {
  it('should display products', () => {
    const mockProducts = [
      { id: 1, name: 'Product 1' },
      { id: 2, name: 'Product 2' }
    ]

    const useProductsSpy = vi.spyOn(useProductsHook, 'useProducts')
    useProductsSpy.mockReturnValue({
      products: mockProducts,
      loading: false,
      error: null
    })

    render(<ProductList />)

    expect(screen.getByText('Product 1')).toBeInTheDocument()

    // Cleanup
    useProductsSpy.mockRestore()
  })

  it('should handle loading state', () => {
    const useProductsSpy = vi.spyOn(useProductsHook, 'useProducts')
    useProductsSpy.mockReturnValue({
      products: [],
      loading: true,
      error: null
    })

    render(<ProductList />)
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })
})
```

**Using `vi.fn()` to Mock Functions:**

```typescript
describe('Component with callbacks', () => {
  it('should call callback when button clicked', async () => {
    const handleClick = vi.fn()
    const { user } = await setup(<Button onClick={handleClick}>Click me</Button>)

    await user.click(screen.getByRole('button'))

    expect(handleClick).toHaveBeenCalledOnce()
    expect(handleClick).toHaveBeenCalledWith(expect.any(Object))
  })
})
```

### 2. Mocking API Calls

**Using `vi.spyOn()` with `global.fetch`:**

```typescript
import { vi } from 'vitest'

describe('API calls', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should fetch user data', async () => {
    const mockUser = { id: 1, name: 'John Doe' }

    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => mockUser,
      headers: new Headers(),
      status: 200,
      statusText: 'OK',
      url: '',
      type: 'basic',
      redirected: false,
      clone: () => ({} as Response),
      blob: async () => new Blob(),
      arrayBuffer: async () => new ArrayBuffer(0),
      text: async () => '',
    } as Response)

    render(<UserProfile userId="1" />)

    const userName = await screen.findByText('John Doe')
    expect(userName).toBeInTheDocument()
    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/users/1'))
  })
})
```

**Using Mock Service Worker (MSW) - Recommended:**

```typescript
// mocks/handlers.ts
import { http, HttpResponse } from 'msw'

export const handlers = [
  http.get('/api/users/:id', ({ params }) => {
    return HttpResponse.json({ id: params.id, name: 'John Doe' })
  }),
]

// vitest.setup.ts
import { setupServer } from 'msw/node'
import { handlers } from './mocks/handlers'

const server = setupServer(...handlers)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

// In your test
describe('With MSW', () => {
  it('should fetch user', async () => {
    render(<UserProfile userId="1" />)
    expect(await screen.findByText('John Doe')).toBeInTheDocument()
  })
})
```

### 3. Mocking Modules

**Partial Module Mocking:**

```typescript
vi.mock('date-fns', async () => {
  const actual = await vi.importActual('date-fns')
  return {
    ...actual,
    format: vi.fn(() => '2025-01-01')
  }
})

describe('Date formatting', () => {
  it('should use mocked format', () => {
    const result = format(new Date(), 'yyyy-MM-dd')
    expect(result).toBe('2025-01-01')
  })
})
```

**Complete Module Mocking:**

```typescript
vi.mock('../api/client', () => ({
  default: {
    get: vi.fn(() => Promise.resolve({ data: 'mocked' })),
    post: vi.fn()
  }
}))
```

### 4. Mocking Global Objects

**Mocking localStorage:**

```typescript
describe('localStorage operations', () => {
  beforeEach(() => {
    const localStorageMock = {
      getItem: vi.fn((key: string) => null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    }
    global.localStorage = localStorageMock as any
  })

  it('should save to localStorage', () => {
    render(<LocalStorageComponent />)

    act(() => {
      localStorage.setItem('key', 'value')
    })

    expect(localStorage.setItem).toHaveBeenCalledWith('key', 'value')
  })
})
```

**Mocking window.matchMedia:**

```typescript
beforeEach(() => {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: query === '(prefers-color-scheme: dark)',
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }))
})
```

### 5. Cleanup and Reset Patterns

```typescript
import { afterEach, vi } from 'vitest'

// In your setup file or test suite
afterEach(() => {
  // Clear mock call history
  vi.clearAllMocks()

  // Restore original implementations
  vi.restoreAllMocks()

  // Reset module mocks (for vi.mock())
  vi.resetModules()

  // Reset timers
  vi.useRealTimers()
})
```

---

## Common Gotchas and Pitfalls

### 1. Missing TypeScript/Vitest Configuration

**Problem:** TypeScript doesn't recognize global test functions or custom matchers.

```
TS2304: Cannot find name 'describe'.
TS2705: Property 'toBeInTheDocument' does not exist on type 'Assertion'
```

**Solution:** Ensure your `vite.config.ts` has `globals: true` and `tsconfig.json` includes:

```json
{
  "compilerOptions": {
    "types": ["vitest/globals"]
  }
}
```

### 2. React `act()` Warning

**Problem:** Tests show warnings about updates not wrapped in `act()`:

```
Warning: An update to X inside a test was not wrapped in act(...)
```

**Causes & Solutions:**

1. **Not awaiting async user interactions:**
   ```typescript
   // ❌ Wrong
   user.click(button)  // Missing await

   // ✅ Correct
   await user.click(button)
   ```

2. **State updates after component unmounts:**
   ```typescript
   // Ensure cleanup in useEffect
   useEffect(() => {
     return () => {
       setLoading(false)  // Cleanup on unmount
     }
   }, [])
   ```

3. **Using setTimeout/setInterval without cleanup:**
   ```typescript
   useEffect(() => {
     const timer = setTimeout(() => {
       setState(value)
     }, 100)

     return () => clearTimeout(timer)  // MUST cleanup
   }, [])
   ```

**Note:** As of January 2025, the act() warning persists with latest React, RTL, and Vitest versions despite tests functioning correctly. This is a known compatibility issue. Tests will pass but warnings appear in CI/CD logs.

### 3. Destructuring `result.current`

**Problem:** Destructuring loses reactivity.

```typescript
// ❌ Wrong - loses reactivity
const { count, increment } = result.current
expect(count).toBe(0)  // Will fail after increment

// ✅ Correct
expect(result.current.count).toBe(0)
```

### 4. Not Awaiting User Events

**Problem:** Async state updates don't complete before assertions.

```typescript
// ❌ Wrong
user.type(input, 'text')
expect(input.value).toBe('text')  // May fail

// ✅ Correct
await user.type(input, 'text')
expect(input.value).toBe('text')
```

### 5. Using `fireEvent` Instead of `user-event`

**Problem:** `fireEvent` dispatches raw DOM events without simulating user behavior.

```typescript
import { fireEvent } from '@testing-library/react'

// ❌ Less realistic
fireEvent.click(button)

// ✅ More realistic - simulates focus, visibility checks, etc.
await user.click(button)
```

`user-event` performs visibility checks, focus management, and simulates actual browser behavior that `fireEvent` skips.

### 6. Slow Tests with jsdom

**Problem:** Tests are slower than expected.

**Solutions:**

1. **Consider happy-dom for simple components:**
   ```typescript
   // vite.config.ts
   export default defineConfig({
     test: {
       environment: 'happy-dom'  // Faster, but less complete
     }
   })
   ```

2. **Use jsdom for complex DOM interactions, happy-dom for unit tests:**
   ```typescript
   // Override per test
   describe.skip('Complex DOM test', { environment: 'jsdom' }, () => {
     // Uses jsdom only for this suite
   })
   ```

3. **Optimize with vmForks:**
   ```typescript
   // vite.config.ts
   export default defineConfig({
     test: {
       pool: 'forks',
       poolOptions: { forks: { singleFork: true } }
     }
   })
   ```

### 7. Testing Async Server Components (Next.js)

**Problem:** Vitest doesn't support async Server Components.

**Limitation:** As of 2025, Vitest cannot test async Server Components. Tests work for synchronous components only.

**Solution:** Use E2E tests (Playwright, Cypress) for async Server Components.

### 8. Environment Variable Mocking

**Problem:** Tests read actual environment variables or values don't reset between tests.

**Solution:**

```typescript
// vitest.setup.ts
import { vi } from 'vitest'

beforeEach(() => {
  vi.stubEnv('VITE_API_URL', 'https://test.local')
})

afterEach(() => {
  vi.unstubAllEnvs()
})

// In test
expect(import.meta.env.VITE_API_URL).toBe('https://test.local')
```

### 9. Race Conditions with Mocks

**Problem:** Mocks from one test affect other tests.

**Solution:** Always cleanup mocks:

```typescript
afterEach(() => {
  vi.clearAllMocks()
  vi.restoreAllMocks()
})
```

### 10. Using getBy for Async Content

**Problem:** `getByText` throws immediately if element doesn't exist.

```typescript
// ❌ Wrong for async content
const element = screen.getByText(/loading/i)

// ✅ Correct - waits for element
const element = await screen.findByText(/loading/i)

// ✅ Also correct - explicit wait
await waitFor(() => {
  expect(screen.getByText(/loaded/i)).toBeInTheDocument()
})
```

---

## Complete Example Setup

### Project Structure

```
project/
├── vite.config.ts
├── vitest.config.ts (optional, extends vite.config.ts)
├── vitest.setup.ts
├── tsconfig.json
├── package.json
├── src/
│   ├── components/
│   │   ├── Button.tsx
│   │   └── Button.test.tsx
│   ├── hooks/
│   │   ├── useCounter.ts
│   │   └── useCounter.test.ts
│   └── App.tsx
└── mocks/
    └── handlers.ts
```

### Full Working Example

**vite.config.ts:**

```typescript
/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './vitest.setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'vitest.setup.ts',
      ]
    }
  },
})
```

**vitest.setup.ts:**

```typescript
import { expect, afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { setupServer } from 'msw/node'
import { handlers } from './mocks/handlers'

// MSW Setup
const server = setupServer(...handlers)

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => {
  cleanup()
  server.resetHandlers()
  vi.clearAllMocks()
})
afterAll(() => server.close())
```

**mocks/handlers.ts:**

```typescript
import { http, HttpResponse } from 'msw'

export const handlers = [
  http.get('/api/users/:id', ({ params }) => {
    return HttpResponse.json({
      id: params.id,
      name: 'Test User',
      email: 'test@example.com'
    })
  }),

  http.post('/api/login', async ({ request }) => {
    const body = await request.json()
    return HttpResponse.json({
      token: 'fake-token',
      user: { id: 1, email: body.email }
    })
  }),
]
```

**Example Component (Button.tsx):**

```typescript
interface ButtonProps {
  onClick?: () => void
  disabled?: boolean
  children: React.ReactNode
}

export function Button({ onClick, disabled = false, children }: ButtonProps) {
  return (
    <button onClick={onClick} disabled={disabled}>
      {children}
    </button>
  )
}
```

**Component Test (Button.test.tsx):**

```typescript
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { Button } from './Button'

describe('Button Component', () => {
  it('should render button with text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument()
  })

  it('should call onClick when clicked', async () => {
    const handleClick = vi.fn()
    const { user } = await setup(<Button onClick={handleClick}>Click</Button>)

    await user.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledOnce()
  })

  it('should be disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })
})

// Setup helper function
async function setup(jsx: React.ReactElement) {
  return {
    user: userEvent.setup(),
    ...render(jsx),
  }
}
```

**Hook (useCounter.ts):**

```typescript
import { useState } from 'react'

export function useCounter(initialValue: number = 0) {
  const [count, setCount] = useState(initialValue)

  const increment = () => setCount(c => c + 1)
  const decrement = () => setCount(c => c - 1)
  const reset = () => setCount(initialValue)

  return { count, increment, decrement, reset }
}
```

**Hook Test (useCounter.test.ts):**

```typescript
import { renderHook, act } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { useCounter } from './useCounter'

describe('useCounter', () => {
  it('should initialize with default value', () => {
    const { result } = renderHook(() => useCounter())
    expect(result.current.count).toBe(0)
  })

  it('should initialize with custom value', () => {
    const { result } = renderHook(() => useCounter(10))
    expect(result.current.count).toBe(10)
  })

  it('should increment counter', () => {
    const { result } = renderHook(() => useCounter())

    act(() => {
      result.current.increment()
    })

    expect(result.current.count).toBe(1)
  })

  it('should decrement counter', () => {
    const { result } = renderHook(() => useCounter(5))

    act(() => {
      result.current.decrement()
    })

    expect(result.current.count).toBe(4)
  })

  it('should reset counter', () => {
    const { result } = renderHook(() => useCounter(5))

    act(() => {
      result.current.increment()
      result.current.increment()
    })

    expect(result.current.count).toBe(7)

    act(() => {
      result.current.reset()
    })

    expect(result.current.count).toBe(5)
  })
})
```

**tsconfig.json:**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "types": ["vitest/globals"],
    "resolveJsonModule": true,
    "allowJs": true,
    "strict": true,
    "esModuleInterop": true,
    "noImplicitAny": true,
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src", "vitest.setup.ts"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

**package.json (scripts section):**

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest",
    "test:watch": "vitest --watch",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage"
  }
}
```

---

## Key Testing Principles for Vitest + React Testing Library

1. **Test User Behavior, Not Implementation Details**
   - Query elements as users would (by role, label, text)
   - Avoid querying by class name or data-testid when possible
   - Test what users see and can interact with

2. **Always Await Async Operations**
   - Use `await user.*()` methods
   - Use `findBy` queries or `waitFor` for async content
   - Never mix sync and async patterns

3. **Clean Up Properly**
   - Call `cleanup()` after each test
   - Clear all mocks and timers
   - Restore module mocks between tests

4. **Use Semantic Queries**
   - `getByRole()` - most reliable (accessibility first)
   - `getByLabelText()` - for form inputs
   - `getByText()` - for other text content
   - Last resort: `getByTestId()`

5. **Mock External Dependencies**
   - Use MSW for API calls
   - Mock external libraries
   - Keep mocks realistic and maintainable

---

## Resources and Documentation

### Official Documentation
- [Vitest Guide](https://vitest.dev/guide/)
- [Vitest Mocking](https://vitest.dev/guide/mocking)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [user-event Documentation](https://testing-library.com/docs/user-event/intro/)
- [Testing Library Jest-DOM](https://github.com/testing-library/jest-dom)

### Helpful Guides
- [Testing React Components with Vitest - Incubyte](https://blog.incubyte.co/blog/vitest-react-testing-library-guide/)
- [Testing React Hooks with Vitest - Maya Shavin](https://mayashavin.com/articles/test-react-hooks-with-vitest)
- [Vitest React Testing Library Guide - Robin Wieruch](https://www.robinwieruch.de/vitest-react-testing-library/)
- [jsdom vs happy-dom Comparison](https://blog.seancoughlin.me/jsdom-vs-happy-dom-navigating-the-nuances-of-javascript-testing)
- [Common Mistakes with React Testing Library - Kent C. Dodds](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

### Related Tools
- [Mock Service Worker (MSW)](https://mswjs.io/)
- [Vitest UI](https://vitest.dev/guide/ui)
- [Testing Playground](https://testing-playground.com/)

---

## Conclusion

React Testing Library + Vitest represents the modern standard for React component testing in 2025. Key advantages:

- **Fast**: Vitest's Vite integration provides instant feedback
- **Modern**: Native ESM and TypeScript support
- **Compatible**: Jest-compatible API for easy migration
- **Best Practices**: Testing Library encourages testing user behavior
- **Flexible**: Support for hooks, context, async operations, and mocking

Following the patterns and configurations in this guide will help you write maintainable, reliable tests that catch real bugs without being brittle.
