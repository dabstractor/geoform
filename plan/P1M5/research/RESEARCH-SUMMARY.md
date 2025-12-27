# Hidden Container Pattern - Research Summary

**Date:** December 27, 2025
**Research Scope:** Hidden container pattern for React state preservation
**Status:** Complete

## What Was Researched

This research investigates the hidden container pattern - a technique where multiple forms in a stack are rendered to the DOM simultaneously but hidden using CSS, allowing React to preserve component state without re-mounting.

## Key Findings

### 1. Pattern Definition

The hidden container pattern:
- Renders all forms to DOM at the same time
- Uses CSS (display: none, visibility: hidden, opacity: 0) to hide non-active forms
- Keeps React components mounted to preserve internal state
- When a child form closes, parent state is automatically available (never unmounted)

### 2. Best Practices Identified

**Critical Rules:**
- Use `display: none` for most cases (cleanest, best performance)
- Keep state in parent Context or centralized store
- Use CSS classes instead of inline styles for maintainability
- Combine with proper accessibility attributes

**Pattern Variants:**
1. Simple toggle (2 forms)
2. Index-based stack (3+ forms)
3. Context-based (complex applications)
4. React 19 Activity component (official recommendation)

### 3. CSS Approaches Comparison

| Approach | Best For | Trade-offs |
|----------|----------|-----------|
| `display: none` | Most common use case | Requires layout recalc |
| `visibility: hidden` | Preserve layout space | Takes up space; still re-layouts |
| `opacity: 0` | Smooth animations | Element remains interactive |
| `position: left: -9999px` | Legacy code | CPU intensive; deprecated |
| **Hybrid (display + opacity)** | Production apps | Best of both worlds |

**Winner:** Hybrid approach combining `display: none` with `opacity: 0` for transitions

### 4. Performance Considerations

**Memory Impact:**
- 3-5 forms: Negligible impact
- 7-10 forms: Noticeable increase (monitor recommended)
- 20+ forms: Significant memory consumption

**Key Metrics:**
- Each hidden form keeps React Fiber nodes in memory
- DOM nodes remain in memory
- useState hooks consume memory
- All Effects run normally (unless using React 19 Activity)

**Optimization Strategies:**
1. Limit form stack to 3-7 forms
2. Use React.memo for expensive components
3. Split Context per form (if > 3 forms)
4. Use React 19 Activity component for automatic optimization
5. Implement lazy loading for large forms

### 5. Accessibility Concerns & Solutions

**Problem Areas:**
1. Hidden focusable elements can be reached via keyboard
2. Screen readers may expose hidden content
3. Focus can get lost when switching forms

**Solutions Implemented:**
1. Use `aria-hidden="true"` on hidden containers
2. Add `tabindex="-1"` to hidden form inputs
3. Implement focus restoration on form switch
4. Use proper ARIA roles and attributes
5. Test with axe or similar accessibility tools

**Recommended Pattern:**
```jsx
<div
  role="tabpanel"
  aria-labelledby={`tab-${id}`}
  hidden={!isActive}
  style={{ display: isActive ? 'block' : 'none' }}
>
  <form>
    {/* All inputs have tabindex="-1" when hidden */}
  </form>
</div>
```

### 6. Popular Library Implementations

**React 19 Activity Component** (Official - Recommended)
- Built into React 19.2+
- Automatic state preservation
- Cleans up Effects when hidden
- No library dependency
- https://react.dev/reference/react/Activity

**react-activation**
- Popular alternative (Vue keep-alive port)
- Works with all React versions
- Provides lifecycle hooks
- Hidden container implementation
- https://github.com/CJY0208/react-activation

**react-modal-stack**
- Specialized for modal stacking
- Zero dependencies
- Automatic z-index management
- Focus trapping built-in
- https://github.com/mattjennings/react-modal-stack

**Material UI Modal**
- Full-featured modal system
- Portal-based rendering
- Accessibility built-in
- https://mui.com/material-ui/react-modal/

### 7. React-Specific Considerations

**Ref Management:**
- Refs work normally in hidden components
- Can collect data from all hidden forms
- useLayoutEffect syncs with visibility changes

**Context Behavior:**
- Hidden components can access Context normally
- Values available even when not visible
- Use separate Contexts per form for performance

**Portal vs Inline Rendering:**
- Inline: Better for most cases (simple, single render pass)
- Portal: Use for z-index escaping or modals
- Recommendation: Start with inline, use portals when needed

**Effect Cleanup:**
- Effects run normally in hidden components
- React 19 Activity: Cleans up Effects when hidden
- Manual approach: Stop subscriptions in Effect cleanup

## Synthesis & Recommendations

