# Hidden Container Pattern - Quick Reference Guide

## Decision Tree

```
Do you have multiple forms that need simultaneous rendering?
├─ YES
│  ├─ Do you need to preserve form state when switching?
│  │  ├─ YES → Hidden Container Pattern (THIS APPROACH)
│  │  └─ NO → Conditional Rendering (unmount on hide)
│  └─ Do you need sophisticated performance optimization?
│     ├─ YES → Use React 19 Activity Component
│     ├─ NO → Use CSS hiding with display: none
│     └─ LEGACY → Use react-activation library
└─ NO → Single form pattern (normal rendering)
```

## CSS Hiding Cheat Sheet

### Quickest Implementation
```jsx
// All you need
<div style={{ display: isActive ? 'block' : 'none' }}>
  <MyForm />
</div>
```

### With Smooth Transitions
```jsx
<div
  style={{
    opacity: isActive ? 1 : 0,
    visibility: isActive ? 'visible' : 'hidden',
    transition: 'opacity 0.3s ease-in-out',
    pointerEvents: isActive ? 'auto' : 'none',
  }}
>
  <MyForm />
</div>
```

### Production-Ready with Accessibility
```jsx
<div
  role="tabpanel"
  aria-labelledby={`tab-${id}`}
  hidden={!isActive}
  style={{
    display: isActive ? 'block' : 'none',
  }}
>
  <MyForm />
</div>
```

## CSS Property Comparison Quick Look

| Property | Space | Re-layout | Focusable | A11y | GPU | Speed |
|----------|-------|-----------|-----------|------|-----|-------|
| display: none | No | Yes | No | Hidden | No | ⚡ |
| visibility: hidden | Yes | No | No | Hidden | No | ⚡⚡ |
| opacity: 0 | Yes | No | Yes | Visible | Yes | ⚡⚡⚡ |
| left: -9999px | Yes | Yes | Yes | Visible | No | ⚠️ |

**Legend:**
- Space: Takes up layout space
- Re-layout: Triggers layout recalculation
- Focusable: Can receive keyboard focus
- A11y: Screen reader exposure
- GPU: Hardware acceleration
- Speed: Animation performance (more lightning = better)

## Accessibility Checklist

- [ ] Hidden forms have `aria-hidden="true"` OR `hidden` attribute
- [ ] No focusable elements in aria-hidden containers, OR use `tabindex="-1"`
- [ ] Active form has proper `role="tabpanel"` or `role="main"`
- [ ] Form navigation has `role="tablist"` with `role="tab"` buttons
- [ ] Tab buttons have `aria-selected` and `aria-controls`
- [ ] Focus is managed when switching forms
- [ ] Screen readers announce form steps
- [ ] Keyboard navigation works (Tab, Shift+Tab)
- [ ] Test with axe DevTools before shipping

## Performance Checklist

- [ ] Forms count <= 7 (too many causes memory issues)
- [ ] Using React.memo for heavy form components
- [ ] Context split per form (if > 3 forms)
- [ ] No infinite loops in hidden form effects
- [ ] Hidden form subscriptions cleaned up properly
- [ ] Lazy loading for large form bundles
- [ ] React DevTools Profiler checked for re-renders
- [ ] Memory usage < 10MB for form stack

## Implementation Patterns

### Pattern 1: Simple Toggle (2 Forms)
```jsx
const [isForm1Active, setIsForm1Active] = useState(true);

return (
  <>
    <div style={{ display: isForm1Active ? 'block' : 'none' }}>
      <Form1 />
    </div>
    <div style={{ display: !isForm1Active ? 'block' : 'none' }}>
      <Form2 />
    </div>
    <button onClick={() => setIsForm1Active(!isForm1Active)}>
      Switch Form
    </button>
  </>
);
```

### Pattern 2: Index-Based Stack (3+ Forms)
```jsx
const [activeIndex, setActiveIndex] = useState(0);
const forms = [<Form1 />, <Form2 />, <Form3 />];

return (
  <>
    {forms.map((form, idx) => (
      <div
        key={idx}
        style={{ display: idx === activeIndex ? 'block' : 'none' }}
      >
        {form}
      </div>
    ))}
    <button onClick={() => setActiveIndex(prev => prev + 1)}>
      Next
    </button>
  </>
);
```

