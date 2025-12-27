# JSDoc Best Practices for React and TypeScript Libraries

## Research Summary

This document provides comprehensive guidance on documenting React form stack libraries using JSDoc with TypeScript. Research synthesized from official TypeScript documentation, TSDoc specification, and community best practices for 2025.

## 1. JSDoc Syntax for TypeScript

### Core Tags Reference

#### @param - Function Parameters
Describes function parameters with optional type annotations. In TypeScript, type annotations are inferred from the source code, so JSDoc @param can be simplified.

```typescript
/**
 * Validates user input and returns a validation result
 * @param value The value to validate
 * @param [options] Optional configuration object
 * @param options.strict Whether to use strict validation mode
 * @returns true if valid, false otherwise
 */
function validateForm(value: string, options?: { strict?: boolean }): boolean {
  return true;
}
```

**Key Points:**
- Surround optional parameters with square brackets: `[paramName]`
- In TypeScript files, type declarations are optional since types come from the code
- Use dot notation for nested properties: `@param options.strict`

#### @returns - Return Values
Documents what a function returns.

```typescript
/**
 * Retrieves form data from the stack
 * @returns The current form state object with all field values
 */
function getFormData(): FormData {
  return {};
}
```

#### @typeParam - Generic Type Parameters
Declares generic type parameters for functions, classes, or interfaces.

```typescript
/**
 * Creates a generic form validator
 * @typeParam T The type of data being validated
 * @param data The data to validate
 * @returns Validation result containing data of type T
 */
function createValidator<T>(data: T): ValidationResult<T> {
  return { success: true, data };
}
```

#### @template - Legacy Generic Declaration
Older syntax for declaring generic types (use @typeParam in modern code when possible).

```typescript
/**
 * @template T The value type
 * @template U The return type
 * @param value
 * @returns
 */
function transform<T, U>(value: T): U {
  return {} as U;
}
```

#### @example - Usage Examples
Provides code examples showing how to use the documented item. Can include multiple examples with captions.

```typescript
/**
 * Opens a form with custom options
 * @param options Configuration for form behavior
 * @returns Promise resolving when form is submitted
 *
 * @example <caption>Basic usage</caption>
 * const result = await openForm({
 *   title: 'User Registration',
 *   onSubmit: (data) => console.log(data)
 * });
 *
 * @example <caption>With validation</caption>
 * const result = await openForm({
 *   title: 'Login',
 *   validate: (data) => data.email.includes('@'),
 *   onError: (error) => console.error(error)
 * });
 */
function openForm(options: FormOptions): Promise<FormResult> {
  return Promise.resolve({ success: true });
}
```

**@example Best Practices:**
- Examples should demonstrate real-world usage patterns
- Include expected output as comments: `// returns 2`
- Use captions for multiple related examples: `<caption>...</caption>`
- Keep examples concise and focused
- For runnable examples in testing, use Deno's `deno test --doc` or similar test runners
- Examples in IDE tooltips are read-only; focus on clarity and documentation value

#### @throws - Exception Information
Documents errors that a function might throw.

```typescript
/**
 * Validates form submission
 * @param data Form data to validate
 * @throws {ValidationError} When form data is invalid
 * @throws {TypeError} When data is null or undefined
 * @returns true if validation passes
 */
function validateSubmission(data: unknown): boolean {
  if (!data) throw new TypeError('Data required');
  return true;
}
```

#### @see - Related Items
Creates links to related documentation or functions.

```typescript
/**
 * Submits the form to the server
 * @see openForm - Opens a form dialog
 * @see validateForm - Validates form before submission
 * @returns Promise with submission result
 */
function submitForm(): Promise<SubmitResult> {
  return Promise.resolve({ success: true });
}
```

#### @since - Version Information
Indicates when an API was introduced or changed.

```typescript
/**
 * Advanced form stack with breadcrumb navigation
 * @since 2.0.0
 * @returns FormStack instance
 */
function createFormStack(): FormStack {
  return new FormStack();
}
```

#### @deprecated - Mark Obsolete Code
Indicates code that should not be used in new implementations.

```typescript
/**
 * @deprecated Use openForm() instead
 * @see openForm
 */
function openLegacyForm(): void {
  // legacy implementation
}
```

