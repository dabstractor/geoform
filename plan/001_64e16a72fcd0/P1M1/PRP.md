# PRP: Project Restoration & Configuration (P1.M1)

**Milestone:** P1.M1 - Project Restoration & Configuration
**Project:** React Hierarchical Form Stack System (geoform-opus)
**Status:** Greenfield (empty repository)
**Estimated Story Points:** 6 SP

---

## Goal

**Feature Goal**: Establish a fully-configured, production-ready TypeScript library foundation with modern tooling that supports React 18/19, dual ESM/CJS module output, strict type safety, and comprehensive testing infrastructure.

**Deliverable**:
- `package.json` with proper module configuration and peer dependencies
- `tsconfig.json` with strict TypeScript settings
- `tsup.config.ts` for dual ESM/CJS library builds
- `vitest.config.ts` for React component and hook testing
- `vitest.setup.ts` for Testing Library configuration
- Source directory structure with barrel exports
- All validation commands passing (type-check, lint, build, test)

**Success Definition**:
1. `npm run build` produces `dist/index.mjs`, `dist/index.cjs`, and `dist/index.d.ts`
2. `npm run test` executes with jsdom environment and Testing Library matchers available
3. `npm run type-check` passes with zero errors
4. Package exports work for both ESM (`import`) and CJS (`require`) consumers
5. Tree-shaking enabled with `sideEffects: false`

---

## Why

- **Foundation for All Future Development**: Every subsequent milestone depends on this configuration being correct
- **Modern Library Standards**: Dual ESM/CJS builds ensure compatibility with all React project types (Next.js, Vite, CRA, etc.)
- **Developer Experience**: Strict TypeScript catches errors early; Vitest provides fast feedback loops
- **Production Readiness**: Proper exports, tree-shaking, and type definitions are required for npm publishing

---

## What

### Success Criteria

- [ ] `package.json` configured with type: "module", proper exports field, peer dependencies for React 18/19
- [ ] `tsconfig.json` with strict mode enabled, jsx: "react-jsx", moduleResolution: "bundler"
- [ ] `tsup.config.ts` generates ESM (.mjs) and CJS (.cjs) outputs with TypeScript declarations
- [ ] `vitest.config.ts` configured with jsdom environment, globals: true, and setup file
- [ ] `vitest.setup.ts` imports @testing-library/jest-dom/vitest and configures cleanup
- [ ] Source directory structure: `src/`, `src/types/`, `src/hooks/`, `src/components/`, `src/context/`
- [ ] Barrel export file `src/index.ts` exists (can be empty placeholder)
- [ ] All validation commands pass: build, type-check, test (with sample test)

---

## All Needed Context

### Context Completeness Check

_This PRP provides everything needed to implement the project configuration from scratch, including exact file contents, dependency versions, and validation commands._

### Documentation & References

```yaml
# MUST READ - Essential configuration patterns
- docfile: plan/P1M1/research/package-config.md
  why: Complete package.json configuration for React TypeScript libraries
  section: "Complete Example Configuration" (Section 8)
  critical: exports field structure, peerDependencies for React 18/19, sideEffects field

- docfile: plan/P1M1/research/tsup-config.md
  why: tsup configuration for dual ESM/CJS builds with React
  section: "Complete React Library Configuration Example" (Section 1.8)
  critical: external react/react-dom, outExtension pattern, dts generation

- docfile: plan/P1M1/research/vitest-config.md
  why: Vitest configuration for React Testing Library
  section: "Production-Ready Configuration" and "Vitest Setup File"
  critical: globals: true, environment: jsdom, @testing-library/jest-dom/vitest import

- docfile: plan/P1M1/research/testing-library-setup.md
  why: React Testing Library best practices and setup patterns
  section: "Setup Files Configuration"
  critical: cleanup() in afterEach, jest-dom matcher extension

- docfile: plan/P1M1/research/QUICK_REFERENCE.md
  why: Quick validation checklist for tsup configuration
  critical: Essential checklist items, validation commands

# Architecture Context
- docfile: plan/architecture/system_context.md
  why: Understand the project technical stack decisions
  section: "Technical Stack Decisions" and "Dependencies"

- docfile: plan/architecture/testing_strategy.md
  why: Testing patterns and coverage goals
  section: "Tools & Libraries" and "Test Coverage Goals"
```

