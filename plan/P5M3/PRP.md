# PRP: README Documentation

**Milestone**: P5.M3 - README Documentation
**Task**: P5.M3.T1 - Write README.md
**Confidence Score**: 9/10 (comprehensive research, clear patterns from JSDoc and examples)

---

## Goal

**Feature Goal**: Create a comprehensive, production-quality README.md that enables developers to understand, install, and effectively use geoform within 10 minutes.

**Deliverable**: A single `README.md` file at the repository root that includes installation instructions, quick start guide, API reference, TypeScript patterns, and usage examples.

**Success Definition**:
- A developer unfamiliar with geoform can install and render their first nested form in under 10 minutes
- All public API surface is documented with types and examples
- README follows React library best practices (react-hook-form, zustand, jotai patterns)
- Documentation aligns with existing JSDoc comments in the codebase

## User Persona

**Target User**: React/TypeScript developers building applications that require nested, hierarchical form workflows (CRM systems, admin panels, data entry applications).

**Use Case**: Developer discovers geoform via npm/GitHub, needs to quickly evaluate if it solves their nested form challenges, then implement it in their project.

**User Journey**:
1. Lands on GitHub/npm page → sees hero statement and features
2. Reads Quick Start → understands core pattern (FormStackProvider + useFormStack + FormProps)
3. Scans API Reference → finds specific hook/component documentation
4. Copies example code → adapts to their use case
5. References Advanced Usage for edge cases (URL sync, error handling, breadcrumbs)

**Pain Points Addressed**:
- "How do I preserve parent form state when opening a child form?"
- "How do I get typed data back from a submitted nested form?"
- "How do I implement breadcrumb navigation for my form hierarchy?"

## Why

- **Business Value**: README is the primary discovery point for npm libraries; quality documentation directly impacts adoption
- **Integration**: Aligns with existing JSDoc documentation in `src/index.ts` and component files
- **Problems Solved**:
  - Provides single source of truth for geoform usage
  - Reduces time-to-first-form for new developers
  - Documents TypeScript patterns for type-safe nested forms

## What

A comprehensive README.md with the following sections:

1. **Header**: Package name, tagline, badges (npm, bundle size, license, TypeScript)
2. **Features**: 5 key benefits with brief descriptions
3. **Installation**: npm/yarn/pnpm commands
4. **Quick Start**: Self-contained example showing FormStackProvider + useFormStack + FormProps pattern
5. **Core Concepts**: Mental model explanation (stack, state preservation, promise-based API)
6. **API Reference**: All exported components, hooks, and types with signatures and examples
7. **Advanced Usage**: URL sync, confirmation dialogs, error boundaries, breadcrumb customization
8. **TypeScript Support**: Generic patterns, type inference, type-safe forms
9. **Examples**: Link to examples/relational-forms with brief explanation
10. **Contributing**: Basic contribution guidelines
11. **License**: MIT

### Success Criteria

- [ ] Quick Start example is copy-paste ready and works immediately
- [ ] All 5 components documented: FormStackProvider, Breadcrumbs, ConfirmationDialog, FormErrorBoundary
- [ ] All 4 hooks documented: useFormStack, useFormStackState, useFormStackActions, useFormStackURLSync
- [ ] All 6 exported types documented: FormProps, OpenFormOptions, StackEntry, FormStackState, FormStackActions
- [ ] TypeScript generics explained with progressive disclosure (simple → advanced)
- [ ] Code examples match patterns in examples/relational-forms/
- [ ] Bundle size and peer dependencies documented
- [ ] Passes "10-minute first form" test for new developers

---

## All Needed Context

### Context Completeness Check

_"If someone knew nothing about this codebase, would they have everything needed to implement this successfully?"_

Yes - this PRP includes:
- Complete public API surface from src/index.ts
- All JSDoc examples from component/hook files
- Working patterns from examples/relational-forms/
- Package.json metadata (version, peer deps, scripts)
- README best practices from react-hook-form, zustand, jotai research

### Documentation & References

