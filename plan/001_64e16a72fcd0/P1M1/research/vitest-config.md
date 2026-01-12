# Vitest Configuration for React Libraries - 2025 Best Practices

**Research Date:** December 26, 2025
**Vitest Latest Version:** 4.0.16 (Released October 22, 2025)
**Node.js Requirements:** 20.19+, 22.12+

---

## Table of Contents

1. [vitest.config.ts Setup](#vitest-config-setup)
2. [Vitest Setup File](#vitest-setup-file)
3. [Dependencies](#dependencies)
4. [Common Gotchas & Pitfalls](#common-gotchas--pitfalls)
5. [Environment Comparison](#environment-comparison)
6. [Coverage Configuration](#coverage-configuration)
7. [Path Aliases & TypeScript](#path-aliases--typescript)
8. [Best Practices](#best-practices)
9. [Sources & References](#sources--references)

---

## vitest.config.ts Setup

### Minimal Configuration for React TypeScript Library

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
  },
})
```

### Production-Ready Configuration with Full Options

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    // Environment & globals
    globals: true,
    environment: 'jsdom', // or 'happy-dom' for faster performance

    // Setup and teardown
    setupFiles: ['./vitest.setup.ts'],

    // Test file patterns
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: ['node_modules', 'dist', '.idea', '.git', '.cache'],

    // Coverage configuration
    coverage: {
      provider: 'v8', // Recommended for 2025 (faster than Istanbul)
      enabled: false, // Enable via --coverage flag
      include: ['src/**/*.{js,jsx,ts,tsx}'],
      exclude: [
        'src/**/*.d.ts',
        'src/**/*.stories.tsx',
        'src/**/__tests__/**',
        'src/**/index.ts', // Often just re-exports
      ],
      lines: 80,
      functions: 80,
      branches: 80,
      statements: 80,
      reporter: ['text', 'html', 'json', 'lcov'],
      reportOnFailure: true,
      skipFull: false,
      all: true, // Show coverage for all files, even if untested
    },

    // Performance & Behavior
    testTimeout: 10000,
    hookTimeout: 10000,

    // Reporters
    reporters: ['default', 'html'],
    outputFile: {
      html: './coverage/index.html',
    },
  },
})
```

### Key Configuration Options Explained

| Option | Type | Purpose | Default |
|--------|------|---------|---------|
| `globals` | boolean | Make `describe`, `it`, `expect` global (no imports needed) | `false` |
| `environment` | string | Test environment: `'node'`, `'jsdom'`, `'happy-dom'`, `'edge-runtime'` | `'node'` |
| `setupFiles` | string[] | Run files before tests start | `[]` |
| `include` | string[] | Test file patterns to include | `['**/*.{test,spec}.?(c\|m)[jt]s?(x)']` |
| `exclude` | string[] | Glob patterns to exclude | Common defaults like `node_modules/**` |
| `css` | boolean \| 'inline' \| 'modules' | CSS handling in tests | `true` |
| `testTimeout` | number | Max test duration (ms) | `10000` |
| `hookTimeout` | number | Max setup/teardown duration (ms) | `10000` |

---

## Vitest Setup File

### TypeScript Setup File (vitest.setup.ts)

This file runs before any tests execute and is essential for configuring Testing Library matchers.

```typescript
import { expect, afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest' // Automatically extends expect

// Cleanup after each test
afterEach(() => {
  cleanup()
})

// Optional: Reset mocks after each test
afterEach(() => {
  vi.clearAllMocks()
})

// Optional: Mock window.matchMedia for responsive testing
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Optional: Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return []
  }
  unobserve() {}
} as any
```

### JavaScript Setup File (vitest.setup.js) - If Not Using TypeScript

```javascript
import { expect, afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'

afterEach(() => {
  cleanup()
})

afterEach(() => {
  vi.clearAllMocks()
})
```

### Alternative: Manual Matchers Setup (If Not Using Vitest Import)

```typescript
import { expect, afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import * as matchers from '@testing-library/jest-dom/matchers'

expect.extend(matchers)

afterEach(() => {
  cleanup()
})
```

---

## Dependencies

### Core Dependencies (Production & Dev)

#### React 18 / 19 Testing Stack

```bash
# Core testing framework
npm install -D vitest@4.0.16

# React testing utilities
npm install -D @testing-library/react@15.0.0+
npm install -D @testing-library/dom@10.4.0+
npm install -D @testing-library/jest-dom@6.9.1+
npm install -D @testing-library/user-event@14.5.1+

# DOM environment simulation
npm install -D jsdom@25.0.0+

# Coverage provider
npm install -D @vitest/coverage-v8@4.0.16

# Vite plugins
npm install -D @vitejs/plugin-react@4.3.0+
npm install -D vite-tsconfig-paths@5.0.0+

# Vite itself
npm install -D vite@7.0.0+
```

### Package.json Scripts

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage",
    "test:watch": "vitest watch"
  }
}
```

### Peer Dependency Requirements

#### For React 18 Projects

```json
{
  "peerDependencies": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0"
  },
  "devDependencies": {
    "@testing-library/react": "^14.0.0",
    "@testing-library/dom": "^9.3.0 || ^10.0.0",
    "@testing-library/jest-dom": "^6.0.0",
    "jsdom": "^24.0.0",
    "vitest": "^4.0.0"
  }
}
```

#### For React 19 Projects (2025 Recommended)

```json
{
  "peerDependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@testing-library/react": "^15.0.0+",
    "@testing-library/dom": "^10.0.0+",
    "@testing-library/jest-dom": "^6.9.1+",
    "jsdom": "^25.0.0+",
    "vitest": "^4.0.16+"
  }
}
```

### Exact Version Examples (December 2025)

| Package | Latest Version | Released | Notes |
|---------|---|---|---|
| `vitest` | 4.0.16 | Dec 2025 | Browser Mode now stable, Visual Regression Testing |
| `@testing-library/react` | 16.0.0+ | Late 2025 | Requires React 18+ |
| `@testing-library/jest-dom` | 6.9.1 | Sep 2025 | Works with Vitest via `/vitest` import |
| `@testing-library/user-event` | 14.5.1 | 2025 | User interaction simulation |
| `@testing-library/dom` | 10.4.1 | Aug 2025 | Peer dependency for RTL 16+ |
| `jsdom` | 25.0.0+ | 2025 | For simulating browser environment |
| `@vitest/coverage-v8` | 4.0.16 | Dec 2025 | V8 provider (faster than Istanbul) |

---

## Common Gotchas & Pitfalls

### 1. TypeScript Errors with Globals

**Problem:** `Cannot find name 'beforeEach'` or `toBeInTheDocument is not defined`

**Solution:** Ensure your `vitest.config.ts` has `globals: true` and your `tsconfig.json` includes:

```json
{
  "compilerOptions": {
    "types": ["vitest/globals", "@testing-library/jest-dom"]
  }
}
```

### 2. Missing Cleanup Between Tests

**Problem:** Tests fail with "BCD document not accessible" or DOM pollution

**Solution:** Always configure cleanup in your setup file:

```typescript
afterEach(() => {
  cleanup()
})
```

### 3. Jest-DOM Import Wrong

**Problem:** `toBeInTheDocument()` not available

**Wrong:**
```typescript
import * as matchers from '@testing-library/jest-dom/matchers'
```

**Correct (for Vitest):**
```typescript
import '@testing-library/jest-dom/vitest'
```

### 4. Manual Mocking Not Happening

**Problem:** Mocks don't work as expected, unlike Jest auto-mocking

**Solution:** Vitest doesn't auto-mock. Manually mock modules:

```typescript
vi.mock('axios', () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: {} }),
  },
}))
```

### 5. Testing Implementation Details Instead of User Behavior

**Problem:** Tests break on harmless refactors

**Don't:**
```typescript
expect(button.classList.contains('btn--primary')).toBe(true)
```

**Do:**
```typescript
expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument()
```

### 6. happy-dom Performance Surprises

**Problem:** happy-dom sometimes slower than jsdom in React projects

**Note:** While happy-dom is generally faster, some React-heavy test suites see performance regressions. Benchmark both before choosing.

**Recommendation:** Start with `jsdom` for maximum compatibility, switch to `happy-dom` only if performance is demonstrably better.

### 7. CSS-in-JS Returns RGB Values

**Problem:** `color: red` returns `rgb(255, 0, 0)`

**Solution:** Use computed style checks instead of exact color strings:

```typescript
const color = window.getComputedStyle(element).color
expect(color).toBe('rgb(255, 0, 0)') // Correct approach
```

### 8. Async Server Components Not Supported

**Problem:** Cannot test async React Server Components

**Solution:** Use E2E tests (Playwright, Cypress) for async components. Vitest is for sync unit tests.

### 9. Fake Timers Configuration Changed in Vitest 3+

**Problem:** Tests that used `vi.useFakeTimers()` may behave differently

**Note:** In Vitest 3+, there's no default fake timers list. Clear configuration if upgrading:

```typescript
// If your old tests have custom fakeTimers config, review it
afterEach(() => {
  vi.clearAllTimers()
})
```

### 10. React 19 Snapshot Issues

**Problem:** Snapshots fail after upgrading to React 19

**Solution:** Regenerate snapshots or pin snapshot reporter to compatible version:

```bash
vitest run --reporter=default --reporter=html -- --update
```

---

## Environment Comparison

### jsdom vs happy-dom for React Testing

| Feature | jsdom | happy-dom |
|---------|-------|-----------|
| **Speed** | Slower | ~40-60% faster in most cases |
| **DOM Compliance** | Very high | High but less complete |
| **CSS Support** | Full | Partial |
| **React Compatibility** | Excellent | Very Good |
| **Browser APIs** | Comprehensive | Limited |
| **Memory Usage** | Higher | Lower |
| **Project Maturity** | Battle-tested (10+ years) | Modern, actively maintained |
| **Best For** | Complex DOM features, full compliance | Pure React component testing |
| **Known Issues** | Slower execution | Some edge case APIs missing |

### Recommendation for React Libraries (2025)

**For most React libraries:** Use `jsdom` for maximum compatibility and fewer surprises.

```typescript
export default defineConfig({
  test: {
    environment: 'jsdom', // Recommended default
  },
})
```

**For performance-critical projects:** Benchmark both:

```bash
# Test with jsdom
npm run test:coverage

