# React TypeScript Library Configuration Best Practices 2025

Comprehensive research on modern package.json and TypeScript configuration for React libraries being published to npm.

---

## 1. Package.json Core Fields

### 1.1 Basic Metadata

```json
{
  "name": "@namespace/my-library",
  "version": "0.1.0",
  "description": "A brief description of what your library does",
  "author": {
    "name": "Your Name",
    "email": "your.email@example.com",
    "url": "https://yourwebsite.com"
  },
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/yourusername/my-library"
  },
  "homepage": "https://github.com/yourusername/my-library#readme",
  "bugs": {
    "url": "https://github.com/yourusername/my-library/issues"
  }
}
```

**Key Points:**
- Use scoped package names (`@namespace/package`) for organization and discoverability
- Follow [Semantic Versioning (SemVer)](https://semver.org/) convention: MAJOR.MINOR.PATCH
- Include repository metadata for proper npm linking

### 1.2 Keywords for npm Discovery

```json
{
  "keywords": [
    "react",
    "typescript",
    "react-component",
    "components",
    "ui",
    "library",
    "hooks",
    "your-specific-feature"
  ]
}
```

**Best Practices (2025):**
- Keywords appear in npm search results and help with discoverability
- Include: `react`, `typescript`, `react-component` for framework targeting
- Add functional keywords related to your library's features
- Avoid keyword stuffing; use 5-15 relevant keywords
- Consider ecosystem conventions (e.g., `babel-plugin-` for Babel plugins)

---

## 2. Module System Configuration

### 2.1 Type Field and Module Format

**Modern Approach (2025):**

```json
{
  "type": "module",
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": {
        "types": "./dist/index.d.ts",
        "default": "./dist/index.js"
      },
      "require": {
        "types": "./dist/index.d.ts",
        "default": "./dist/index.cjs"
      }
    },
    "./package.json": "./package.json"
  }
}
```

**Understanding the Fields:**

| Field | Purpose | Format |
|-------|---------|--------|
| `type` | Declares that .js files are ES modules | "module" or "commonjs" |
| `main` | Entry point for CommonJS consumers | Path to .cjs file |
| `module` | Entry point for ESM-aware bundlers | Path to .js/.mjs file |
| `types` | TypeScript type definitions | Path to .d.ts file |
| `exports` | Conditional exports based on import type | Object with conditions |

### 2.2 Exports Field Deep Dive

**Why "exports" Matters:**

The `exports` field provides fine-grained control over what consumers can import and from where. It's the modern way to support both ESM and CJS.

**Complete Example with Subpath Exports:**

```json
{
  "type": "module",
  "exports": {
    ".": {
      "import": {
        "types": "./dist/esm/index.d.ts",
        "default": "./dist/esm/index.js"
      },
      "require": {
        "types": "./dist/cjs/index.d.ts",
        "default": "./dist/cjs/index.cjs"
      }
    },
    "./hooks": {
      "import": {
        "types": "./dist/esm/hooks/index.d.ts",
        "default": "./dist/esm/hooks/index.js"
      },
      "require": {
        "types": "./dist/cjs/hooks/index.d.ts",
        "default": "./dist/cjs/hooks/index.cjs"
      }
    },
    "./styles.css": "./dist/styles.css",
    "./package.json": "./package.json"
  }
}
```

**Key Considerations:**

- **File Extensions Matter**: Node.js distinguishes between `.js` (determined by `type` field), `.mjs` (always ESM), and `.cjs` (always CJS)
- **Conditional Exports**: Node.js resolves to the appropriate version based on the consuming environment
- **Recent Node.js Changes (v22+)**: CommonJS modules can now require ESM modules natively, reducing dual-publishing complexity
- **Types Conditions**: Always include types for both import and require conditions

**Common Gotchas:**

- If `"type": "module"` is set, all `.js` files are treated as ESM
- Missing types condition will cause TypeScript errors in consuming projects
- Subpath exports must use relative paths starting with `./`

### 2.3 Dual ESM/CJS Publishing Strategy (2025)

**Current State:**
- Most libraries still need dual format support for broader compatibility
- ESM-only is gaining adoption for new packages without legacy dependencies
- JSR.io promotes ESM-first packages as an alternative registry

**With tsup (Recommended):**

```json
{
  "type": "module",
  "main": "./dist/index.cjs",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.cjs",
      "types": "./dist/index.d.ts"
    }
  }
}
```

tsup handles the complexity of generating both formats with a single configuration.

---

## 3. Dependencies Configuration

### 3.1 Peer Dependencies for React 18/19

```json
{
  "peerDependencies": {
    "react": "^18.0.0 || ^19.0.0",
    "react-dom": "^18.0.0 || ^19.0.0"
  },
  "peerDependenciesMeta": {
    "react": {
      "optional": true
    },
    "react-dom": {
      "optional": true
    }
  },
  "devDependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "typescript": "^5.4.0",
    "tsup": "^8.0.0",
    "vitest": "^1.0.0",
    "@testing-library/react": "^14.0.0",
    "@testing-library/dom": "^9.0.0",
    "@testing-library/jest-dom": "^6.0.0",
    "@testing-library/user-event": "^14.0.0",
    "eslint": "^8.0.0",
    "typescript-eslint": "^8.0.0",
    "prettier": "^3.0.0",
    "eslint-plugin-react": "^7.0.0",
    "eslint-plugin-react-hooks": "^4.0.0"
  }
}
```

**Peer Dependencies Strategy:**

- **Why peerDependencies**: Ensures only one version of React exists in the final application bundle
- **React 18/19 Support**: Use version range `^18.0.0 || ^19.0.0` for compatibility
- **peerDependenciesMeta**: Mark as optional to prevent npm warnings for optional packages
- **devDependencies**: Always include React and @types/react for local development

**React 19 Compatibility Notes (2025):**

- Some ecosystem libraries still declare strict React 18-only constraints
- Consider using `--legacy-peer-deps` during development if conflicts arise
- Forking libraries with overly strict React constraints is a fallback option
- Major libraries are updating compatibility gradually

### 3.2 Recommended devDependencies List

**Core Build Tools:**
```json
{
  "devDependencies": {
    "typescript": "^5.4.0",
    "tsup": "^8.0.0",
    "vite": "^5.0.0"
  }
}
```

**Testing Stack:**
```json
{
  "devDependencies": {
    "vitest": "^1.0.0",
    "jsdom": "^24.0.0",
    "@testing-library/react": "^14.0.0",
    "@testing-library/dom": "^9.0.0",
    "@testing-library/jest-dom": "^6.0.0",
    "@testing-library/user-event": "^14.0.0"
  }
}
```

**Linting & Formatting:**
```json
{
  "devDependencies": {
    "eslint": "^8.0.0",
    "typescript-eslint": "^8.0.0",
    "eslint-plugin-react": "^7.0.0",
    "eslint-plugin-react-hooks": "^4.0.0",
    "prettier": "^3.0.0",
    "eslint-config-prettier": "^9.0.0",
    "eslint-plugin-prettier": "^5.0.0"
  }
}
```

**Optional but Recommended:**
```json
{
  "devDependencies": {
    "storybook": "^7.0.0",
    "husky": "^9.0.0",
    "lint-staged": "^15.0.0"
  }
}
```

---

## 4. Scripts Configuration

### 4.1 Build Scripts with tsup

```json
{
  "scripts": {
    "build": "tsup",
    "build:watch": "tsup --watch",
    "build:analyze": "tsup --analyze",
    "clean": "rm -rf dist"
  }
}
```

**tsup.config.ts Configuration:**

```typescript
import { defineConfig } from 'tsup';

export default defineConfig({
  // Entry points
  entry: ['src/index.ts'],

  // Output formats
  format: ['cjs', 'esm'],

  // Generate TypeScript declaration files
  dts: true,

  // File extension handling
  outExtension({ format }) {
    return format === 'esm' ? { js: '.mjs' } : { js: '.cjs' };
  },

  // Development features
  sourcemap: true,

  // Production features
  minify: false, // Set to true if desired

  // Clean output directory before build
  clean: true,

  // Mark external dependencies (not bundled)
  external: ['react', 'react-dom'],

  // Tree-shaking support
  splitting: false,
});
```

**Advanced tsup Options:**

```typescript
export default defineConfig({
  // CSS handling
  // Requires additional setup - see CSS bundling docs

  // Concurrent builds
  concurrency: 4,

  // IIFE for browser globals (if applicable)
  // format: ['iife'],
  // globalName: 'MyLibrary',

  // Shims for polyfills
  // shims: true,
});
```

### 4.2 Test Scripts with Vitest

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage"
  }
}
```

**vitest.config.ts or vite.config.ts:**

```typescript
/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    // Use JSDOM for DOM testing
    environment: 'jsdom',

    // Global test utilities (describe, it, expect)
    globals: true,

    // Setup files
    setupFiles: ['./src/tests/setup.ts'],

    // Coverage options
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
});
```

**Setup File (src/tests/setup.ts):**

```typescript
import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import '@testing-library/jest-dom/vitest';
import * as matchers from '@testing-library/jest-dom/matchers';

