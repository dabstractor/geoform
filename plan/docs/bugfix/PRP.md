# PRP: FormStackRenderer Callback Memoization Decision (P1.M4.T1.S2)

**Milestone:** P1.M4 - Performance Optimizations
**Task:** P1.M4.T1.S2 - Implement callback memoization if beneficial
**Project:** React Hierarchical Form Stack System (geoform)
**Status:** Decision Required (Code Change vs Documentation Only)
**Estimated Story Points:** 2 SP (documentation) OR 3 SP (implementation)
**Dependencies:** P1.M4.T1.S1 (Performance Analysis - Complete)

---

## Goal

**Feature Goal**: Make an informed decision about callback memoization in FormStackRenderer based on P1.M4.T1.S1 performance analysis, then either implement useCallback OR document why no change is needed.

**Deliverable**: Either (A) Modified `src/components/FormStackRenderer.tsx` with memoized callbacks OR (B) Documentation at `plan/docs/bugfix/callback_memoization_decision.md` explaining why no change is needed.

**Success Definition**:
1. Decision is justified by P1.M4.T1.S1 analysis findings
2. If implementing useCallback: All tests pass, no regressions
3. If documenting: Decision document references specific analysis findings and architectural reasoning
4. Resolution is communicated clearly for future maintainers

---

## User Persona

**Target User**: React developers maintaining or consuming the geoform library

**Use Case**: Understanding the performance characteristics of FormStackRenderer callback patterns

**User Journey**:
1. Developer encounters FormStackRenderer callback pattern (inline functions in map)
2. Developer questions whether callbacks should be memoized
3. Developer consults decision document or reads code comments
4. Developer understands the architectural rationale

**Pain Points Addressed**:
- Uncertainty about premature optimization
- Missing context for future maintainability
- Need for documented performance decisions

---

## Why

**Performance Analysis Context**:
- P1.M4.T1.S1 completed comprehensive architectural analysis of FormStackRenderer callback creation
- Analysis conclusion: **SKIP OPTIMIZATION** based on CSS visibility isolation and per-entry callback architecture
- Break-even threshold not met: 100+ prevented re-renders needed for useCallback benefit

**Key Factors from P1.M4.T1.S1 Analysis**:
| Factor | Finding | Impact |
|--------|---------|--------|
| CSS Isolation | `display: none` prevents hidden form re-renders | Callback ref changes don't trigger re-renders |
| Per-Entry Callbacks | Each form has unique callbacks closing over its own `entry.deferred` | Active form changes don't affect hidden forms |
| User Forms | Not memoized by default | Callback ref changes don't cause re-renders |
| Render Frequency | User-initiated (~1/sec) | useCallback overhead (0.3ms) > benefit |
| React 19 Compiler | Auto-memoization available | Manual optimization less critical |

**Integration with Existing Features**:
- FormStackProvider already uses useCallback for context-exported actions (stable references for consumers)
- FormStackRenderer has different architecture (per-entry callbacks vs shared actions)
- Decision respects architectural boundaries

**Problems This Solves**:
- Documents performance optimization decision rationale
- Prevents premature optimization
- Provides clear guidance for future maintenance
- Respects the "measure first, optimize second" principle

---

## What

### Decision Point

This task has two possible outcomes based on P1.M4.T1.S1 analysis:

**Outcome A**: Implement callback memoization with useCallback
**Outcome B**: Document why no code change is needed

### Success Criteria (Outcome A - Implement useCallback)

- [ ] Callbacks (handleSubmit, handleCancel, handleError) wrapped in useCallback
- [ ] Dependencies: `[entry.deferred, onClose, onCancelRequest]` for all callbacks
- [ ] `entry.id` used as key to maintain stable references (see Implementation Patterns)
- [ ] All existing tests pass: `npm run test`
- [ ] Type checking passes: `npm run type-check`
- [ ] Build succeeds: `npm run build`
- [ ] No performance regression in manual testing

### Success Criteria (Outcome B - Document Decision)