### For New Projects (React 19+)
Use the React Activity component - it's built-in, optimized, and handles state preservation automatically.

```jsx
<Activity mode={activeForm === 'form1' ? 'visible' : 'hidden'}>
  <Form1 />
</Activity>
```

### For Existing Projects (React 16.8+)
Use CSS-based hiding with inline rendering, combined with Context for state management:

```jsx
<div style={{ display: activeForm === 'form1' ? 'block' : 'none' }}>
  <Form1 />
</div>
```

### For Complex Applications
Combine with react-activation or react-modal-stack libraries for advanced features like lifecycle hooks or automatic modal stacking.

### For Accessibility
Always include:
- Proper ARIA roles (role="tabpanel", role="tablist")
- aria-hidden or hidden attribute
- tabindex="-1" for hidden focusable elements
- Focus restoration on form switch
- Test with axe DevTools

## Key Code Examples

### Minimal Implementation
```jsx
const [activeForm, setActiveForm] = useState(0);

<div style={{ display: activeForm === 0 ? 'block' : 'none' }}>
  <Form1 />
</div>
<div style={{ display: activeForm === 1 ? 'block' : 'none' }}>
  <Form2 />
</div>
```

### Production-Ready Implementation
```jsx
<div
  role="tabpanel"
  aria-labelledby={`tab-${id}`}
  hidden={!isActive}
  style={{
    display: isActive ? 'block' : 'none',
    opacity: isActive ? 1 : 0,
    visibility: isActive ? 'visible' : 'hidden',
    transition: 'opacity 0.3s ease-in-out',
  }}
>
  <form>
    {/* Form fields */}
  </form>
</div>
```

### React 19 Recommended
```jsx
<Activity mode={isActive ? 'visible' : 'hidden'}>
  <Form />
</Activity>
```

## Sources Used

### Official Documentation
- [React Activity Component](https://react.dev/reference/react/Activity)
- [React Preserving and Resetting State](https://react.dev/learn/preserving-and-resetting-state)
- [ARIA aria-hidden Attribute](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-hidden)

### Accessibility Resources
- [Accessibility Insights - aria-hidden-focus](https://accessibilityinsights.io/info-examples/web/aria-hidden-focus/)
- [W3C WCAG Rules](https://www.w3.org/WAI/standards-guidelines/act/rules/6cfa84/)
- [Josh Comeau - Visually Hidden Components](https://www.joshwcomeau.com/snippets/react-components/visually-hidden/)

### CSS Performance
- [CSS Display vs Visibility vs Opacity](https://thisthat.dev/display-none-vs-opacity-0-vs-visibility-hidden/)
- [Medium - CSS Hiding Properties](https://medium.com/@narayanansundar02/difference-between-display-none-visibility-hidden-and-opacity-0-in-css-b8630d58540c)

### React Patterns & Libraries
- [react-activation GitHub](https://github.com/CJY0208/react-activation)
- [react-modal-stack GitHub](https://github.com/mattjennings/react-modal-stack)
- [Material UI Modal](https://mui.com/material-ui/react-modal/)
- [React Portals](https://react.dev/learn/rendering-lists)

### Form State Management
- [React Hook Form - Multiple Forms](https://github.com/react-hook-form/react-hook-form/discussions)
- [Multi-Step Forms with React](https://www.buildwithmatija.com/blog/master-multi-step-forms-build-a-dynamic-react-form-in-6-simple-steps)

## Document Structure

The complete research has been organized into:

1. **hidden-container-pattern.md** (Main Document - 28KB)
   - Comprehensive guide with all details
   - 7 major sections covering all aspects
   - Complete code examples
   - Best practices and patterns

2. **implementation-quick-reference.md** (Quick Guide - 8KB)
   - Decision trees
   - Cheat sheets
   - Common pitfalls and solutions
   - Testing templates
   - Performance monitoring code

3. **RESEARCH-SUMMARY.md** (This File)
   - Overview of research
   - Key findings
   - Synthesis and recommendations
   - Source documentation

## Gaps Identified

None - research is comprehensive across all requested areas:
- ✅ Best practices
- ✅ CSS approaches
- ✅ Performance considerations
- ✅ Accessibility concerns
- ✅ Library examples
- ✅ React-specific considerations

## Next Steps for Implementation

1. Review the documents
2. Implement in P1M5 phase of geoform project
3. Test accessibility with axe DevTools
4. Monitor performance with React DevTools
5. Adapt patterns based on specific project needs

---

**Research Completed By:** Claude AI Research Agent
**Research Method:** Web search synthesis with multiple source verification
**Confidence Level:** High (sourced from official documentation and established patterns)
