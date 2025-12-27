# Testing URL/Router Integration

## Overview

Testing React Router components requires simulating routing context. Vitest and React Testing Library support multiple approaches: using `createRoutesStub` (React Router's official approach), `MemoryRouter` wrapper, or mocking router hooks.

## Key Approaches

### 1. Using createRoutesStub (Official React Router v7 Approach)

`createRoutesStub` is the official way to test router-dependent components:

```typescript
import { createRoutesStub } from 'react-router'
import { render, screen } from '@testing-library/react'

function NavigationComponent() {
  const navigate = useNavigate()
  return (
    <button onClick={() => navigate('/dashboard')}>
      Go to Dashboard
    </button>
  )
}

test('navigate to dashboard', async () => {
  const user = userEvent.setup()

  const RemoteRoutes = createRoutesStub([
    {
      path: '/',
      Component: NavigationComponent
    },
    {
      path: '/dashboard',
      Component: () => <div>Dashboard</div>
    }
  ])

  render(<RemoteRoutes />)

  const button = screen.getByRole('button')
  expect(button).toBeInTheDocument()
})
```

### 2. Using MemoryRouter Wrapper

Wrap components with `MemoryRouter` and `BrowserRouter` for testing:

```typescript
import { MemoryRouter, BrowserRouter, Routes, Route } from 'react-router-dom'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

function HomePage() {
  return <div>Home Page</div>
}

function AboutPage() {
  return <div>About Page</div>
}

function Navigation() {
  return (
    <nav>
      <Link to="/">Home</Link>
      <Link to="/about">About</Link>
    </nav>
  )
}

// Test utility with routing
export function renderWithRouter(
  component: React.ReactElement,
  { initialRoute = '/' } = {}
) {
  window.history.pushState({}, 'Test page', initialRoute)

  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  )
}

// Or with MemoryRouter
export function renderWithMemoryRouter(
  component: React.ReactElement,
  { initialRoute = '/' } = {}
) {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      {component}
    </MemoryRouter>
  )
}

test('navigate between routes', async () => {
  const user = userEvent.setup()

  render(
    <MemoryRouter initialEntries={['/']}>
      <Navigation />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
      </Routes>
    </MemoryRouter>
  )

  expect(screen.getByText('Home Page')).toBeInTheDocument()

  const aboutLink = screen.getByRole('link', { name: /about/i })
  await user.click(aboutLink)

  expect(screen.getByText('About Page')).toBeInTheDocument()
})
```

### 3. Setup Test Utils with Router

Create a test utilities file for consistent router setup:

```typescript
// test-utils.tsx
import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { MemoryRouter, MemoryRouterProps } from 'react-router-dom'

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialRoute?: string
  routerProps?: Partial<MemoryRouterProps>
}

function AllTheProviders({
  children,
  initialRoute = '/',
  routerProps = {}
}: {
  children: React.ReactNode
  initialRoute?: string
  routerProps?: Partial<MemoryRouterProps>
}) {
  return (
    <MemoryRouter initialEntries={[initialRoute]} {...routerProps}>
      {children}
    </MemoryRouter>
  )
}

export function renderWithRouter(
  ui: ReactElement,
  { initialRoute = '/', routerProps = {}, ...renderOptions }: CustomRenderOptions = {}
) {
  return render(ui, {
    wrapper: ({ children }) => (
      <AllTheProviders initialRoute={initialRoute} routerProps={routerProps}>
        {children}
      </AllTheProviders>
    ),
    ...renderOptions
  })
}

export * from '@testing-library/react'
export { renderWithRouter as render }
```

Then use it in tests:

```typescript
import { render, screen } from './test-utils'

test('renders at specific route', () => {
  render(<MyRouteComponent />, { initialRoute: '/dashboard' })
  expect(screen.getByText('Dashboard')).toBeInTheDocument()
})
```

### 4. Testing useNavigate Hook

```typescript
import { useNavigate } from 'react-router-dom'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

function LoginForm() {
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // Simulate login
    navigate('/dashboard', { state: { from: '/login' } })
  }

  return (
    <form onSubmit={handleSubmit}>
      <button type="submit">Login</button>
    </form>
  )
}

test('navigates to dashboard after login', async () => {
  const user = userEvent.setup()

  render(
    <MemoryRouter initialEntries={['/login']}>
      <Routes>
        <Route path="/login" element={<LoginForm />} />
        <Route path="/dashboard" element={<div>Dashboard</div>} />
      </Routes>
    </MemoryRouter>
  )

  await user.click(screen.getByRole('button', { name: /login/i }))

  await waitFor(() => {
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
  })
})
```

### 5. Testing Route Parameters and Search Params

```typescript
import { useParams, useSearchParams } from 'react-router-dom'

function UserProfile() {
  const { userId } = useParams<{ userId: string }>()
  const [searchParams] = useSearchParams()
  const tab = searchParams.get('tab') || 'overview'

  return (
    <div>
      <h1>User {userId}</h1>
      <p>Tab: {tab}</p>
    </div>
  )
}

test('displays user id from route param', () => {
  render(
    <MemoryRouter initialEntries={['/users/123']}>
      <Routes>
        <Route path="/users/:userId" element={<UserProfile />} />
      </Routes>
    </MemoryRouter>
  )

  expect(screen.getByText('User 123')).toBeInTheDocument()
})

test('reads search params', () => {
  render(
    <MemoryRouter initialEntries={['/users/456?tab=activity']}>
      <Routes>
        <Route path="/users/:userId" element={<UserProfile />} />
      </Routes>
    </MemoryRouter>
  )

  expect(screen.getByText('Tab: activity')).toBeInTheDocument()
})
```

### 6. Mocking Router Hooks

When you need to isolate a component from routing:

```typescript
import { vi } from 'vitest'
import { useNavigate, useParams } from 'react-router-dom'

vi.mock('react-router-dom', async () => ({
  ...await vi.importActual('react-router-dom'),
  useNavigate: vi.fn(),
  useParams: vi.fn()
}))

test('component calls navigate', () => {
  const mockNavigate = vi.fn()
  vi.mocked(useNavigate).mockReturnValue(mockNavigate)

  render(<MyComponent />)

  // Trigger navigation
  userEvent.click(screen.getByRole('button'))

  expect(mockNavigate).toHaveBeenCalledWith('/new-route')
})

test('component uses route params', () => {
  vi.mocked(useParams).mockReturnValue({ id: '123' })

  render(<MyComponent />)

  expect(screen.getByText('123')).toBeInTheDocument()
})
```

### 7. Testing Nested Routes

```typescript
function AppLayout() {
  return (
    <div>
      <header>Header</header>
      <Outlet />
      <footer>Footer</footer>
    </div>
  )
}

function Dashboard() {
  return <div>Dashboard Content</div>
}

test('nested routes render correctly', () => {
  render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
        </Route>
      </Routes>
    </MemoryRouter>
  )

  expect(screen.getByText('Header')).toBeInTheDocument()
  expect(screen.getByText('Dashboard Content')).toBeInTheDocument()
  expect(screen.getByText('Footer')).toBeInTheDocument()
})
```

## Configuration for Vitest

### Vitest Config with Router Support

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    css: true
  }
})
```

### Setup File

```typescript
// vitest.setup.ts
import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

