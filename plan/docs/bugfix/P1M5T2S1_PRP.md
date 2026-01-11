# PRP: P1.M5.T2.S1 - Add URL Sync Restoration Documentation to README

---

## Goal

**Feature Goal**: Add a comprehensive "Form Restoration" subsection to the README.md's "URL Sync" section that explains how to implement the `onRestore` callback for manual form restoration.

**Deliverable**: Enhanced README.md with a new "Form Restoration" subsection (H4) under the "URL Sync" section (H3) containing:
- Clear explanation of URL sync restoration behavior and limitations
- Practical code example showing switch-based form ID to component mapping
- Explanation of why forms don't auto-render (no form registry design decision)
- Best practices and common gotchas

**Success Definition**:
- README.md contains a new `#### Form Restoration` subsection after line 537
- Subsection includes complete, working TypeScript/React code example
- Documentation clearly explains the manual implementation requirement
- Code follows existing README formatting patterns (2-space indentation, tsx language indicator)
- Validation: README renders correctly with no markdown syntax errors

## User Persona

**Target User**: Developers integrating geoform into their applications who need to enable shareable URLs and form state restoration.

**Use Case**: A developer wants to allow users to bookmark or share URLs that restore a specific form stack state, and needs to understand how to implement the restoration logic.

**User Journey**:
1. Developer reads URL Sync section and sees `onRestore` callback
2. Developer wonders: "How do I actually implement form restoration?"
3. Developer finds Form Restoration subsection with clear example
4. Developer adapts the switch statement pattern to map their form IDs to components
5. Developer successfully implements shareable form URLs

**Pain Points Addressed**:
- **Confusion**: Current docs show `onRestore` callback but don't explain how to implement it
- **Missing Context**: No explanation of why forms don't auto-render
- **Unclear Design**: Developers might expect auto-restore behavior like traditional routing
- **Implementation Gap**: No code example showing the ID-to-component mapping pattern

## Why

- **Documentation Completeness**: The URL Sync section shows the `onRestore` callback signature but provides no guidance on implementation, leaving developers to figure it out themselves
- **Design Clarity**: The "no form registry" decision is intentional but not documented - users may perceive this as a missing feature rather than a design choice
- **Reduced Support Burden**: Clear documentation reduces questions about why forms don't automatically restore from URLs
- **Adoption Barrier**: Developers evaluating geoform may dismiss it due to perceived missing functionality (auto-restore) when it's actually an intentional design decision

## What

Add a "Form Restoration" subsection to the README's URL Sync section that:

1. **Explains the restoration behavior**:
   - URL sync tracks which forms are open via `?forms=` query parameter
   - The `onRestore` callback receives an array of form IDs from the URL
   - Forms do **not** auto-render - the consumer must implement restoration logic

2. **Documents the design decision**:
   - Explicitly state that geoform does not include a form registry
   - Explain this is an intentional non-goal (PRD Section 2)
   - Note that full auto-restore would require a registry pattern

3. **Provides implementation guidance**:
   - Show switch statement pattern for mapping form IDs to components
   - Include complete, working code example with TypeScript types
   - Demonstrate calling `openForm()` for each ID from the URL

4. **Covers best practices and gotchas**:
   - Handling unknown form IDs (graceful degradation)
   - Loading states during restoration
   - Form data persistence (URL only tracks IDs, not form data)

### Success Criteria

- [ ] New `#### Form Restoration` subsection exists after line 537 in README.md
- [ ] Code example uses switch statement to map form IDs to components
- [ ] Documentation explicitly mentions "no form registry" as an intentional design decision
- [ ] Code follows README formatting patterns (tsx language, 2-space indentation)
- [ ] Example shows calling `openForm()` within the callback
- [ ] Markdown validates with no syntax errors

## All Needed Context

### Context Completeness Check

_Passes "No Prior Knowledge" test: The PRP provides exact file locations, line numbers, code patterns, and all context needed to implement this documentation enhancement._

### Documentation & References