# Test with happy-dom
VITEST_ENV=happy-dom npm run test:coverage
```

---

## Coverage Configuration

### v8 Provider (Default & Recommended in 2025)

The v8 coverage provider is now the recommended default as of Vitest 3.2.0+:

```typescript
test: {
  coverage: {
    provider: 'v8', // Native V8 engine coverage
    enabled: false, // Explicitly enable with --coverage flag
    include: ['src/**/*.{js,jsx,ts,tsx}'],
    exclude: [
      'src/**/*.d.ts',
      'src/**/*.stories.{ts,tsx}',
      'src/**/index.ts',
    ],
    lines: 80,
    functions: 80,
    branches: 75,
    statements: 80,
    reporter: ['text', 'html', 'json', 'lcov'],
    all: true, // Show all files in report
    skipFull: false,
  },
}
```

### Coverage Command Line

```bash
# Run tests with coverage
npm run test:coverage

# Generate and open HTML report
npm run test:coverage
# Report at: ./coverage/index.html

# Set thresholds to fail on low coverage
vitest run --coverage --coverage.lines 80 --coverage.functions 80
```

### Known Issues with Coverage

**React 19 + v8 Coverage:** If you have inline component definitions, v8 may not track coverage correctly. Solution: Switch to `istanbul` provider temporarily or restructure components.

```typescript
// Works with v8
export const Button = () => <button>Click</button>

