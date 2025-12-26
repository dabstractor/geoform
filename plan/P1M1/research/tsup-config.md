# tsup Configuration Best Practices for React TypeScript Libraries (2025)

## Research Summary

This document contains comprehensive research on configuring tsup for building modern React TypeScript libraries in 2025. Based on the latest documentation and real-world examples, this guide covers dual ESM/CJS builds, proper package.json configuration, tree-shaking optimization, and common gotchas.

**Current Version**: tsup 8.5.1 (released late 2025)

---

## 1. tsup.config.ts Setup for Dual ESM/CJS Builds

### 1.1 Basic Configuration with All Key Options

```typescript
import { defineConfig } from 'tsup';

export default defineConfig({
  // Entry Points
  entry: ['src/index.ts'],

  // Output Formats (dual ESM/CJS)
  format: ['esm', 'cjs'],

  // Output file extensions
  outExtension({ format }) {
    return {
      js: format === 'esm' ? '.mjs' : '.cjs',
    };
  },

  // TypeScript Declaration Files
  dts: true,

  // Source Maps for Debugging
  sourcemap: true,

  // Clean dist directory before build
  clean: true,

  // Target Environment
  target: 'es2020',

  // Minification
  minify: true,

  // Tree-shaking
  treeshake: true,

  // External Dependencies (Peer Dependencies)
  external: ['react', 'react-dom'],

  // Splitting code - keep files separate for better tree-shaking
  splitting: true,
});
```

### 1.2 Entry Points Configuration

tsup supports multiple ways to define entry points:

```typescript
// Single entry point
entry: ['src/index.ts']

// Multiple entry points
entry: {
  index: 'src/index.ts',
  button: 'src/components/Button.tsx',
  input: 'src/components/Input.tsx',
}

// Glob pattern for tree-shakable libraries
entry: ['src/**/*@(ts|tsx)', '!src/**/*.test.ts'],
```

**Best Practice**: Use a single main entry point (`src/index.ts`) for libraries unless you need subpath exports.

### 1.3 Output Formats

```typescript
format: ['esm', 'cjs']
```

This generates:
- `dist/index.mjs` - ESM format (modern, tree-shakable)
- `dist/index.cjs` - CommonJS format (Node.js, older tooling)
- `dist/index.d.ts` - TypeScript declarations

### 1.4 TypeScript Declaration Generation

```typescript
{
  dts: true,
  // OR for more control
  dts: {
    resolve: true,  // Resolve type dependencies
    entry: ['src/index.ts'],
  }
}
```

**Important**: By default, tsup generates a single `index.d.ts` file. For multiple entry points, declarations are generated for each entry.

### 1.5 External Dependencies (React as Peer Dependency)

```typescript
export default defineConfig({
  external: ['react', 'react-dom', '@emotion/react', '@emotion/styled'],
});
```

**Why This Matters**:
- Prevents bundling React inside your library
- Ensures only one React instance runs in the consumer's app
- Reduces bundle size significantly
- Consumer's build system handles React resolution

**In package.json**:
```json
{
  "peerDependencies": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0"
  },
  "devDependencies": {
    "@types/react": "^19.0.10",
    "@types/react-dom": "^19.0.4",
    "typescript": "^5.8.2"
  }
}
```

**Best Practice**: Add peer dependencies to both `peerDependencies` AND `devDependencies` so they're installed locally during development.

### 1.6 Source Maps Configuration

```typescript
export default defineConfig({
  // Enable source maps for debugging
  sourcemap: true,

  // For production, use linked source maps
  // sourcemap: 'linked',

  // Or use inline source maps for smaller deployments
  // sourcemap: 'inline',
});
```

**When to Use**:
- `true` - Generates separate `.js.map` files (recommended for production)
- `'linked'` - References external map files
- `'inline'` - Embeds maps in JS files (slower, larger)

### 1.7 Minification Options

```typescript
export default defineConfig({
  // Basic minification
  minify: true,

  // For development
  minify: false,

  // Production with source maps
  minify: 'terser',  // or 'esbuild' (default)
});
```

**Minification Best Practices**:
- Enable in production builds
- Always pair with source maps for debugging
- Use: `NODE_ENV=production npx tsup --minify`
- Dead code elimination works best with ESM format

