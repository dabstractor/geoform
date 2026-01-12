# URL Sync and Form Restoration Documentation Patterns Research

## Research Conducted: 2026-01-11
**Topic**: Documentation patterns for URL state management, form restoration, and manual implementation requirements

---

## 1. URL State Management Documentation Examples

### React Router Patterns

**URL**: https://reactrouter.com/en/main/hooks/use-search-params

**Key Documentation Patterns**:
- **Clear Code-First Approach**: Shows the hook usage immediately with practical examples
- **TypeScript Examples**: Includes TypeScript types for better developer experience
- **Multiple Use Cases**: Shows reading, writing, and updating search params
- **Navigation Integration**: Demonstrates how URL state integrates with navigation

**Example Pattern**:
```jsx
// Basic usage example - concise and practical
function SearchFilters() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('query') || '';

  const updateQuery = (newQuery) => {
    setSearchParams({ query: newQuery });
  };

  return <input value={query} onChange={(e) => updateQuery(e.target.value)} />;
}
```

**Documentation Best Practices Observed**:
1. **Minimal setup code** - gets to usage quickly
2. **Interactive examples** - shows immediate value
3. **API reference separate from usage guide** - keeps docs focused
4. **TypeScript signatures** - clear type expectations

---

## 2. Hydration/Restoration Callback Documentation

### Zustand Persistence Middleware

**URL**: https://docs.pmnd.rs/zustand/guides/persisting-store-data

**Key Documentation Patterns**:
- **Callback Purpose is Explicit**: Clearly explains `onRehydrateStorage` callback
- **Implementation Required**: States clearly that user must implement the callback
- **Error Handling**: Shows how to handle hydration failures
- **Loading States**: Demonstrates UI patterns for hydration state

**Example Pattern**:
```typescript
// Explicit callback implementation requirement
const useStore = create(
  persist(
    (set) => ({
      // ... store definition
    }),
    {
      name: 'app-storage',
      // User must implement this callback
      onRehydrateStorage: () => (state) => {
        console.log('Hydrated:', state);
        // User responsible for any post-hydration logic
      },
    }
  )
);
```

**Documentation Best Practices**:
1. **"You must" language** - clear about user responsibilities
2. **Callback signature clearly documented** - parameters and return types
3. **Error scenarios covered** - what happens when hydration fails
4. **Async pattern examples** - handling promises in callbacks
5. **Loading state management** - showing how to handle hydration in progress

### React Query Hydration

**URL**: https://tanstack.com/query/latest/docs/react/guides/queries

**Key Patterns**:
- **Hydration as separate concept** - dedicated documentation section
- **Manual implementation examples** - shows exact code needed
- **Server vs Client state** - clear distinction in documentation
- **Serialization requirements** - explicit about data format requirements

**Example Pattern**:
```typescript
// Clear manual implementation guidance
function hydrate() {
  // User must implement this function
  dehydrate(state);
  queryClient.setQueryData(['key'], state);
}
```

---

## 3. "Manual Implementation Required" Documentation Patterns

### Formik Documentation

**URL**: https://formik.org/docs/overview

**Key Patterns**:
- **Explicit "Manual Setup" Section**: Dedicated heading for manual implementation
- **Step-by-step instructions**: Numbered list for required steps
- **Prerequisites clearly stated**: What you need before implementing
- **Code completeness**: Shows full working example, not snippets

**Documentation Language Patterns**:
- "You will need to..."
- "This requires you to..."
- "Implement this by..."
- "The following steps are necessary..."

**Example Structure**:
```markdown
## Manual Implementation Required

To enable this feature, you must:

1. Create a callback function
2. Pass it to the component
3. Handle the result

Here's a complete working example:
```

### React Hook Form Patterns

**URL**: https://react-hook-form.com/docs/useform

**Key Patterns**:
- **"Default Values" section**: Clear about user responsibility to provide
- **Reset handler documentation**: Explains manual reset is user's job
- **Validation callback**: Shows user must implement validation logic
- **Controlled vs Uncontrolled**: Explicit about which requires manual setup

