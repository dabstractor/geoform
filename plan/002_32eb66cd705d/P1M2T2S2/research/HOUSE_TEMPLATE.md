# Common Pitfalls — House Template (extracted from README.md §Common Pitfalls)

Source: direct read of all six existing pitfalls in `README.md`
(`## Common Pitfalls` → last pitfall before `## TypeScript`). Verified
content-anchored (line numbers shift because sibling P1.M2.T2.S1 edits the file
concurrently — see SLUGS_AND_ANCHORS.md §"moving target").

## Canonical skeleton (every existing pitfall follows this)

```markdown
### <Title>

**Problem**: <one-to-two sentence statement of the mistake and its symptom>

**❌ BAD** - <short label>:
```tsx
// path/to/File.tsx  (optional locator comment)
<code showing the mistake, with // ❌ inline markers>
```

**✅ GOOD** - <short label>:
```tsx
// path/to/File.tsx  (optional locator comment)
<code showing the fix, with // ✅ inline markers>
```

**Why it's problematic**: <paragraph explaining the mechanism>
   ^^^^^^^^^^^^^^^^^^^^^^
   heading verb varies by pitfall:
     - "Why it's problematic"   (closeForm, ... )
     - "Why it doesn't work"    (URL Sync auto-restore)
     - "Why retry sometimes doesn't work"  (Retry)
     - "How it works"           (Async submission)
   → use "Why it's problematic" for a footgun/mistake pitfall (our case)

<optional: `> **Note**: ...` blockquote for caveats/gotchas>

<optional: a `**Valid use case**:` block + example (only closeForm pitfall uses this)>

@see [text](#anchor) for <purpose>.
```

## Observed conventions (MUST match)

1. **Heading level is `###`** (sub-section of `## Common Pitfalls`).
2. **Order of labelled blocks** is exactly: `**Problem**` → `**❌ BAD**` →
   `**✅ GOOD**` → `**Why ...**` → (optional Note) → `@see`.
3. **Code fences are ` ```tsx `** (not `jsx`/`ts`). Every existing pitfall uses tsx.
4. **Inline comment markers** are C-style `// ❌ ...` and `// ✅ ...` trailing
   comments inside the tsx (NOT JSX block comments `{/* */}`). Examples:
   `const { openForm } = useFormStack();  // ❌ THROWS ERROR`
5. **`@see` line is the LAST line** of the pitfall, before the blank line + next
   `###`/`##` heading. Format: `@see [Display](#anchor) for <reason>.` — may list
   two targets joined with `and`.
6. **No `---` separator** between pitfalls. Pitfalls are separated by a single
   blank line only (verified: no `---` anywhere inside `## Common Pitfalls`).
7. **Problem line** names the mistake + the user-visible symptom in 1-2 sentences.

## The six existing pitfalls (titles, for tone/length calibration)

1. Calling closeForm() Directly Instead of Using onSubmit/onCancel
2. Expecting URL Sync to Auto-Restore Forms
3. Using Retry for Structural Errors vs Transient Errors
4. Forgetting to Wrap App in FormStackProvider
5. Calling useFormStack Outside Provider
6. Not Handling Async Form Submission Properly   ← ours inserts AFTER this one

Our new pitfall — `### Forgetting <FormStackViewport/> with autoRender={false}`
— goes LAST (after #6, immediately before `## TypeScript`), matching the gap-map
§8 instruction ("before line 939" = pre-expansion number for `## TypeScript`).