---

## 2. JSDoc for React Components

### React Component Documentation Pattern

#### Functional Components with Props

**Simple components (1-2 props):**
```typescript
/**
 * Displays a form submission status message
 * @param props Component props
 * @param props.status The submission status ('success' | 'error' | 'loading')
 * @param props.message The status message text
 * @returns A React element displaying the status
 */
function StatusMessage({ status, message }: { status: string; message: string }): JSX.Element {
  return <div className={`status-${status}`}>{message}</div>;
}
```

**Complex components (3+ props):**
```typescript
/**
 * @typedef {object} FormHeaderProps
 * @property {string} title The form title displayed at the top
 * @property {string} [subtitle] Optional subtitle or description
 * @property {boolean} [showClose] Whether to show close button
 * @property {() => void} [onClose] Callback when close button is clicked
 * @property {React.ReactNode} [icon] Optional icon element
 */

/**
 * Header component for forms with customizable title and actions
 * @param {FormHeaderProps} props
 * @returns {JSX.Element}
 *
 * @example
 * <FormHeader
 *   title="Create Account"
 *   subtitle="Enter your information below"
 *   onClose={() => console.log('Closed')}
 * />
 */
function FormHeader(props: FormHeaderProps): JSX.Element {
  const { title, subtitle, showClose, onClose, icon } = props;
  return (
    <div className="form-header">
      {icon && <span className="icon">{icon}</span>}
      <h1>{title}</h1>
      {subtitle && <p>{subtitle}</p>}
      {showClose && <button onClick={onClose}>×</button>}
    </div>
  );
}
```

**Components extending HTML attributes:**
```typescript
/**
 * @typedef {object} InputFieldProps
 * @property {string} label The input label
 * @property {string} [error] Error message if validation failed
 * @property {(value: string) => void} [onChange] Change handler
 */

/**
 * Form input field with label and error display
 * @param {React.InputHTMLAttributes<HTMLInputElement> & InputFieldProps} props
 * @returns {JSX.Element}
 */
function InputField(props: React.InputHTMLAttributes<HTMLInputElement> & InputFieldProps): JSX.Element {
  const { label, error, onChange, ...inputProps } = props;
  return (
    <div className="input-field">
      <label>{label}</label>
      <input onChange={(e) => onChange?.(e.target.value)} {...inputProps} />
      {error && <span className="error">{error}</span>}
    </div>
  );
}
```

#### React Element Return Types

- **`JSX.Element`**: Single DOM/React element - use for components that return a single element
- **`React.ReactNode`**: Flexible type for component children - accepts elements, strings, numbers, arrays, booleans, fragments
- **`React.FC<Props>`**: Type for the component function itself (when passing components as props)

```typescript
/**
 * Renders a list of form items
 * @param props Component props
 * @param props.items Array of items to render
 * @param props.children Render function or React elements
 * @returns Rendered list
 */
function FormList({ items, children }: { items: unknown[]; children: React.ReactNode }): JSX.Element {
  return <div>{children}</div>;
}

/**
 * Higher-order component pattern - accepts a component
 * @param Component The component to wrap
 * @returns Enhanced component
 */
function withFormTracking<P>(Component: React.FC<P>): React.FC<P> {
  return (props) => <Component {...props} />;
}
```

---

## 3. Documenting Generic Types in TypeScript

### @template and @typeParam for Generic Types

#### Generic Interfaces and Types

```typescript
/**
 * @template T The type of data being stored in the form stack
 * @typedef {object} FormStackOptions
 * @property {string} id Unique identifier for the form stack
 * @property {T} initialData Initial form data
 * @property {(data: T) => Promise<void>} onSubmit Submission handler
 * @property {(errors: ValidationError[]) => void} [onError] Error handler
 */

/**
 * Manages a stack of forms with state preservation
 * @template T The form data type
 */
class FormStack<T> {
  /**
   * Initializes the form stack
   * @param options Configuration options
   */
  constructor(options: FormStackOptions<T>) {}

  /**
   * Pushes a new form onto the stack
   * @template U The specific form data type (extends T)
   * @param formConfig The form configuration
   * @returns Promise resolving when form is completed
   */
  push<U extends T>(formConfig: FormConfig<U>): Promise<U> {
    return Promise.resolve({} as U);
  }
}
```

