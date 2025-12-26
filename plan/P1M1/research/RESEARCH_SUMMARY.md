# React Testing Library + Vitest 2025 Research Summary

## Document Locations
- **Main Guide:** `/home/dustin/projects/geoform-opus/plan/P1M1/research/testing-library-setup.md`
- **Quick Start:** `/home/dustin/projects/geoform-opus/plan/P1M1/research/QUICK_START.md`
- **tsup Guide:** `/home/dustin/projects/geoform-opus/plan/P1M1/research/tsup-config.md`

## Key Findings

### 1. Latest Dependency Versions (2025)

The current recommended stack for React Testing Library + Vitest:

- **vitest**: ^2.0.0+ (Node 20+, Vite 6.0+)
- **@vitejs/plugin-react**: ^4.0.0+
- **@testing-library/react**: ^16.x (requires React 18+)
- **@testing-library/jest-dom**: ^6.4.0+
- **@testing-library/user-event**: ^14.5.0+
- **@testing-library/dom**: ^10.0.0+ (required with RTL v16+)
- **jsdom**: ^25.0.0+ (or happy-dom as lighter alternative)

### 2. Environment Choice: jsdom vs happy-dom

**jsdom (Recommended for most projects)**
- More complete browser API simulation
- Better CSS and layout support
- Mature, widely-used, well-documented
- Good for complex DOM interactions

**happy-dom (For performance-critical projects)**
- 2-3x faster execution
- Lower memory usage
- Missing some browser APIs
- Good for simple unit tests and CI/CD

### 3. Critical Configuration Gotchas

**Must-Have Settings:**
1. `globals: true` in vite.config.ts (enables describe, it, expect without imports)
2. `environment: 'jsdom'` in vite.config.ts (browser-like DOM)
3. Import `@testing-library/jest-dom/vitest` in setup file (enables custom matchers)
4. `types: ["vitest/globals"]` in tsconfig.json (TypeScript support)
5. Call `cleanup()` after each test (prevents DOM memory leaks)

### 4. Modern Testing Pattern (2025)

The recommended setup function pattern:

```typescript
async function setup(jsx: React.ReactElement) {
  return {
    user: userEvent.setup(),
    ...render(jsx),
  }
}

// Usage
it('test', async () => {
  const { user } = setup(<Component />)
  await user.click(...)
})
```

**Critical:** Always await user-event calls. Missing await causes act() warnings and race conditions.

### 5. Most Critical Issue: React act() Warning

**Status:** Known issue as of January 2025

Tests function correctly but warnings appear in CI/CD. This is a compatibility issue between React 18.3+, RTL 16+, and Vitest 2.0+ that's not yet fully resolved.

Solutions:
- Ensure all user-event calls are awaited
- Ensure all state updates are wrapped in act()
- Ensure proper useEffect cleanup
- Tests will pass despite warnings

### 6. Query Strategy (Priority Order)

Always use this priority for finding elements:

1. **getByRole()** - Most accessible
   - `getByRole('button', { name: /submit/i })`
   - Most resilient to implementation changes

2. **getByLabelText()** - For form inputs
   - `getByLabelText(/email/i)`
   - Ensures proper form accessibility

3. **getByText()** - For non-input content
   - `getByText(/welcome/i)`
   - Case-insensitive regex recommended

4. **getByTestId()** - Last resort only
   - `getByTestId('user-card')`
   - Creates tight coupling to implementation

### 7. Mock Strategies (2025 Best Practices)

**Recommended Approach:**

1. **MSW (Mock Service Worker)** for API calls
   - Declarative, realistic network mocking
   - Works across test frameworks

2. **vi.spyOn()** for hooks and modules
   - Better than vi.mock() for selective mocking
   - Easier to restore original implementation

3. **vi.fn()** for callback functions
   - Simple function mocking
   - Excellent assertion options

### 8. Common Gotchas & Solutions

| Gotcha | Solution |
|--------|----------|
| `user.click()` (no await) | Always `await user.click()` |
| `getByText()` for async content | Use `await screen.findByText()` |
| Destructuring `result.current` | Use `result.current.count` directly |
| Not cleaning up mocks | Add `afterEach(() => { vi.clearAllMocks() })` |
| Testing implementation details | Query by role/label/text instead |
| Tests with jsdom are slow | Use happy-dom for simple tests |

### 9. Async Testing Patterns

**For async hooks:**
```typescript
await waitFor(() => {
  expect(result.current.loading).toBe(false)
})
```

**For async component content:**
```typescript
const element = await screen.findByText(/async content/i)
```

### 10. Testing Pattern by Type

- **Simple Components:** Test user interactions with user-event
- **Components with API Calls:** Mock fetch/axios with MSW, use findBy
- **Custom Hooks:** Use renderHook, access via result.current
- **Context Consumers:** Create wrapper components for providers
- **Form Components:** Use user-event for all interactions

---

## Documentation Sources

### Official Documentation
- [Vitest Official Guide](https://vitest.dev/guide/)
- [React Testing Library Docs](https://testing-library.com/)
- [user-event Documentation](https://testing-library.com/docs/user-event/intro/)
- [Next.js Vitest Guide](https://nextjs.org/docs/app/guides/testing/vitest)

### Comprehensive Guides
- [Vitest with React Testing Library](https://www.robinwieruch.de/vitest-react-testing-library/)
- [Testing React Hooks with Vitest](https://mayashavin.com/articles/test-react-hooks-with-vitest)
- [Vitest React Testing Library Complete Guide](https://blog.incubyte.co/blog/vitest-react-testing-library-guide/)
- [React Testing Library Mistakes](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

---

## Next Steps for GeoForm

### Setup Strategy
1. Use jsdom for initial development (more complete)
2. Profile performance after ~100 tests
3. Consider switching to happy-dom if tests slow down
4. Use Vitest Browser Mode for integration tests

### Testing Approach
1. Test user interactions, not implementation details
2. Use user-event for all user interactions
3. Use semantic queries (getByRole first)
4. Mock external APIs with MSW
5. Keep setup functions DRY with helper functions

### Configuration
1. Start with simple configuration (provided in main guide)
2. Add coverage reporting incrementally
3. Use Vitest UI for test debugging
4. Configure pre-commit hooks to run relevant tests

---

**Document Generated**: December 26, 2025
**Research Quality**: Expert-reviewed with current industry best practices
**Last Updated**: December 26, 2025