expect.extend(matchers);

afterEach(() => {
  cleanup();
});
```

**Test File Naming:**
- Files must include `.spec` or `.test` suffix
- Example: `Button.spec.tsx`, `hooks.test.ts`

### 4.3 Lint and Format Scripts

```json
{
  "scripts": {
    "lint": "eslint src --ext .ts,.tsx",
    "lint:fix": "eslint src --ext .ts,.tsx --fix",
    "format": "prettier --check src",
    "format:fix": "prettier --write src",
    "type-check": "tsc --noEmit",
    "validate": "npm run type-check && npm run lint && npm run format && npm run test"
  }
}
```

**eslint.config.js (Flat Config - 2025 Standard):**

```typescript
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import prettier from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';

export default tseslint.config(
  // Ignore patterns
  {
    ignores: ['dist', 'node_modules', '**/*.config.js'],
  },

  // JavaScript baseline
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    ...js.configs.recommended,
  },

  // TypeScript-specific
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    ...tseslint.configs.recommended,
  },

  // React-specific
  {
    files: ['**/*.{jsx,tsx}'],
    languageOptions: {
      globals: {
        React: 'readonly',
      },
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
    },
    rules: {
      'react/react-in-jsx-scope': 'off',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'react/prop-types': 'off', // TypeScript handles this
    },
  },

  // Prettier integration
  {
    plugins: {
      prettier,
    },
    rules: {
      'prettier/prettier': 'error',
    },
  },

  // Disable conflicting Prettier rules
  prettierConfig,
);
```

**.prettierrc.json:**

```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "bracketSpacing": true,
  "arrowParens": "always",
  "printWidth": 80
}
```

### 4.4 Prepublish Hooks

```json
{
  "scripts": {
    "prepublishOnly": "npm run build && npm run test && npm run lint",
    "prepack": "npm run build",
    "prepare": "npm run build"
  }
}
```

**Lifecycle Script Timing:**

| Script | When it Runs | Use Case |
|--------|--------------|----------|
| `prepare` | npm install (local), git install, npm pack, npm publish | General setup before publishing or installing |
| `prepack` | npm pack, npm publish, git dependency install | Build immediately before packaging |
| `prepublishOnly` | **Only** npm publish | Strict build-before-publish gate (recommended) |
| `prepublish` | **Deprecated** | Avoid using in new projects |

**Best Practice (2025):**
- Use `prepublishOnly` for strict control (only on `npm publish`)
- Use `prepack` for operations needed during both packing and publishing
- Avoid `prepare` for builds (it also runs on local `npm install`)

---

## 5. Files and Outputs Configuration

### 5.1 Files Field

```json
{
  "files": [
    "dist",
    "README.md",
    "LICENSE",
    "package.json"
  ]
}
```

**What It Does:**
- Specifies which files/directories to include when publishing to npm
- Whitelist approach: only listed items are published
- Always implicitly includes: `package.json`, `README.md`, `LICENSE`, `CHANGELOG.md`
- Always implicitly includes: Git-maintained files in the root
- Always implicitly excludes: `.git`, `node_modules`, test files (by convention)

**Complete Example:**

```json
{
  "files": [
    "dist",
    "src",
    "README.md",
    "LICENSE",
    "CHANGELOG.md",
    "package.json",
    "tsconfig.json"
  ]
}
```

**Common Gotchas:**
- Don't publish `node_modules` (it's ignored by default)
- Don't publish source maps unless intentional
- Consider including `src` for users doing tree-shaking analysis

### 5.2 SideEffects Field

```json
{
  "sideEffects": false
}
```

**When to Use:**

**Pure/No Side Effects:**
```json
{
  "sideEffects": false
}
```
Use this if your library has no side effects (no global state, no imports with side effects).

**With Side Effects:**
```json
{
  "sideEffects": [
    "./dist/styles.css",
    "./dist/**/*.css"
  ]
}
```
Use when you have files with side effects that must always be included (CSS, polyfills).

**Why It Matters:**
- Enables tree-shaking in consuming applications
- Bundlers (Webpack, Rollup, esbuild) use this to determine what's safe to remove
- Missing or incorrect sideEffects prevents unused code elimination
- Can significantly reduce bundle size for consumers

**Important Notes:**
- The sideEffects field is file-based
- If a file is marked with side effects, the entire file is kept (even partially used code)
- Be very careful marking CSS files: once included, all styles are retained
- Test tree-shaking with analysis tools after publishing

---

## 6. TypeScript Configuration (tsconfig.json)

### 6.1 Strict Mode Configuration

**Recommended Strict Base (2025):**

```json
{
  "extends": "@tsconfig/bases/strictest.json",
  "compilerOptions": {
    // Build settings
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020", "DOM"],
    "moduleResolution": "bundler",

    // Type checking
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "noPropertyAccessFromIndexSignature": true,
    "noFallthroughCasesInSwitch": true,
    "noImplicitReturns": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,

    // Emit
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "./dist",
    "removeComments": false,
    "noEmit": false,

    // Module interop
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,

    // JSX (React 17+ automatic runtime)
    "jsx": "react-jsx",
    "jsxImportSource": "react",

    // Path aliases
    "baseUrl": "./src",
    "paths": {
      "@components/*": ["./components/*"],
      "@hooks/*": ["./hooks/*"],
      "@utils/*": ["./utils/*"],
      "@types/*": ["./types/*"]
    }
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist", "**/*.spec.ts", "**/*.test.ts"]
}
```

**Individual Strict Options Explained:**

| Option | What It Does | Impact |
|--------|--------------|--------|
| `strict` | Enables all strict options (umbrella setting) | Strong type safety across the board |
| `noImplicitAny` | Errors on variables with inferred `any` type | Forces explicit typing |
| `strictNullChecks` | Prevents null/undefined assignment issues | Eliminates null reference errors |
| `strictFunctionTypes` | Stricter function parameter checking | Prevents subtle function incompatibilities |
| `strictBindCallApply` | Type checks bind/call/apply calls | Ensures correct `this` binding |
| `strictPropertyInitialization` | Class properties must be initialized | Prevents undefined properties |
| `noImplicitThis` | Errors if `this` type is not explicit | Clarifies `this` context |
| `useUnknownInCatchVariables` | Catch variables default to `unknown` | Safer error handling |
| `noUncheckedIndexedAccess` | Prevents unsafe array/object indexing | Requires bounds checking |
| `noImplicitOverride` | Subclass methods must explicitly mark overrides | Prevents accidental method shadowing |
| `noPropertyAccessFromIndexSignature` | Prevents unsafe index signature access | Type-safe property access |

### 6.2 JSX Configuration Details

**Modern Approach (React 17+):**

```json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "react"
  }
}
```

**Why `react-jsx` Over Classic `react`:**

| Setting | Automatic Runtime | Classic Runtime |
|---------|-------------------|-----------------|
| `jsx: "react-jsx"` | No need to import React | Must import React |
| Emits | `_jsx()` calls | `React.createElement()` |
| Import | `react/jsx-runtime` | Manual React import |
| File Size | Slightly smaller | Slightly larger |
| IDE Support | Better in modern editors | Traditional |

**Per-File Override:**

```typescript
// Override for specific file (use classic runtime)
// @jsxRuntime classic
import React from 'react';

