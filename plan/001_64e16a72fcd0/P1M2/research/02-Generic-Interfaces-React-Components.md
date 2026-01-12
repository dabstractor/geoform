# Generic Interfaces for React Components - 2025 Research

## Overview
This document covers TypeScript generic patterns for React components, including proper typing of `ComponentType<Props>`, generic constraints, and the debate between interfaces and types for props.

---

## 1. Generic Component Props Interfaces

### Basic Generic Component

```typescript
// Simple generic component with props interface
interface ListProps<T> {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
  keyExtractor: (item: T) => string | number;
}

// Component implementation
function List<T extends unknown>({ items, renderItem, keyExtractor }: ListProps<T>) {
  return (
    <ul>
      {items.map((item) => (
        <li key={keyExtractor(item)}>
          {renderItem(item)}
        </li>
      ))}
    </ul>
  );
}

// Usage
interface User {
  id: number;
  name: string;
}

const users: User[] = [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }];

<List<User>
  items={users}
  renderItem={(user) => user.name}
  keyExtractor={(user) => user.id}
/>
```

**Key Points:**
- Use `<T extends unknown>` in TSX files (not just `<T>`) to avoid confusion with JSX syntax
- Alternative: use `<T,>` syntax with trailing comma
- Type parameter must be explicitly provided in JSX context

---

### Generic Component with Multiple Type Parameters

```typescript
interface TableProps<TData, TColumn> {
  data: TData[];
  columns: TColumn[];
  renderCell: (item: TData, column: TColumn) => React.ReactNode;
}

function Table<TData extends unknown, TColumn extends unknown>(
  { data, columns, renderCell }: TableProps<TData, TColumn>
) {
  return (
    <table>
      <tbody>
        {data.map((row, idx) => (
          <tr key={idx}>
            {columns.map((col, colIdx) => (
              <td key={colIdx}>{renderCell(row, col)}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

---

## 2. Typing ComponentType<Props> with Generics

### Basic ComponentType Usage

```typescript
interface FormProps<T> {
  initialValues: T;
  onSubmit: (values: T) => void;
}

interface FormPageProps<T> {
  title: string;
  FormComponent: React.ComponentType<FormProps<T>>;
  initialValues: T;
}

function FormPage<T extends unknown>({
  title,
  FormComponent,
  initialValues,
}: FormPageProps<T>) {
  return (
    <div>
      <h1>{title}</h1>
      <FormComponent
        initialValues={initialValues}
        onSubmit={(values) => console.log('Submitted:', values)}
      />
    </div>
  );
}

// Usage
interface UserFormValues {
  email: string;
  password: string;
}

function UserForm({ initialValues, onSubmit }: FormProps<UserFormValues>) {
  return (
    <form onSubmit={() => onSubmit(initialValues)}>
      {/* Form fields */}
    </form>
  );
}

<FormPage<UserFormValues>
  title="User Registration"
  FormComponent={UserForm}
  initialValues={{ email: '', password: '' }}
/>
```

---

### ComponentType with Constrained Generics

```typescript
// Constrain generic to objects with specific properties
interface HasId {
  id: string | number;
}

interface ItemRendererProps<T extends HasId> {
  item: T;
  isSelected: boolean;
}

interface ListWithSelectionProps<T extends HasId> {
  items: T[];
  ItemRenderer: React.ComponentType<ItemRendererProps<T>>;
  onItemSelect: (item: T) => void;
}

function ListWithSelection<T extends HasId>({
  items,
  ItemRenderer,
  onItemSelect,
}: ListWithSelectionProps<T>) {
  const [selectedId, setSelectedId] = useState<string | number | null>(null);

  return (
    <div>
      {items.map((item) => (
        <div
          key={item.id}
          onClick={() => {
            setSelectedId(item.id);
            onItemSelect(item);
          }}
        >
          <ItemRenderer
            item={item}
            isSelected={selectedId === item.id}
          />
        </div>
      ))}
    </div>
  );
}
```

---

## 3. Generic Constraint Patterns

### T extends unknown vs T extends any

```typescript
// Pattern 1: T extends unknown (Recommended)
// More restrictive, forces proper typing
interface Container1Props<T extends unknown> {
  value: T;
  transform: (val: T) => string;
}

function Container1<T extends unknown>({ value, transform }: Container1Props<T>) {
  return <div>{transform(value)}</div>;
}

// Usage - Type is inferred correctly
<Container1 value={42} transform={(n) => n.toString()} /> // T is number
<Container1 value="hello" transform={(s) => s.toUpperCase()} /> // T is string

// Pattern 2: T extends any (Less restrictive)
interface Container2Props<T extends any> {
  value: T;
  transform: (val: T) => string;
}

