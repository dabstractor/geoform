# tsup Configuration - Quick Reference Card

## Fastest Setup (Copy & Paste)

### tsup.config.ts
```typescript
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  outExtension({ format }) {
    return { js: format === 'esm' ? '.mjs' : '.cjs' };
  },
  dts: true,
  sourcemap: true,
  clean: true,
  target: 'es2020',
  minify: true,
  treeshake: true,
  splitting: true,
  external: ['react', 'react-dom'],
});
```

### tsconfig.json (Essential Parts)
```json
{
  "compilerOptions": {
    "module": "ESNext",
    "moduleResolution": "node",
    "jsx": "react-jsx",
    "target": "ES2020",
    "declaration": true,
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
```

### package.json (Key Sections)
```json
{
  "type": "module",
  "main": "./dist/index.cjs",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": { "types": "./dist/index.d.ts", "default": "./dist/index.mjs" },
      "require": { "types": "./dist/index.d.ts", "default": "./dist/index.cjs" }
    }
  },
  "files": ["dist"],
  "sideEffects": false,
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
    "dev": "tsup --watch"
  }
}
```

---

## Essential Checklist

- [ ] `external: ['react', 'react-dom']` - Don't bundle React
- [ ] `format: ['esm', 'cjs']` - Support both module types
- [ ] `dts: true` - Generate TypeScript declarations
- [ ] `"type": "module"` in package.json
- [ ] `"sideEffects": false` in package.json
- [ ] `"jsx": "react-jsx"` in tsconfig.json
- [ ] `"exports"` field with conditional imports
- [ ] `"peerDependencies"` for React
- [ ] `"devDependencies"` includes React for dev

---

## Gotchas Summary

| Problem | Fix |
|---------|-----|
| React appears twice | Add `external: ['react']` |
| Can't tree-shake | Use ESM, set `"sideEffects": false` |
| No .d.ts files | Enable `dts: true` |
| Type imports fail | Add `"exports"` field to package.json |
| Slow builds | Add `--watch` or use dev mode |
| JSX breaks | Use `"jsx": "react-jsx"` |

---

## Validation Commands

```bash
# Check TypeScript
tsc --noEmit

# Validate exports
npx @arethetypeswrong/cli --pack .

# Build with watch
npm run dev

# Production build
NODE_ENV=production npm run build -- --minify

# Test locally
npm link
cd ../test-app && npm link my-package
```

---

## Tree-Shaking Checklist

- [ ] ESM format included: `format: ['esm', 'cjs']`
- [ ] Side effects marked: `"sideEffects": false`
- [ ] No global code execution on import
- [ ] Each component in separate file
- [ ] Named exports (not default)
- [ ] Consumers use named imports: `import { Button }`
- [ ] Verify with bundle analyzer

---

## Versions (Dec 2025)

```
tsup:                8.5.1
TypeScript:          5.8.2
React:               18.0+
@types/react:        19.0.10
@types/react-dom:    19.0.4
Node.js:             18+ (22+ recommended)
```

---

## File Structure

```
src/
  index.ts                    # Main entry point
  components/
    Button.tsx               # Each component separate
    Input.tsx
  hooks/
    useForm.ts
tsup.config.ts               # Build config
tsconfig.json                # TS config
package.json                 # NPM package
```

---

## Common Commands

```bash
# Install dependencies
npm install

# Develop with watch
npm run dev

# Build for production
npm run build

# Check types
npm run check

# Validate everything
npm run validate

# Link locally for testing
npm link
```

---

## Output Files After Build

```
dist/
  index.mjs          # ESM format
  index.cjs          # CommonJS format
  index.d.ts         # TypeScript declarations
  index.js.map       # Source maps (if enabled)
```

---

For comprehensive details, see `tsup-config.md`
For research methodology, see `RESEARCH_SUMMARY.md`