```yaml
# PRIMARY TARGET - File to modify
- file: README.md
  why: Main documentation file requiring the Form Restoration subsection
  location: Lines 505-537 contain the URL Sync section; insert new subsection after line 537
  pattern: URL Sync section uses H3 heading, code examples with tsx language, 2-space indentation
  gotcha: The URL Sync section currently has no subsections; this will be the first H4 subsection

# KEY CONTEXT - URL Sync Implementation
- file: src/hooks/useFormStackURLSync.ts
  why: Contains onRestore callback signature and implementation details
  lines: "72-75 (onRestore type definition), 258-292 (restoreFromUrl function)"
  pattern: onRestore is optional callback with signature (formIds: string[]) => void
  critical: The callback only provides IDs; consumers must implement component mapping themselves

# KEY CONTEXT - URL Encoding Implementation
- file: src/utils/urlEncoding.ts
  why: Shows how form IDs are encoded/decoded in URL parameters
  functions: "encodeFormStack() - line 22, decodeFormStack() - line 41"
  pattern: Comma-separated, URL-encoded form IDs (e.g., ?forms=org-form,team-form)

# DESIGN RATIONALE - System Context
- file: plan/docs/architecture/system_context.md
  why: Explains the "no form registry" non-goal and design philosophy
  section: URL Sync Restoration Design (document architecture decision)
  critical: "Forms are treated as black-box React components managed by consumers"
  gotcha: Forward navigation (browser forward button) doesn't work - would require registry

# EXISTING PATTERNS - Switch Statement Example
- file: src/context/formStackReducer.ts
  why: Shows codebase switch statement pattern for type-based routing
  pattern: Discriminated union types with exhaustive checking using never type
  reference: Use similar switch pattern for form ID mapping

# DOCUMENTATION PATTERNS - JSDoc Best Practices
- file: plan/P5M1/research/jsdoc-best-practices.md
  why: Established patterns for documenting callbacks and types
  section: Callback documentation patterns
  pattern: Clear @param descriptions, @see references, @example usage

# EXTERNAL RESEARCH - URL Sync Documentation Patterns
- file: plan/P1M6/research/url-sync-documentation-patterns.md
  why: External best practices for documenting URL state and restoration callbacks
  sections: "Component Mapping Guide, 'Why Not' Documentation Structure"
  insight: Object mapping preferred over switch for extensibility, but switch is clearer for examples

# EXISTING README - URL Sync Section (for consistency)
- file: README.md
  lines: "505-537"
  why: Must match existing formatting style and code block patterns
  pattern: "tsx language indicator, 2-space indentation, descriptive inline comments"

# TEST EXAMPLES - onRestore Usage Patterns
- file: src/hooks/__tests__/useFormStackURLSync.test.tsx
  lines: "156-173 (basic restoration), 393-413 (special characters)"
  why: Shows how onRestore is actually called and what parameters it receives
  pattern: onRestore receives string[] of form IDs, callback is invoked on mount

# TYPE DEFINITIONS - Form Stack Types
- file: src/types/context.ts
  why: OpenFormOptions and FormStackActions types for accurate code examples
  interfaces: "OpenFormOptions<T>, FormStackActions.openForm method"
  pattern: openForm returns Promise<T | undefined>
```

### Current Codebase Tree

```bash
geoform/
├── README.md                          # TARGET FILE - Add Form Restoration subsection
├── plan/
│   └── bugfix/
│       └── P1M5T2S1/                  # Work item directory
│           └── PRP.md                 # This file
├── src/
│   ├── hooks/
│   │   ├── useFormStackURLSync.ts     # onRestore callback implementation
│   │   └── __tests__/
│   │       └── useFormStackURLSync.test.tsx  # Usage examples
│   ├── utils/
│   │   └── urlEncoding.ts             # URL encoding utilities
│   ├── types/
│   │   ├── context.ts                 # FormStackActions, OpenFormOptions
│   │   └── form.ts                    # FormProps interface
│   └── context/
│       └── formStackReducer.ts        # Switch statement pattern reference
```

### Desired Codebase Tree with Files to be Modified

```bash
geoform/
├── README.md                          # MODIFIED - Add Form Restoration subsection at line 538
│   └── (URL Sync section, lines 505-537)
│       └── (NEW) #### Form Restoration  # Insert after line 537
```

### Known Gotchas of Our Codebase & Library Quirks

```typescript
// CRITICAL: onRestore only provides form IDs, not components or data
// The callback receives: string[] (array of form IDs from URL)
// It does NOT receive: components, form data, or any state
// Consumer MUST implement ID-to-component mapping themselves

// DESIGN DECISION: No form registry is an explicit non-goal (PRD Section 2)
// Rationale: Forms are black-box components managed by consumers
// Consequence: Forward navigation (browser forward) doesn't work
// Only back navigation (closing forms) works via popToIndex()

// URL ENCODING: Form IDs are comma-separated and URL-encoded
// Example: ?forms=org-form,team-form,user-form
// Special chars: spaces → %20, & → %26
// Implementation: src/utils/urlEncoding.ts handles encoding/decoding

// TEST ENVIRONMENT: jsdom doesn't execute requestAnimationFrame callbacks
// The hook includes RAF availability detection for test compatibility
// Uses synchronous execution in tests vs. RAF coalescing in production

// DOCUMENTATION PATTERN: README uses tsx language indicator for all React code
// Indentation: 2 spaces (not 4)
// Comment style: // Single-line for code comments, {/* */} for JSX comments

// EXISTING PATTERN: Switch statements use exhaustive checking with never type
// See: src/context/formStackReducer.ts for pattern reference
// const _exhaustive: never = action; // Throws if incomplete switch
```