function Container2<T extends any>({ value, transform }: Container2Props<T>) {
  return <div>{transform(value)}</div>;
}

// Usage - Type is still inferred but less strict

// Pattern 3: Unconstrained T (Default)
interface Container3Props<T> {
  value: T;
  transform: (val: T) => string;
}

function Container3<T>({ value, transform }: Container3Props<T>) {
  return <div>{transform(value)}</div>;
}
```

**Comparison:**
- `<T extends unknown>`: Most restrictive, recommended for TSX
- `<T extends any>`: Medium restriction, more flexible
- `<T>`: Unconstrained, least restrictive but may cause type inference issues

**Recommendation:** Use `<T extends unknown>` for better type safety and clarity.

---

### Complex Constraint Patterns

```typescript
// Constraint to objects with specific key
interface HasKey<K extends string | number | symbol> {
  [key in K]: any;
}

// Constraint using extends with intersection
interface DataWithId {
  id: string;
}

interface TableDataProps<T extends DataWithId> {
  data: T[];
  columns: (keyof T)[];
}

// Constraint using function type
interface CallbackProps<T extends (...args: any[]) => any> {
  callback: T;
  args: Parameters<T>;
}

// Multiple constraints
interface ComplexProps<
  T extends { id: string | number },
  K extends keyof T
> {
  items: T[];
  sortBy: K;
  sortOrder: 'asc' | 'desc';
}
```

---

## 4. Interface vs Type for React Props

### Current Best Practice: Both Are Equivalent

Modern TypeScript (4.2+) has made interfaces and type aliases nearly equivalent for most use cases. The choice depends on project conventions and specific needs.

### When to Use Interface

```typescript
// 1. Library/Public API Definitions
// Interfaces support declaration merging for extensibility
interface ButtonProps {
  variant: 'primary' | 'secondary';
  size: 'small' | 'medium' | 'large';
}

// Users of your library can extend this
declare global {
  namespace React {
    interface ButtonProps {
      customColor?: string;
    }
  }
}

// 2. Extensible Component Props
// Good for inheritance and extension
interface BaseButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

interface PrimaryButtonProps extends BaseButtonProps {
  variant: 'primary';
}

interface SecondaryButtonProps extends BaseButtonProps {
  variant: 'secondary';
}

// 3. Class Component Props
class MyComponent extends React.Component<MyComponentProps> {
  // ...
}

// 4. Multiple Interface Extension
interface WithTheme {
  theme: 'light' | 'dark';
}

interface WithAccessibility {
  ariaLabel: string;
}

interface ButtonProps extends WithTheme, WithAccessibility {
  onClick: () => void;
}
```

### When to Use Type

```typescript
// 1. Union Types
type ButtonVariant = 'primary' | 'secondary' | 'danger';

type ButtonSize = 'small' | 'medium' | 'large';

type ButtonProps = {
  variant: ButtonVariant;
  size: ButtonSize;
  onClick: () => void;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

// 2. Intersection Types
interface BaseProps {
  className?: string;
}

interface InteractiveProps {
  onClick: () => void;
}

type CompleteButtonProps = BaseProps & InteractiveProps & {
  disabled?: boolean;
};

// 3. Function Overloads
type FormHandler = {
  (values: FormData): Promise<void>;
  (values: FormData, onSuccess?: () => void): Promise<void>;
};

// 4. Mapped Types and Generics
type ReadonlyProps<T> = {
  readonly [K in keyof T]: T[K];
};

interface UserFormValues {
  email: string;
  password: string;
}

type ReadonlyUserProps = ReadonlyProps<UserFormValues>;
// Result: { readonly email: string; readonly password: string }

// 5. Conditional Types
type Component<T> = T extends { children: React.ReactNode }
  ? React.FC<T>
  : React.ComponentType<T>;
```

---

### Decision Table for Interface vs Type

| Scenario | Recommendation | Reason |
|----------|---|---|
| Simple component props | Either | Both work equally well |
| Library/public APIs | Interface | Declaration merging support |
| Union types needed | Type | Types support unions natively |
| Intersection types needed | Type | Types handle intersections better |
| Complex type manipulations | Type | Mapped and conditional types |
| Class component props | Interface | Convention and clarity |
| Team consistency | Pick one | Consistency matters most |
| Large component tree with inheritance | Interface | Easier extension pattern |
| Generic constraints with transformations | Type | Better for complex generics |

---

## 5. Best Practice Patterns

### Pattern 1: Interface with Generics for Extensible Components

```typescript
// Base interface
interface BaseComponentProps<T = any> {
  className?: string;
  id?: string;
}

// Generic interface for list-like components
interface ListComponentProps<T, K extends keyof T = keyof T> extends BaseComponentProps {
  items: T[];
  itemKey: K | ((item: T) => string | number);
  renderItem: (item: T, index: number) => React.ReactNode;
  renderEmpty?: () => React.ReactNode;
}

function ListComponent<T extends { id?: string | number }, K extends keyof T>(
  props: ListComponentProps<T, K>
) {
  // Implementation
}
```

### Pattern 2: Type Union for Polymorphic Components

```typescript
// Polymorphic component pattern using types
type PolymorphicProps<C extends React.ElementType> = React.ComponentPropsWithoutRef<C> & {
  as?: C;
  children?: React.ReactNode;
};

type ButtonVariant = 'primary' | 'secondary' | 'outline';

interface ButtonOwnProps {
  variant?: ButtonVariant;
  isLoading?: boolean;
}

type ButtonProps<C extends React.ElementType = 'button'> = PolymorphicProps<C> & ButtonOwnProps;

const Button = React.forwardRef<any, ButtonProps>(
  ({ as: Component = 'button', variant = 'primary', ...props }, ref) => (
    <Component ref={ref} className={`btn btn-${variant}`} {...props} />
  )
);

// Usage
<Button variant="primary">Click me</Button>
<Button as="a" href="/home" variant="secondary">Home</Button>
```

### Pattern 3: Generic Type with Helper Types

```typescript
// Reusable generic types
type AsyncState<T, E = Error> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: E };