### Current Codebase Tree

```bash
geoform-opus/
├── .git
├── .gitignore
├── PRD.md
├── tasks.json
└── plan/
    ├── architecture/
    │   ├── external_dependencies.md
    │   ├── summary.md
    │   ├── system_context.md
    │   └── testing_strategy.md
    └── P1M1/
        ├── PRP.md (this file)
        └── research/
            ├── package-config.md
            ├── tsup-config.md
            ├── vitest-config.md
            ├── testing-library-setup.md
            └── ... (other research files)
```

### Desired Codebase Tree After Implementation

```bash
geoform-opus/
├── .git
├── .gitignore
├── PRD.md
├── tasks.json
├── package.json              # NEW: Library configuration with dual ESM/CJS exports
├── tsconfig.json             # NEW: Strict TypeScript configuration
├── tsup.config.ts            # NEW: Build configuration for library bundling
├── vitest.config.ts          # NEW: Test runner configuration
├── vitest.setup.ts           # NEW: Testing Library setup with jest-dom
├── src/
│   ├── index.ts              # NEW: Barrel export (placeholder)
│   ├── types/
│   │   └── index.ts          # NEW: Type definitions barrel
│   ├── hooks/
│   │   └── index.ts          # NEW: Hooks barrel
│   ├── components/
│   │   └── index.ts          # NEW: Components barrel
│   ├── context/
│   │   └── index.ts          # NEW: Context barrel
│   └── utils/
│       └── index.ts          # NEW: Utilities barrel
├── dist/                     # GENERATED: Build output (gitignored)
│   ├── index.mjs
│   ├── index.cjs
│   └── index.d.ts
└── plan/
    └── ... (existing)
```

### Known Gotchas & Library Quirks

```typescript
// CRITICAL: tsup requires React marked as external to avoid bundling
// If React is bundled, consumers will have duplicate React instances causing hooks to fail
external: ['react', 'react-dom']

// CRITICAL: Vitest globals must be enabled in BOTH vitest.config.ts AND tsconfig.json
// vitest.config.ts: globals: true
// tsconfig.json: "types": ["vitest/globals"]

// CRITICAL: @testing-library/jest-dom v6+ requires special import for Vitest
// WRONG: import '@testing-library/jest-dom'
// CORRECT: import '@testing-library/jest-dom/vitest'

// CRITICAL: cleanup() must be called after each test to prevent DOM pollution
// Add to vitest.setup.ts: afterEach(() => { cleanup() })

// CRITICAL: React 18/19 peer dependency range
// Use: "^18.0.0 || ^19.0.0" to support both versions

// GOTCHA: tsconfig.json noEmit should be true when using tsup for builds
// tsup handles emission, tsc is only for type-checking

// GOTCHA: outExtension must return correct extensions
// ESM -> .mjs, CJS -> .cjs (not .js/.cjs when type: "module")
```

---

## Implementation Blueprint

### Data Models and Structure

This milestone creates configuration files rather than data models. No Pydantic/ORM models required.

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: CREATE package.json
  - IMPLEMENT: Complete package.json with all required fields
  - CONTENT: See "Package.json Complete Content" section below
  - NAMING: Standard npm package.json
  - CRITICAL FIELDS:
    - "name": "geoform" (or scoped @yourorg/geoform)
    - "type": "module"
    - "main": "./dist/index.cjs"
    - "module": "./dist/index.mjs"
    - "types": "./dist/index.d.ts"
    - "exports" with conditional import/require
    - "sideEffects": false
    - "peerDependencies": react ^18.0.0 || ^19.0.0
    - All devDependencies at specified versions
  - VALIDATION: npm install completes without errors

