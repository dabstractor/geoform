# PRP: P1.M5.T3.S1 - Common Pitfalls Documentation

---

## Goal

**Feature Goal**: Create a comprehensive "Common Pitfalls" section in README.md that consolidates warnings and anti-patterns from JSDoc comments into user-facing documentation.

**Deliverable**: A new `## Common Pitfalls` section in README.md (after line 663, before `## TypeScript` at line 664) documenting six common mistakes with anti-pattern examples, explanations, and correct solutions.

**Success Definition**:
- New section is inserted in README.md at the correct location (after "Advanced Usage", before "TypeScript")
- All 6 pitfalls from the work item are documented with ❌ BAD vs ✅ GOOD patterns
- Each pitfall includes clear explanation of why it's problematic
- Documentation follows existing README.md formatting conventions (H3/H4 headers, code blocks with language tags, blockquotes for notes)
- Section cross-references related API documentation

## User Persona

**Target User**: React developers integrating geoform into their applications

**Use Case**: A developer has implemented basic geoform functionality but is encountering unexpected behavior, confusing errors, or questions about proper usage patterns.

**User Journey**:
1. Developer reads Quick Start and implements basic forms
2. Developer encounters a problem (e.g., form doesn't close properly, URL sync doesn't restore forms, retry doesn't work)
3. Developer scans documentation for troubleshooting guidance
4. Developer finds Common Pitfalls section with their exact scenario
5. Developer sees the anti-pattern they're using and the correct solution

**Pain Points Addressed**:
- **API Confusion**: closeForm() is public but shouldn't be called directly in most cases
- **Unmet Expectations**: URL sync doesn't auto-restore forms (no form registry)
- **Retry Misuse**: Users click "Try Again" for structural errors that will never succeed
- **Missing Provider**: Errors about hooks being used outside provider context
- **Async Confusion**: Not understanding the Promise-based form submission pattern

## Why

- **Reduce Support Burden**: Consolidates scattered JSDoc warnings into one discoverable location
- **Prevent Common Mistakes**: Makes anti-patterns visible before developers implement them incorrectly
- **Clarify Design Decisions**: Explains intentional limitations (no form registry, retry behavior)
- **Improve Developer Experience**: Provides clear "what not to do" guidance with examples
- **Align with P1.M5 Goals**: Completes the documentation improvements task set (T1=Browser Support, T2=URL Sync Limitations, T3=Common Pitfalls)

## What

Add a new `## Common Pitfalls` section to README.md documenting:

### Success Criteria

- [ ] New section inserted after line 663 (end of Advanced Usage)
- [ ] All 6 pitfalls documented with proper subsections
- [ ] Each pitfall has ❌ BAD example showing the mistake
- [ ] Each pitfall has ✅ GOOD example showing correct usage
- [ ] Each pitfall explains why the mistake is problematic
- [ ] Cross-references to API documentation included
- [ ] Follows README.md formatting conventions

## All Needed Context

### Context Completeness Check

**"No Prior Knowledge" Test**: If someone knew nothing about this codebase, would they have everything needed to implement this successfully?

**YES** - This PRP provides:
- Exact file path and line number for insertion
- Complete source material for each pitfall (JSDoc comments, test files, PRD issues)
- Existing README.md formatting patterns to follow
- External documentation patterns from React ecosystem
- Specific content requirements with examples

### Documentation & References

```yaml
# MUST READ - Include these in your context window

# Primary README structure and insertion point
- file: /home/dustin/projects/geoform/README.md
  why: Main documentation file to modify - shows formatting patterns, insertion location
  pattern: H3 headers for subsections, code blocks with tsx language tags, blockquotes for notes
  gotcha: Insert AFTER line 663 (end of Advanced Usage), BEFORE line 664 (TypeScript section)

# Source material for Pitfall 1: closeForm misuse
- file: /home/dustin/projects/geoform/src/hooks/useFormStack.ts
  why: Contains comprehensive JSDoc (lines 24-89) explaining when NOT to use closeForm
  pattern: Shows discouraged vs recommended patterns with code examples
  section: UseFormStackReturn.closeForm JSDoc (lines 24-89)

# Test examples for closeForm warning
- file: /home/dustin/projects/geoform/src/components/__tests__/FormStackProvider.test.tsx
  why: Shows the development warning triggered by direct closeForm calls (lines 138-167)
  pattern: Test verifies console.warn is called with specific message

# Source material for Pitfall 2: URL sync restoration expectations
- file: /home/dustin/projects/geoform/README.md
  why: Existing "Form Restoration" section (lines 539-594) explains manual restoration requirement
  pattern: Shows switch statement pattern for mapping form IDs to components
  section: Advanced Usage > URL Sync > Form Restoration

# Source material for Pitfall 3: Retry limitations
- file: /home/dustin/projects/geoform/src/components/FormErrorBoundary.tsx
  why: Contains JSDoc (lines 42-60) and handleRetry comments (lines 134-149) explaining retry behavior
  pattern: Distinguishes transient vs structural errors
  gotcha: "Children receive the EXACT SAME props" - structural errors will recur

# Provider requirement pattern
- file: /home/dustin/projects/geoform/src/hooks/useFormStack.ts
  why: Shows @throws documentation for using hook outside provider (lines 102-103)
  pattern: Error message: "useFormStackState must be used within a FormStackProvider"

# Test examples for provider requirement
- file: /home/dustin/projects/geoform/src/hooks/__tests__/useFormStack.test.tsx
  why: Test showing error thrown when hook used without provider (lines 60-79)
  pattern: expect(() => renderHook(() => useFormStack())).toThrow()

# Async form submission patterns
- file: /home/dustin/projects/geoform/examples/relational-forms/OrganizationForm.tsx
  why: Shows proper async/await pattern for form submission with onSubmit (lines 31-89)
  pattern: Form calls onSubmit(data) - NOT closeForm() directly

# External documentation patterns research
- docfile: /home/dustin/projects/geoform/plan/docs/external-best-practices-development-warnings.md
  why: Research on how React Router, TanStack Query, Redux Toolkit document warnings
  section: Warning message structure (What + Why + How + Context)

# PRD context for design decisions
- file: /home/dustin/projects/geoform/PRD.md
  why: Original requirements explaining Issues 5, 7, 8 and "No form registry" decision
  gotcha: "No form registry" is an explicit non-goal that causes URL sync limitation

# P1.M5.T2 URL sync restoration documentation
- docfile: /home/dustin/projects/geoform/plan/bugfix/P1M5T2S1/PRP.md
  why: Previously completed documentation for URL sync limitations - ensure consistency
  section: Form Restoration implementation example

# Related test for async submission
- file: /home/dustin/projects/geoform/src/__tests__/integration/FormLifecycle.integration.test.tsx
  why: Shows correct Promise handling pattern (lines 81-108, 110-135)
  pattern: await openForm() returns result or undefined on cancel
```

### Current Codebase Tree (README structure)

```bash
README.md
├── Features (lines 10-17)
├── Installation (lines 18-36)
├── Quick Start (lines 38-89)
├── Core Concepts (lines 91-123)
├── API Reference (lines 124-502)
│   ├── Components (FormStackProvider, Breadcrumbs, ConfirmationDialog, FormErrorBoundary)
│   ├── Hooks (useFormStack, useFormStackState, useFormStackActions, useFormStackURLSync)
│   └── Types (FormProps, OpenFormOptions, StackEntry, FormStackState, FormStackActions)
├── Advanced Usage (lines 504-663)        # <-- INSERT AFTER THIS
│   ├── URL Sync (includes Form Restoration subsection)
│   ├── Confirmation Dialogs
│   ├── Error Boundaries
│   └── Custom Breadcrumb Styling
├── Common Pitfalls (NEW SECTION)          # <-- INSERT HERE
├── TypeScript (lines 664-726)             # <-- BEFORE THIS
├── Examples (lines 728-736)
├── Browser Support (lines 738-796)
├── Contributing (lines 799-806)
└── License (lines 808-810)
```

### Desired Codebase Tree (with new section)

```bash
README.md
├── ...
├── Advanced Usage (lines 504-663)
│   └── [existing content]
├── Common Pitfalls (NEW SECTION at line 664)
│   ├── Introduction paragraph
│   ### Calling closeForm() Directly Instead of Using onSubmit/onCancel
│   ├── Expecting URL Sync to Auto-Restore Forms
│   ├── Using Retry for Structural Errors vs Transient Errors
│   ├── Forgetting to Wrap App in FormStackProvider
│   ├── Calling useFormStack Outside Provider
│   └── Not Handling Async Form Submission Properly
├── TypeScript (lines shifted down)
└── ...
```

### Known Gotchas of Our Codebase & Library Quirks

```typescript
// CRITICAL: README.md insertion point
// Insert AFTER line 663 (end of "Custom Breadcrumb Styling" section)
// Insert BEFORE line 664 (start of "TypeScript" section)
// This maintains logical flow: Basic -> Advanced -> Pitfalls -> TypeScript

// CRITICAL: JSDoc closeForm documentation already exists
// The JSDoc in useFormStack.ts (lines 24-89) is comprehensive
// DO NOT duplicate it verbatim - extract and simplify for README
// Focus on the anti-pattern vs correct pattern format

// CRITICAL: "No form registry" is an explicit design decision
// PRD Section 2 lists this as a non-goal
// URL sync CANNOT auto-restore forms - this is intentional
// The onRestore callback MUST be implemented by consumers

// CRITICAL: Retry behavior is often misunderstood
// FormErrorBoundary.handleRetry increments retryCount to force remount
// Children receive SAME PROPS - structural errors will always recur
// Only transient errors (network, race conditions) benefit from retry

// CRITICAL: closeForm() is in public API for a reason
// It's needed for: programmatic closure from parent, emergency recovery
// It's NOT for: form components calling it directly (use onSubmit/onCancel)
// Development warning exists but needs user-facing documentation

// CRITICAL: README formatting conventions
// - Use ### for pitfall subsection titles
// - Use ❌ and ✅ emojis for bad/good examples (matches JSDoc pattern)
// - Use ```tsx code blocks with language tags
// - Use > **Note**: blockquotes for design decision explanations
// - Reference API docs with @see-style inline links
```

## Implementation Blueprint

### Content Structure

```markdown
## Common Pitfalls

[Introduction paragraph - 2-3 sentences explaining purpose]

### Calling closeForm() Directly Instead of Using onSubmit/onCancel
[Problem description]
[❌ BAD example from useFormStack.ts JSDoc]
[✅ GOOD example from useFormStack.ts JSDoc]
[Why it's problematic explanation]
[When closeForm IS appropriate]

### Expecting URL Sync to Auto-Restore Forms
[Problem description]
[❌ BAD example - expecting auto-restore]
[✅ GOOD example from README Form Restoration section]
[Why it doesn't work - no form registry design decision]
[> **Note** blockquote explaining design rationale]

### Using Retry for Structural Errors vs Transient Errors
[Problem description]
[❌ BAD example - retrying structural error]
[✅ GOOD example - dismissing structural error]
[Explanation of transient vs structural errors]
[When to use retry vs dismiss]

### Forgetting to Wrap App in FormStackProvider
[Problem description]
[❌ BAD example - missing provider]
[✅ GOOD example - proper provider setup]
[Error message they'll see]

### Calling useFormStack Outside Provider
[Problem description]
[❌ BAD example - hook outside provider]
[✅ GOOD example - hook inside provider]
[Error message reference]

### Not Handling Async Form Submission Properly
[Problem description]
[❌ BAD example - not awaiting result]
[✅ GOOD example from examples/OrganizationForm.tsx]
[Promise pattern explanation]
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: READ source material for all 6 pitfalls
  - EXTRACT: closeForm JSDoc from src/hooks/useFormStack.ts (lines 24-89)
  - EXTRACT: Form Restoration section from README.md (lines 539-594)
  - EXTRACT: FormErrorBoundary JSDoc from src/components/FormErrorBoundary.tsx (lines 42-60, 134-149)
  - EXTRACT: Provider setup examples from README.md Quick Start (lines 38-89)
  - EXTRACT: Async submission pattern from examples/relational-forms/OrganizationForm.tsx
  - OUTPUT: Create research notes with exact content to use for each pitfall

Task 2: CREATE pitfall content drafts (one file per pitfall)
  - CREATE: plan/bugfix/P1M5T3S1/pitfall-1-closeform.md
  - CREATE: plan/bugfix/P1M5T3S1/pitfall-2-urlsync.md
  - CREATE: plan/bugfix/P1M5T3S1/pitfall-3-retry.md
  - CREATE: plan/bugfix/P1M5T3S1/pitfall-4-provider-wrap.md
  - CREATE: plan/bugfix/P1M5T3S1/pitfall-5-hook-outside-provider.md
  - CREATE: plan/bugfix/P1M5T3S1/pitfall-6-async-submission.md
  - FORMAT: Each with problem, ❌ BAD, ✅ GOOD, explanation
  - REFERENCE: Use formatting patterns from README.md

Task 3: WRITE introduction paragraph for Common Pitfalls section
  - DRAFT: 2-3 sentence intro explaining section purpose
  - TONE: Helpful, reassuring (mistakes happen, here's how to avoid them)
  - PATTERN: Similar to existing section intros (see "Advanced Usage" line 504)
  - PLACEHOLDER: "## Common Pitfalls\n\n[intro]\n\n### Pitfall 1..."

Task 4: ASSEMBLE complete Common Pitfalls section
  - COMBINE: Intro + all 6 pitfalls into single markdown section
  - ORDER: Pitfalls in order from work item contract (closeForm, URL sync, retry, provider wrap, hook outside, async)
  - VERIFY: Each pitfall has all required elements (problem, ❌ BAD, ✅ GOOD, explanation)
  - FORMAT: Follow README.md conventions (### for subsections, ```tsx for code, > for notes)

Task 5: VERIFY insertion point in README.md
  - FIND: Line 663 (end of Custom Breadcrumb Styling section)
  - CONFIRM: Line 664 is start of TypeScript section
  - PLAN: Insert new section between these lines
  - BACKUP: No backup needed (git will track changes)

Task 6: MODIFY README.md - insert Common Pitfalls section
  - INSERT: New section after line 663, before line 664
  - PRESERVE: All existing content (only adding, not modifying)
  - FORMAT: Ensure proper spacing (blank line before and after new section)
  - VALIDATE: No markdown syntax errors

Task 7: VERIFY documentation quality
  - CHECK: All 6 pitfalls present
  - CHECK: Each has ❌ BAD and ✅ GOOD examples
  - CHECK: Code examples use ```tsx language tags
  - CHECK: Cross-references to API docs included
  - CHECK: Formatting matches existing README style

Task 8: CREATE validation test (optional but recommended)
  - CREATE: Simple script to verify README.md is valid markdown
  - VERIFY: No broken links or malformed code blocks
  - TOOL: Could use markdownlint or similar
```

### Implementation Patterns & Key Details

```typescript
// Pattern 1: README.md Section Header Format
// From README.md line 504 (Advanced Usage) and line 664 (TypeScript)

## Common Pitfalls

Follow these common mistakes to avoid unexpected behavior and ensure your forms work as intended.

// Pattern 2: Subsection Header with ❌/✅ Examples
// From useFormStack.ts JSDoc pattern (lines 47-88)

### Calling closeForm() Directly Instead of Using onSubmit/onCancel

**Problem**: Calling `closeForm()` directly from a form component bypasses the Promise resolution pattern.

**❌ BAD** - Direct closeForm call in a form component:
```tsx
// src/components/MyForm.tsx
function MyForm({ onSubmit, onCancel }: FormProps<Data>) {
  const { closeForm } = useFormStack();

  const handleSave = () => {
    onSubmit(data);
    closeForm(); // WRONG! FormStackRenderer handles this via onSubmit
  };
}
```

**✅ GOOD** - Use onSubmit/onCancel props:
```tsx
// src/components/MyForm.tsx
function MyForm({ onSubmit, onCancel }: FormProps<Data>) {
  const handleSave = () => {
    onSubmit(data); // FormStackRenderer will call closeForm() internally
  };

  const handleCancel = () => {
    onCancel(); // FormStackRenderer will call closeForm() internally
  };
}
```

**Why it's problematic**: Direct `closeForm()` calls dispatch `POP_FORM` directly to the reducer, bypassing the Promise resolution pattern that `openForm()` returns. This breaks the parent's `await` and can cause unexpected behavior.

**Valid use case**: Programmatic form closure from a parent component (outside the form stack) is appropriate:

```tsx
// ParentComponent.tsx
function ParentComponent() {
  const { closeForm, stack } = useFormStack();

  const handleEmergencyClose = () => {
    while (stack.length > 0) {
      closeForm(); // OK: Called from outside the form stack
    }
  };
}
```

@see [API Reference > useFormStack](#useformstack) for more details.

// Pattern 3: URL Sync Pitfall with Design Decision Note
// Based on README.md Form Restoration section (lines 539-594)

### Expecting URL Sync to Auto-Restore Forms

**Problem**: Forms don't automatically render when sharing URLs with form stack state.

**❌ BAD** - Expecting auto-restore:
```tsx
// App.tsx
function App() {
  // ❌ This won't auto-restore forms from URL
  useFormStackURLSync();
  return <MyApp />;
}
```

**✅ GOOD** - Implementing onRestore callback:
```tsx
// App.tsx
function getFormComponent(formId: string) {
  switch (formId) {
    case 'user-form':
      return { component: UserForm, label: 'User' };
    case 'org-form':
      return { component: OrgForm, label: 'Organization' };
    default:
      console.warn(`Unknown form ID: ${formId}`);
      return null;
  }
}

function URLSyncedApp() {
  const { openForm } = useFormStack();
  const { isRestoring } = useFormStackURLSync({
    paramName: 'forms',
    onRestore: async (formIds) => {
      for (const formId of formIds) {
        const entry = getFormComponent(formId);
        if (entry) {
          await openForm({
            id: formId,
            component: entry.component,
            label: entry.label,
          });
        }
      }
    },
  });

  if (isRestoring) {
    return <div>Restoring forms...</div>;
  }

  return <MyApp />;
}
```

**Why it doesn't work**: geoform does not include a form registry. This is an intentional design decision—the library treats forms as black-box components managed by you. URL sync can encode form IDs but cannot auto-restore forms without component references.

> **Note**: A form registry would add complexity and reduce flexibility. Manual restoration keeps the library simple and gives you full control over which forms can be opened via URL.

@see [Advanced Usage > URL Sync > Form Restoration](#form-restoration) for complete implementation guide.

// Pattern 4: Retry Pitfall with Error Type Distinction
// Based on FormErrorBoundary.tsx JSDoc (lines 42-60, 134-149)

### Using Retry for Structural Errors vs Transient Errors

**Problem**: Clicking "Try Again" for structural errors will always fail.

**❌ BAD** - Expecting retry to fix structural errors:
```tsx
// This form will ALWAYS throw - props are invalid
<UserForm userId={undefined} />  // Component requires userId prop
```
When this form throws and the error boundary appears, clicking "Try Again" won't help—the prop is still `undefined`.

**✅ GOOD** - Use Dismiss for structural errors:
```tsx
// Fix the underlying prop issue
<UserForm userId={validId} />  // Valid prop
```
Or click "Dismiss" to close the form and fix the prop in the parent component.

**Why retry sometimes doesn't work**: The retry mechanism increments `retryCount` to force a component remount, but children receive the **exact same props** as before the error.

- **✅ Retry works for transient errors**:
  - Network failures that may succeed on retry
  - Temporary rendering bugs or race conditions
  - Component state corruption that resets on remount

- **❌ Retry won't work for structural errors**:
  - Invalid or malformed props (like `undefined` userId)
  - Type mismatches or missing required data
  - Logic errors in the component's render method

@see [API Reference > FormErrorBoundary](#formerrorboundary) for error handling patterns.

// Pattern 5: Provider Wrap Pitfall (Simple Pattern)
// Based on README.md Quick Start (lines 38-89) and test error messages

### Forgetting to Wrap App in FormStackProvider

**Problem**: All geoform hooks must be used within a `FormStackProvider`.

**❌ BAD** - Missing provider:
```tsx
// App.tsx
function App() {
  return <MyApp />;  // No provider!
}

function MyApp() {
  const { openForm } = useFormStack();  // ❌ THROWS ERROR
  // Error: useFormStackState must be used within a FormStackProvider
}
```

**✅ GOOD** - Proper provider setup:
```tsx
// App.tsx
function App() {
  return (
    <FormStackProvider>
      <MyApp />
    </FormStackProvider>
  );
}

function MyApp() {
  const { openForm } = useFormStack();  // ✅ Works!
}
```

**Error you'll see**: `useFormStackState must be used within a FormStackProvider`

@see [API Reference > FormStackProvider](#formstackprovider) for provider setup.

// Pattern 6: Async Submission Pitfall (Promise Pattern)
// Based on examples/relational-forms/OrganizationForm.tsx and integration tests

### Not Handling Async Form Submission Properly

**Problem**: Not understanding the Promise-based form submission pattern.

**❌ BAD** - Not awaiting or checking result:
```tsx
// ParentComponent.tsx
function ParentComponent() {
  const { openForm } = useFormStack();

  const handleClick = () => {
    openForm<UserData>({
      id: 'create-user',
      component: UserForm,
      label: 'Create User',
    });
    // ❌ Not awaiting! Can't use result.
  };
}
```

**✅ GOOD** - Async/await with result handling:
```tsx
// ParentComponent.tsx
function ParentComponent() {
  const { openForm } = useFormStack();

  const handleClick = async () => {
    const result = await openForm<UserData>({
      id: 'create-user',
      component: UserForm,
      label: 'Create User',
    });

    if (result) {
      // User submitted - result is UserData
      console.log('Created user:', result.name);
    } else {
      // User cancelled - result is undefined
      console.log('User cancelled');
    }
  };
}
```

**How it works**: `openForm()` returns a `Promise<T | undefined>` that resolves when the form closes:
- **Submit**: Resolves with the value passed to `onSubmit(value)`
- **Cancel**: Resolves with `undefined`

The form component itself should just call `onSubmit(data)` or `onCancel()`—the Promise pattern is handled by geoform.

@see [Core Concepts > Promise-Based API](#promise-based-api) and [API Reference > useFormStack](#useformstack).
```

### Integration Points

```yaml
README.md:
  - insert_at: line 664 (after Advanced Usage, before TypeScript)
  - preserve: all existing content (only adding new section)
  - spacing: blank line before and after new section

CROSS_REFERENCES:
  - link_to: "API Reference > useFormStack" for closeForm details
  - link_to: "Advanced Usage > URL Sync > Form Restoration" for URL sync
  - link_to: "API Reference > FormErrorBoundary" for retry behavior
  - link_to: "Core Concepts > Promise-Based API" for async submission

CONSISTENCY:
  - match: P1.M5.T2.S1 URL sync restoration documentation style
  - match: README.md "Best Practices" lists (see URL Sync section line 589-593)
  - match: Quick Start code comment style (// label for file/component)
```

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# After modifying README.md - validate markdown syntax
npx markdownlint README.md 2>&1 | grep -E "(error|warning)" || echo "✓ Markdown syntax valid"

# Check for broken internal links
# (Common Pitfalls section may link to other sections)
grep -o '\[[^]]*\](#[^)]*)' README.md | while read link; do
  anchor=$(echo "$link" | sed 's/.*#//; s/).*//');
  if ! grep -q "# $anchor" README.md && ! grep -q "### $anchor" README.md; then
    echo "⚠ Possible broken link: #$anchor";
  fi;
done

# Expected: No markdown syntax errors, no broken internal links
```

### Level 2: Content Validation (Manual Review)

```bash
# Verify section insertion point
head -n 670 README.md | tail -n 10
# Should show: end of Custom Breadcrumb Styling, then blank line, then "## Common Pitfalls"

# Verify all 6 pitfalls are present
grep -c "^### " README.md | tail -1  # Count should increase by 6

# Verify each pitfall has required elements
for pitfall in "closeForm" "URL Sync" "Retry" "FormStackProvider" "outside" "Async"; do
  echo "Checking pitfall: $pitfall";
  # Should have ❌ indicator
  grep -A 20 "$pitfall" README.md | grep -q "❌" && echo "  ✓ Has BAD example" || echo "  ✗ Missing BAD example";
  # Should have ✅ indicator
  grep -A 20 "$pitfall" README.md | grep -q "✅" && echo "  ✓ Has GOOD example" || echo "  ✗ Missing GOOD example";
done

# Expected: All pitfalls present, each with ❌ and ✅ examples
```

### Level 3: Documentation Quality (Manual Checklist)

```bash
# Manual verification tasks (run through this checklist after implementation)

echo "Common Pitfalls Documentation Quality Checklist"
echo "================================================="
echo ""
echo "Content Completeness:"
echo "  [ ] Introduction paragraph present"
echo "  [ ] All 6 pitfalls documented:"
echo "      [ ] 1. Calling closeForm() directly"
echo "      [ ] 2. Expecting URL sync auto-restore"
echo "      [ ] 3. Using retry for structural errors"
echo "      [ ] 4. Forgetting FormStackProvider"
echo "      [ ] 5. Calling useFormStack outside provider"
echo "      [ ] 6. Not handling async submission"
echo ""
echo "Formatting Conventions:"
echo "  [ ] Uses ### for pitfall subsections"
echo "  [ ] Code blocks use \`\`\`tsx language tag"
echo "  [ ] File/component labels in comments (// file.tsx)"
echo "  [ ] ❌ and ✅ emojis for bad/good examples"
echo "  [ ] Blockquotes (> **Note**: ) for design decisions"
echo ""
echo "Cross-References:"
echo "  [ ] Links to API Reference sections"
echo "  [ ] Links to related documentation"
echo "  [ ] @see-style inline references where appropriate"
echo ""
echo "Clarity:"
echo "  [ ] Each pitfall explains WHY it's problematic"
echo "  [ ] Examples are complete and runnable"
echo "  [ ] Error messages shown where applicable"
echo "  [ ] Design decisions explained (not just stated)"
```

### Level 4: User Experience Validation

```bash
# Simulate user journey through documentation

echo "User Journey Simulation"
echo "======================="
echo ""
echo "Scenario 1: Developer's closeForm() call isn't working"
echo "  1. Scan README.md for 'closeForm' or 'close'"
echo "  2. Find Common Pitfalls > Calling closeForm() Directly"
echo "  3. See ❌ BAD example matching their code"
echo "  4. See ✅ GOOD example showing onSubmit pattern"
echo "  5. Understand why it's problematic"
echo "  ✓ Can user fix their issue? YES"
echo ""
echo "Scenario 2: Developer shares URL but forms don't restore"
echo "  1. Scan README.md for 'URL' or 'restore'"
echo "  2. Find Common Pitfalls > Expecting URL Sync to Auto-Restore"
echo "  3. Learn about no-form-registry decision"
echo "  4. See onRestore callback example"
echo "  ✓ Can user implement restoration? YES"
echo ""
echo "Scenario 3: Developer clicks Try Again but error persists"
echo "  1. Scan README.md for 'retry' or 'error'"
echo "  2. Find Common Pitfalls > Using Retry for Structural Errors"
echo "  3. Learn difference between transient vs structural errors"
echo "  4. Understand when to use Dismiss instead"
echo "  ✓ Can user understand retry behavior? YES"
```

## Final Validation Checklist

### Technical Validation

- [ ] README.md is valid markdown (no syntax errors)
- [ ] All internal links resolve correctly
- [ ] All 6 pitfalls are present with correct subsection headers
- [ ] Each pitfall has ❌ BAD and ✅ GOOD examples
- [ ] Code examples use ```tsx language tags
- [ ] Section inserted at correct location (after line 663, before line 664)

### Content Validation

- [ ] Introduction paragraph explains section purpose
- [ ] Each pitfall has clear problem description
- [ ] Each pitfall explains WHY it's problematic
- [ ] Examples show file/component labels in comments
- [ ] Design decisions are explained (e.g., no form registry)
- [ ] Error messages shown where applicable

### Formatting Validation

- [ ] Uses ### for pitfall subsections (matches README convention)
- [ ] Blockquotes use `> **Note**:` format (matches README)
- [ ] Cross-references to API docs included
- [ ] Consistent with existing README.md tone and style
- [ ] Proper spacing between sections

### Integration Validation

- [ ] Consistent with P1.M5.T2 URL sync restoration documentation
- [ ] References API Reference sections correctly
- [ ] Does not duplicate existing content (consolidates instead)
- [ ] Maintains logical documentation flow

### Documentation Quality

- [ ] Passes "No Prior Knowledge" test (new developer can understand)
- [ ] Examples are complete and could be copied into actual code
- [ ] Explanations are concise but complete
- [ ] Pitfalls are ordered logically (most common/confusing first)

---

## Anti-Patterns to Avoid

- ❌ Don't copy JSDoc verbatim - extract and simplify for README audience
- ❌ Don't add pitfalls not mentioned in work item contract (only the 6 specified)
- ❌ Don't modify existing README.md content - only insert new section
- ❌ Don't use different formatting conventions - follow existing patterns
- ❌ Don't forget to explain WHY - "what" alone isn't helpful
- ❌ Don't assume reader knows design decisions - explain "no form registry"
- ❌ Don't place section in wrong location - must be after Advanced Usage, before TypeScript
- ❌ Don't use overly technical jargon - keep explanations accessible