type DataProps<T> = {
  data: AsyncState<T>;
  onRetry?: () => void;
};

interface TableProps<T extends { id: string | number }> extends DataProps<T[]> {
  columns: Array<{
    key: keyof T;
    label: string;
    render?: (value: T[keyof T], row: T) => React.ReactNode;
  }>;
}

function Table<T extends { id: string | number }>(props: TableProps<T>) {
  const { data, columns } = props;

  if (data.status === 'loading') return <div>Loading...</div>;
  if (data.status === 'error') return <div>Error: {data.error.message}</div>;
  if (data.status === 'idle') return null;

  return (
    <table>
      <thead>
        <tr>
          {columns.map(col => <th key={String(col.key)}>{col.label}</th>)}
        </tr>
      </thead>
      <tbody>
        {data.data.map(row => (
          <tr key={row.id}>
            {columns.map(col => (
              <td key={String(col.key)}>
                {col.render ? col.render(row[col.key], row) : String(row[col.key])}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

---

## 6. Advanced Generic Patterns

### InferProps Pattern

```typescript
// Extract props type from component
type InferProps<C extends React.ComponentType<any>> = C extends React.FC<infer P>
  ? P
  : C extends React.ComponentType<infer P>
  ? P
  : never;

interface MyComponentProps {
  title: string;
  count: number;
}

const MyComponent: React.FC<MyComponentProps> = ({ title, count }) => (
  <div>{title}: {count}</div>
);

type Props = InferProps<typeof MyComponent>; // { title: string; count: number }
```

### Generic Component Wrapper

```typescript
function withGenericData<T extends unknown>(
  Component: React.ComponentType<{ data: T }>
) {
  return function WithDataComponent(props: { source: T }) {
    return <Component data={props.source} />;
  };
}

interface BlogPost {
  id: number;
  title: string;
  content: string;
}

function BlogPostDisplay({ data }: { data: BlogPost }) {
  return <article><h1>{data.title}</h1><p>{data.content}</p></article>;
}

const BlogPostWithData = withGenericData(BlogPostDisplay);

// Usage
<BlogPostWithData source={{ id: 1, title: 'Hello', content: 'World' }} />
```

---

## 7. Key Takeaways

1. **Use `<T extends unknown>`** in TSX files for generic components
2. **Interfaces** are better for public APIs and extensible components
3. **Types** are better for unions, intersections, and complex transformations
4. **Consistency** within a project matters more than the specific choice
5. **Constrain generics appropriately** to prevent type inference issues
6. **Leverage discriminated unions** for polymorphic components
7. **Create reusable generic patterns** for common use cases

---

## References

- [How to Use TypeScript Generics with Functional React Components](https://www.freecodecamp.org/news/typescript-generics-with-functional-react-components/)
- [React TypeScript Cheatsheet - Generic Components](https://react-typescript-cheatsheet.netlify.app/docs/advanced/guides/generic-components.md)
- [Ben Ilegbodu - Generic React Components in TypeScript](https://www.benmvp.com/blog/generic-react-components-typescript/)
- [TypeScript Handbook - Narrowing](https://www.typescriptlang.org/docs/handbook/2/narrowing.html)
- [React TypeScript Cheatsheet - Typing Props](https://react-typescript-cheatsheet.netlify.app/docs/basic/getting-started/basic_type_example/)
