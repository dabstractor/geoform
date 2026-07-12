# Slug + Anchor Verification + Moving-Target Warning

## 1. The new pitfall heading → its slug (CRITICAL — controls the inbound link)

Prescribed heading (contract §3 LOGIC + gap-map §8):

    ### Forgetting <FormStackViewport/> with autoRender={false}

GitHub slug algorithm (lowercase → strip `< > / { } = ( )` and all non-alnum/space/hyphen
→ spaces to hyphens). Applying it token by token:

  "Forgetting"            → forgetting
  "<FormStackViewport/>"  → formstackviewport   (strip < / > ; letters collapse)
  "with"                  → with
  "autoRender={false}"    → autorenderfalse     (strip { } = ; letters collapse)

  → slug: #forgetting-formstackviewport-with-autorenderfalse

**Confirmed INBOUND cross-link** (written by sibling S1's Hostable Viewport
subsection, README line ~855):

    [Common Pitfalls > Forgetting `<FormStackViewport/>`](#forgetting-formstackviewport-with-autorenderfalse)

⇒ Our heading MUST be EXACTLY `### Forgetting <FormStackViewport/> with
autoRender={false}`. Any deviation (colon, em-dash, reword, extra space) changes
the slug and breaks S1's link. This is the single most fragile constraint.

## 2. Our OUTBOUND @see targets (both verified to exist in current README)

Target A — the component entry:
  heading: `#### FormStackViewport`            (verified at README line 285)
  slug:    #formstackviewport
  use:     `[API Reference > FormStackViewport](#formstackviewport)`

Target B — the single-shared-modal Advanced Usage subsection (sibling S1, LANDED):
  heading: `### Hostable Viewport (Single Shared Modal)`   (verified at line 791)
  slug:    #hostable-viewport-single-shared-modal
  use:     `[Advanced Usage > Hostable Viewport](#hostable-viewport-single-shared-modal)`

Both headings were confirmed present via:
  grep -nE '^#### FormStackViewport$|^### Hostable Viewport' README.md
  → 285:#### FormStackViewport
  → 791:### Hostable Viewport (Single Shared Modal)

NOTE: Target B only resolves because S1 has ALREADY landed in the working tree.
If S1's subsection is ever reverted/missing, Target B becomes a dead anchor — but
it is the correct canonical link and S1 is the dependency, not us.

## 3. The MOVING TARGET — README is being edited in parallel by S1

S1 ("Add Features bullet + Hostable Viewport Advanced Usage section") is marked
"Implementing" and is actively writing to README.md during this research. Observed
line-number drift across consecutive reads in ONE session:

  read #1:  ## Common Pitfalls @ 790,  last pitfall @ 1012, ## TypeScript @ 1065
  read #2:  ## Common Pitfalls @ 857,  last pitfall @ 1079, ## TypeScript @ 1132

⇒ ALL line numbers are unstable. The contract's own references
("line 664", "ends ~line 937", "## TypeScript (line 939)") are PRE-expansion and
already wrong. RULE: anchor every edit by UNIQUE CONTENT, never by line number.

The stable, content-anchored insertion boundary is the LAST pitfall's `@see` line
followed by `## TypeScript`:

    @see [Core Concepts > Promise-Based API](#promise-based-api) and [API Reference > useFormStack](#useformstack).

    ## TypeScript

Both lines are globally unique in README.md → safe as the `oldText` for the edit.

## 4. OUTPUT gate sanity check

Contract OUTPUT spec #4: `grep -c 'autoRender={false}' README.md` ≥ 2.
Current count (post-S1) = 9. Our pitfall ADDS occurrences (BAD example + prose),
so the gate is satisfied with large margin. The gate exists to ensure the pitfall
actually references `autoRender={false}` — it is NOT a tight count assertion.