## Implementation Blueprint

### Data Models and Structure

No new data models required - this is a documentation enhancement. Existing types to reference:

```typescript
// From src/types/context.ts - callback signature
interface UseFormStackURLSyncOptions {
  onRestore?: (formIds: string[]) => void;
  // ... other options
}

// Restoration callback receives:
type FormIds = string[];  // Array of form IDs parsed from ?forms= URL parameter
```

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: LOCATE insertion point in README.md
  - FIND: Line 537 in README.md (end of current URL Sync section)
  - VERIFY: Content after line 537 is "### Confirmation Dialogs" section
  - INSERT: New content will go between line 537 and line 539

Task 2: CREATE Form Restoration subsection header
  - ADD: "#### Form Restoration" heading (H4) after line 537
  - FOLLOW: Existing H4 pattern in API Reference sections
  - BLANK: Leave one blank line after heading

Task 3: WRITE explanatory paragraph
  - EXPLAIN: URL sync tracks open forms via ?forms= parameter
  - CLARIFY: onRestore callback provides form IDs, not components
  - STATE: Forms don't auto-render - manual implementation required
  - REFERENCE: Mention this is intentional (no form registry design)

Task 4: CREATE code example - Form registry type definition
  - DEFINE: FormRegistry interface mapping form IDs to components
  - PATTERN: Object-based mapping with TypeScript types
  - INCLUDE: ComponentType<FormProps<any>> for form components
  - FOLLOW: README formatting (tsx language, 2-space indent)

Task 5: CREATE code example - Switch statement mapping
  - IMPLEMENT: switch statement mapping form IDs to components
  - PATTERN: Follow src/context/formStackReducer.ts switch style
  - INCLUDE: Default case handling for unknown form IDs
  - DEMONSTRATE: Returning component and optional label

Task 6: CREATE code example - onRestore callback implementation
  - IMPLEMENT: useFormStackURLSync with onRestore callback
  - LOGIC: Iterate formIds array, map each ID to component via switch
  - ACTION: Call openForm() for each mapped component
  - INCLUDE: Error handling for unknown form IDs

Task 7: ADD best practices and gotchas section
  - DOCUMENT: Unknown form ID handling (graceful degradation)
  - EXPLAIN: Form data not preserved in URL (only IDs)
  - NOTE: Forward navigation limitation (requires form registry)
  - WARNING: isRestoring state for loading UI

Task 8: INSERT content at correct location
  - ENSURE: Blank line before new subsection
  - MAINTAIN: Two blank lines after subsection (before "### Confirmation Dialogs")
  - PRESERVE: All existing URL Sync content (lines 505-537)

Task 9: VALIDATE markdown syntax
  - RUN: markdown linting or preview to verify rendering
  - CHECK: Code blocks have proper language indicators
  - VERIFY: Heading hierarchy is correct (H3 → H4)
  - CONFIRM: No broken links or malformed lists
```

### Implementation Patterns & Key Details

```markdown
# README Subsection Pattern (H4 under H3)

#### Form Restoration

[Explanatory paragraph - 2-3 sentences]

The `onRestore` callback provides the form IDs from the URL, but you must
implement the actual form opening logic. This is intentional - geoform treats
forms as black-box components managed by you.

```tsx
// PATTERN: File/component label comment
// PATTERN: Import statements first
import { useFormStack, useFormStackURLSync, type FormProps } from 'geoform';

// PATTERN: Blank line after imports

// PATTERN: Type definition for form registry (optional but recommended)
interface FormRegistry {
  [formId: string]: {
    component: React.ComponentType<FormProps<any>>;
    label?: string;
  };
}

// PATTERN: Switch function for ID-to-component mapping
function getFormComponent(formId: string) {
  switch (formId) {
    case 'user-form':
      return { component: UserForm, label: 'User' };
    case 'org-form':
      return { component: OrgForm, label: 'Organization' };
    // PATTERN: Handle unknown IDs gracefully
    default:
      console.warn(`Unknown form ID: ${formId}`);
      return null;
  }
}

function URLSyncedApp() {
  const { openForm } = useFormStack();
  const { isRestoring } = useFormStackURLSync({
    paramName: 'forms',
    // PATTERN: Implement onRestore to handle restoration
    onRestore: async (formIds) => {
      for (const formId of formIds) {
        const entry = getFormComponent(formId);
        if (entry) {
          // PATTERN: Open each form from the URL
          await openForm({
            id: formId,
            component: entry.component,
            label: entry.label,
          });
        }
      }
    },
  });

  // PATTERN: Show loading state during restoration
  if (isRestoring) {
    return <div>Restoring forms...</div>;
  }

  return <YourApp />;
}
```

> **Note**: geoform does not include a form registry. This is an intentional
> design decision - forms are managed by you, not the library. Full auto-restore
> would require a registry pattern, which would add complexity and reduce
> flexibility.