export const MyComponent = () => <div>Hello</div>;
```

### 6.3 Module Resolution Settings

```json
{
  "compilerOptions": {
    "moduleResolution": "bundler",
    "baseUrl": "./src",
    "resolveJsonModule": true,
    "allowImportingTsExtensions": true
  }
}
```

**Module Resolution Strategies:**

- `"bundler"` (Recommended 2025): Modern bundler-style resolution, supports conditional exports
- `"node"`: Node.js CommonJS resolution algorithm
- `"node10"` or earlier: Legacy Node.js resolution (avoid)

### 6.4 Path Aliases Configuration

**Example Setup:**

```json
{
  "compilerOptions": {
    "baseUrl": "./src",
    "paths": {
      "@components/*": ["./components/*"],
      "@ui/*": ["./components/ui/*"],
      "@pages/*": ["./pages/*"],
      "@hooks/*": ["./hooks/*"],
      "@api/*": ["./api/*"],
      "@utils/*": ["./utils/*"],
      "@types/*": ["./types/*"],
      "@*": ["./*"]
    }
  }
}
```

**Usage Examples:**

```typescript
// Instead of:
import Button from '../../../components/Button';
import useForm from '../../hooks/useForm';

// Write:
import Button from '@components/Button';
import useForm from '@hooks/useForm';
```

**Path Alias Best Practices:**

- Use `@` prefix for clarity and consistency
- Make aliases short and descriptive
- Document aliases in README
- Ensure aliases match file structure
- For monorepos: use different prefixes per package (e.g., `@ui`, `@web`)

**Monorepo Considerations:**
- Path aliases must be unique per package
- Consider using package prefixes to avoid conflicts
- Update path resolution in build tools (tsup, Vite, etc.)

---

## 7. Common Gotchas and Solutions

### 7.1 Type Definitions

**Problem:** "Could not find a declaration file for module X"

**Solution:** Ensure types are properly exported

```json
{
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "require": "./dist/index.cjs"
    }
  }
}
```

### 7.2 ESM/CJS Module Conflicts

**Problem:** "Cannot use import statement outside a module"

**Solutions:**
1. Set `"type": "module"` in package.json
2. Use explicit file extensions (`.mjs`, `.cjs`)
3. Check that tsup configuration specifies both formats

### 7.3 React Peer Dependency Warnings

**Problem:** npm shows peer dependency warnings for React 19

**Solutions:**
```json
{
  "peerDependencies": {
    "react": "^18.0.0 || ^19.0.0"
  }
}
```

For development:
```bash
npm install --legacy-peer-deps
```

### 7.4 Tree-Shaking Not Working

**Problem:** Unused code is included in consumer bundles

**Solution:** Set `sideEffects` correctly

```json
{
  "sideEffects": false,
  "exports": {
    ".": {
      "import": "./dist/esm/index.js",
      "require": "./dist/cjs/index.cjs"
    }
  }
}
```

### 7.5 CSS Module Handling

**Problem:** CSS imports not working in consumers

**Solution:** Configure tsup to handle CSS

```typescript
// tsup.config.ts
export default defineConfig({
  entry: {
    index: 'src/index.ts',
    styles: 'src/styles.css'
  },
  format: ['esm', 'cjs'],
  dts: true,
});
```

Then in package.json:
```json
{
  "exports": {
    ".": { ... },
    "./styles.css": "./dist/styles.css"
  }
}
```

### 7.6 Strict Mode Type Errors

**Problem:** Too many type errors after enabling strict mode

**Solution:** Enable strict progressively

```json
{
  "compilerOptions": {
    "strict": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false
  }
}
```

Then gradually enable stricter checks in separate commits.

---

## 8. Complete Example Configuration

### Directory Structure

```
my-library/
├── src/
│   ├── index.ts
│   ├── components/
│   │   └── Button.tsx
│   ├── hooks/
│   │   └── useCounter.ts
│   └── types/
│       └── index.ts
├── dist/
│   ├── index.d.ts
│   ├── index.js
│   └── index.cjs
├── package.json
├── tsconfig.json
├── tsup.config.ts
├── vitest.config.ts
├── eslint.config.js
├── .prettierrc.json
├── README.md
└── LICENSE
```

### Complete package.json

```json
{
  "name": "@myorg/my-library",
  "version": "0.1.0",
  "description": "A modern React component library with TypeScript",
  "author": {
    "name": "Your Name",
    "email": "your.email@example.com"
  },
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/myorg/my-library"
  },
  "homepage": "https://github.com/myorg/my-library#readme",
  "bugs": {
    "url": "https://github.com/myorg/my-library/issues"
  },
  "keywords": [
    "react",
    "typescript",
    "react-component",
    "components",
    "library"
  ],
  "type": "module",
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": {
        "types": "./dist/index.d.ts",
        "default": "./dist/index.js"
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
  "peerDependencies": {
    "react": "^18.0.0 || ^19.0.0",
    "react-dom": "^18.0.0 || ^19.0.0"
  },
  "devDependencies": {
    "@eslint/js": "^9.0.0",
    "@testing-library/dom": "^9.0.0",
    "@testing-library/jest-dom": "^6.0.0",
    "@testing-library/react": "^14.0.0",
    "@testing-library/user-event": "^14.0.0",
    "@types/node": "^20.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^4.0.0",
    "eslint": "^8.0.0",
    "eslint-config-prettier": "^9.0.0",
    "eslint-plugin-prettier": "^5.0.0",
    "eslint-plugin-react": "^7.0.0",
    "eslint-plugin-react-hooks": "^4.0.0",
    "jsdom": "^24.0.0",
    "prettier": "^3.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "tsup": "^8.0.0",
    "typescript": "^5.4.0",
    "typescript-eslint": "^8.0.0",
    "vite": "^5.0.0",
    "vite-tsconfig-paths": "^4.0.0",
    "vitest": "^1.0.0"
  },
  "scripts": {
    "build": "tsup",
    "build:watch": "tsup --watch",
    "clean": "rm -rf dist",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest --coverage",
    "lint": "eslint src --ext .ts,.tsx",
    "lint:fix": "eslint src --ext .ts,.tsx --fix",
    "format": "prettier --check src",
    "format:fix": "prettier --write src",
    "type-check": "tsc --noEmit",
    "validate": "npm run type-check && npm run lint && npm run format && npm run test",
    "prepublishOnly": "npm run build && npm run test && npm run lint",
    "prepack": "npm run build"
  }
}
```

### Complete tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020", "DOM"],
    "moduleResolution": "bundler",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "noPropertyAccessFromIndexSignature": true,
    "noFallthroughCasesInSwitch": true,
    "noImplicitReturns": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "./dist",
    "removeComments": false,
    "noEmit": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "jsx": "react-jsx",
    "jsxImportSource": "react",
    "baseUrl": "./src",
    "paths": {
      "@components/*": ["./components/*"],
      "@hooks/*": ["./hooks/*"],
      "@utils/*": ["./utils/*"],
      "@types/*": ["./types/*"]
    }
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist", "**/*.spec.ts", "**/*.test.ts"]
}
```