Task 2: CREATE tsconfig.json
  - IMPLEMENT: Strict TypeScript configuration
  - CONTENT: See "tsconfig.json Complete Content" section below
  - CRITICAL OPTIONS:
    - "strict": true
    - "jsx": "react-jsx"
    - "moduleResolution": "bundler"
    - "noEmit": true (tsup handles emission)
    - "types": ["vitest/globals"]
  - VALIDATION: npx tsc --noEmit passes

Task 3: CREATE tsup.config.ts
  - IMPLEMENT: Build configuration for dual ESM/CJS
  - CONTENT: See "tsup.config.ts Complete Content" section below
  - CRITICAL OPTIONS:
    - entry: ['src/index.ts']
    - format: ['esm', 'cjs']
    - dts: true
    - external: ['react', 'react-dom']
    - outExtension for .mjs/.cjs
  - VALIDATION: npm run build produces dist/index.mjs, dist/index.cjs, dist/index.d.ts

Task 4: CREATE vitest.config.ts
  - IMPLEMENT: Test runner configuration
  - CONTENT: See "vitest.config.ts Complete Content" section below
  - CRITICAL OPTIONS:
    - globals: true
    - environment: 'jsdom'
    - setupFiles: ['./vitest.setup.ts']
  - DEPENDENCIES: Requires vitest.setup.ts to exist

Task 5: CREATE vitest.setup.ts
  - IMPLEMENT: Testing Library setup file
  - CONTENT: See "vitest.setup.ts Complete Content" section below
  - CRITICAL:
    - Import '@testing-library/jest-dom/vitest'
    - afterEach cleanup()
    - Optional: vi.clearAllMocks()
  - VALIDATION: Test matchers like toBeInTheDocument() available

Task 6: CREATE src/ directory structure
  - CREATE directories: src/, src/types/, src/hooks/, src/components/, src/context/, src/utils/
  - CREATE placeholder barrel exports in each:
    - src/index.ts: export {} // placeholder
    - src/types/index.ts: export {}
    - src/hooks/index.ts: export {}
    - src/components/index.ts: export {}
    - src/context/index.ts: export {}
    - src/utils/index.ts: export {}
  - VALIDATION: Build succeeds (tsup processes src/index.ts)

Task 7: UPDATE .gitignore
  - ADD: node_modules/, dist/, coverage/, *.tsbuildinfo
  - VALIDATION: git status shows dist/ is ignored

Task 8: CREATE sample test to validate setup
  - CREATE: src/__tests__/setup.test.ts
  - IMPLEMENT: Simple test to verify Vitest + Testing Library work
  - VALIDATION: npm run test passes
```

### Implementation Patterns & Key Details

#### Package.json Complete Content

```json
{
  "name": "geoform",
  "version": "0.1.0",
  "description": "React Hierarchical Form Stack System - infinitely nestable forms with state preservation",
  "author": "Your Name",
  "license": "MIT",
  "type": "module",
  "main": "./dist/index.cjs",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": {
        "types": "./dist/index.d.ts",
        "default": "./dist/index.mjs"
      },
      "require": {
        "types": "./dist/index.d.ts",
        "default": "./dist/index.cjs"
      }
    },
    "./package.json": "./package.json"
  },
  "files": [
    "dist",
    "README.md",
    "LICENSE"
  ],
  "sideEffects": false,
  "keywords": [
    "react",
    "forms",
    "nested-forms",
    "form-stack",
    "hierarchical-forms",
    "typescript",
    "react-hooks"
  ],
  "repository": {
    "type": "git",
    "url": "https://github.com/yourusername/geoform"
  },
  "bugs": {
    "url": "https://github.com/yourusername/geoform/issues"
  },
  "homepage": "https://github.com/yourusername/geoform#readme",
  "peerDependencies": {
    "react": "^18.0.0 || ^19.0.0",
    "react-dom": "^18.0.0 || ^19.0.0"
  },
  "devDependencies": {
    "@testing-library/dom": "^10.4.0",
    "@testing-library/jest-dom": "^6.6.0",
    "@testing-library/react": "^16.0.0",
    "@testing-library/user-event": "^14.5.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^4.3.0",
    "jsdom": "^25.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "tsup": "^8.3.0",
    "typescript": "^5.7.0",
    "vite": "^6.0.0",
    "vitest": "^2.1.0"
  },
  "scripts": {
    "build": "tsup",
    "build:watch": "tsup --watch",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "type-check": "tsc --noEmit",
    "clean": "rm -rf dist coverage",
    "prepublishOnly": "npm run clean && npm run type-check && npm run test && npm run build"
  }
}
```

#### tsconfig.json Complete Content

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "moduleResolution": "bundler",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "noFallthroughCasesInSwitch": true,
    "noImplicitReturns": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "noEmit": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "react-jsx",
    "jsxImportSource": "react",
    "skipLibCheck": true,
    "types": ["vitest/globals"]
  },
  "include": ["src", "vitest.setup.ts"],
  "exclude": ["node_modules", "dist"]
}
```