```yaml
# MUST READ - Include these in your context window
- file: src/index.ts
  why: Master export file with complete JSDoc documentation for all public APIs
  pattern: JSDoc examples are production-ready and should be adapted for README
  gotcha: Some JSDoc examples use abbreviated syntax; expand for README clarity

- file: examples/relational-forms/App.tsx
  why: Complete working example of FormStackProvider + useFormStack pattern
  pattern: Shows how to handle openForm() result, integrate Breadcrumbs, manage state
  gotcha: Example uses crypto.randomUUID() for IDs - note this is browser-only

- file: examples/relational-forms/TeamForm.tsx
  why: Demonstrates nested form opening (parent opens child, awaits result)
  pattern: async/await openForm(), conditional result handling, state preservation
  gotcha: Shows proper useState pattern preserved across child form lifecycle

- file: examples/relational-forms/UserForm.tsx
  why: Simplest form example - leaf node in hierarchy
  pattern: FormProps<T> implementation, onSubmit/onCancel usage, validation pattern
  gotcha: Uses button type="button" not "submit" to prevent form submission

- file: package.json
  why: Extract version, peer dependencies, scripts, keywords for README
  pattern: peerDependencies for compatibility table, scripts for development section
  critical: React 18/19 compatibility, zero runtime dependencies

- file: src/hooks/useFormStackURLSync.ts
  why: Advanced feature documentation - URL sync hook API
  pattern: Options interface, return type, browser navigation behavior
  gotcha: Safe for SSR (checks typeof window), uses pushState/replaceState

- file: src/components/Breadcrumbs.tsx
  why: Breadcrumbs component API and CSS class documentation
  pattern: BreadcrumbsProps interface, CSS class names for styling
  gotcha: Returns null if stack is empty

- file: src/components/FormErrorBoundary.tsx
  why: Error boundary documentation - only class component in library
  pattern: Props interface, retry/dismiss behavior, custom fallback
  gotcha: Class component required for getDerivedStateFromError/componentDidCatch
```

### Current Codebase tree

```bash
.
├── examples
│   └── relational-forms
│       ├── App.tsx
│       ├── OrganizationForm.tsx
│       ├── TeamForm.tsx
│       ├── types.ts
│       └── UserForm.tsx
├── src
│   ├── components
│   │   ├── Breadcrumbs.tsx
│   │   ├── ConfirmationDialog.tsx
│   │   ├── FormErrorBoundary.tsx
│   │   ├── FormStackProvider.tsx
│   │   ├── FormStackRenderer.tsx
│   │   └── index.ts
│   ├── context
│   │   ├── FormStackContext.ts
│   │   ├── formStackReducer.ts
│   │   └── index.ts
│   ├── hooks
│   │   ├── index.ts
│   │   ├── useFormStackActions.ts
│   │   ├── useFormStackState.ts
│   │   ├── useFormStack.ts
│   │   └── useFormStackURLSync.ts
│   ├── types
│   │   ├── context.ts
│   │   ├── form.ts
│   │   ├── index.ts
│   │   └── stack.ts
│   ├── utils
│   │   ├── createDeferredPromise.ts
│   │   ├── index.ts
│   │   └── urlEncoding.ts
│   └── index.ts
├── package.json
├── tsconfig.json
├── tsup.config.ts
└── vitest.config.ts
```

### Desired Codebase tree with files to be added

```bash
.
├── README.md                    # NEW: Comprehensive documentation file
├── examples/...
├── src/...
├── package.json
└── ...
```

### Known Gotchas of our codebase & Library Quirks

```markdown
# CRITICAL: React 18/19 only - hooks API
# geoform uses React hooks (useContext, useReducer, useMemo)
# peerDependencies: "react": "^18.0.0 || ^19.0.0"

# CRITICAL: FormProps<T> generic typing
# The T type parameter flows through: FormProps<T> → OpenFormOptions<T> → Promise<T | undefined>
# This enables full type safety from form definition to result handling

# CRITICAL: Context splitting pattern
# Two contexts exist: FormStackStateContext and FormStackActionsContext
# useFormStackState re-renders on stack changes; useFormStackActions does not
# Document performance optimization: use split hooks when only reading OR only dispatching

# GOTCHA: openForm() returns Promise<T | undefined>
# undefined = user cancelled; T = user submitted
# Always check result before using: if (result) { ... }

# GOTCHA: Forms must use button type="button", not "submit"
# Prevents browser form submission; all control via onSubmit/onCancel callbacks

# GOTCHA: confirmOnCancel shows native <dialog> element
# Uses showModal() API - graceful fallback for JSDOM/SSR environments

# GOTCHA: CSS classes are provided but no default styles
# Components export CSS class names for styling but no bundled CSS
# Document all class names for each component

# PATTERN: Form ID should be unique per form instance
# When opening multiple forms of same type, use dynamic IDs: `add-user-${Date.now()}`
```

