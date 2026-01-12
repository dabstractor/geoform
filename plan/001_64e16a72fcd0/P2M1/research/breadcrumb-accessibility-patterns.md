# React Breadcrumb Accessibility & Implementation Patterns

## WCAG/WAI-ARIA Standards for Breadcrumbs

### Required ARIA Structure

```html
<nav aria-label="Breadcrumb">
  <ol role="list">
    <li><a href="#">Home</a></li>
    <li><a href="#">Products</a></li>
    <li><a href="#" aria-current="page">Current Item</a></li>
  </ol>
</nav>
```

### Key Accessibility Requirements

1. **Navigation Landmark**: `<nav aria-label="Breadcrumb">` for screen reader identification
2. **Current Page**: `aria-current="page"` on the last/active item
3. **Ordered List**: Use `<ol>` for semantic hierarchy (add `role="list"` for VoiceOver/Safari)
4. **Separators**: Must be decorative with `aria-hidden="true"` or CSS-only

### Separator Handling (Critical)

**CSS Approach (Preferred)**:
```css
.breadcrumb__item + .breadcrumb__item::before {
  content: "/";
  margin: 0 8px;
  color: #999;
}
```

**HTML Approach (If needed)**:
```jsx
<span aria-hidden="true" className="breadcrumb__separator">/</span>
```

## TypeScript Interface Patterns

### Standard Breadcrumb Props

```typescript
interface BreadcrumbItem {
  id: string;
  label: string;
  onClick?: () => void;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  separator?: React.ReactNode;
  className?: string;
  ariaLabel?: string;
  onNavigate?: (index: number) => void;
}
```

### For geoform Stack Integration

```typescript
// Uses existing StackEntry type
import type { StackEntry } from '../types';

interface BreadcrumbsProps {
  /** Optional custom separator (default: "/") */
  separator?: React.ReactNode;
  /** Optional CSS class name */
  className?: string;
  /** Optional aria-label (default: "Form navigation") */
  ariaLabel?: string;
}
```

## State-Driven Breadcrumb Pattern

For state-based navigation (not URL-based):

```typescript
const Breadcrumbs: React.FC<BreadcrumbsProps> = ({
  separator = '/',
  className = '',
  ariaLabel = 'Form navigation'
}) => {
  const { stack } = useFormStackState();
  const { popToIndex } = useFormStackActions();

  const handleClick = (index: number) => {
    // Don't navigate if clicking on current form
    if (index === stack.length - 1) return;
    popToIndex(index);
  };

  return (
    <nav aria-label={ariaLabel} className={className}>
      <ol role="list">
        {stack.map((entry, index) => {
          const isCurrent = index === stack.length - 1;
          return (
            <li key={entry.id}>
              {isCurrent ? (
                <span aria-current="page">{entry.label || entry.id}</span>
              ) : (
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    handleClick(index);
                  }}
                >
                  {entry.label || entry.id}
                </a>
              )}
              {!isCurrent && separator && (
                <span aria-hidden="true">{separator}</span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
```

## CSS Patterns (BEM Naming)

```scss
.breadcrumbs {
  &__nav {
    padding: 8px 0;
  }

  &__list {
    display: flex;
    align-items: center;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  &__item {
    display: inline-flex;
    align-items: center;
  }

  &__link {
    color: #0066cc;
    text-decoration: none;
    padding: 4px 8px;
    border-radius: 4px;

    &:hover {
      background-color: rgba(0, 102, 204, 0.1);
      text-decoration: underline;
    }

    &:focus-visible {
      outline: 2px solid #0066cc;
      outline-offset: 2px;
    }
  }

  &__current {
    font-weight: 600;
    color: #333;
    padding: 4px 8px;
  }

  &__separator {
    margin: 0 4px;
    color: #999;
    user-select: none;
  }
}
```

## Key Implementation Notes

1. **No custom keyboard handling needed** - standard link navigation works
2. **Focus visible states** - use `:focus-visible` for keyboard users
3. **Color contrast** - minimum 4.5:1 ratio for WCAG AA
4. **Click prevention for current** - clicking current page should do nothing

## Reference URLs

- W3C WAI Breadcrumb Pattern: https://www.w3.org/WAI/ARIA/apg/patterns/breadcrumb/
- W3C Breadcrumb Example: https://www.w3.org/WAI/ARIA/apg/patterns/breadcrumb/examples/breadcrumb/
- MDN aria-current: https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-current
- Material UI Breadcrumbs: https://mui.com/material-ui/react-breadcrumbs/