### 1.8 Complete React Library Configuration Example

```typescript
import { defineConfig } from 'tsup';

export default defineConfig({
  // Core settings
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  outExtension({ format }) {
    return {
      js: format === 'esm' ? '.mjs' : '.cjs',
    };
  },

  // TypeScript
  dts: true,
  tsconfig: './tsconfig.json',

  // Output options
  clean: true,
  sourcemap: true,
  target: 'es2020',

  // Optimization
  minify: true,
  treeshake: true,
  splitting: true,

  // External dependencies
  external: ['react', 'react-dom'],

  // esbuild options for advanced control
  esbuildOptions(options) {
    options.banner = {
      js: '"use client"',  // For Next.js Server Components
    };
  },
});
```

---

## 2. Package.json Exports Field Configuration

### 2.1 Recommended Modern Structure (2025)

```json
{
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
    }
  },
  "sideEffects": false
}
```

### 2.2 Field Explanations

#### `type: "module"`
- Tells Node.js this package uses ESM by default
- Recommended for modern libraries

#### `main` Field
- Entry point for CommonJS consumers
- Should point to `.cjs` file
- Fallback for older tooling

#### `module` Field
- Entry point for ESM consumers (bundlers/modern tools)
- Should point to `.mjs` file
- Legacy convention (use `exports` instead)

#### `types` Field
- TypeScript declaration file location
- Applies to all export conditions

#### `exports` Field
- Modern conditional export configuration
- Routes different consumers to appropriate formats
- Encapsulates internal modules (only specified paths are accessible)

**Export Conditions Resolution Order**:
1. `import` - Used for ESM imports
2. `require` - Used for CommonJS requires
3. `types` - Used by TypeScript
4. `default` - Fallback for other tools

### 2.3 Advanced: Multiple Entry Points

For larger libraries with subpath exports:

```json
{
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
    "./button": {
      "import": {
        "types": "./dist/button.d.ts",
        "default": "./dist/button.mjs"
      },
      "require": {
        "types": "./dist/button.d.ts",
        "default": "./dist/button.cjs"
      }
    }
  }
}
```

Configure in tsup:
```typescript
entry: {
  index: 'src/index.ts',
  button: 'src/components/Button.tsx',
}
```

### 2.4 Complete package.json Example

```json
{
  "name": "my-react-library",
  "version": "1.0.0",
  "description": "A modern React component library",
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
    }
  },
  "files": [
    "dist"
  ],
  "sideEffects": false,
  "keywords": ["react", "component", "typescript"],
  "author": "Your Name",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/yourname/my-react-library"
  },
  "peerDependencies": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0"
  },
  "devDependencies": {
    "@types/react": "^19.0.10",
    "@types/react-dom": "^19.0.4",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "typescript": "^5.8.2",
    "tsup": "^8.5.1"
  },
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch",
    "lint": "tsc --noEmit",
    "type-check": "tsc --noEmit"
  }
}
```

---

## 3. TypeScript Configuration (tsconfig.json)

```json
{
  "compilerOptions": {
    // Module Resolution
    "module": "ESNext",
    "moduleResolution": "node",

    // JSX Configuration
    "jsx": "react-jsx",
    "jsxImportSource": "react",

    // Target
    "target": "ES2020",

    // Declarations
    "declaration": true,
    "declarationMap": true,
    "emitDeclarationOnly": false,

    // Lib
    "lib": ["ES2020", "DOM", "DOM.Iterable"],

    // Output
    "outDir": "./dist",
    "rootDir": "./src",

    // Strict Mode
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,

    // Incremental
    "incremental": true,
    "tsBuildInfoFile": ".tsbuildinfo"
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist", "**/*.test.ts", "**/*.test.tsx"]
}
```

---

## 4. Dependencies Needed (2025 Recommended Versions)

### Core Build Tools

```json
{
  "devDependencies": {
    "tsup": "^8.5.1",
    "typescript": "^5.8.2",
    "@types/react": "^19.0.10",
    "@types/react-dom": "^19.0.4"
  }
}
```

### Peer Dependencies

