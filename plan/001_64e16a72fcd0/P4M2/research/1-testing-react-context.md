# Testing React Context with React Testing Library

## Overview

Testing React Context is best approached by wrapping components with context providers in tests, similar to how they would be used in production. The key principle is: **"The more your tests resemble the way your software is used, the more confidence they can give you."** - Kent C. Dodds

## Core Patterns

### 1. Testing Default Context Values

When testing a context consumer without a provider, you can verify default values:

```typescript
import { render, screen } from '@testing-library/react'
import { NameConsumer } from './NameConsumer'

test('NameConsumer shows default value', () => {
  render(<NameConsumer />)
  expect(screen.getByText(/^My Name Is:/)).toHaveTextContent(
    'My Name Is: Unknown',
  )
})
```

### 2. Custom Render Function with Provider

Create a test utility that wraps render with context providers:

```typescript
import { render, RenderOptions } from '@testing-library/react'
import { NameContext } from './NameContext'

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  providerProps?: Partial<NameContextValue>
}

const customRender = (
  ui: React.ReactElement,
  { providerProps = {}, ...renderOptions }: CustomRenderOptions = {}
) => {
  return render(
    <NameContext.Provider value={providerProps}>
      {ui}
    </NameContext.Provider>,
    renderOptions,
  )
}

export { customRender as render }
```

Then use it in tests:

```typescript
import { render, screen } from './test-utils'

test('displays provided context value', () => {
  render(<NameConsumer />, {
    providerProps: { name: 'Luke Skywalker' }
  })
  expect(screen.getByText(/Luke Skywalker/)).toBeInTheDocument()
})
```

### 3. Testing Provider Components

Test a provider component with matching consumer as child:

```typescript
test('NameProvider supplies context value to children', () => {
  const { getByText } = render(
    <NameProvider first="Leia" last="Organa">
      <NameConsumer />
    </NameProvider>
  )
  expect(getByText(/Leia Organa/)).toBeInTheDocument()
})
```

### 4. Full Provider/Consumer Trees with Wrapper

Use the `wrapper` option for complete context hierarchies:

```typescript
test('complex context tree works correctly', () => {
  const wrapper = ({ children }) => (
    <NameProvider first="Han" last="Solo">
      <AgeProvider age={35}>
        {children}
      </AgeProvider>
    </NameProvider>
  )

  render(<ComplexComponent />, { wrapper })
  // assertions...
})
```

## Best Practices

### DO:
- Test provider and consumer together as a unit
- Create custom render functions for frequently used providers
- Verify context values flow correctly through component trees
- Test different context states (loaded, error, empty)
- Use `screen` queries instead of destructuring from render

### DON'T:
- Use `jest.mock()` for context providers (extremely problematic)
- Test context in isolation without context consumers
- Test single-use custom hooks in isolation
- Make assertions about internal implementation

## Testing Multiple Context Providers

When your application uses multiple contexts, compose them in your test utilities:

```typescript
// test-utils.tsx
interface AllProvidersProps {
  children: React.ReactNode
}

const AllProviders: React.FC<AllProvidersProps> = ({ children }) => (
  <ThemeProvider defaultTheme="light">
    <UserProvider>
      <NotificationProvider>
        {children}
      </NotificationProvider>
    </UserProvider>
  </ThemeProvider>
)

export const renderWithProviders = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: AllProviders, ...options })
```

## Testing Context Updates

Test that context values update correctly:

```typescript
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { UserProvider, useUser } from './UserContext'

function UserDisplay() {
  const { user, setUser } = useUser()
  return (
    <div>
      <p>User: {user?.name || 'Not logged in'}</p>
      <button onClick={() => setUser({ name: 'John' })}>
        Login
      </button>
    </div>
  )
}

test('updates context value when user logs in', async () => {
  const user = userEvent.setup()
  render(<UserDisplay />, { wrapper: UserProvider })

  expect(screen.getByText('Not logged in')).toBeInTheDocument()

  await user.click(screen.getByRole('button', { name: /login/i }))

  await waitFor(() => {
    expect(screen.getByText('User: John')).toBeInTheDocument()
  })
})
```

## Key References

- **Testing Library React Context Docs**: https://testing-library.com/docs/example-react-context/
- **React Testing Best Practices**: https://github.com/testing-library/react-testing-library
- **Common Testing Mistakes**: https://kentcdodds.com/blog/common-mistakes-with-react-testing-library

## Summary

The fundamental principle for testing React Context is to test providers and consumers together, mimicking production usage patterns. Use custom render functions to compose providers and avoid mocking context directly.
