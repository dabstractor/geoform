# Vitest Configuration Research - Complete Index

**Created:** December 26, 2025
**Research Focus:** Vitest 4.0 configuration for React libraries (TypeScript)
**Target:** Production-ready setup for modern React development

---

## Documents Generated

### 1. **vitest-config.md** (24 KB, 943 lines)
**Comprehensive Reference Document**

Complete guide covering all aspects of Vitest configuration for React libraries:

- **vitest.config.ts Setup** - Minimal and production-ready configurations
- **Vitest Setup File** - TypeScript and JavaScript setup examples
- **Dependencies** - Exact package versions and peer dependencies
- **Common Gotchas & Pitfalls** - 10 detailed problems and solutions
- **Environment Comparison** - jsdom vs happy-dom analysis
- **Coverage Configuration** - V8 and Istanbul providers
- **Path Aliases & TypeScript** - vite-tsconfig-paths setup
- **Best Practices** - User-centric testing patterns
- **File Structure Example** - Recommended project layout
- **Migration Guide** - Jest to Vitest conversion
- **Complete Templates** - Ready-to-use configurations
- **Sources & References** - 25+ authoritative sources

**Use This For:** Deep understanding, comprehensive reference, troubleshooting

---

### 2. **VITEST_QUICK_SETUP.md** (3.5 KB)
**Copy-Paste Ready Quick Setup**

Minimal, practical guide for immediate implementation:

- One-command installation script
- vitest.config.ts template
- vitest.setup.ts template
- tsconfig.json additions
- package.json scripts
- Simple test example
- Run commands
- Common troubleshooting (4 scenarios)
- Key 2025 facts

**Use This For:** Rapid setup, reference during implementation, troubleshooting

---

## Key Information Summary

### Latest Versions (December 2025)

| Package | Version | Released | Key Info |
|---------|---------|----------|----------|
| **vitest** | 4.0.16 | Dec 2025 | Stable Browser Mode, Visual Regression Testing |
| **@testing-library/react** | 15.0+ | Late 2025 | Requires React 18+ |
| **@testing-library/jest-dom** | 6.9.1 | Sep 2025 | Use `/vitest` import with Vitest |
| **@testing-library/user-event** | 14.5.1 | 2025 | User interaction simulation |
| **@testing-library/dom** | 10.4.1 | Aug 2025 | Required peer dependency |
| **jsdom** | 25.0+ | 2025 | Best for React compatibility |
| **@vitest/coverage-v8** | 4.0.16 | Dec 2025 | 40% faster than Istanbul |
| **vite-tsconfig-paths** | 5.0+ | 2025 | Auto-resolve TypeScript paths |

### Critical Configuration Files

#### vitest.config.ts (Minimal)
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

#### vitest.setup.ts
```typescript
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'

afterEach(() => { cleanup() })
```

#### tsconfig.json (Essential Additions)
```json
{
  "compilerOptions": {
    "types": ["vitest/globals", "@testing-library/jest-dom"],
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@components/*": ["src/components/*"]
    }
  }
}
```

---

## Top 10 Best Practices for 2025

1. **Use Vitest 4.0.16+** - Latest stable with production-ready Browser Mode
2. **Globals: true** - Set in config for cleaner test syntax
3. **jsdom Environment** - Most compatible; switch to happy-dom only after benchmarking
4. **V8 Coverage** - Default provider (40% faster than Istanbul)
5. **vite-tsconfig-paths** - Automatic TypeScript path resolution
6. **User-Centric Testing** - Test behavior, not implementation details
7. **Semantic Queries** - Use `getByRole`, avoid `getByTestId`
8. **Manual Mocking** - Unlike Jest, Vitest requires explicit mocks
9. **Test Isolation** - Always run cleanup in afterEach
10. **React 19 Compatible** - Use RTL 15.0+ and vitest 4.0+

---

## Common Gotchas Checklist