- [ ] Decision document created at `plan/docs/bugfix/callback_memoization_decision.md`
- [ ] Document references P1.M4.T1.S1 analysis findings
- [ ] Document includes architectural rationale (CSS isolation, per-entry callbacks)
- [ ] Document includes decision framework application (testing_best_practices.md Section 3.6)
- [ ] Code comment added to FormStackRenderer explaining pattern
- [ ] Decision linked from architecture documentation

---

## All Needed Context

### Context Completeness Check

_This PRP provides everything needed for an implementer with no prior codebase knowledge to make an informed decision about callback memoization in FormStackRenderer. All architectural analysis, decision frameworks, and existing patterns are explicitly documented._

### Documentation & References

```yaml
# MUST READ - Performance Analysis Result
- file: plan/docs/architecture/callback_performance_analysis.md
  why: Contains P1.M4.T1.S1 analysis with recommendation to SKIP OPTIMIZATION
  critical: |
    Executive Summary: CSS display: none isolation prevents hidden form re-renders
    Recommendation: SKIP OPTIMIZATION
    Break-even threshold: 100+ prevented re-renders needed
    Per-entry callbacks: Each form has unique callbacks with stable closures
  section: "Executive Summary" and "Recommendation"

# MUST READ - Decision Framework
- file: plan/docs/architecture/testing_best_practices.md
  why: Section 3.6 provides useCallback decision tree
  critical: |
    Line 609-626: Decision tree for when to use useCallback
    Use useCallback when: passed to memoized child, used in dependency array, exported from context
    Don't use when: only used locally, child not memoized, function inexpensive to recreate
  section: "3.6 Decision Tree"

# MUST READ - Current Implementation
- file: src/components/FormStackRenderer.tsx
  why: Contains the callback pattern under evaluation
  pattern: |
    Lines 38-94: map() loop creating inline callbacks (handleSubmit, handleCancel, handleError)
    Each callback closes over entry.deferred (stable reference)
    CSS isolation: style={{ display: isActive ? 'block' : 'none' }}
    Key: entry.id used as React key (not for memoization)
  gotcha: |
    entry.deferred is stable (doesn't change after form creation)
    Callbacks are per-entry (unique per form, not shared)
    Hidden forms don't re-render due to CSS display: none

# MUST READ - Existing useCallback Patterns
- file: src/components/FormStackProvider.tsx
  why: Shows proper useCallback usage for context-exported actions
  pattern: |
    Lines 64, 79, 99, 132, 176: useCallback with empty deps for stable references
    These are exported to context consumers (need stable refs)
    Different from FormStackRenderer (per-entry vs shared actions)
  critical: |
    FormStackProvider: Shared actions for all forms (useCallback appropriate)
    FormStackRenderer: Per-entry callbacks (each form gets unique callbacks)

# MUST READ - Test Patterns
- file: src/components/__tests__/FormStackRenderer.test.tsx
  why: Contains existing test patterns for validation
  pattern: AAA (Arrange-Act-Assert), render() with wrapper, fireEvent for interactions

# MUST READ - Performance Test Documentation
- file: src/components/__tests__/FormStackRenderer.performance.test.tsx
  why: Documents architectural patterns and expected behavior
  pattern: Describes CSS isolation, per-entry callbacks, decision framework

# Research Documents from P1.M4.T1.S1
- docfile: plan/docs/bugfix/P1M4T1S1/research/memoization-worth-it-analysis.md
  why: Cost-benefit analysis framework
  critical: |
    useCallback overhead: 0.01ms per callback
    Break-even threshold: 100+ prevented re-renders needed
    Skip threshold: <5 renders/sec OR <0.1ms calculation

- docfile: plan/docs/bugfix/P1M4T1S1/research/useCallback-overhead-analysis.md
  why: Performance benchmarks
  critical: |
    Overhead: ~0.01ms per useCallback
    Total overhead for 10 forms: 0.3ms per render

- docfile: plan/docs/bugfix/P1M4T1S1/research/react-19-compiler-auto-memoization.md
  why: React Compiler impact
  critical: |
    React 19 Compiler auto-memoizes by default
    Manual useCallback less critical when compiler enabled
```

### Current Codebase Tree