---

## Implementation Blueprint

### README Structure and Sections

The README should follow this exact structure (order matters for discoverability):

```markdown
1. # geoform (h1)
2. Hero statement + badges (npm, size, license, typescript)
3. ## Features (h2) - 5 bullet points
4. ## Installation (h2)
5. ## Quick Start (h2) - under 30 lines of code
6. ## Core Concepts (h2) - mental model explanation
7. ## API Reference (h2)
   7.1 ### Components (h3)
       - FormStackProvider
       - Breadcrumbs
       - ConfirmationDialog
       - FormErrorBoundary
   7.2 ### Hooks (h3)
       - useFormStack
       - useFormStackState
       - useFormStackActions
       - useFormStackURLSync
   7.3 ### Types (h3)
       - FormProps<T>
       - OpenFormOptions<T>
       - StackEntry
       - FormStackState
       - FormStackActions
8. ## Advanced Usage (h2)
   - URL Sync
   - Confirmation Dialogs
   - Error Boundaries
   - Custom Breadcrumbs Styling
9. ## TypeScript (h2) - generic patterns
10. ## Examples (h2) - link to examples/relational-forms
11. ## Browser Support (h2)
12. ## Contributing (h2)
13. ## License (h2)
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: CREATE README.md with header section
  - IMPLEMENT: Package name, tagline, badges row
  - CONTENT:
    - Title: "# geoform"
    - Tagline: "React Hierarchical Form Stack System - infinitely nestable forms with state preservation"
    - Badges: npm version, bundle size, license (MIT), TypeScript
  - PATTERN: Use markdown badge syntax from popular libraries (zustand, jotai)
  - PLACEMENT: Repository root /README.md

Task 2: ADD Features section
  - IMPLEMENT: 5 key features as bullet points
  - CONTENT:
    1. Infinitely nestable forms with state preservation
    2. Promise-based async/await API
    3. Full TypeScript support with generics
    4. Built-in breadcrumb navigation
    5. Error boundaries per form
  - PATTERN: Short, scannable bullet points (one line each)
  - FOLLOW: JSDoc core concepts from src/index.ts lines 38-44

Task 3: ADD Installation section
  - IMPLEMENT: npm/yarn/pnpm installation commands
  - CONTENT: Package name "geoform", peer deps note (React 18/19)
  - PATTERN: Code blocks with copy-paste commands

Task 4: ADD Quick Start section
  - IMPLEMENT: Complete, self-contained example in ~25 lines
  - CONTENT:
    - FormStackProvider wrapper
    - Simple form with FormProps<T>
    - openForm() usage with await
    - Result handling (submit vs cancel)
  - FOLLOW PATTERN: examples/relational-forms/App.tsx + UserForm.tsx combined
  - CRITICAL: Must be copy-paste ready, all imports shown

Task 5: ADD Core Concepts section
  - IMPLEMENT: Mental model explanation
  - CONTENT:
    - Form Stack: Stack of suspended components, only top visible
    - State Preservation: Parent forms remain mounted (hidden) while children active
    - Promise-Based API: openForm() returns Promise, resolves on submit/cancel
    - Breadcrumb Navigation: Click to navigate, cancels intermediate forms
    - Error Isolation: Each form wrapped in error boundary
  - FOLLOW: src/index.ts JSDoc lines 38-44

Task 6: ADD API Reference - Components section
  - IMPLEMENT: Documentation for 4 exported components
  - COMPONENTS:
    1. FormStackProvider - props, usage, example
    2. Breadcrumbs - props (separator, className, ariaLabel), CSS classes, example
    3. ConfirmationDialog - props, usage pattern, example
    4. FormErrorBoundary - props, retry/dismiss behavior, example
  - FOLLOW PATTERN: JSDoc from each component file
  - INCLUDE: Complete TypeScript interfaces for props

Task 7: ADD API Reference - Hooks section
  - IMPLEMENT: Documentation for 4 exported hooks
  - HOOKS:
    1. useFormStack - returns {stack, openForm, closeForm}, primary hook
    2. useFormStackState - returns {stack}, re-renders on changes, performance note
    3. useFormStackActions - returns {openForm, closeForm, popToIndex}, no re-renders
    4. useFormStackURLSync - options, returns, URL format, example
  - FOLLOW PATTERN: JSDoc from src/hooks/*.ts
  - INCLUDE: Return type interfaces with all properties

Task 8: ADD API Reference - Types section
  - IMPLEMENT: Documentation for 5 exported types
  - TYPES:
    1. FormProps<T> - onSubmit, onCancel, onError; generic explanation
    2. OpenFormOptions<T> - id, component, label, confirmOnCancel
    3. StackEntry - id, label (public view)
    4. FormStackState - stack: readonly StackEntry[]
    5. FormStackActions - openForm, closeForm, popToIndex signatures
  - FOLLOW PATTERN: src/types/*.ts JSDoc
  - INCLUDE: Full interface definitions in code blocks

Task 9: ADD Advanced Usage section
  - IMPLEMENT: 4 advanced patterns with examples
  - PATTERNS:
    1. URL Sync - useFormStackURLSync() setup, URL format, back/forward support
    2. Confirmation Dialogs - confirmOnCancel option, custom dialog content
    3. Error Boundaries - onError callback for logging, custom fallback UI
    4. Breadcrumb Styling - CSS class names list, custom separator
  - FOLLOW: JSDoc examples from respective component/hook files

Task 10: ADD TypeScript section
  - IMPLEMENT: Progressive disclosure of generic patterns
  - CONTENT:
    1. Basic usage (no explicit generics needed)
    2. Typed form data - FormProps<UserData>
    3. Typed openForm - await openForm<UserData>({...})
    4. Type flow explanation: FormProps<T> → OpenFormOptions<T> → Promise<T | undefined>
  - CRITICAL: Show type inference benefits, error cases TypeScript catches

Task 11: ADD Examples, Browser Support, Contributing, License sections
  - IMPLEMENT: Final README sections
  - CONTENT:
    - Examples: Link to examples/relational-forms/, brief description of hierarchy
    - Browser Support: Modern browsers (ES2020+), React 18/19, SSR notes
    - Contributing: Basic guidelines (issues, PRs, code style)
    - License: MIT with link to LICENSE file
  - PATTERN: Keep concise; these are reference sections
```

