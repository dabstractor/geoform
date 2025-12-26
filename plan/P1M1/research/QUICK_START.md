# React Testing Library + Vitest 2025: Quick Start Guide

## 1-Minute Setup

### Install Dependencies
```bash
npm install --save-dev \
  vitest@^2.0.0 \
  @vitejs/plugin-react@^4.0.0 \
  jsdom@^25.0.0 \
  @testing-library/react@^16.0.0 \
  @testing-library/jest-dom@^6.4.0 \
  @testing-library/user-event@^14.5.0 \
  @testing-library/dom@^10.0.0
```

### Create `vite.config.ts`
```typescript
/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './vitest.setup.ts',
  },
})
```

### Create `vitest.setup.ts`
```typescript
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'

afterEach(() => {
  cleanup()
})
```

### Update `tsconfig.json`
```json
{
  "compilerOptions": {
    "types": ["vitest/globals"]
  }
}
```

### Add Test Scripts to `package.json`
```json
{
  "scripts": {
    "test": "vitest",
    "test:watch": "vitest --watch",
    "test:ui": "vitest --ui"
  }
}
```

---

## Common Testing Patterns

### Component Test
```typescript
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from './Button'

describe('Button', () => {
  it('should call onClick', async () => {
    const handleClick = vi.fn()
    const { user } = setup(<Button onClick={handleClick}>Click</Button>)

    await user.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledOnce()
  })
})

async function setup(jsx: React.ReactElement) {
  return {
    user: userEvent.setup(),
    ...render(jsx),
  }
}
```

### Hook Test
```typescript
import { renderHook, act } from '@testing-library/react'
import { useCounter } from './useCounter'

describe('useCounter', () => {
  it('should increment', () => {
    const { result } = renderHook(() => useCounter())

    act(() => {
      result.current.increment()
    })

    expect(result.current.count).toBe(1)
  })
})
```

### Async Test
```typescript
it('should load data', async () => {
  render(<DataComponent />)

  // Use findBy for async content
  const data = await screen.findByText(/loaded/i)
  expect(data).toBeInTheDocument()
})
```

---

## Query Priority

Always query in this order:

1. **getByRole()** - Best for accessibility
2. **getByLabelText()** - For form inputs
3. **getByText()** - For text content
4. **getByTestId()** - Last resort only

### Async Variants
- `findByRole()`, `findByLabelText()`, `findByText()` - For async content
- `queryByRole()`, `queryByText()` - Returns null if not found

---

## Common Mistakes to Avoid

| Mistake | Solution |
|---------|----------|
| `user.click()` (no await) | Always `await user.click()` |
| `screen.getByText()` for async | Use `await screen.findByText()` |
| `const { count } = result.current` | Use `result.current.count` |
| Not cleaning up mocks | Add `afterEach(() => { vi.clearAllMocks() })` |
| Testing implementation details | Query by role/label/text instead |
| Not wrapping state updates | Use `act(() => { ... })` around updates |

---

## Mock Quick Reference

### Mock a Function
```typescript
const mockFn = vi.fn()
const mockResolve = vi.fn().mockResolvedValue(data)
```

### Spy on Hook
```typescript
const spy = vi.spyOn(useProductsModule, 'useProducts')
spy.mockReturnValue(mockValue)
```

### Mock API Call
```typescript
vi.spyOn(global, 'fetch').mockResolvedValueOnce({
  json: async () => ({ data: 'test' })
} as Response)
```

### Reset Mocks
```typescript
afterEach(() => {
  vi.clearAllMocks()    // Clear call history
  vi.restoreAllMocks()  // Restore original
})
```

---

## Key Environment Settings

| Setting | Value | Purpose |
|---------|-------|---------|
| `environment` | `jsdom` | Full DOM simulation |
| `environment` | `happy-dom` | Faster, less complete |
| `globals` | `true` | No imports needed for test functions |
| `setupFiles` | Path | Run before all tests |

---

## Async Patterns

### User Input + Wait for Response
```typescript
const { user } = setup(<LoginForm />)

await user.type(screen.getByLabelText(/email/i), 'user@test.com')
await user.click(screen.getByRole('button', { name: /login/i }))

// Wait for response
expect(await screen.findByText(/welcome/i)).toBeInTheDocument()
```

### Hook Async Operations
```typescript
it('should load data', async () => {
  const { result } = renderHook(() => useAsyncData())

  await waitFor(() => {
    expect(result.current.loading).toBe(false)
  })

  expect(result.current.data).toBeDefined()
})
```

---

## Testing Context Providers

```typescript
const wrapper = ({ children }: { children: ReactNode }) => (
  <ThemeProvider>{children}</ThemeProvider>
)

const { result } = renderHook(() => useTheme(), { wrapper })
```

---

## Debugging Tips

### Log DOM
```typescript
render(<Component />)
screen.debug()  // Prints entire DOM
screen.debug(screen.getByRole('button'))  // Specific element
```

### Log Queries
```typescript
// Find what queries match
screen.logTestingPlaygroundURL()
```

### Use Testing Playground
Visit https://testing-playground.com/ and paste your HTML to find best queries.

---

## Performance Optimization

### Use happy-dom for Speed
```typescript
// vite.config.ts
test: {
  environment: 'happy-dom'  // ~2-3x faster than jsdom
}
```

### Only jsdom When Needed
```typescript
describe('Complex CSS tests', { environment: 'jsdom' }, () => {
  // Only this suite uses jsdom
})
```

---

## For More Details

See the comprehensive guide: `/home/dustin/projects/geoform-opus/plan/P1M1/research/testing-library-setup.md`

Covers:
- Complete setup configurations
- All testing patterns
- Mock strategies
- Gotchas and solutions
- Full example project setup