```bash
geoform/
├── src/
│   ├── components/
│   │   ├── FormStackRenderer.tsx        # TARGET FILE (lines 38-94)
│   │   ├── FormStackProvider.tsx        # REFERENCE: useCallback patterns
│   │   ├── ConfirmationDialog.tsx       # REFERENCE: useCallback for dependencies
│   │   ├── FormErrorBoundary.tsx
│   │   ├── Breadcrumbs.tsx
│   │   ├── index.ts
│   │   └── __tests__/
│   │       ├── FormStackRenderer.test.tsx          # Validation tests
│   │       ├── FormStackRenderer.performance.test.tsx  # Performance docs
│   │       ├── FormStackProvider.test.tsx
│   │       └── ...
│   ├── hooks/
│   │   ├── useFormStackURLSync.ts        # REFERENCE: useCallback patterns
│   │   └── ...
│   ├── types/
│   │   ├── form.ts                       # DeferredPromise<T> type
│   │   ├── stack.ts                      # InternalStackEntry<T> type
│   │   └── ...
│   └── ...
├── plan/
│   ├── bugfix/
│   │   ├── P1M4T1S2/
│   │   │   ├── PRP.md                    # THIS FILE
│   │   │   └── callback_memoization_decision.md  # TO CREATE (if Outcome B)
│   │   └── architecture/
│   │       └── testing_best_practices.md # Decision framework reference
│   └── docs/
│       └── architecture/
│           └── callback_performance_analysis.md  # P1.M4.T1.S1 analysis
└── ...
```

### Desired Codebase Tree (Outcome A - If Implementing)

No structural changes - only modification to existing FormStackRenderer.tsx

### Desired Codebase Tree (Outcome B - If Documenting)

```bash
geoform/
├── plan/
│   └── bugfix/
│       └── P1M4T1S2/
│           ├── PRP.md                              # This file
│           └── callback_memoization_decision.md    # NEW: Decision documentation
└── src/
    └── components/
        └── FormStackRenderer.tsx                   # MODIFIED: Add explanatory comment
```

### Known Gotchas & Library Quirks

```typescript
// CRITICAL: FormStackRenderer has DIFFERENT architecture than FormStackProvider
// FormStackProvider: Shared actions for ALL forms (useCallback needed for stable refs)
// FormStackRenderer: Per-entry callbacks for EACH form (unique callbacks per form)

// GOTCHA: entry.deferred is STABLE (doesn't change after form creation)
// This means callback closures are stable even without useCallback
const handleSubmit = (value: unknown) => {
  entry.deferred.resolve(value);  // entry.deferred never changes
  onClose();
};

// CRITICAL: CSS display: NONE prevents hidden form re-renders
// When active form changes state, hidden forms don't re-render because:
// 1. Their props haven't changed (callbacks are unique per entry)
// 2. They're hidden with display: none (visual isolation)
// 3. User forms aren't memoized by default
style={{ display: isActive ? 'block' : 'none' }}

// GOTCHA: If implementing useCallback, entry.id cannot be used as dependency
// entry.id is a string, but the callback needs to close over entry.deferred
// WRONG: const handleSubmit = useCallback((value) => { ... }, [entry.id]);
// RIGHT: const handleSubmit = useCallback((value) => { ... }, [entry.deferred, onClose]);

// CRITICAL: Decision Framework from testing_best_practices.md Section 3.6
// useCallback is worthwhile when:
// 1. Function is passed to memoized child → Form components are NOT memoized
// 2. Function is used as dependency → Callbacks are NOT used as dependencies
// 3. Function is exported from context → These callbacks are NOT exported
// Conclusion: useCallback is NOT warranted for FormStackRenderer

// PERFORMANCE: Break-even analysis from P1.M4.T1.S1
// useCallback overhead: 0.01ms per callback
// Total for 10 forms: 0.01ms × 3 callbacks × 10 forms = 0.3ms per render
// Benefit needed: 100+ prevented re-renders to break even
// Current behavior: Hidden forms DON'T re-render (CSS isolation)
// ROI: Negative (premature optimization)

// REACT 19 COMPILER: Auto-memoization changes the landscape
// When enabled, React Compiler automatically memoizes values and functions
// Manual useCallback becomes unnecessary in most cases
// Recommendation: Consider enabling React Compiler instead of manual optimization
```