// Cleanup after each test
afterEach(() => {
  cleanup()
})

// Mock window.matchMedia
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
```

## Best Practices

### DO:
- Use official `createRoutesStub` for new React Router code
- Use `MemoryRouter` for full route testing
- Create test utilities to avoid repetition
- Test route parameters and search params
- Test navigation from user interactions
- Use proper semantic HTML (data-testid for complex routes)

### DON'T:
- Mock `react-router` unless you're testing isolated component logic
- Forget to set `initialEntries` in `MemoryRouter`
- Use `BrowserRouter` in tests (causes issues with test isolation)
- Test router implementation (test your components)
- Mix routing approaches in same test file

## Common Issues and Solutions

### Issue: "useNavigate must be used within <BrowserRouter>"

```typescript
// Wrong
render(<ComponentThatUses Navigate />)

// Correct
render(
  <MemoryRouter>
    <ComponentThatUsesNavigate />
  </MemoryRouter>
)
```

### Issue: useOutletContext Type Errors

```typescript
// Mock it properly
vi.mock('react-router-dom', async () => ({
  ...await vi.importActual('react-router-dom'),
  useOutletContext: vi.fn(() => ({ /* context shape */ }))
}))
```

### Issue: Route Not Matching

```typescript
// Debug route matching
test('route matches', () => {
  const { container } = render(
    <MemoryRouter initialEntries={['/exact-path']}>
      <Routes>
        {/* Check path matches exactly */}
        <Route path="/exact-path" element={<Component />} />
      </Routes>
    </MemoryRouter>
  )
  // Log to verify route rendered
  console.log(container.innerHTML)
})
```

## Key References

- **React Router Testing**: https://reactrouter.com/start/framework/testing
- **createRoutesStub Example**: https://akoskm.com/react-router-vitest-example/
- **Vitest + React Router Guide**: https://patelvivek.dev/blog/testing-react-router-vitest
- **Testing Router with RTL**: https://javascript.plainenglish.io/testing-react-router-with-react-testing-library-8e24f7bdca18

## Summary

Use `createRoutesStub` for React Router v7+ or `MemoryRouter` for full integration testing. Create test utilities to wrap components consistently with routing context. Test route parameters, search params, and navigation. Avoid mocking router hooks unless testing isolated component logic.