```json
{
  "peerDependencies": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0"
  }
}
```

### Complete Dev Dependencies for Full Stack

```json
{
  "devDependencies": {
    // Core build
    "tsup": "^8.5.1",
    "typescript": "^5.8.2",

    // React types
    "@types/react": "^19.0.10",
    "@types/react-dom": "^19.0.4",

    // Testing (optional)
    "vitest": "^2.1.0",
    "@testing-library/react": "^16.0.0",
    "@testing-library/jest-dom": "^6.5.0",

    // Linting & Formatting (optional)
    "@biomejs/biome": "^1.9.0",

    // Storybook (optional)
    "storybook": "^8.5.0",
    "@storybook/react": "^8.5.0"
  }
}
```

**Version Selection Notes**:
- **tsup**: Latest is 8.5.1 (released Dec 2025)
- **TypeScript**: 5.8.2+ recommended for full type safety
- **React**: 18.0+ required for modern features and types
- **@types packages**: Match React version major.minor

---

## 5. Common Gotchas for React Library Builds

### 5.1 "use client" Directive Not Preserved

**Problem**: The `"use client"` directive for Next.js Server Components is lost during bundling.

**Solutions**:

Option 1: Manual banner (not recommended - applies to all files):
```typescript
esbuildOptions(options) {
  options.banner = {
    js: '"use client"',
  };
}
```

Option 2: Add directive to source files directly:
```typescript
// src/Button.tsx
'use client';

export const Button = () => { ... }
```

**Best Practice**: Add `"use client"` directly in source files that need it. tsup preserves them correctly when configured properly.

### 5.2 JSX Runtime Configuration

**Problem**: Missing JSX runtime error

**Solution**:
```json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "react"
  }
}
```