---

## Implementation Blueprint

### Decision Framework Application

Based on `testing_best_practices.md` Section 3.6 decision tree:

```
Should FormStackRenderer callbacks be memoized with useCallback?
│
├─ Is the function passed to a memoized child?
│  ├─ No → User form components are NOT memoized by default
│  └─ Continue
│
├─ Is the function used in another hook's dependency array?
│  ├─ No → Callbacks are passed directly to createElement, not used in hooks
│  └─ Continue
│
├─ Is the function exported from context?
│  ├─ No → These are per-entry callbacks, not shared actions
│  └─ Continue
│
└─ DECISION: Don't memoize (current implementation is correct)
```

### Data Models and Structure

No new data models - this task modifies existing FormStackRenderer.tsx (Outcome A) or documents current implementation (Outcome B).

### Implementation Tasks (Outcome A: Implement useCallback)

**ONLY PROCEED IF P1.M4.T1.S1 ANALYSIS RECOMMENDS OPTIMIZATION**

```yaml
Task 1: MODIFY src/components/FormStackRenderer.tsx
  - IMPLEMENT: Wrap handleSubmit, handleCancel, handleError in useCallback
  - FOLLOW pattern: FormStackProvider.tsx (useCallback with proper dependencies)
  - NAMING: Same callback names, just wrapped in useCallback
  - PLACEMENT: Lines 42-60 in FormStackRenderer.tsx
  - DEPENDENCIES: [entry.deferred, onClose, onCancelRequest]
  - CONTENT:
    ```typescript
    import { useCallback, createElement, type ReactElement } from 'react';
    import type { InternalStackEntry, FormProps } from '../types';
    import { FormErrorBoundary } from './FormErrorBoundary';

    // ... (props interface unchanged)

    export function FormStackRenderer({ stack, onClose, onCancelRequest }: FormStackRendererProps): ReactElement | null {
      if (stack.length === 0) {
        return null;
      }

      return (
        <div className="form-stack">
          {stack.map((entry, index) => {
            const isActive = index === stack.length - 1;

            // Memoized callbacks with stable dependencies
            // Note: entry.deferred is stable (doesn't change after form creation)
            const handleSubmit = useCallback((value: unknown) => {
              entry.deferred.resolve(value);
              onClose();
            }, [entry.deferred, onClose]);

            const handleCancel = useCallback(async () => {
              const confirmed = await onCancelRequest(entry);
              if (!confirmed) {
                return;
              }
              entry.deferred.resolve(undefined);
              onClose();
            }, [entry.deferred, onCancelRequest, onClose]);

            const handleError = useCallback((error: unknown) => {
              entry.deferred.reject(error);
              onClose();
            }, [entry.deferred, onClose]);

            // ... rest of component unchanged
          })}
        </div>
      );
    }
    ```
  - VALIDATION: npm run type-check passes

Task 2: VERIFY existing tests still pass
  - RUN: npm run test src/components/__tests__/FormStackRenderer.test.tsx
  - EXPECTED: All tests pass (behavior unchanged, only implementation detail)
  - VALIDATION: No test modifications needed

Task 3: RUN performance validation (manual)
  - BUILD: npm run build
  - TEST: Use React DevTools Profiler to verify no hidden form re-renders
  - EXPECTED: Same render behavior as before (hidden forms don't re-render)
  - VALIDATION: No performance regression

Task 4: ADD code comment explaining memoization
  - ADD: Comment above useCallback blocks explaining rationale
  - CONTENT: |
    // Callbacks are memoized to maintain stable references across renders.
    // Each callback closes over entry.deferred which is stable after form creation.
    // While analysis shows minimal benefit (CSS isolation prevents re-renders),
    // memoization provides consistency with FormStackProvider patterns.
  - PLACEMENT: Lines 42-45
```

### Implementation Tasks (Outcome B: Document Decision)

**RECOMMENDED OUTCOME BASED ON P1.M4.T1.S1 ANALYSIS**

