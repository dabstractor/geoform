# closeForm Usage Patterns Research

## Summary

This document catalogs the actual usage patterns of `closeForm` throughout the geoform codebase to inform documentation improvements.

## Current closeForm JSDoc State

**File**: `src/hooks/useFormStack.ts`, Lines 24-90

The current JSDoc is already quite comprehensive, documenting:
- "When NOT to use" (in form components)
- "When to use" (programmatic closure, advanced scenarios, emergency recovery)
- Technical implementation details in @remarks
- Three examples: discouraged, recommended, and valid programmatic usage

## Usage Pattern Analysis

### Recommended Usage: onSubmit/onCancel Props

**FormProps Interface** (`src/types/form.ts`, Lines 29-36)
```typescript
export interface FormProps<T = unknown> {
  /** Called when form submits with the form's return value */
  onSubmit: (value: T) => void;
  /** Called when form is canceled (returns undefined to parent) */
  onCancel: () => void;
  /** Optional error handler for form-level errors */
  onError?: (error: unknown) => void;
}
```

**Recommended Pattern Example** (`README.md`, Lines 49-59)
```tsx
// ✅ RECOMMENDED: Use onSubmit/onCancel props in form components
function MyForm({ onSubmit, onCancel }: FormProps<Data>) {
  const handleSave = () => {
    onSubmit(data); // FormStackRenderer will call closeForm() internally
  };

  const handleCancel = () => {
    onCancel(); // FormStackRenderer will call closeForm() internally
  };
}
```

**Test Utils Example** (`src/__tests__/integration/test-utils.tsx`, Lines 99-110)
```tsx
export function SimpleTestForm({ onSubmit, onCancel }: FormProps<string>) {
  return (
    <div data-testid="simple-form">
      <button data-testid="submit-simple" onClick={() => onSubmit('submitted')}>
        Submit
      </button>
      <button data-testid="cancel-simple" onClick={onCancel}>
        Cancel
      </button>
    </div>
  );
}
```

### FormStackRenderer Callback Pattern

**File**: `src/components/FormStackRenderer.tsx`, Lines 52-77

```typescript
const handleSubmit = (value: unknown) => {
  entry.deferred.resolve(value);
  onClose(); // This calls closeForm from provider
};

const handleCancel = async () => {
  const confirmed = await onCancelRequest(entry);
  if (!confirmed) {
    return; // User cancelled confirmation, stay on form
  }
  entry.deferred.resolve(undefined);
  onClose(); // This calls closeForm from provider
};
```

**Key Pattern**: FormStackRenderer creates callbacks that:
1. Resolve the deferred promise (with data or undefined)
2. THEN call `onClose()` which triggers `closeForm`

### Direct closeForm Usage (Discouraged in Forms)

**Development Warning** (`src/components/FormStackProvider.tsx`, Lines 102-118)

The code includes a development-mode console.warn when closeForm is called directly:

```typescript
const closeForm = useCallback(() => {
  if (typeof process !== "undefined" && process.env?.NODE_ENV === 'development') {
    console.warn(
      'closeForm() was called directly. Most forms should use onSubmit/onCancel props instead. ' +
      'Use closeForm() only for programmatic closure from outside the form stack.\n\n' +
      'Example (DISCOURAGED - direct call in form):\n' +
      '  function MyForm({ closeForm }) {\n' +
      '    const handleSave = () => {\n' +
      '      onSubmit(data);\n' +
      '      closeForm(); // DON\'T DO THIS\n' +
      '    };\n' +
      '  }\n\n' +
      'Example (RECOMMENDED - use onSubmit):\n' +
      '  function MyForm({ onSubmit }) {\n' +
      '    const handleSave = () => {\n' +
      '      onSubmit(data); // FormStackRenderer handles closure\n' +
      '    };\n' +
      '  }'
    );
  }
  dispatch({ type: 'POP_FORM' });
}, []);
```

### Valid Direct Usage: Programmatic Closure

**Parent Component Pattern** (`src/hooks/useFormStack.ts`, Lines 75-88)

```typescript
// @example
// ```tsx
// VALID: Programmatic closure from parent component (outside form stack)
// function ParentComponent() {
//   const { closeForm, stack } = useFormStack();
//
//   // Emergency close all forms scenario
//   const handleEmergencyClose = () => {
//     while (stack.length > 0) {
//       closeForm();
//     }
//   };
// }
// ```
```

### Parent Form Opening Child Form Pattern

**File**: `src/__tests__/integration/test-utils.tsx`, Lines 38-84

```tsx
export function ParentFormWithChild<TChild = unknown>({
  onSubmit,
  onCancel,
  ChildComponent,
  formId = 'parent',
}: FormProps<{ parentValue: string; childResult?: TChild }> & {
  ChildComponent: React.ComponentType<FormProps<TChild>>;
  formId?: string;
}) {
  const { openForm } = useFormStack();
  const [parentValue, setParentValue] = useState('');
  const [childResult, setChildResult] = useState<TChild | undefined>(undefined);

  const handleOpenChild = async () => {
    const result = await openForm({
      id: 'child-form',
      label: 'Child Form',
      component: ChildComponent,
    });
    setChildResult(result);
  };

  return (
    <div>
      <button onClick={handleOpenChild}>Open Child</button>
      <button onClick={() => onSubmit({ parentValue, childResult })}>
        Submit
      </button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  );
}
```

## Existing README Documentation

**File**: `README.md`

- **Lines 673-683**: Shows BAD pattern (direct closeForm call)
- **Lines 685-697**: Shows GOOD pattern (using onSubmit/onCancel)
- **Lines 705-714**: Shows valid programmatic usage

## Key Insights for Documentation

1. **Clear Separation of Concerns**: Forms should NEVER call closeForm directly. Only parent components outside the form stack should use it.

2. **Promise Pattern Bypass**: Direct closeForm() calls bypass the Promise resolution pattern, breaking parent component expectations.

3. **FormStackRenderer Responsibility**: FormStackRenderer handles both promise resolution AND form closure automatically when forms use onSubmit/onCancel.

4. **No Cleanup Needed**: Due to the hidden container pattern (CSS-based hiding), forms don't need explicit cleanup - state is preserved automatically.

5. **Development Warning Already Exists**: The FormStackProvider already has a comprehensive console.warn for direct closeForm usage in development mode.

## Reference File Locations

| Pattern | File | Lines |
|---------|------|-------|
| FormProps interface | src/types/form.ts | 29-36 |
| FormStackRenderer callbacks | src/components/FormStackRenderer.tsx | 52-77 |
| Development warning | src/components/FormStackProvider.tsx | 102-118 |
| closeForm JSDoc | src/hooks/useFormStack.ts | 24-90 |
| README examples | README.md | 673-714 |
| Test utils examples | src/__tests__/integration/test-utils.tsx | 38-110 |