This uses the modern JSX transform (doesn't require React import).

### 5.3 React Bundled Multiple Times

**Problem**: Consumer's bundle has two React instances causing state issues

**Cause**: React not marked as external

**Solution**:
```typescript
export default defineConfig({
  external: ['react', 'react-dom'],
});
```

### 5.4 Type Definitions Not Generated

**Problem**: `.d.ts` files missing from dist

**Causes & Solutions**:
```typescript
// Make sure dts is enabled
dts: true,

// Ensure tsconfig.json has:
{
  "compilerOptions": {
    "declaration": true,
  }
}

// Check TypeScript version (should be 5.0+)
```

### 5.5 CommonJS Consumers Can't Import

**Problem**: CJS consumers get errors with ESM-only output

**Solution**: Always build both formats:
```typescript
format: ['esm', 'cjs']
```

And ensure outExtension is set:
```typescript
outExtension({ format }) {
  return {
    js: format === 'esm' ? '.mjs' : '.cjs',
  };
}
```

### 5.6 Tree-Shaking Not Working

**Problem**: Unused code not removed from consumer bundle

**Causes**:
- Using CommonJS only (CJS is not tree-shakable)
- Code has side effects
- package.json missing `"sideEffects": false`

**Solutions**:
```typescript
// 1. Ensure ESM format
format: ['esm', 'cjs']

// 2. Add to package.json
"sideEffects": false

// 3. No side effects in source code
// Don't do: window.something = value; at top level
```

### 5.7 Path Exports Not Working

**Problem**: Subpath exports like `import Button from 'lib/button'` fail

**Solution**: Use exports field AND configure tsup entry points:

tsup.config.ts:
```typescript
entry: {
  index: 'src/index.ts',
  button: 'src/components/Button.tsx',
}
```

package.json:
```json
{
  "exports": {
    ".": { /* main export */ },
    "./button": {
      "import": "./dist/button.mjs",
      "require": "./dist/button.cjs",
      "types": "./dist/button.d.ts"
    }
  }
}
```

---

## 6. Tree-Shaking Best Practices

### 6.1 Enable ESM Format

```typescript
// Good - supports tree-shaking
format: ['esm', 'cjs']

// Bad - no tree-shaking
format: ['cjs']
```

ESM uses static imports/exports that bundlers can analyze statically.

### 6.2 Mark No Side Effects

```json
{
  "sideEffects": false
}
```

**Side effects** = code that runs on import with consequences:
- DOM manipulation
- Global variable assignment
- Polyfills
- CSS imports (⚠️ needs special handling)

**Bad**:
```typescript
// src/index.ts
console.log('Library loaded');  // SIDE EFFECT!

export const Button = () => { ... }
```

**Good**:
```typescript
// src/Button.tsx
export const Button = () => { ... }

// Only side effects in intentional files
```

### 6.3 Module Structure for Tree-Shaking

**Bad** (single file with everything):
```
src/
  index.ts (500 lines, all exports)
```

**Good** (modular structure):
```
src/
  index.ts (re-exports)
  components/
    Button.tsx
    Input.tsx
    Dialog.tsx
  hooks/
    useForm.ts
    usePagination.ts
```

Each file is a "leaf" that can be individually tree-shaken.

### 6.4 Import Practices for Consumers

**Bad** (imports whole library):
```typescript
import * as UI from 'my-lib';
const Button = UI.Button;
```

**Good** (named imports):
```typescript
import { Button } from 'my-lib';
```

The `Button` export can be included, unused exports excluded.

### 6.5 Verify Tree-Shaking Works

Use webpack-bundle-analyzer or Vite visualizer:

```bash
# After building consumer app
npm install --save-dev webpack-bundle-analyzer

# Analyze bundle
webpack-bundle-analyzer dist/bundle.js
```

**Expected Results**:
- Using one component: ~5-10KB per component
- Using two components: ~10-15KB (not doubling)
- Using all components: Full library size

### 6.6 tsup Configuration for Tree-Shaking

```typescript
export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],

  // Critical for tree-shaking
  treeshake: true,

  // Keep module structure
  splitting: true,

  // Use ESM format for consumers
  dts: true,

  // No side effects
  // + "sideEffects": false in package.json
});
```

---

## 7. Build and Development Commands

### 7.1 Package.json Scripts

```json
{
  "scripts": {
    "build": "tsup",
    "build:prod": "NODE_ENV=production tsup --minify",
    "dev": "tsup --watch",
    "check": "tsc --noEmit",
    "type-check": "tsc --noEmit",
    "validate": "tsc --noEmit && tsup"
  }
}
```

### 7.2 Command Line Usage

```bash
# Build once
npx tsup

# Watch mode
npx tsup --watch

# Build specific formats
npx tsup --format esm,cjs

# With minification
npx tsup --minify

# Production build
NODE_ENV=production tsup --minify

# Clean build
tsup --clean

# Generate declarations only
tsup --dts --no-bundle
```

---

## 8. Validation Tools

### 8.1 Are the Types Wrong?

Validate your package.json exports configuration:

```bash
npx @arethetypeswrong/cli --pack .
```

Checks:
- ESM/CJS export routing
- TypeScript resolution
- Missing declarations
- Dual package hazards

### 8.2 TypeScript Compiler

```bash
tsc --noEmit
```

Validates all TypeScript types without emitting files.

### 8.3 Local Testing

Before publishing:

```bash
# Link package locally
npm link

# In consumer app
npm link my-react-library

# Test the import
import { Component } from 'my-react-library';
```

---

## 9. Real-World Complete Example

### Full Project Structure

```
my-react-library/
  src/
    index.ts
    components/
      Button.tsx
      Input.tsx
    hooks/
      useForm.ts
    types/
      index.ts
  dist/
    index.mjs
    index.cjs
    index.d.ts
    button.mjs
    button.cjs
    button.d.ts
  tsup.config.ts
  tsconfig.json
  package.json
  README.md
  LICENSE
```

### tsup.config.ts

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
  tsconfig: './tsconfig.json',
  clean: true,
  sourcemap: true,
  target: 'es2020',
  minify: true,
  treeshake: true,
  splitting: true,
  external: ['react', 'react-dom'],
});
```

### tsconfig.json

```json
{
  "compilerOptions": {
    "module": "ESNext",
    "moduleResolution": "node",
    "jsx": "react-jsx",
    "target": "ES2020",
    "declaration": true,
    "declarationMap": true,
    "emitDeclarationOnly": false,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "incremental": true,
    "tsBuildInfoFile": ".tsbuildinfo"
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist", "**/*.test.ts", "**/*.test.tsx"]
}
```

### package.json

```json
{
  "name": "@yourorg/react-components",
  "version": "1.0.0",
  "description": "A performant, tree-shakable React component library",
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
    }
  },
  "files": [
    "dist"
  ],
  "sideEffects": false,
  "keywords": ["react", "components", "typescript"],
  "author": "Your Name",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/yourorg/react-components"
  },
  "peerDependencies": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0"
  },
  "devDependencies": {
    "@types/react": "^19.0.10",
    "@types/react-dom": "^19.0.4",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "typescript": "^5.8.2",
    "tsup": "^8.5.1"
  },
  "scripts": {
    "build": "tsup",
    "build:prod": "NODE_ENV=production tsup --minify",
    "dev": "tsup --watch",
    "check": "tsc --noEmit",
    "validate": "tsc --noEmit && tsup"
  }
}
```

---

## 10. Key References & Documentation

### Official Documentation
- **tsup Official Docs**: https://tsup.egoist.dev/
- **tsup GitHub**: https://github.com/egoist/tsup
- **tsup npm**: https://www.npmjs.com/package/tsup
- **Node.js Packages Documentation**: https://nodejs.org/api/packages.html

### Dual ESM/CJS Publishing
- **Johnny Reilly - Dual Publishing**: https://johnnyreilly.com/dual-publishing-esm-cjs-modules-with-tsup-and-are-the-types-wrong
- **Antfu - Ship ESM & CJS**: https://antfu.me/posts/publish-esm-and-cjs
- **Mayank - Dual Packages**: https://mayank.co/blog/dual-packages/
- **Liran Tal - TypeScript in 2025**: https://lirantal.com/blog/typescript-in-2025-with-esm-and-cjs-npm-publishing

### Tree-Shaking & Optimization
- **Dorshinar - Tree-Shakable Libraries**: https://dorshinar.me/posts/treeshaking-with-tsup
- **Spencer Miskoviak - Build with Tailwind**: https://www.skovy.dev/blog/build-component-libraries-with-tsup-tailwind
- **Carl Rippon - React Tree-Shaking**: https://carlrippon.com/how-to-make-your-react-component-library-tree-shakeable/

### Configuration Deep Dives
- **LogRocket - tsup Guide**: https://blog.logrocket.com/tsup/
- **Medium - Sundargautam - React NPM Packages**: https://medium.com/@sundargautam2022/creating-and-publishing-react-npm-packages-simply-using-tsup-6809168e4c86
- **Medium - Asaf Shakarzy - Minimal React Library**: https://medium.com/@asafshakarzy/setting-up-a-minimal-react-library-workspace-with-typescript-tsup-biome-and-storybook-e689f4703e26
- **Guide to package.json exports**: https://hirok.io/posts/package-json-exports

### Validation Tools
- **Are the Types Wrong**: Validation tool for ESM/CJS dual packages
- **Webpack Bundle Analyzer**: Bundle size analysis
- **ts-prune**: Identify unused exports

---

## 11. Quick Checklist for React Library Setup

- [ ] Create `tsup.config.ts` with ESM+CJS formats
- [ ] Set `external: ['react', 'react-dom']` to avoid bundling
- [ ] Enable `dts: true` for TypeScript declarations
- [ ] Configure `tsconfig.json` with `"jsx": "react-jsx"`
- [ ] Add React to `peerDependencies` in package.json
- [ ] Add React to `devDependencies` for local development
- [ ] Set `"type": "module"` in package.json (modern packages)
- [ ] Configure `exports` field with conditional imports
- [ ] Add `"sideEffects": false` for tree-shaking
- [ ] Enable `sourcemap: true` for debugging
- [ ] Test with `npm link` before publishing
- [ ] Run `@arethetypeswrong/cli` to validate exports
- [ ] Run TypeScript compiler check: `tsc --noEmit`
- [ ] Test in actual Next.js/Vite project
- [ ] Check bundle size is reasonable

---

## Document Version

- **Last Updated**: December 2025
- **tsup Version**: 8.5.1
- **TypeScript Version**: 5.8.2
- **React Version**: 18.0+
- **Node.js**: 16.0+ (with 18+ recommended)