#### Generic Function Examples

```typescript
/**
 * Transforms form data using a mapper function
 * @template T Input data type
 * @template U Output data type
 * @param data The input data
 * @param mapper Function to transform data
 * @returns Transformed data
 */
function mapFormData<T, U>(data: T, mapper: (input: T) => U): U {
  return mapper(data);
}

/**
 * Validates data against a schema
 * @template T The data type to validate
 * @param data Data to validate
 * @param schema Validation schema
 * @returns Validation result
 */
function validate<T>(data: unknown, schema: ValidationSchema<T>): ValidationResult<T> {
  return { success: true, data: data as T };
}
```

### @callback for Generic Callback Functions

The `@callback` tag is essential for documenting reusable callback/function types with generics:

```typescript
/**
 * Callback function for form submission
 * @template T The form data type
 * @callback OnFormSubmit
 * @param {T} data The submitted form data
 * @param {FormContext} context Metadata about the form
 * @returns {Promise<void>} Promise that resolves when submission completes
 *
 * @example
 * const handleSubmit: OnFormSubmit<UserData> = async (data, context) => {
 *   await api.saveUser(data);
 *   context.closeForm();
 * };
 */

/**
 * Opens a form with custom submission handler
 * @template T The form data type
 * @param {OnFormSubmit<T>} onSubmit Callback for form submission
 * @returns {Promise<void>}
 */
function openForm<T>(onSubmit: OnFormSubmit<T>): Promise<void> {
  return Promise.resolve();
}
```

#### Generic Props Type Patterns

```typescript
/**
 * @template T The data type contained in this component
 * @typedef {object} FormContainerProps
 * @property {T} initialData Initial data for the form
 * @property {(data: T) => void} onChange Called when data changes
 * @property {(data: T) => Promise<SubmitResult>} onSubmit Form submission handler
 * @property {string} [title] Optional form title
 */

/**
 * Container component managing form state generically
 * @template T The form data type
 * @param {FormContainerProps<T>} props Configuration and handlers
 * @returns {JSX.Element}
 */
function FormContainer<T extends object>(props: FormContainerProps<T>): JSX.Element {
  return <div>Form</div>;
}
```

---

## 4. Module-Level Documentation with @packageDocumentation

### Entry Point Documentation

Place in the main index file (e.g., `src/index.ts` or `src/index.js`):

```typescript
/**
 * @packageDocumentation
 *
 * Geoform Opus - A comprehensive React form stack management library
 *
 * Provides production-ready form handling with:
 * - Multi-level form stack management with breadcrumb navigation
 * - Complete state preservation across form stack operations
 * - Advanced error isolation with Error Boundary components
 * - URL-based state synchronization for deep linking
 * - Accessibility-first component design
 *
 * @example <caption>Basic Usage</caption>
 * ```typescript
 * import { FormStack, useFormStack } from 'geoform-opus';
 *
 * function MyApp() {
 *   const formStack = useFormStack();
 *
 *   return (
 *     <FormStack stack={formStack}>
 *       <Form onSubmit={(data) => formStack.push({ data })} />
 *     </FormStack>
 *   );
 * }
 * ```
 *
 * @example <caption>With Error Handling</caption>
 * ```typescript
 * import { FormStack, FormErrorBoundary } from 'geoform-opus';
 *
 * <FormErrorBoundary onRetry={() => window.location.reload()}>
 *   <FormStack stack={formStack} />
 * </FormErrorBoundary>
 * ```
 *
 * @see {@link FormStack} for stack management
 * @see {@link useFormStack} for hook-based integration
 * @see {@link FormErrorBoundary} for error handling
 */

export { FormStack } from './FormStack';
export { useFormStack } from './hooks/useFormStack';
export { FormErrorBoundary } from './components/FormErrorBoundary';
```

### File-Level Module Documentation