// May have coverage issues with v8
const Button = () => <button>Click</button>
export default Button
```

---

## Path Aliases & TypeScript

### Using vite-tsconfig-paths (Recommended)

Install the plugin:

```bash
npm install -D vite-tsconfig-paths
```

**vitest.config.ts:**

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    globals: true,
    environment: 'jsdom',
  },
})
```

**tsconfig.json:**

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@components/*": ["src/components/*"],
      "@hooks/*": ["src/hooks/*"],
      "@utils/*": ["src/utils/*"],
      "@types/*": ["src/types/*"],
      "@/*": ["src/*"]
    }
  }
}
```

### Manual Alias Configuration (If Not Using vite-tsconfig-paths)

```typescript
import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@components': path.resolve(__dirname, './src/components'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
  },
})
```

### Test Files Using Aliases

```typescript
import { Button } from '@components/Button'
import { useCustomHook } from '@hooks/useCustomHook'
import { formatDate } from '@utils/formatDate'
import type { User } from '@types/index'

describe('Button', () => {
  it('renders with default props', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button')).toBeInTheDocument()
  })
})
```

---

## Best Practices

### 1. User-Centric Testing

Test how users interact with components, not implementation details:

```typescript
// Good: Testing user perspective
it('submits form when user clicks submit button', async () => {
  render(<LoginForm onSubmit={vi.fn()} />)

  await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com')
  await userEvent.type(screen.getByLabelText(/password/i), 'password123')
  await userEvent.click(screen.getByRole('button', { name: /submit/i }))

  expect(onSubmit).toHaveBeenCalledWith({
    email: 'test@example.com',
    password: 'password123',
  })
})

// Bad: Testing implementation details
it('calls handleSubmit when submit button clicked', () => {
  const handleSubmit = vi.fn()
  render(<LoginForm handleSubmit={handleSubmit} />)

  const submitButton = container.querySelector('button.submit-btn')
  fireEvent.click(submitButton)

  expect(handleSubmit).toHaveBeenCalled()
})
```

### 2. Use Role-Based Queries

Prioritize semantic queries over test IDs:

```typescript
// Best: Semantic query
screen.getByRole('button', { name: /submit/i })

// Good: Label query
screen.getByLabelText(/email/i)

// Acceptable: Placeholder
screen.getByPlaceholderText(/search/i)

// Avoid: Test ID (unless necessary)
screen.getByTestId('submit-btn')
```

### 3. Test Isolation & Cleanup

Ensure no test pollution:

```typescript
describe('Component', () => {
  // Global setup if needed
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // Cleanup happens automatically in afterEach from setup file

  it('test 1', () => {
    render(<Component />)
    // Test logic
  })

  it('test 2', () => {
    render(<Component />)
    // DOM is clean from previous test
  })
})
```

### 4. Async Testing Patterns

```typescript
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

it('loads and displays data', async () => {
  const { rerender } = render(<Component />)

  // Wait for async data
  await waitFor(() => {
    expect(screen.getByText(/loaded/i)).toBeInTheDocument()
  })

  // Or use waitFor with specific assertion
  const element = await screen.findByRole('button', { name: /submit/i })
  expect(element).toBeInTheDocument()
})
```

### 5. Mock Management

```typescript
import { vi } from 'vitest'

describe('API calls', () => {
  afterEach(() => {
    vi.clearAllMocks() // Clear between tests
  })

  it('fetches user data', async () => {
    const mockApi = vi.fn().mockResolvedValue({
      id: 1,
      name: 'John',
    })

    // Use mock
    const result = await mockApi()

    expect(mockApi).toHaveBeenCalledTimes(1)
  })
})
```

### 6. Extract Test Helpers

```typescript
// tests/helpers.ts
import { render, RenderOptions } from '@testing-library/react'
import { ReactElement } from 'react'
import { Provider } from 'react-redux'
import { store } from '@/store'

export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) {
  return render(ui, { wrapper: Provider, ...options })
}

// In your tests
it('works with redux', () => {
  renderWithProviders(<ComponentUsingRedux />)
  // Test with Redux provider automatically
})
```

### 7. Coverage-Driven Development

```bash
# Run tests with coverage
npm run test:coverage

# Watch with coverage
vitest --coverage --watch

# Fail on low coverage
vitest run --coverage --coverage.lines 80
```

---

## File Structure Example

```
my-react-library/
├── src/
│   ├── components/
│   │   ├── Button.tsx
│   │   ├── Button.test.tsx          # Test file next to component
│   │   └── ...
│   ├── hooks/
│   │   ├── useCustomHook.ts
│   │   ├── useCustomHook.test.ts
│   │   └── ...
│   ├── utils/
│   │   ├── formatDate.ts
│   │   ├── formatDate.test.ts
│   │   └── ...
│   └── setupTests.ts                # Shared test setup
├── vitest.config.ts
├── vitest.setup.ts                  # Global setup
├── tsconfig.json
├── package.json
└── vite.config.ts (or use vitest.config.ts)
```

---

## Complete vitest.config.ts Template

```typescript
/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    // Environment
    globals: true,
    environment: 'jsdom',

    // Setup
    setupFiles: ['./vitest.setup.ts'],

    // File patterns
    include: ['src/**/*.{test,spec}.{ts,tsx,js,jsx}'],
    exclude: ['node_modules', 'dist', '.idea', '.git', '.cache'],

    // Timeouts
    testTimeout: 10000,
    hookTimeout: 10000,

    // Coverage
    coverage: {
      provider: 'v8',
      enabled: false,
      include: ['src/**/*.{ts,tsx,js,jsx}'],
      exclude: [
        'src/**/*.d.ts',
        'src/**/*.stories.{ts,tsx}',
        'src/**/index.ts',
      ],
      lines: 80,
      functions: 80,
      branches: 75,
      statements: 80,
      reporter: ['text', 'html', 'json'],
      all: true,
      skipFull: false,
    },

    // Reporting
    reporters: ['default'],
    outputFile: {
      html: './coverage/index.html',
    },

    // Performance
    pool: {
      size: 4, // Parallel test workers
    },
  },
})
```

---

## Migration from Jest to Vitest

### Key Differences

| Aspect | Jest | Vitest |
|--------|------|--------|
| **Config File** | `jest.config.js` | `vitest.config.ts` |
| **Test Runner** | Node.js based | Vite-based (faster) |
| **Auto-mocking** | Yes (modules auto-mocked) | No (must mock manually) |
| **Module Syntax** | ESM or CJS | ESM native |
| **Setup File** | `setupFilesAfterEnv` | `setupFiles` |
| **Coverage Provider** | Istanbul (default) | v8 (default in Vitest 3.2+) |
| **Watch Mode** | Via flag | Native & faster |

### Migration Checklist

1. Remove `jest.config.js`, create `vitest.config.ts`
2. Update `package.json` test script: `"test": "vitest"`
3. Create `vitest.setup.ts` with jest-dom setup
4. Update `tsconfig.json` types: add `"vitest/globals"`
5. Convert test imports: Remove Jest imports, use Vitest equivalents
6. Add manual mocks where needed (Vitest doesn't auto-mock)
7. Update coverage configuration
8. Verify all tests pass

### Example Jest to Vitest Conversion

**jest.config.js:**
```javascript
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  globals: true,
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
}
```

**vitest.config.ts (Replacement):**
```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.ts'],
  },
})
```

---

## Sources & References

### Official Documentation
- [Vitest Official Guide](https://vitest.dev/guide/)
- [Vitest Configuration Reference](https://vitest.dev/config/)
- [Vitest Coverage Guide](https://vitest.dev/guide/coverage)
- [Vitest Environment Configuration](https://vitest.dev/guide/environment)
- [Testing Library React Setup](https://testing-library.com/docs/react-testing-library/setup/)

### Key Blog Posts & Guides (2025)
- [Component Testing Guide - Vitest](https://vitest.dev/guide/browser/component-testing)
- [Vitest with React Testing Library - Incubyte Blog](https://blog.incubyte.co/blog/vitest-react-testing-library-guide/)
- [React Testing Setup: Vitest + TypeScript + React Testing Library - DEV Community](https://dev.to/kevinccbsg/react-testing-setup-vitest-typescript-react-testing-library-42c8)
- [Testing React Applications with Vitest - DEV Community](https://dev.to/samuel_kinuthia/testing-react-applications-with-vitest-a-comprehensive-guide-2jm8)
- [Vitest with React Testing Library - Robin Wieruch](https://www.robinwieruch.de/vitest-react-testing-library/)
- [React Testing Library + Vitest: Common Mistakes - Medium](https://medium.com/@samueldeveloper/react-testing-library-vitest-the-mistakes-that-haunt-developers-and-how-to-fight-them-like-ca0a0cda2ef8)

### Advanced Topics
- [Vitest Browser Mode (Stable in v4.0) - Vitest Blog](https://vitest.dev/blog/vitest-4)
- [Setting Up TypeScript Path Aliases in Vitest](https://www.timsanteford.com/posts/setting-up-vitest-to-support-typescript-path-aliases/)
- [vite-tsconfig-paths Plugin](https://github.com/aleclarson/vite-tsconfig-paths)
- [Upgrading to Vitest 3 with React 19](https://www.thecandidstartup.org/2025/03/31/vitest-3-vite-6-react-19.html)

### Package Resources
- [@testing-library/jest-dom Documentation](https://www.npmjs.com/package/@testing-library/jest-dom)
- [@testing-library/react - npm](https://www.npmjs.com/package/@testing-library/react)
- [@vitest/coverage-v8 - npm](https://www.npmjs.com/package/@vitest/coverage-v8)
- [vitest - npm](https://www.npmjs.com/package/vitest)

### GitHub Issues & Discussions
- [jsdom vs happy-dom Discussion](https://github.com/vitest-dev/vitest/discussions/1607)
- [Happy DOM Performance Discussion](https://github.com/capricorn86/happy-dom/discussions/1438)
- [React 19 + Vitest Compatibility Issues](https://github.com/vitest-dev/vitest/issues/6908)

---

## Summary of 2025 Recommendations

1. **Use Vitest 4.0.16+** - Latest stable with Browser Mode now production-ready
2. **Environment:** Start with `jsdom`, benchmark `happy-dom` if performance is critical
3. **Coverage Provider:** Use `v8` (default) for 40% faster coverage reports
4. **Node.js:** Use 22.12+ for best compatibility with Vite 7.0+
5. **React 18/19:** Both supported; for new projects, target React 19
6. **Path Aliases:** Use `vite-tsconfig-paths` for automatic resolution
7. **Testing Philosophy:** Test user behavior, not implementation details
8. **Setup:** Minimal config required; most features work out-of-the-box
9. **Globals:** Enable `globals: true` for cleaner test syntax
10. **Mocking:** Manually mock modules unlike Jest (auto-mocking disabled)

---

**Last Updated:** December 26, 2025
**Vitest Version Tested:** 4.0.16
**React Versions:** 18.x, 19.x