### Implementation Patterns & Key Details

```typescript
// FormProps<T> pattern - show in API Reference
interface FormProps<T = unknown> {
  onSubmit: (value: T) => void;
  onCancel: () => void;
  onError?: (error: unknown) => void;
}

// Usage example for Quick Start section
function UserForm({ onSubmit, onCancel }: FormProps<UserData>) {
  const [name, setName] = useState('');

  return (
    <form>
      <input value={name} onChange={(e) => setName(e.target.value)} />
      <button type="button" onClick={() => onSubmit({ name })}>Save</button>
      <button type="button" onClick={onCancel}>Cancel</button>
    </form>
  );
}

// openForm pattern - show result handling
const result = await openForm<UserData>({
  id: 'create-user',
  component: UserForm,
  label: 'Create User',
});

if (result) {
  // User submitted - result is typed as UserData
  console.log('Created:', result.name);
}
// If undefined, user cancelled - no action needed

// Performance hooks pattern - show context splitting
// When only reading state:
const { stack } = useFormStackState();

// When only dispatching actions (no re-renders on stack changes):
const { openForm } = useFormStackActions();

// When need both (most common):
const { stack, openForm, closeForm } = useFormStack();
```

### Breadcrumbs CSS Classes (document in API Reference)

```css
/* All CSS classes provided by Breadcrumbs component */
.breadcrumbs                /* nav element container */
.breadcrumbs__list          /* ol element */
.breadcrumbs__item          /* li element for each entry */
.breadcrumbs__link          /* a element for clickable items */
.breadcrumbs__current       /* span element for current form */
.breadcrumbs__separator     /* span element for separators */
```