**Best Practices**:

- Handle unknown form IDs gracefully (don't crash on invalid URLs)
- Show a loading state during restoration using `isRestoring`
- Remember: the URL only tracks form IDs, not form data or user input
```

### Integration Points

```yaml
README:
  - modify: README.md line 538 (insert after URL Sync content)
  - preserve: All existing content lines 1-537
  - preserve: All content after line 538 (Confirmation Dialogs section onward)

# No code changes required - documentation only
```

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# Markdown linting (if markdownlint-cli is available)
npx markdownlint README.md --fix

# Alternative: Use built-in VS Code markdown linting
# Or: Validate with an online markdown linter

# Manual validation check:
# 1. Open README.md in markdown preview
# 2. Navigate to URL Sync section
# 3. Verify Form Restoration subsection renders correctly
# 4. Check code blocks have proper syntax highlighting
# 5. Confirm heading hierarchy is valid

# Expected: No markdown syntax errors, clean rendering
```

### Level 2: Content Validation (Documentation Quality)

```bash
# Verify content completeness
grep -A 50 "#### Form Restoration" README.md

# Check required elements are present:
# - [x] Subsection heading exists
# - [x] Code example with switch statement
# - [x] Explanation of manual implementation requirement
# - [x] Mention of "no form registry" design decision
# - [x] Best practices section

# Verify code example quality:
# - [x] Uses tsx language indicator
# - [x] 2-space indentation
# - [x] Includes import statements
# - [x] Shows complete, working example
# - [x] Has inline comments explaining logic

# Expected: All required elements present, code example is complete and valid
```

### Level 3: Link and Reference Validation

```bash
# Check for any internal links (none expected for this change)
# If any links are added, verify they work

# Verify heading hierarchy
grep -E "^#{1,4} " README.md | sort -u

# Expected: Proper H1 → H2 → H3 → H4 hierarchy maintained
```

### Level 4: User Acceptance Validation

```bash
# Manual review checklist:
echo "Validation Checklist for Form Restoration Documentation"

echo "1. Does the subsection clearly explain restoration behavior?"
echo "2. Is the code example complete and runnable?"
echo "3. Is the 'no form registry' decision clearly explained?"
echo "4. Are best practices practical and actionable?"
echo "5. Would a developer understand how to implement onRestore?"

# Final review: Read the entire URL Sync section (including new subsection)
# and verify it flows naturally and provides complete guidance.

# Expected: Documentation enables one-pass understanding for implementers
```

## Final Validation Checklist

### Technical Validation

- [ ] Markdown syntax is valid (no rendering errors)
- [ ] Code blocks use `tsx` language indicator
- [ ] All indentation is 2 spaces (consistent with README)
- [ ] No broken markdown links or malformed lists
- [ ] Heading hierarchy is correct (H4 under H3)

### Content Validation

- [ ] `#### Form Restoration` heading exists after line 537
- [ ] Explanatory paragraph describes restoration behavior
- [ ] Code example shows switch statement for form ID mapping
- [ ] Code example includes complete `onRestore` implementation
- [ ] "No form registry" design decision is explicitly mentioned
- [ ] Best practices section covers edge cases

### Code Example Quality

- [ ] Code example includes import statements
- [ ] TypeScript types are properly used
- [ ] Switch statement includes default case for unknown IDs
- [ ] Example shows calling `openForm()` for each ID
- [ ] Loading state with `isRestoring` is demonstrated
- [ ] Inline comments explain non-obvious logic

### Documentation Quality

- [ ] Tone is consistent with existing README
- [ ] Formatting matches existing patterns (spacing, indentation)
- [ ] Code follows README style guide (tsx, 2-space indent)
- [ ] Explanation is clear for developers unfamiliar with codebase
- [ ] Passes "No Prior Knowledge" test - someone new could implement from this

---

## Anti-Patterns to Avoid

- **Don't** add auto-restore functionality - this is documentation only
- **Don't** use 4-space indentation - README consistently uses 2 spaces
- **Don't** forget the `tsx` language indicator for code blocks
- **Don't** provide incomplete code snippets - show full working examples
- **Don't** omit the default case in the switch statement
- **Don't** use vague language like "implement restoration" - show exactly how
- **Don't** place the subsection before or within the existing URL Sync content
- **Don't** remove or modify any existing README content (only add)

---

## Confidence Score

**9/10** - One-pass implementation success likelihood

**Rationale**:
- Comprehensive research provides exact file locations, line numbers, and patterns
- Existing codebase examples (switch statements, callback patterns) are well-documented
- Clear task breakdown with dependency ordering
- Specific formatting requirements from README analysis
- Validation commands are project-appropriate

**Remaining risk**: Minor - documentation tone and style consistency with existing README content. This is mitigated by providing specific examples from the existing README to follow.