```yaml
Task 1: CREATE plan/docs/bugfix/callback_memoization_decision.md
  - IMPLEMENT: Decision documentation explaining why no code change is needed
  - FOLLOW pattern: Executive summary, architectural analysis, decision framework application
  - NAMING: callback_memoization_decision.md
  - PLACEMENT: plan/docs/bugfix/
  - CONTENT:
    ```markdown
    # FormStackRenderer Callback Memoization Decision

    **Date**: [DATE]
    **Task**: P1.M4.T1.S2
    **Decision**: NO CODE CHANGE - Current implementation is optimal

    ## Executive Summary

    Based on P1.M4.T1.S1 performance analysis, callback memoization in FormStackRenderer is **NOT warranted**. The current inline callback pattern is optimal for this use case.

    ## Decision

    **Status**: No implementation needed - document current implementation as correct

    ## Rationale

    ### 1. CSS Visibility Isolation
    Hidden forms use `display: none` which prevents visual re-renders. When the active form's state changes, hidden forms have no reason to re-render because their props haven't changed.

    ### 2. Per-Entry Callback Architecture
    Each form receives unique callback instances that close over its own `entry.deferred`. When the active form re-renders, hidden forms are unaffected because their callbacks and props remain stable.

    ### 3. Decision Framework Application
    Per `testing_best_practices.md` Section 3.6 decision tree:
    - ❌ Not passed to memoized child (user forms aren't memoized by default)
    - ❌ Not used in dependency array (callbacks passed directly to createElement)
    - ❌ Not exported from context (these are per-entry, not shared actions)

    ### 4. Cost-Benefit Analysis
    - useCallback overhead: 0.01ms per callback
    - Total overhead (10 forms × 3 callbacks): 0.3ms per render
    - Benefit: 0ms (hidden forms don't re-render due to CSS isolation)
    - ROI: Negative (premature optimization)

    ### 5. React 19 Compiler Consideration
    React Compiler auto-memoizes by default, making manual useCallback unnecessary. Consider enabling React Compiler for automatic optimization instead of manual memoization.

    ## Comparison with FormStackProvider

    FormStackProvider uses useCallback for its action handlers, which is correct because:
    - Actions are exported via context (need stable references for consumers)
    - Actions are shared across all forms (not per-entry)
    - Multiple components depend on these references

    FormStackRenderer has different architecture:
    - Callbacks are per-entry (unique per form, not shared)
    - Callbacks are passed directly to user components (not exported)
    - CSS isolation prevents unnecessary re-renders

    ## References

    - P1.M4.T1.S1 Analysis: `plan/docs/architecture/callback_performance_analysis.md`
    - Decision Framework: `plan/docs/architecture/testing_best_practices.md` (Section 3.6)
    - Research Documents: `plan/docs/bugfix/P1M4T1S1/research/`

    ## Conclusion

    The current implementation with inline callbacks is architecturally sound and performance-optimal. No code changes are needed.
    ```

Task 2: ADD explanatory comment to FormStackRenderer.tsx
  - ADD: Comment above callback creation explaining pattern
  - LOCATION: Line 41 (before callback creation in map loop)
  - CONTENT:
    ```typescript
    // Callback creation pattern: Inline functions per form entry
    //
    // Rationale: Callbacks are NOT memoized (useCallback) because:
    // 1. Each form receives unique callbacks closing over its own entry.deferred
    // 2. CSS display: none isolation prevents hidden form re-renders
    // 3. User forms are not memoized by default
    // 4. Callbacks are not used as dependencies in other hooks
    // 5. Analysis shows break-even threshold not met (100+ prevented renders needed)
    //
    // See: plan/docs/architecture/callback_performance_analysis.md
    // See: plan/docs/bugfix/callback_memoization_decision.md
    ```
  - PLACEMENT: src/components/FormStackRenderer.tsx line 41

Task 3: UPDATE architecture documentation index
  - MODIFY: plan/docs/architecture/callback_performance_analysis.md
  - ADD: Link to decision document in "Next Steps" section
  - CONTENT: |
    - ✅ **P1.M4.T1.S2**: Decision documented - No code change needed (see plan/docs/bugfix/callback_memoization_decision.md)
  - PLACEMENT: Line 307 of callback_performance_analysis.md

Task 4: VERIFY no existing tests need modification
  - RUN: npm run test src/components/__tests__/FormStackRenderer.test.tsx
  - EXPECTED: All tests pass (no code changes = no test changes needed)
  - VALIDATION: Documentation only, no functional changes
```

### Implementation Patterns & Key Details

```typescript
// PATTERN: FormStackRenderer vs FormStackProvider useCallback Strategy

// FormStackProvider: useCallback IS appropriate (shared actions, context export)
const openForm = useCallback(<T,>(options: OpenFormOptions<T>): Promise<T | undefined> => {
  // Shared action for all forms
  // Exported via context - needs stable reference
  // Multiple components depend on this reference
}, []);

// FormStackRenderer: useCallback NOT appropriate (per-entry callbacks)
stack.map((entry, index) => {
  // Inline callback per form entry
  // Closes over entry.deferred (stable reference)
  // Not exported, not used as dependency
  const handleSubmit = (value: unknown) => {
    entry.deferred.resolve(value);
    onClose();
  };
  // ...
});

// GOTCHA: If implementing useCallback despite analysis recommendation
// WRONG: Using entry.id as dependency (doesn't capture closure)
const handleSubmit = useCallback((value) => {
  entry.deferred.resolve(value);  // Wrong entry!
}, [entry.id]);  // ❌

// RIGHT: Using actual closure dependencies
const handleSubmit = useCallback((value) => {
  entry.deferred.resolve(value);
}, [entry.deferred, onClose]);  // ✅

// CRITICAL: entry.deferred is STABLE (doesn't change after creation)
// This means callback closures are stable even without useCallback
// The callback's closure captures a reference that never changes
```

### Integration Points

```yaml
NO NEW INTEGRATIONS (Outcome B - Documentation):
  - No code changes = no new integration points
  - Existing integration points unchanged

POTENTIAL INTEGRATIONS (Outcome A - If Implementing useCallback):
  DEPENDENCIES:
    - add import: import { useCallback } from 'react'
    - no other dependency changes

  TESTING:
    - existing tests should pass without modification
    - manual profiler verification recommended
```

---

## Validation Loop

### Level 1: Syntax & Style (Immediate Feedback)

```bash
# After creating/modifying files
npm run type-check

# Expected: Zero errors
# If errors: Check imports, ensure useCallback imported from 'react'

# Format check (if configured)
npm run lint || true  # May not be configured in this project
```

### Level 2: Unit Tests (Component Validation)

```bash
# Run FormStackRenderer tests
npm run test src/components/__tests__/FormStackRenderer.test.tsx

# Expected output:
# ✓ FormStackRenderer > renders null when stack is empty
# ✓ FormStackRenderer > renders all forms in stack
# ✓ FormStackRenderer > only active form is visible
# ✓ FormStackRenderer > calls onSubmit and closes form
# ✓ FormStackRenderer > calls onCancel and closes form when confirmed
# ✓ FormStackRenderer > does not close form when cancel denied
# ✓ FormStackRenderer > calls onError and closes form
# ✓ ... (all existing tests pass)

# Run full test suite
npm run test

# Expected: All tests pass (including FormStackRenderer tests)
# Note: If Outcome B (documentation only), no test changes expected
```

### Level 3: Integration Testing (System Validation)

```bash
# Build to verify no TypeScript errors
npm run build

# Expected: dist/index.cjs and dist/index.mjs generated successfully

# Verify exports work
node -e "const geo = require('./dist/index.cjs'); console.log('FormStackRenderer:', typeof geo.FormStackRenderer);"
# Expected: FormStackRenderer: function

# Manual testing (if Outcome A - useCallback implementation)
# 1. Start dev server: npm run dev
# 2. Open browser DevTools → Profiler
# 3. Navigate to example app
# 4. Open multiple nested forms
# 5. Interact with active form (type in input)
# 6. Verify in Profiler: Hidden forms do NOT re-render
# 7. Close forms, verify callbacks still work correctly
```

### Level 4: Manual Verification (Decision Validation)

```bash
# Verify decision documentation (Outcome B)
# 1. Read decision document: cat plan/docs/bugfix/callback_memoization_decision.md
# 2. Verify all sections complete: Executive Summary, Rationale, Comparison, References
# 3. Verify code comment exists in FormStackRenderer.tsx line 41
# 4. Verify architecture doc links to decision: grep -l "P1M4T1S2" plan/docs/architecture/callback_performance_analysis.md

# Expected: Decision document complete and linked from architecture docs
```

---

## Final Validation Checklist

### Technical Validation (Outcome A - If Implementing useCallback)

- [ ] `npm run type-check` passes with zero errors
- [ ] `npm run test` passes all tests (including FormStackRenderer)
- [ ] `npm run build` succeeds
- [ ] useCallback imported from 'react'
- [ ] All three callbacks wrapped (handleSubmit, handleCancel, handleError)
- [ ] Dependencies: [entry.deferred, onClose, onCancelRequest]
- [ ] No test modifications needed (behavior unchanged)

### Technical Validation (Outcome B - If Documenting Decision) - RECOMMENDED

- [ ] Decision document created at `plan/docs/bugfix/callback_memoization_decision.md`
- [ ] Decision document references P1.M4.T1.S1 analysis
- [ ] Decision document applies testing_best_practices.md decision framework
- [ ] Code comment added to FormStackRenderer.tsx line 41
- [ ] Architecture doc updated with link to decision
- [ ] `npm run test` passes (no code changes, but verify no regressions)
- [ ] `npm run type-check` passes

### Feature Validation

- [ ] Decision is justified by P1.M4.T1.S1 analysis findings
- [ ] Architectural rationale is clear (CSS isolation, per-entry callbacks)
- [ ] Comparison with FormStackProvider useCallback usage is documented
- [ ] References to supporting documentation are included
- [ ] Future maintainers can understand the decision

### Code Quality Validation

- [ ] Decision document follows markdown formatting conventions
- [ ] Code comment is clear and concise
- [ ] No premature optimization (measure first principle respected)
- [ ] React 19 Compiler consideration included
- [ ] Decision is linked from architecture documentation

### Documentation & Deployment

- [ ] Decision document is discoverable from architecture docs
- [ ] Code comment points to supporting documentation
- [ ] Decision is reversible if assumptions change (e.g., React.memo adoption)
- [ ] PRP is stored at plan/docs/bugfix/PRP.md

---

## Anti-Patterns to Avoid

- **DON'T** implement useCallback without considering the decision framework
- **DON'T** use entry.id as useCallback dependency (doesn't capture closure properly)
- **DON'T** apply FormStackProvider patterns to FormStackRenderer without architectural analysis
- **DON'T** optimize prematurely without profiling measurements
- **DON'T** ignore CSS visibility isolation (display: none prevents re-renders)
- **DON'T** assume all callbacks need memoization (context actions != per-entry callbacks)
- **DON'T** skip documenting the decision (future maintainers need context)
- **DON'T** forget to consider React 19 Compiler impact on manual memoization

---

## Confidence Score

**10/10** - Complete confidence for decision documentation (Outcome B)

**3/10** - Low confidence for useCallback implementation (Outcome A) - analysis shows no benefit

**Rationale for Outcome B (Documentation) Recommendation:**
- P1.M4.T1.S1 analysis explicitly recommends SKIP OPTIMIZATION
- Decision framework (testing_best_practices.md Section 3.6) confirms no useCallback needed
- CSS visibility isolation prevents hidden form re-renders
- Per-entry callback architecture means callbacks are unique per form
- Break-even threshold not met (100+ prevented re-renders needed)
- React 19 Compiler provides auto-memoization
- Current implementation follows React best practices (inline functions are default)

**Risk Mitigation (If Implementing useCallback Despite Recommendation):**
- Ensure dependencies are correct: [entry.deferred, onClose, onCancelRequest]
- Don't use entry.id as dependency (doesn't capture closure)
- Verify with React DevTools Profiler that behavior is unchanged
- Ensure all tests pass (no behavioral changes)