#### tsup.config.ts Complete Content

```typescript
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  outExtension({ format }) {
    return {
      js: format === 'esm' ? '.mjs' : '.cjs',
    };
  },
  dts: true,
  sourcemap: true,
  clean: true,
  target: 'es2020',
  minify: false,
  treeshake: true,
  splitting: false,
  external: ['react', 'react-dom'],
});
```

#### vitest.config.ts Complete Content

```typescript
/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', 'dist'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.d.ts',
        'src/**/*.test.{ts,tsx}',
        'src/**/*.spec.{ts,tsx}',
        'src/**/index.ts',
      ],
      reporter: ['text', 'html', 'json'],
    },
  },
});
```

#### vitest.setup.ts Complete Content

```typescript
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// Cleanup after each test to prevent DOM pollution
afterEach(() => {
  cleanup();
});

// Reset mocks after each test
afterEach(() => {
  vi.clearAllMocks();
});
```

#### src/index.ts Placeholder Content

```typescript
// React Hierarchical Form Stack System
// Main barrel export - will be populated in P1.M6

export {};
```

#### src/__tests__/setup.test.ts Sample Test Content

```typescript
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

describe('Test Setup Verification', () => {
  it('should have Testing Library matchers available', () => {
    const TestComponent = () => <div data-testid="test">Hello</div>;
    render(<TestComponent />);

    expect(screen.getByTestId('test')).toBeInTheDocument();
    expect(screen.getByTestId('test')).toHaveTextContent('Hello');
  });

  it('should run tests with jsdom environment', () => {
    expect(typeof document).toBe('object');
    expect(typeof window).toBe('object');
  });
});
```

### Integration Points

```yaml
NPM:
  - Run: npm install (after creating package.json)
  - Installs all devDependencies
  - Creates node_modules/ and package-lock.json

BUILD:
  - Command: npm run build
  - Input: src/index.ts
  - Output: dist/index.mjs, dist/index.cjs, dist/index.d.ts

TEST:
  - Command: npm run test
  - Runs: vitest with jsdom environment
  - Uses: vitest.setup.ts for Testing Library configuration

TYPE-CHECK:
  - Command: npm run type-check
  - Runs: tsc --noEmit
  - Validates: All TypeScript files in src/
```

---

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# After creating package.json
npm install
# Expected: Clean install, no peer dependency warnings for React

# After creating tsconfig.json
npx tsc --noEmit
# Expected: Zero errors (may show "no files" until src/index.ts exists)

# After creating all config files
npm run type-check
# Expected: Zero TypeScript errors
```

### Level 2: Build Validation (Component Validation)

```bash
# After creating tsup.config.ts and src/index.ts
npm run build

# Expected output:
# dist/
#   index.mjs     (ESM format)
#   index.cjs     (CommonJS format)
#   index.d.ts    (TypeScript declarations)