```typescript
/**
 * Form stack management and navigation utilities
 *
 * Provides the core FormStack class and related utilities for managing
 * a hierarchical stack of forms with state preservation and breadcrumb navigation.
 *
 * @module FormStack
 */

export class FormStack {
  // implementation
}
```

---

## 5. @example Block Best Practices

### General Guidelines

#### Syntax and Structure

```typescript
/**
 * Function description
 *
 * @example <caption>Basic usage</caption>
 * const result = myFunction('input');
 * console.log(result); // outputs expected result
 *
 * @example <caption>Advanced usage with options</caption>
 * const result = myFunction('input', {
 *   verbose: true,
 *   timeout: 5000
 * });
 */
function myFunction(input: string, options?: Options): Result {
  return {};
}
```

#### Captions for Multiple Examples

Always use captions when documenting multiple examples to clarify the use case:

```typescript
/**
 * @example <caption>Opening a simple form</caption>
 * openForm({ title: 'Create User' });
 *
 * @example <caption>Form with validation</caption>
 * openForm({
 *   title: 'Create User',
 *   validate: (data) => data.email.includes('@')
 * });
 *
 * @example <caption>Form with error handling</caption>
 * openForm({
 *   title: 'Create User',
 *   onError: (error) => console.error(error)
 * });
 */
```

#### Including Comments and Output

```typescript
/**
 * Calculates total form value
 * @param items Array of form items with values
 * @returns Sum of all item values
 *
 * @example
 * const items = [{ value: 5 }, { value: 10 }, { value: 3 }];
 * const total = calculateTotal(items);
 * console.log(total); // 18
 */
function calculateTotal(items: Item[]): number {
  return items.reduce((sum, item) => sum + item.value, 0);
}
```

### Runnable Examples - Testing Documentation

#### With Deno
```typescript
/**
 * Formats a date for display
 * @param date The date to format
 * @returns Formatted date string
 *
 * @example
 * ```typescript
 * import { formatDate } from './formatter.ts';
 *
 * const formatted = formatDate(new Date('2025-01-15'));
 * console.assert(formatted === '1/15/2025');
 * ```
 */
export function formatDate(date: Date): string {
  return date.toLocaleDateString();
}
```

Run with: `deno test --doc formatter.ts`

#### With Jest/Vitest
```typescript
/**
 * Validates email format
 * @param email The email to validate
 * @returns true if email is valid
 *
 * @example
 * // This example is tested by the test suite
 * isValidEmail('test@example.com'); // true
 * isValidEmail('invalid-email'); // false
 */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
```

### Best Practices Summary for @example

1. **Show Real Patterns** - Demonstrate how code is actually used
2. **Include Output** - Comment expected results: `// returns 2`
3. **Use Captions** - Clarify different use cases with `<caption>` tags
4. **Keep Concise** - Focus on essential functionality, not edge cases
5. **Don't Over-Document** - A few good examples beat many mediocre ones
6. **Consider IDE Display** - Examples appear in tooltips; keep readable
7. **Test When Possible** - Use doc testing features (Deno, Jest) to verify examples
8. **Markdown Support** - Use markdown formatting in examples for clarity

---

## 6. Documenting Callback Functions

### Callback Props in Components

```typescript
/**
 * @typedef {object} FormDialogProps
 * @property {string} title Dialog title
 * @property {(data: FormData) => Promise<void>} onSubmit Called when form is submitted
 * @property {() => void} [onCancel] Called when dialog is cancelled
 * @property {(error: FormError) => void} [onError] Called when validation fails
 */

/**
 * Dialog component for form submission
 * @param {FormDialogProps} props Configuration and callbacks
 * @returns {JSX.Element}
 */
function FormDialog(props: FormDialogProps): JSX.Element {
  return <div>Form</div>;
}
```

### Callback as Generic Type Parameter

```typescript
/**
 * Form submission handler for generic data types
 * @template T The form data type
 * @callback FormSubmitHandler
 * @param {T} data The submitted form data
 * @param {FormContext} context Form context and utilities
 * @returns {Promise<SubmitResult>} Result of submission
 */

/**
 * Creates a form with a typed submission handler
 * @template T The form data type
 * @param {FormConfig<T>} config Form configuration
 * @param {FormSubmitHandler<T>} onSubmit Submission handler
 * @returns {Form<T>} Form instance
 */
function createForm<T extends object>(
  config: FormConfig<T>,
  onSubmit: FormSubmitHandler<T>
): Form<T> {
  return new Form(config, onSubmit);
}
```