### ConfirmationDialog CSS Classes

```css
.confirmation-dialog
.confirmation-dialog__content
.confirmation-dialog__title
.confirmation-dialog__message
.confirmation-dialog__actions
.confirmation-dialog__button
.confirmation-dialog__button--cancel
.confirmation-dialog__button--confirm
```

### FormErrorBoundary CSS Classes

```css
.form-error-boundary
.form-error-boundary__container
.form-error-boundary__title
.form-error-boundary__message
.form-error-boundary__actions
.form-error-boundary__retry-button
.form-error-boundary__dismiss-button
```

---

## Validation Loop

### Level 1: Syntax & Style (Markdown Validation)

```bash
# Verify markdown renders correctly (manual check in VS Code preview or GitHub)
# Check for:
# - All code blocks have language specifiers (```tsx, ```bash, etc.)
# - All links are valid
# - Headers follow correct hierarchy (h1 → h2 → h3)
# - Badge URLs are valid

# Lint check if markdownlint is available
npx markdownlint README.md --fix 2>/dev/null || echo "markdownlint not available, skip"
```

### Level 2: Content Accuracy (Code Validation)

```bash
# Verify all code examples compile (create temp file and type-check)
# Extract code blocks and verify they match actual API

# Type-check the codebase to ensure examples match exports
npm run type-check

# Expected: Zero type errors
```

### Level 3: Integration Testing (Documentation Accuracy)

```bash
# Verify package.json metadata matches README claims
cat package.json | jq '.version, .peerDependencies, .license'

# Verify exports match documented API
cat src/index.ts | grep "^export"

# Run tests to ensure documented features work
npm run test

# Expected: All tests pass, all documented exports exist
```

### Level 4: User Experience Validation

```bash
# Manual validation checklist:
# 1. Open README in GitHub preview mode
# 2. Verify Quick Start example is copy-paste ready
# 3. Verify all code blocks have proper syntax highlighting
# 4. Verify table of contents would work (if using GitHub auto-TOC)
# 5. Test all external links (npm, GitHub)

# Build package to verify it matches README claims
npm run build

# Expected: Build succeeds, dist/ contains documented exports
```

---

## Final Validation Checklist

### Technical Validation

- [ ] README.md created at repository root
- [ ] All code examples compile (match TypeScript types)
- [ ] Package version/dependencies match package.json
- [ ] All documented exports exist in src/index.ts

### Content Validation

- [ ] Quick Start is under 30 lines, copy-paste ready
- [ ] All 4 components documented with props and examples
- [ ] All 4 hooks documented with return types and examples
- [ ] All 5 types documented with interfaces
- [ ] TypeScript generics explained with progression
- [ ] CSS class names listed for styling components

### User Experience Validation

- [ ] Developer can complete Quick Start in under 10 minutes
- [ ] API Reference is scannable with clear section headers
- [ ] Advanced patterns are discoverable but not overwhelming
- [ ] Examples section links to working code

### Documentation Quality

- [ ] Consistent code style (semicolons, quotes, formatting)
- [ ] All code blocks have language specifiers
- [ ] No broken internal/external links
- [ ] Badges render correctly (npm, license, TypeScript)

---

## Anti-Patterns to Avoid

- ❌ Don't document internal APIs (FormStackRenderer, createDeferredPromise, InternalStackEntry)
- ❌ Don't show incomplete code examples (always show imports)
- ❌ Don't use JSDoc @link syntax in README (use markdown links instead)
- ❌ Don't repeat the same example in multiple sections (adapt for each context)
- ❌ Don't include time estimates or implementation timeline
- ❌ Don't document undocumented features or future plans
- ❌ Don't add inline comments explaining obvious code in examples
- ❌ Don't include CSS files (geoform is unstyled; only document class names)