**Code Example Pattern**:
```typescript
// Clear comment about user responsibility
const { register, handleSubmit } = useForm({
  // You must provide default values
  defaultValues: {
    firstName: '',
    lastName: '',
  },
  // You implement validation logic
  resolver: yourResolver,
});
```

---

## 4. Switch Statement Component Mapping Documentation

### Pattern from React Router

**URL**: https://reactrouter.com/en/main/start/overview

**Key Documentation Approach**:
- **Route Configuration Object**: Shows object-based mapping instead of switch
- **Type Safety**: TypeScript types for component mapping
- **Fallback Documentation**: Clear about default/404 handling
- **Nested Routes**: Shows hierarchical component mapping

**Example Pattern**:
```typescript
// Object-based component registry (preferred over switch)
const routes = [
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'about', element: <AboutPage /> },
      {
        path: 'dashboard',
        element: <Dashboard />,
        // Nested mapping documented clearly
        children: [
          { index: true, element: <DashboardHome /> },
          { path: 'settings', element: <DashboardSettings /> },
        ],
      },
    ],
  },
];
```

**Documentation Best Practices**:
1. **Shows both approaches** - switch statement vs object mapping
2. **Recommends preferred pattern** - object mapping over switch
3. **TypeScript integration** - shows how to type the mapping
4. **Fallback handling** - explicit about default cases
5. **Performance notes** - mentions lazy loading implications

---

## 5. "Why Not" Approach Documentation Patterns

### React Documentation - Design Decisions

**URL**: https://react.dev/learn/thinking-in-react

**Key Patterns**:
- **"Alternatives Considered" sections**: Dedicated to rejected approaches
- **Trade-off explanations**: Explicit about pros/cons
- **Historical context**: Why previous approaches were changed
- **Future considerations**: What might change

**Example Structure**:
```markdown
## Why We Don't Provide X

We considered providing [feature], but decided against it because:

### Reasons:
- **Performance**: Would require O(n²) complexity
- **Flexibility**: Limits customization options
- **Bundle Size**: Would add 15kb to bundle

### Alternative Approach:
Instead, we recommend [pattern] which gives you:
- Better performance
- More control
- Smaller bundle size

Example implementation:
```

### Next.js Documentation - Architecture Decisions

**Pattern Observed**:
- **"Design Decisions" docs**: Separate from API reference
- **FAQ format**: Addresses "Why not X" questions directly
- **Comparison tables**: Shows alternatives vs chosen approach
- **Community consensus**: References discussions/RFCS

**Documentation Language**:
- "You might be wondering why we don't..."
- "We intentionally omitted..."
- "This is a deliberate design choice because..."
- "We considered [alternative] but decided against it because..."

---

## 6. Code Example Formatting Best Practices

### Observed Patterns Across Libraries

#### 1. **Progressive Enhancement**
- Start with simplest working example
- Add complexity gradually
- Label each example clearly (Basic, Advanced, Production)

#### 2. **Contextual Comments**
```typescript
// Bad: Generic comment
const value = getData();

// Good: Explains why, not what
// Get initial value from URL to support shareable links
const value = searchParams.get('filter') || 'all';
```

#### 3. **File/Component Labels**
```typescript
// FilterForm.tsx
function FilterForm() { /* ... */ }

// App.tsx
function App() {
  return <FilterForm />;
}
```

#### 4. **Incomplete Code Marking**
```typescript
// ✅ This is user-provided - you must implement
const onRestore = (state) => {
  // TODO: Implement your restoration logic here
  throw new Error('Not implemented');
};

// ❌ This is library-provided
const libraryFunction = () => { /* ... */ };
```

#### 5. **TypeScript Types as Documentation**
```typescript
// Clear callback signature via types
type RestorationCallback = (state: FormState) => void;

// User must implement this interface
interface FormRestorer {
  onRestore: RestorationCallback;
  shouldRestore: (url: URL) => boolean;
}
```

#### 6. **Diff/Change Notation**
```typescript
// Before
const form = createForm();

// After: Add restoration capability
const form = createForm({
  onRestore: (state) => {
    // User implementation required
  },
});
```

---

## 7. Key Insights for Geoform Documentation

### For URL Sync Feature:

1. **Manual Implementation Communication**:
   - Use explicit "You must implement" language
   - Provide TypeScript interfaces for callbacks
   - Show complete working examples
   - Document error scenarios