# Verify files exist
ls -la dist/
# Expected: Three files as listed above
```

### Level 3: Test Validation (System Validation)

```bash
# After creating vitest.config.ts, vitest.setup.ts, and sample test
npm run test

# Expected:
# ✓ src/__tests__/setup.test.ts (2 tests passed)
#   ✓ should have Testing Library matchers available
#   ✓ should run tests with jsdom environment

# Test coverage (optional validation)
npm run test:coverage
# Expected: Coverage report generated in coverage/
```

### Level 4: Integration Validation

```bash
# Validate package exports configuration
npx @arethetypeswrong/cli --pack .

# Expected: No errors, all export conditions resolve correctly

# Validate tree-shaking is possible (manual check)
# 1. Build succeeds
# 2. sideEffects: false in package.json
# 3. ESM format generated (.mjs)

# Full validation suite
npm run type-check && npm run test && npm run build
# Expected: All three commands pass with zero errors
```

---

## Final Validation Checklist

### Technical Validation

- [ ] `npm install` completes without errors
- [ ] `npm run type-check` passes with zero errors
- [ ] `npm run test` passes all tests
- [ ] `npm run build` generates dist/index.mjs, dist/index.cjs, dist/index.d.ts
- [ ] All source directories exist: src/, src/types/, src/hooks/, src/components/, src/context/, src/utils/

### Feature Validation

- [ ] package.json has "type": "module"
- [ ] package.json has correct "exports" field with import/require conditions
- [ ] package.json has React 18/19 peer dependencies
- [ ] package.json has "sideEffects": false
- [ ] tsconfig.json has "strict": true
- [ ] tsconfig.json has "jsx": "react-jsx"
- [ ] tsconfig.json has "types": ["vitest/globals"]
- [ ] vitest.config.ts has environment: 'jsdom'
- [ ] vitest.config.ts has globals: true
- [ ] vitest.setup.ts imports '@testing-library/jest-dom/vitest'
- [ ] vitest.setup.ts calls cleanup() in afterEach
- [ ] Sample test uses toBeInTheDocument() matcher successfully

### Code Quality Validation

- [ ] All configuration files use TypeScript where applicable (.ts)
- [ ] No hardcoded paths that would break on other machines
- [ ] .gitignore includes node_modules/, dist/, coverage/

### Documentation & Deployment

- [ ] Package can be built from clean state (npm install && npm run build)
- [ ] Tests can be run from clean state (npm install && npm run test)

---

## Anti-Patterns to Avoid

- **DON'T** bundle React - always mark as external in tsup.config.ts
- **DON'T** use `@testing-library/jest-dom` import (use `/vitest` subpath)
- **DON'T** forget cleanup() in vitest.setup.ts (causes test pollution)
- **DON'T** set noEmit: false in tsconfig.json (tsup handles emission)
- **DON'T** use .js extension for ESM output when type: "module" (use .mjs)
- **DON'T** forget to add "types": ["vitest/globals"] to tsconfig.json
- **DON'T** create complex abstractions - this is just configuration
- **DON'T** add linting/prettier in this milestone (keep scope focused)

---

## Confidence Score

**8/10** - High confidence for one-pass implementation success

**Rationale:**
- All configuration values are explicitly specified with complete file contents
- Dependency versions are researched and documented
- Common gotchas are explicitly called out
- Validation commands are specific and executable
- Minor uncertainty: Exact version compatibility may vary based on npm resolution

**Risk Mitigation:**
- If npm install fails: Check for version conflicts, use `--legacy-peer-deps` if needed
- If build fails: Verify src/index.ts exists with at least `export {}`
- If tests fail: Verify vitest.setup.ts is correctly referenced in vitest.config.ts

---

## Quick Start for Implementation

```bash
# 1. Create all files as specified above
# 2. Run installation
npm install

# 3. Verify type checking
npm run type-check

# 4. Verify testing
npm run test

# 5. Verify build
npm run build

# 6. Full validation
npm run type-check && npm run test && npm run build
```

**Expected total time:** 15-30 minutes for a developer familiar with the tooling.