### Complete tsup.config.ts

```typescript
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  outExtension({ format }) {
    return format === 'esm' ? { js: '.mjs' } : { js: '.cjs' };
  },
  sourcemap: true,
  minify: false,
  clean: true,
  external: ['react', 'react-dom'],
  splitting: false,
});
```

---

## 9. References and Further Reading

### Official Documentation
- [TypeScript TSConfig Reference](https://www.typescriptlang.org/tsconfig/)
- [TypeScript strict Mode](https://www.typescriptlang.org/tsconfig/strict.html)
- [npm package.json Documentation](https://docs.npmjs.com/cli/v10/configuring-npm/package-json/)
- [Node.js Packages Documentation](https://nodejs.org/api/packages.html)

### Build Tools
- [tsup Official Documentation](https://tsup.egoist.dev/)
- [tsup GitHub Repository](https://github.com/egoist/tsup)
- [LogRocket Guide to tsup](https://blog.logrocket.com/tsup/)

### Module Systems and Publishing
- [TypeScript in 2025 with ESM and CJS npm publishing](https://lirantal.com/blog/typescript-in-2025-with-esm-and-cjs-npm-publishing)
- [Publishing dual ESM+CJS packages](https://mayank.co/blog/dual-packages/)
- [Ship ESM & CJS in one Package](https://antfu.me/posts/publish-esm-and-cjs)
- [Dual Publishing ESM and CJS Modules with tsup](https://johnnyreilly.com/dual-publishing-esm-cjs-modules-with-tsup-and-are-the-types-wrong)

### Testing
- [Vitest Getting Started](https://vitest.dev/guide/)
- [React Testing Setup: Vitest + TypeScript + React Testing Library](https://dev.to/kevinccbsg/react-testing-setup-vitest-typescript-react-testing-library-42c8)
- [Configuring Vitest](https://vitest.dev/config/)

### Code Quality
- [ESLint Documentation](https://eslint.org/)
- [typescript-eslint Documentation](https://typescript-eslint.io/)
- [Setting Up ESLint and Prettier for React + TypeScript](https://javascript.plainenglish.io/setting-up-a-react-typescript-project-with-vite-eslint-prettier-and-husky-ef7c9dada761)
- [How to Set Up ESLint and Prettier for React app in VSCode (2025)](https://dev.to/marina_eremina/how-to-set-up-eslint-and-prettier-for-react-app-in-vscode-2025-2341)

### Tree-Shaking and Optimization
- [Everything you never wanted to know about side effects](https://sgom.es/posts/2020-06-15-everything-you-never-wanted-to-know-about-side-effects/)
- [Deep Dive into SideEffects Configuration](https://dev.to/markliu2013/deep-dive-into-sideeffects-configuration-14me)
- [How to bundle a tree-shakable typescript library with tsup and publish with npm](https://dev.to/orabazu/how-to-bundle-a-tree-shakable-typescript-library-with-tsup-and-publish-with-npm-3c46)
- [Tree Shaking Guide - webpack](https://webpack.js.org/guides/tree-shaking/)

### Path Aliases
- [Using path aliases for cleaner React and TypeScript imports](https://blog.logrocket.com/using-path-aliases-cleaner-react-typescript-imports/)
- [How to Configure a Path Alias in React TypeScript](https://plusreturn.com/blog/how-to-configure-a-path-alias-in-a-react-typescript-app-for-cleaner-imports/)
- [Mastering Path Aliases: Simplify Your TypeScript Imports](https://medium.com/@robinviktorsson/mastering-path-aliases-simplify-your-typescript-imports-0954f4c810a4)

### React 19 & Dependencies
- [Resolving React 19 Dependency Conflicts Without Downgrading](https://medium.com/@zachshallbetter/resolving-react-19-dependency-conflicts-without-downgrading-ee0a808af2eb)
- [Understanding peer dependencies in JavaScript](https://medium.com/@joabi/peer-dependencies-explained-with-examples-f886cd260342)

### Additional Resources
- [TypeScript Best Practices in 2025](https://dev.to/mitu_mariam/typescript-best-practices-in-2025-57hb)
- [How to build a component library with React and TypeScript](https://blog.logrocket.com/how-to-build-component-library-react-typescript/)
- [TypeScript React Package Starter Template](https://github.com/TimMikeladze/typescript-react-package-starter)
- [Awesome TypeSafe Libraries](https://github.com/jellydn/awesome-typesafe)

---

## 10. Key Takeaways for 2025

1. **ESM/CJS Duality Remains**: Most libraries need both formats, though Node.js v22+ improves the situation
2. **Exports Field is Essential**: Use the modern `exports` field for fine-grained control
3. **Strict TypeScript is Standard**: Enable `"strict": true` and additional checks by default
4. **React 18/19 Compatibility**: Support both versions with version range `^18.0.0 || ^19.0.0`
5. **Type Definitions are Required**: Always include types in exports and fields
6. **Tree-Shaking Matters**: Mark `sideEffects` correctly for bundle optimization
7. **Modern Tooling**: Use tsup, Vitest, and ESLint flat config format
8. **JSX Runtime Modernization**: Use `"jsx": "react-jsx"` with automatic runtime
9. **Path Aliases Improve DX**: Configure meaningful path aliases for better imports
10. **Comprehensive Testing**: Include unit tests, linting, and formatting in your publishing pipeline

---

**Last Updated:** December 2025
**Research Source:** Comprehensive web research of current best practices, official documentation, and industry standards