---

## Quick Start for Implementation

### Outcome B: Document Decision (RECOMMENDED)

```bash
# 1. Create decision document
cat > plan/docs/bugfix/callback_memoization_decision.md << 'EOF'
# FormStackRenderer Callback Memoization Decision

**Date**: $(date +%Y-%m-%d)
**Task**: P1.M4.T1.S2
**Decision**: NO CODE CHANGE - Current implementation is optimal

[Copy content from Implementation Tasks Outcome B Task 1]
EOF

# 2. Add explanatory comment to FormStackRenderer.tsx
# Edit line 41, add comment from Implementation Tasks Outcome B Task 2

# 3. Verify tests still pass
npm run test

# 4. Update architecture doc with link
# Edit plan/docs/architecture/callback_performance_analysis.md line 307

# 5. Complete
echo "P1.M4.T1.S2 complete: Decision documented, no code changes needed"
```

### Outcome A: Implement useCallback (NOT RECOMMENDED)

```bash
# Only proceed if P1.M4.T1.S1 analysis recommends optimization
# (Current analysis: SKIP OPTIMIZATION)

# 1. Modify FormStackRenderer.tsx
# - Import useCallback from 'react'
# - Wrap callbacks in useCallback with [entry.deferred, onClose, onCancelRequest]
# - See Implementation Tasks Outcome A Task 1 for exact code

# 2. Verify tests pass
npm run test

# 3. Verify type check
npm run type-check

# 4. Build
npm run build

# Expected: All commands pass, behavior unchanged
```

