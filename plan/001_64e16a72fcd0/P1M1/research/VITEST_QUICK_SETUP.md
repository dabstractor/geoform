# Vitest for React Libraries - Quick Setup Guide

**Copy-Paste Ready Templates for 2025**

---

## 1. Installation (One Command)

```bash
npm install -D vitest@4.0.16 @vitejs/plugin-react@4.3 jsdom@25.0 \
  @testing-library/react@15.0 @testing-library/dom@10.4 @testing-library/jest-dom@6.9 \
  @testing-library/user-event@14.5 @vitest/coverage-v8@4.0.16 vite-tsconfig-paths@5.0
```

---

## 2. vitest.config.ts (Copy This)

```typescript
/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.d.ts', 'src/**/index.ts'],
      lines: 80,
      functions: 80,
      branches: 75,
      statements: 80,
      reporter: ['text', 'html'],
    },
  },
})
```

---

## 3. vitest.setup.ts (Copy This)

```typescript
import { expect, afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'

afterEach(() => {
  cleanup()
})
```

---

## 4. tsconfig.json (Add These Compiler Options)

```json
{
  "compilerOptions": {
    "types": ["vitest/globals", "@testing-library/jest-dom"],
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@components/*": ["src/components/*"],
      "@hooks/*": ["src/hooks/*"],
      "@utils/*": ["src/utils/*"]
    }
  }
}
```

---

## 5. package.json Scripts

```json
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage",
    "test:ui": "vitest --ui"
  }
}
```

---

## 6. Simple Test Example

```typescript
// Button.test.tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from './Button'

describe('Button', () => {
  it('renders and responds to click', async () => {
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>Click me</Button>)

    await userEvent.click(screen.getByRole('button', { name: /click me/i }))

    expect(handleClick).toHaveBeenCalledOnce()
  })
})
```

---

## 7. Run Tests

```bash
# Watch mode (development)
npm test

# Run once (CI/production)
npm run test:run

# With coverage report
npm run test:coverage

# With UI dashboard
npm run test:ui
```

---

## Common Troubleshooting

### Error: "Cannot find name 'describe'"
Fix: Add to tsconfig.json:
```json
{
  "compilerOptions": {
    "types": ["vitest/globals"]
  }
}
```

### Error: "toBeInTheDocument is not defined"
Fix: Add to vitest.setup.ts:
```typescript
import '@testing-library/jest-dom/vitest'
```

### Error: "@/ alias not working"
Fix: Install vite-tsconfig-paths:
```bash
npm install -D vite-tsconfig-paths
```

Then add to vitest.config.ts:
```typescript
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  // ...
})
```

---

## Key 2025 Facts

- **Vitest 4.0.16** is latest (Dec 2025)
- **V8 coverage** is 40% faster than Istanbul
- **jsdom** is most compatible for React testing
- **Browser Mode** now production-ready
- **Node.js 22.12+** recommended
- **React 19** fully supported

---

See `/home/dustin/projects/geoform-opus/plan/P1M1/research/vitest-config.md` for complete guide with all options and detailed explanations.