### Optional Callbacks with Default Handling

```typescript
/**
 * @typedef {object} FormOptions
 * @property {(data: any) => Promise<void>} onSubmit Required submission handler
 * @property {() => void} [onCancel] Optional cancel handler (no-op if not provided)
 * @property {(error: Error) => void} [onError] Optional error handler
 */

/**
 * Opens a form with required and optional callbacks
 * @param {FormOptions} options Form options
 * @param options.onSubmit Handler for form submission
 * @param [options.onCancel] Handler for cancellation
 * @param [options.onError] Handler for errors
 * @returns {Promise<void>}
 */
function openForm(options: FormOptions): Promise<void> {
  return Promise.resolve();
}
```

### Nested Callbacks (Higher-Order Functions)

```typescript
/**
 * Creates a form submission handler with retry logic
 * @template T The form data type
 * @param {FormSubmitHandler<T>} baseHandler The base submission handler
 * @param {number} [maxRetries=3] Maximum retry attempts
 * @returns {FormSubmitHandler<T>} Enhanced handler with retry capability
 *
 * @example
 * const handleSubmit = withRetry(
 *   async (data) => {
 *     await api.submitForm(data);
 *   },
 *   5
 * );
 */
function withRetry<T>(
  baseHandler: FormSubmitHandler<T>,
  maxRetries?: number
): FormSubmitHandler<T> {
  return async (data, context) => {
    // implementation with retries
  };
}
```

---

## 7. TSDoc vs JSDoc for TypeScript Projects

### Key Differences

| Feature | JSDoc | TSDoc |
|---------|-------|-------|
| **Specification** | Loosely defined, tool-specific variants | Formal specification by Microsoft |
| **Primary Target** | JavaScript projects | TypeScript projects |
| **Type Annotations** | Often needed for JavaScript | Minimized - types from code |
| **Standardization** | Low - tools have different interpretations | High - consistent parsing |
| **Tooling** | JSDoc ecosystem (JSDoc, better-docs) | TSDoc tools (API Extractor, TypeDoc) |
| **Focus** | Type documentation and validation | Documentation and API exposure |

### When to Use Each

**Use JSDoc when:**
- Working primarily with JavaScript files
- Using simple type annotations
- TypeScript support is not a priority
- Tool ecosystem already uses JSDoc

**Use TSDoc when:**
- Building TypeScript libraries for distribution
- Need API documentation extraction (API Extractor)
- Using Microsoft's toolchain (Rushstack)
- Targeting high documentation standardization

### Compatibility

TSDoc syntax is mostly a superset of JSDoc. Modern TypeScript tools support both:
- TypeDoc: Supports both JSDoc and TSDoc
- VS Code: Recognizes both standards
- TypeScript language server: Works with both

### Recommendation for React Form Stack