---

## Research References

### Internal Documentation

- **P1.M4.T1.S1 Analysis**: `plan/docs/architecture/callback_performance_analysis.md`
- **Decision Framework**: `plan/docs/architecture/testing_best_practices.md` (Section 3.6)
- **Research Summary**: `plan/docs/bugfix/P1M4T1S1/research/RESEARCH_SUMMARY.md`
- **Quick Reference**: `plan/docs/bugfix/P1M4T1S1/research/QUICK_REFERENCE.md`

### External Documentation

- [React useCallback Reference](https://react.dev/reference/react/useCallback)
- [React Compiler Documentation](https://react.dev/learn/react-compiler)
- [React Profiler Guide](https://react.dev/learn/react-developer-tools)

### Key Decision Points

1. **CSS Visibility Isolation**: Hidden forms use `display: none` - no re-render on active form changes
2. **Per-Entry Architecture**: Each form has unique callbacks - shared optimization doesn't apply
3. **Decision Framework**: testing_best_practices.md Section 3.6 - useCallback not warranted
4. **Cost-Benefit**: 0.3ms overhead for 0ms benefit - negative ROI
5. **React 19 Compiler**: Auto-memoization available - manual optimization unnecessary

---

## Appendix: P1.M4.T1.S1 Analysis Summary

### Executive Summary from P1.M4.T1.S1

| Aspect | Finding |
|--------|---------|
| Hidden form re-render behavior | CSS `display: none` isolation prevents unnecessary re-renders |
| Callback architecture | Per-entry unique callbacks with stable closures |
| Expected render count | 11 renders total (10 mount + 1 active form state change) |
| React 19 Compiler impact | Auto-memoization reduces need for manual useCallback |
| User-perceivable delay | Expected < 10ms (well below 100ms threshold) |

### Recommendation from P1.M4.T1.S1

**SKIP OPTIMIZATION**

**Rationale**: Based on architectural analysis, the current implementation should NOT cause unnecessary re-renders of hidden forms due to:
1. CSS visibility isolation (`display: none`)
2. Per-entry callback architecture (each form has unique callbacks)
3. Non-memoized user form components (callback ref changes don't trigger re-renders)
4. React 19 Compiler auto-memoization
5. Low likelihood of meeting break-even threshold (100+ prevented re-renders)

### Next Steps from P1.M4.T1.S1

- ✅ **P1.M4.T1.S1**: Complete architectural analysis
- 📋 **Manual Profiler Verification**: Use React DevTools Profiler to confirm analysis (optional)
- ❌ **P1.M4.T1.S2**: Mark as NOT NEEDED unless profiler shows unexpected behavior
- 🔧 **Consider React Compiler**: Enable for auto-memoization instead of manual useCallback

---

**End of PRP**
