# P3M1 Research: URL State Synchronization

## Overview

This directory contains comprehensive research on React URL state synchronization patterns and best practices for 2024-2025. The research covers both foundational concepts and advanced implementation patterns for creating bidirectional sync between React state and URL query parameters.

## Documents

### url-sync-patterns.md (Primary Document)
**1,487 lines | 38 KB**

The main comprehensive guide covering:

1. **useSearchParams Patterns** - React Router v6 patterns with code examples
2. **Custom Hooks** - Building URL sync without a router library
3. **Browser History API** - pushState, replaceState, and popstate event handling
4. **Encoding Strategies** - Type conversion, complex objects, and dates
5. **Array Encoding** - Repeating keys, comma-separated, and JSON approaches
6. **Debouncing & Batching** - Performance optimization techniques
7. **SSR Considerations** - Server-side rendering challenges and solutions
8. **Common Pitfalls** - 7 major gotchas and how to avoid them
9. **Modern Libraries** - nuqs, react-use-search-params-state, serialize-query-params
10. **Decision Trees** - Quick reference for pattern selection
11. **Checklists** - Performance and security validation

## Key Implementation Patterns

### Pattern 1: React Router v6
```javascript
const [searchParams, setSearchParams] = useSearchParams();
const value = searchParams.get('param') || '';
setSearchParams(params => { params.set('key', value); return params; });
```

### Pattern 2: Custom Hook Without Router
```javascript
function useParamState(paramName, initialValue) {
  // Reads from URL, syncs back when state changes
  // Handles popstate for back button
}
```

### Pattern 3: Modern Type-Safe (nuqs)
```javascript
const [value, setValue] = useQueryState('param', parseAsString);
// Automatic type conversion and serialization
```

## Array Encoding Strategies

| Strategy | Pros | Cons | Best For |
|----------|------|------|----------|
| Repeating Keys | RESTful standard | Verbose | Default choice |
| Comma-Separated | Compact | Requires escaping | Space-conscious |
| JSON | Nested data | Long URLs | Complex structures |

Example:
```javascript
// Repeating: ?tag=a&tag=b&tag=c
params.append('tag', 'a');
params.append('tag', 'b');

// Comma: ?tags=a,b,c
params.set('tags', ['a','b'].map(encodeURIComponent).join(','));

// JSON: ?filters={"tags":["a","b"]}
params.set('filters', JSON.stringify({tags: ['a','b']}));
```

## Debouncing Patterns

**Problem**: Searching on every keystroke causes:
- URL updates per keystroke
- Excessive re-renders
- History pollution (too many back button entries)

**Solution**: Debounce with 300-500ms delay
```javascript
const debouncedQuery = useDebounce(localQuery, 500);
useEffect(() => {
  setSearchParams({ q: debouncedQuery }, { replace: true });
}, [debouncedQuery]);
```

## Common Gotchas

1. **Losing Parameters**: Always use callback form of setters
2. **Type Confusion**: URL params are always strings - convert explicitly
3. **History Pollution**: Use `replace: true` for refinements
4. **Encoding Issues**: Properly encode values with special characters
5. **Sync Loops**: Don't update params in effects that depend on params
6. **XSS Vulnerabilities**: Validate/sanitize URL params before rendering
7. **Back Button**: Implement popstate handler for history navigation

## SSR Considerations

- Both server and client must render with same URL state
- Use loaders/getServerSideProps to read params server-side
- Avoid media queries or browser APIs in SSR renders
- Pass initial data as props, not in URL state
- Handle hydration mismatches carefully

## Tools & Libraries (2024-2025)

### Recommended
- **nuqs** (6KB gzipped) - Type-safe, all frameworks
- **React Router** (built-in) - Simple useState-like API
- **serialize-query-params** - Flexible encoding options

### When to Use Each
- **Simple params (<5)**: React Router's useSearchParams
- **Type safety needed**: nuqs library
- **Array parameters**: serialize-query-params with ArrayParam
- **No router**: Custom useParamState hook

## Performance Checklist

- [ ] Debounce search inputs (300-500ms)
- [ ] Use `replace: true` for refinements
- [ ] Batch multiple updates together
- [ ] Monitor URL length (< 2000 chars ideal)
- [ ] Don't update params per keystroke
- [ ] Validate params before using them
- [ ] Test with React DevTools Profiler

## Security Checklist

- [ ] No secrets in URL (JWT, API keys, passwords)
- [ ] Validate/sanitize all URL parameters
- [ ] Use allowlists for enum values
- [ ] Sanitize before rendering as HTML
- [ ] Remember URLs are in browser history
- [ ] Consider HTTPS-only enforcement
- [ ] Aware of referer header exposure

## Quick Decision Guide

**Do you use React Router v6?**
- YES: Use `useSearchParams` (simple) or `nuqs` (type-safe)
- NO: Use custom hook or `nuqs`

**Need array parameters?**
- YES: Use repeating keys by default, or serialize-query-params
- NO: Simple key-value pairs

**Search-as-you-type?**
- YES: Debounce 300-500ms + replace history
- NO: Push state for distinct views

**Complex nested state?**
- YES: JSON encode or use nuqs
- NO: Keep params simple and flat

## Research Sources

### Official Documentation
- [React Router v6 useSearchParams](https://reactrouter.com/api/hooks/useSearchParams)
- [MDN History API](https://developer.mozilla.org/en-US/docs/Web/API/History_API/Working_with_the_History_API)
- [MDN URLSearchParams](https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams)

### Comprehensive Guides
- LogRocket: URL state with useSearchParams
- LogRocket: Advanced URL state management
- DeveloperWay: Debouncing in React

### Libraries
- [nuqs](https://nuqs.dev) - Modern type-safe solution
- [react-use-search-params-state](https://github.com/jschwindt/react-use-search-params-state)
- [serialize-query-params](https://github.com/pbeshai/serialize-query-params)

## Implementation Recommendations

### For Simple UIs
```javascript
const [search, setSearch] = useSearchParams();
// Direct URLSearchParams manipulation
```

### For Type-Safe Modern Apps
```javascript
import { useQueryState, parseAsString } from 'nuqs';
const [value, setValue] = useQueryState('param', parseAsString);
```

### For Array Parameters
```javascript
import { ArrayParam, useQueryParams } from 'serialize-query-params';
const [{ tags }, setParams] = useQueryParams({ tags: ArrayParam });
```

## Testing Patterns

- Test URL persistence on component mount
- Test parameter hydration from URL
- Test back/forward button behavior
- Test debouncing delays
- Test array parameter encoding/decoding
- Test SSR hydration matching

---

**Research Completeness:** ✓ All 6 focus areas covered with 100+ code examples
**Document Date:** December 2025
**Format:** Markdown with extensive code examples
**Total Lines:** 1,487
**Size:** 38 KB