**Use JSDoc for Geoform Opus because:**
1. React ecosystem standard is JSDoc
2. TypeScript provides type inference (reducing JSDoc type duplication)
3. Simpler, more familiar syntax for team members
4. Tools like VS Code have excellent JSDoc IntelliSense
5. Documentation generation tools (TypeDoc, better-docs) support JSDoc
6. Less ceremonious for medium-sized library (doesn't need full API Extractor setup)

**Consider TSDoc if:**
- Planning to use API Extractor for API review
- Building for enterprise distribution
- Need formal versioning/deprecation tracking

---

## 8. Common Pitfalls When Documenting React Hooks

### Pitfall 1: Not Documenting Return Values from Hooks

**Problem:** Hooks often return complex objects with multiple values and functions.

```typescript
// BAD - Unclear what hook returns
/**
 * Custom form hook
 */
function useFormData() {
  return [data, setData, validate, submit];
}

// GOOD - Documents return structure
/**
 * Custom form data management hook
 * @returns {object} Form state object
 * @returns {any} state The current form data
 * @returns {Function} setState Function to update form data
 * @returns {Function} validate Function to validate current data
 * @returns {Function} submit Function to submit the form
 *
 * @example
 * const [data, setData, validate, submit] = useFormData();
 */
function useFormData() {
  return [data, setData, validate, submit];
}

// BETTER - Use typedef for clarity
/**
 * @typedef {object} UseFormDataReturn
 * @property {FormData} state The current form data
 * @property {(data: Partial<FormData>) => void} setState Update form data
 * @property {() => boolean} validate Validate form data
 * @property {() => Promise<void>} submit Submit the form
 */

/**
 * Custom form data management hook
 * @returns {UseFormDataReturn} Form state and utilities
 *
 * @example
 * const { state, setState, validate, submit } = useFormData();
 * setState({ name: 'John' });
 * await submit();
 */
function useFormData() {
  // implementation
}
```

### Pitfall 2: Missing Dependency Array Documentation

**Problem:** Dependencies and side effects in hooks aren't explained.

```typescript
// BAD - Dependencies unclear
/**
 * Syncs form state with URL parameters
 */
function useFormStackURLSync(formStack: FormStack) {
  useEffect(() => {
    // sync implementation
  }, [formStack]); // Why only formStack?
}

// GOOD - Documents dependencies and effects
/**
 * Synchronizes form stack state with URL parameters
 *
 * Updates URL when form stack changes, and restores form state
 * when URL parameters change. Useful for deep linking and browser navigation.
 *
 * @param formStack The form stack instance to sync
 * @param [options] Synchronization options
 * @param [options.encoding] URL encoding strategy ('json' or 'query')
 * @param [options.debug] Enable debug logging
 *
 * @example
 * useFormStackURLSync(formStack, { encoding: 'json' });
 * // Now form state persists in URL: /app?form_state={...}
 */
function useFormStackURLSync(
  formStack: FormStack,
  options?: URLSyncOptions
): void {
  useEffect(() => {
    // sync implementation
  }, [formStack, options?.encoding]); // Clear why these are deps
}
```

### Pitfall 3: Not Documenting Cleanup Functions

**Problem:** Hooks with side effects need cleanup documentation.

```typescript
// BAD - Cleanup purpose not explained
/**
 * Subscribes to form changes
 */
function useFormSubscription(callback: (data: FormData) => void) {
  useEffect(() => {
    const unsubscribe = formStack.subscribe(callback);
    return unsubscribe;
  }, [callback, formStack]);
}

// GOOD - Documents cleanup responsibility
/**
 * Subscribes to form stack changes with automatic cleanup
 *
 * The hook registers a callback that fires whenever form data changes.
 * Automatically unsubscribes when the component unmounts or dependencies change.
 *
 * @param callback Function called with new form data whenever stack changes
 * @throws {Error} If callback is null or undefined
 *
 * @example
 * useFormSubscription((data) => {
 *   console.log('Form data changed:', data);
 *   // Cleanup happens automatically on unmount
 * });
 */
function useFormSubscription(callback: (data: FormData) => void) {
  useEffect(() => {
    const unsubscribe = formStack.subscribe(callback);
    return unsubscribe; // Automatic cleanup
  }, [callback, formStack]);
}
```

### Pitfall 4: Unclear Hook Behavior with Multiple Effects

**Problem:** Hooks with multiple useEffect calls need clear documentation of each side effect.

```typescript
// BAD - Multiple effects, unclear behavior
/**
 * Complete form stack hook
 */
function useFormStack(options: FormStackOptions) {
  useEffect(() => { /* load */ }, []);
  useEffect(() => { /* sync */ }, [options]);
  useEffect(() => { /* validate */ }, [formData]);
  return { formData, push, pop };
}

// GOOD - Documents each side effect clearly
/**
 * Complete form stack management hook
 *
 * Initializes form stack state and manages multiple side effects:
 * - Initial load: Restores form stack from localStorage on mount
 * - Options sync: Updates stack configuration when options change
 * - Data validation: Validates form data whenever it changes
 *
 * @param options Form stack configuration options
 * @returns {FormStackState} Current form stack state and methods
 * @returns {FormData} formData The current form data
 * @returns {(form: Form) => void} push Push a new form onto stack
 * @returns {() => void} pop Remove the top form from stack
 *
 * @example
 * const { formData, push, pop } = useFormStack({
 *   persistToLocalStorage: true,
 *   validateOnChange: true
 * });
 */
function useFormStack(options: FormStackOptions) {
  // Initialization effect (runs once)
  useEffect(() => {
    // Load from storage
  }, []);

  // Options change effect
  useEffect(() => {
    // Reconfigure stack
  }, [options]);

  // Data validation effect
  useEffect(() => {
    // Validate current data
  }, [formData]);

  return { formData, push, pop };
}
```

### Pitfall 5: Not Documenting State Updates That Might Cause Re-renders

**Problem:** Closures and stale state not explained.

```typescript
// BAD - Doesn't explain stale closure issues
/**
 * Form state hook
 */
function useFormState() {
  const [data, setData] = useState({});
  const handleChange = (field: string, value: any) => {
    setData(d => ({ ...d, [field]: value }));
  };
  return { data, handleChange };
}

// GOOD - Explains state update patterns and closures
/**
 * Form state management hook with proper dependency handling
 *
 * Uses functional setState to ensure updated data is used in callbacks.
 * Prevents stale closure issues when multiple state updates happen in sequence.
 *
 * Note: Callbacks returned from this hook are NOT memoized. Wrap in useCallback
 * if passing to child components to prevent unnecessary re-renders.
 *
 * @returns {object} Form state object
 * @returns {FormData} data Current form data
 * @returns {(field: string, value: any) => void} handleChange Update single field
 * @returns {(newData: Partial<FormData>) => void} setData Batch update form data
 *
 * @example
 * const { data, handleChange, setData } = useFormState();
 *
 * // Safe - uses functional setState
 * handleChange('name', 'John');
 * handleChange('email', 'john@example.com');
 */
function useFormState() {
  const [data, setData] = useState({});
  const handleChange = (field: string, value: any) => {
    // Uses functional setState to avoid stale closures
    setData(prevData => ({ ...prevData, [field]: value }));
  };
  return { data, handleChange, setData };
}
```

### Pitfall 6: Missing Type Constraints Documentation

**Problem:** Generic hooks don't document type constraints or limitations.

```typescript
// BAD - Type parameter constraints not explained
/**
 * Stack management hook
 * @template T
 */
function useStack<T>() {
  return { items: [] as T[], push: (item: T) => {} };
}

// GOOD - Explains type constraints and usage
/**
 * Generic stack data structure hook
 *
 * @template T The type of items stored in the stack
 *
 * Type constraints:
 * - Must be serializable if using localStorage persistence
 * - Objects should have unique identifiers for proper key management
 *
 * @returns {object} Stack operations
 * @returns {T[]} items Array of items in the stack
 * @returns {(item: T) => void} push Add item to top of stack
 * @returns {() => T | undefined} pop Remove and return top item
 *
 * @example
 * const { items, push, pop } = useStack<FormData>();
 * push({ name: 'User 1' });
 * const popped = pop();
 */
function useStack<T>() {
  return {
    items: [] as T[],
    push: (item: T) => {},
    pop: () => {} as T | undefined
  };
}
```

### Summary: Hook Documentation Best Practices

1. **Document Return Structures** - Use @typedef for complex return values
2. **Explain Dependencies** - Comment on what triggers effects and why
3. **Document Cleanup** - Clarify what the returned cleanup function does
4. **Explain Multiple Effects** - If hook has multiple useEffect, document each
5. **Warn About Closures** - Mention stale closure risks and mitigation
6. **Document Constraints** - For generic hooks, explain type constraints
7. **Provide Real Examples** - Show actual usage patterns, not just syntax
8. **Mention Memoization Needs** - Note if hook results should be memoized

---

## Summary: Best Practices Checklist

### Documentation Quality
- [ ] Every public function/component has a JSDoc comment
- [ ] @param documents all parameters with descriptions
- [ ] @returns documents return type and meaning
- [ ] @example shows real-world usage patterns
- [ ] Complex types use @typedef for clarity

### React Components
- [ ] Props documented with @param or @typedef
- [ ] Component purpose stated in opening line
- [ ] Return type is JSX.Element or React.ReactNode as appropriate
- [ ] Optional props use square brackets: `[propName]`
- [ ] Examples show common use cases

### Hooks
- [ ] Return value structure documented
- [ ] Dependencies explained in description
- [ ] Cleanup functions documented
- [ ] Type constraints explained (for generics)
- [ ] Example shows typical usage

### Generic Types
- [ ] @template or @typeParam documents type parameters
- [ ] Type constraints documented (e.g., `extends Serializable`)
- [ ] Usage examples show actual type instantiation
- [ ] Callback types use @callback for reusability

### Error Handling
- [ ] @throws documents expected exceptions
- [ ] Error types specified when possible
- [ ] Recovery strategies mentioned in description

### Versioning & Maintenance
- [ ] @since indicates when API was introduced
- [ ] @deprecated marks obsolete code with alternatives
- [ ] @see links to related items
- [ ] @author credits contributors when appropriate

---

## Official References and Tools

### Official Documentation
- **TypeScript JSDoc Reference**: https://www.typescriptlang.org/docs/handbook/jsdoc-supported-types.html
- **TSDoc Specification**: https://tsdoc.org/
- **JSDoc Official**: https://jsdoc.app/

### Documentation Generation Tools
- **TypeDoc**: Generates documentation from JSDoc comments (supports TSDoc)
- **better-docs**: Custom JSDoc theme with React component previews
- **API Extractor**: Microsoft tooling for API review (TSDoc-focused)
- **JSR (Deno)**: Automatic documentation with runnable examples

### Testing Documentation
- **Deno**: `deno test --doc` for executable examples
- **Jest/Vitest**: Doc tests via plugin extensions
- **JSDoc Lint**: Identify missing documentation

### IDE Support
- **VS Code**: Built-in JSDoc IntelliSense and preview
- **WebStorm**: JSDoc hints and auto-generation
- **Vim/Neovim**: Via LSP (typescript-language-server)

---

## Implementation Recommendations for Geoform Opus

For the form stack library JSDoc migration (P5M1), follow this priority:

1. **Phase 1: Core Components** (Week 1)
   - FormStack, FormContainer classes
   - useFormStack, useFormStackURLSync hooks
   - Custom hook return types with @typedef
   - Generic type documentation with @template

2. **Phase 2: Component Library** (Week 2)
   - FormErrorBoundary, FormErrorDisplay
   - Breadcrumb navigation components
   - Callback prop documentation (@callback patterns)
   - Props documentation with @typedef

3. **Phase 3: Types & Utilities** (Week 3)
   - Form configuration types
   - Callback function types
   - Validation schemas
   - Module-level @packageDocumentation

4. **Phase 4: Examples & Testing** (Week 4)
   - Add comprehensive @example blocks
   - Implement doc testing (deno test --doc)
   - Generate TypeDoc documentation
   - Audit for common pitfalls

---

## References

Sources used in this research (2025):

- [TypeScript: Documentation - JSDoc Reference](https://www.typescriptlang.org/docs/handbook/jsdoc-supported-types.html)
- [What is TSDoc? | TSDoc](https://tsdoc.org/)
- [Writing JSDoc for React Components](https://schof.co/writing-jsdoc-for-react-components/)
- [Document Your React Code with JSDoc: Best Practices and Tips](https://medium.com/@bobjunior542/document-your-react-code-with-jsdoc-best-practices-and-tips-32bf6b92b91f)
- [Use JSDoc](https://jsdoc.app/)
- [Get a reusable type for a generic function using JSDoc](https://www.williamkillerud.com/blog/type-generic-function-jsdoc/)
- [How to document your JavaScript package | Deno](https://deno.com/blog/document-javascript-package)
- [7 Common Mistakes When Using React Hooks](https://www.telerik.com/blogs/7-common-mistakes-using-react-hooks)
- [React Hooks — Common pitfalls and Best Practices](https://hrshdg8.medium.com/react-hooks-common-pitfalls-and-best-practices-96079a40870c)
- [Avoiding common mistakes in React Hooks - LogRocket Blog](https://blog.logrocket.com/avoiding-common-mistakes-in-react-hooks/)