- [ ] Added `"vitest/globals"` to tsconfig.json types
- [ ] Using `@testing-library/jest-dom/vitest` import, not matchers
- [ ] Set `globals: true` in vitest config
- [ ] Imported `cleanup` and added `afterEach` in setup file
- [ ] Manually mocked modules (Vitest doesn't auto-mock)
- [ ] Testing user behavior, not implementation
- [ ] Using `screen` for queries, not `container`
- [ ] Awaiting async queries properly
- [ ] Clearing mocks between tests

---

## Quick Decision Tree

### Q: How do I start testing React components?
**A:** Copy templates from VITEST_QUICK_SETUP.md, run npm install, then npm test

### Q: Should I use jsdom or happy-dom?
**A:** Start with jsdom; benchmark happy-dom if performance is an issue

### Q: Do I need to mock everything like Jest?
**A:** No, but Vitest doesn't auto-mock - only mock what you need manually

### Q: How do I set up path aliases?
**A:** Install vite-tsconfig-paths, add to plugins, configure tsconfig.json paths

### Q: What's the coverage configuration?
**A:** V8 provider (default) with include/exclude patterns and thresholds (80%)

### Q: Can I test React Server Components?
**A:** No, use E2E tests. Vitest is for sync unit tests only

### Q: What about TypeScript errors with matchers?
**A:** Ensure types config includes "vitest/globals" and "@testing-library/jest-dom"

---

## File Locations in Project

```
/home/dustin/projects/geoform-opus/plan/P1M1/research/
├── vitest-config.md                    (Complete guide, 943 lines)
├── VITEST_QUICK_SETUP.md              (Quick reference, copy-paste ready)
└── VITEST_RESEARCH_INDEX.md           (This file, navigation guide)
```

---

## Official Resources Referenced

**Core Documentation:**
- Vitest Official Guide: https://vitest.dev/guide/
- Vitest Configuration: https://vitest.dev/config/
- Vitest Coverage: https://vitest.dev/guide/coverage
- Testing Library React: https://testing-library.com/docs/react-testing-library/setup/

**Key Technical Posts:**
- Vitest 4.0 Release: https://vitest.dev/blog/vitest-4
- Component Testing: https://vitest.dev/guide/browser/component-testing
- Vitest + RTL Guide: https://blog.incubyte.co/blog/vitest-react-testing-library-guide/
- Path Aliases Setup: https://www.timsanteford.com/posts/setting-up-vitest-to-support-typescript-path-aliases/
- React 19 Compatibility: https://www.thecandidstartup.org/2025/03/31/vitest-3-vite-6-react-19.html

---

## Implementation Roadmap

### Phase 1: Initial Setup (15 mins)
1. Run npm install command from VITEST_QUICK_SETUP.md
2. Copy vitest.config.ts template
3. Copy vitest.setup.ts template
4. Update tsconfig.json with type definitions
5. Add test script to package.json
6. Run `npm test` to verify setup

### Phase 2: First Test (30 mins)
1. Create simple component
2. Create test file (component.test.tsx)
3. Write basic render test
4. Add user interaction test
5. Run tests and verify passing

### Phase 3: Coverage Setup (15 mins)
1. Run `npm run test:coverage`
2. Review HTML coverage report
3. Adjust coverage thresholds if needed
4. Configure CI to run coverage checks

### Phase 4: Project Standards (30 mins)
1. Set up ESLint for testing best practices
2. Document test conventions
3. Create test helpers/utilities
4. Set up pre-commit hooks for tests

---

## Notes for Team

### What Changed from Jest
- **No auto-mocking** - Must explicitly mock modules
- **Config file** - vitest.config.ts instead of jest.config.js
- **Import path** - @testing-library/jest-dom/vitest instead of /matchers
- **Setup file** - setupFiles instead of setupFilesAfterEnv
- **Speed** - Vitest is significantly faster due to Vite integration
- **ESM first** - Native ES modules support (no Babel required)

### Why Vitest for React Libraries in 2025
- Unified config with Vite (no duplicate configurations)
- 40-60% faster test execution
- Native TypeScript support
- Smaller bundle size
- Better DX with hot reload in watch mode
- Growing ecosystem (most libraries support it)
- React team recommends Vite as build tool

### Potential Challenges
- Fewer StackOverflow answers (Jest is older)
- Some older Jest-specific libraries won't work directly
- Manual mocking required (more verbose initially)
- Browser Mode still relatively new (though stable in v4)

---

## Maintenance & Updates

**Last Reviewed:** December 26, 2025

**Vitest 4.0.16 Status:**
- Stable and production-ready
- Browser Mode now stable (no longer experimental)
- Visual Regression Testing support
- OpenTelemetry traces (experimental)
- File system cache (experimental)

**Next Major Version:** Vitest 5.0 (ETA 2026)
- Keep eye on breaking changes
- Migration docs available in Vitest blog

---

## Quick Links to Documentation Sections

### In vitest-config.md:
- Line ~25: vitest.config.ts Setup
- Line ~130: Vitest Setup File
- Line ~190: Dependencies
- Line ~340: Common Gotchas & Pitfalls
- Line ~560: Environment Comparison
- Line ~620: Coverage Configuration
- Line ~700: Path Aliases & TypeScript
- Line ~800: Best Practices

---

## Support & Next Steps

For questions or issues:

1. **Quick answers:** See VITEST_QUICK_SETUP.md troubleshooting section
2. **Detailed info:** Search vitest-config.md Table of Contents
3. **Official docs:** Links in Sources section
4. **Common problems:** Check "Common Gotchas & Pitfalls" section

---

**Status:** Complete and ready for implementation
**Date Generated:** December 26, 2025
**Researcher:** Web Search Specialist
**Sources:** 25+ authoritative resources