### Pattern 3: Context-Based (Complex App)
```jsx
const [activeFormId, setActiveFormId] = useContext(FormStackContext);

return (
  <>
    {FORMS.map(form => (
      <div
        key={form.id}
        style={{ display: activeFormId === form.id ? 'block' : 'none' }}
      >
        {form.component}
      </div>
    ))}
  </>
);
```

### Pattern 4: React 19 Activity (Recommended for New Projects)
```jsx
<Activity mode={isForm1Active ? 'visible' : 'hidden'}>
  <Form1 />
</Activity>

<Activity mode={isForm2Active ? 'visible' : 'hidden'}>
  <Form2 />
</Activity>
```

## Common Pitfalls and Solutions

| Pitfall | Cause | Solution |
|---------|-------|----------|
| Form state resets | Using conditional rendering | Use CSS display:none instead |
| Can tab into hidden form | Focusable elements in aria-hidden | Add tabindex="-1" to all form inputs |
| Memory leak | Unstopped subscriptions | Add cleanup functions to useEffect |
| Poor performance | All forms re-render | Use React.memo or split contexts |
| Focus lost | No focus management | Implement focus save/restore |
| Scroll jumps | Position not saved | Save scroll before hide, restore on show |
| Screen readers read hidden | Using opacity:0 | Use display:none or aria-hidden |
| Layout shifts | Using visibility:hidden | Use display:none or fixed positioning |
| Z-index conflicts | Inline rendering | Use portals for modals/overlays |

## Testing Template

```jsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';

describe('FormStack', () => {
  test('preserves form state when switching', async () => {
    const { rerender } = render(<FormStack />);

    // Fill first form
    const input = screen.getByPlaceholderText('Name');
    await userEvent.type(input, 'John');
    expect(input).toHaveValue('John');

    // Switch form
    rerender(<FormStack activeForm="form2" />);

    // Switch back
    rerender(<FormStack activeForm="form1" />);

    // State preserved
    expect(screen.getByPlaceholderText('Name')).toHaveValue('John');
  });

  test('should not tab into hidden forms', async () => {
    render(<FormStack activeForm="form1" />);
    const hiddenInput = screen.getByPlaceholderText('Address');

    expect(hiddenInput).toHaveAttribute('tabindex', '-1');
  });

  test('should have no accessibility violations', async () => {
    const { container } = render(<FormStack />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

## Memory/Performance Monitoring

```jsx
function useFormStackMetrics(formCount) {
  useEffect(() => {
    // Warn if too many forms
    if (formCount > 10) {
      console.warn(`⚠️ Form stack has ${formCount} forms (recommended: <= 7)`);
    }

    // Monitor renders
    let renderCount = 0;
    return () => {
      console.log(`Form stack rendered ${renderCount} times`);
    };
  }, [formCount]);

  // Monitor memory (Chrome DevTools)
  useEffect(() => {
    if (performance.memory) {
      console.log(`Memory: ${Math.round(performance.memory.usedJSHeapSize / 1048576)}MB`);
    }
  }, []);
}

// Usage
useFormStackMetrics(formStack.length);
```

## When NOT to Use This Pattern

- Single form applications (just render it)
- Forms that should reset between sessions (use conditional rendering)
- Forms that need to be completely removed from memory (lazy load instead)
- Mobile apps with very limited memory (use Activity component)
- Forms with heavy real-time subscriptions (deactivate subscriptions)

## When TO Use This Pattern

- Multi-step wizards
- Tabbed interfaces with form content
- Modal stacks (nested modals)
- Wizard dialogs with navigation
- Form state preservation across navigation
- Complex workflows with multiple screens
- Dashboard with form panels

## Library Recommendations

| Scenario | Library | Setup Complexity |
|----------|---------|------------------|
| React 19+ Projects | Activity (built-in) | ⭐ |
| Any React Version | react-activation | ⭐⭐ |
| Modal Stacking | react-modal-stack | ⭐ |
| Material Design | Material UI Modal | ⭐⭐ |
| Minimal Setup | Plain CSS + React | ⭐ |

## Links to Key Resources

- React Activity: https://react.dev/reference/react/Activity
- react-activation: https://github.com/CJY0208/react-activation
- react-modal-stack: https://github.com/mattjennings/react-modal-stack
- Accessibility: https://accessibilityinsights.io/info-examples/web/aria-hidden-focus/
- CSS Comparison: https://thisthat.dev/display-none-vs-opacity-0-vs-visibility-hidden/