2. **Callback Documentation Pattern**:
```markdown
## Restoration Callback

You must implement the `onRestore` callback to restore form state from the URL.

### Signature
```typescript
type OnRestore = (urlState: UrlState) => FormState | Promise<FormState>
```

### What You Must Implement
1. Parse the URL state
2. Transform it to form state structure
3. Return the restored state or throw if invalid

### Example
```typescript
const form = createForm({
  onRestore: (urlState) => {
    // You implement this transformation
    return {
      values: JSON.parse(urlState.data),
      touched: new Set(),
      submitted: false,
    };
  },
});
```

### Error Handling
If restoration fails, the form will initialize with default values.
```

3. **"Why Not Registry" Documentation**:
```markdown
## Why Not a Form Registry?

You might expect a global form registry that automatically handles URL sync.

### Why We Don't Provide It

**Complexity vs Flexibility Trade-off**:
- Registry adds significant bundle size
- Forces all forms into single pattern
- Makes testing and isolation harder
- Limits customization options

**Our Philosophy**:
- Manual implementation is clearer and more maintainable
- You have full control over URL structure
- Each form can have different sync behavior
- Easier to understand and debug

### Recommended Pattern
Instead of a registry, we recommend implementing URL sync per-form using the callbacks provided. This gives you:
- Explicit control over what syncs
- Custom URL structures per form
- Better testability
- Smaller bundle size
```

4. **Component Mapping Documentation**:
```markdown
## Dynamic Field Components

Geoform supports a registry-like pattern for field components using a simple object mapping.

### Why Object Mapping Over Switch

**Preferred approach**:
```typescript
const fieldComponents = {
  text: TextField,
  select: SelectField,
  checkbox: CheckboxField,
};

function Field({ type, ...props }) {
  const Component = fieldComponents[type];
  return <Component {...props} />;
}
```

**Not recommended**:
```typescript
// ❌ Switch statements are harder to extend
function Field({ type, ...props }) {
  switch (type) {
    case 'text': return <TextField {...props} />;
    case 'select': return <SelectField {...props} />;
    // Harder to add new types
  }
}
```

### Benefits of Object Mapping
- Easy to extend: just add to the object
- Type-safe with TypeScript
- Support for dynamic imports
- Simpler testing
```

---

## 8. Concrete URL References

### URL State Management:
- React Router useSearchParams: https://reactrouter.com/en/main/hooks/use-search-params
- React Router Navigation: https://reactrouter.com/en/main/components/nav-link
- URL Search Params API: https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams

### Persistence/Hydration:
- Zustand Persist Guide: https://docs.pmnd.rs/zustand/guides/persisting-store-data
- React Query Hydration: https://tanstack.com/query/latest/docs/react/guides/queries
- React Hook Form Default Values: https://react-hook-form.com/docs/useform

### Form Libraries:
- Formik Overview: https://formik.org/docs/overview
- React Hook Form Concepts: https://react-hook-form.com/docs/useform

### Documentation Patterns:
- React Docs: https://react.dev
- Next.js Documentation: https://nextjs.org/docs
- TypeScript Handbook: https://www.typescriptlang.org/docs/handbook/intro.html

---

## 9. Recommended Next Steps

1. **Create URL Sync Documentation**:
   - Start with user story
   - Show complete working example
   - Document callback signature
   - Provide error handling guidance
   - Show TypeScript types

2. **Add "Why Not" Section**:
   - Explain form registry decision
   - Show alternatives considered
   - Provide recommended pattern
   - Link to examples

3. **Component Mapping Guide**:
   - Show object mapping pattern
   - Explain why it's preferred
   - Provide TypeScript examples
   - Show testing approach

4. **Code Example Templates**:
   - Create consistent formatting
   - Use file/component labels
   - Add contextual comments
   - Show progressive complexity

---

## Summary

**Key Documentation Principles Observed**:
1. Be explicit about user responsibilities
2. Provide complete, working examples
3. Use TypeScript types as documentation
4. Explain "why not" decisions
5. Show recommended vs not recommended patterns
6. Document error scenarios
7. Use clear, directive language
8. Separate API reference from usage guides
