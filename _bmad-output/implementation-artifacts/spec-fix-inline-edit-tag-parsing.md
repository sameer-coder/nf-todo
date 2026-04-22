---
title: 'Fix inline edit tag parsing'
type: 'bugfix'
created: '2026-04-22'
status: 'done'
baseline_commit: '2d65c11'
context: ['_bmad-output/project-context.md']
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** When a user edits a todo title inline and adds `#hashtag` tokens, the new tags are silently ignored — `handleSave` sends `todo.tags` (the stale snapshot) instead of re-parsing the edited text. This makes tag assignment via editing non-functional, breaking the core hashtag-to-tag workflow established in Epic 3.

**Approach:** Call `parseTagsFromTitle` inside `handleSave` to extract new tags from the edited text. Merge newly parsed tags with the todo's existing tags (additive) so that tags previously assigned are preserved. Tag removal remains via the chip ✕ button only.

## Boundaries & Constraints

**Always:** Follow the existing optimistic UI pattern. Use `parseTagsFromTitle` — no duplicate parsing logic. Deduplicate the merged tag array.

**Ask First:** Changing the merge strategy (e.g., replacing existing tags instead of merging).

**Never:** Adding a separate tag input widget. Modifying `parseTagsFromTitle` itself. Changing `handleRemoveTag` logic.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Add tag via edit | Edit "Buy milk" → "Buy milk #shopping" | title="Buy milk", tags=["shopping"] | N/A |
| Add tag preserves existing | Todo has tags=["work"], edit title → "Task #urgent" | title="Task", tags=["work","urgent"] | N/A |
| No hashtags in edit | Edit "Buy milk" → "Buy groceries" (no #) | title="Buy groceries", tags unchanged from todo.tags | N/A |
| Duplicate tag in edit | Todo has tags=["work"], edit → "Task #work" | title="Task", tags=["work"] (no duplicate) | N/A |
| Edit to only hashtag | Edit → "#errand" | title="" — save should be rejected or handled gracefully | N/A |
| API failure on save | Edit with new tags, API throws | Rollback to previous todo (title + tags) | Toast: "Something went wrong" |

</frozen-after-approval>

## Code Map

- `frontend/src/components/TodoItem.tsx` -- Bug location: `handleSave` at ~L64
- `frontend/src/utils/parseTagsFromTitle.ts` -- Tag extraction utility (already used in AddTodoInput)
- `frontend/src/components/TodoItem.test.tsx` -- Existing tests; add coverage for edit-tag-parsing
- `frontend/src/components/AddTodoInput.tsx` -- Reference: correct usage pattern of parseTagsFromTitle

## Tasks & Acceptance

**Execution:**
- [x] `frontend/src/components/TodoItem.tsx` -- Import `parseTagsFromTitle`; in `handleSave`, call it on `newTitle`, merge parsed tags with `todo.tags`, use cleaned title and merged tags in both the optimistic dispatch and the API call. Guard against empty cleaned title (return early without saving).
- [x] `frontend/src/components/TodoItem.test.tsx` -- Add tests covering: edit adds new tag, edit preserves existing tags, edit with no hashtags preserves tags, duplicate tag deduplication, empty-title-after-parse rejection.

**Acceptance Criteria:**
- Given a todo with no tags, when the user edits the title to include `#shopping`, then the todo displays a "shopping" tag chip after save.
- Given a todo with tags=["work"], when the user edits the title to add `#urgent`, then both "work" and "urgent" chips display.
- Given a todo with tags=["work"], when the user edits the title without any hashtags, then the "work" tag is preserved.
- Given a todo, when the user edits the title to only `#errand` (empty title after parse), then the save is rejected and editing state is preserved.

## Verification

**Commands:**
- `cd frontend && npx vitest run src/components/TodoItem.test.tsx` -- expected: all tests pass
- `cd frontend && npx vitest run src/utils/parseTagsFromTitle.test.ts` -- expected: all existing tests still pass

## Suggested Review Order

**Tag parsing fix**

- Entry point: `handleSave` now calls `parseTagsFromTitle` and merges tags before optimistic dispatch
  [`TodoItem.tsx:65`](../../frontend/src/components/TodoItem.tsx#L65)

- Empty-title guard: early return prevents saving when hashtags consume entire title
  [`TodoItem.tsx:67`](../../frontend/src/components/TodoItem.tsx#L67)

- Set-based merge ensures deduplication of existing + newly parsed tags
  [`TodoItem.tsx:69`](../../frontend/src/components/TodoItem.tsx#L69)

- Reference: `parseTagsFromTitle` extracts `#word` tokens and returns cleaned title + unique tags
  [`parseTagsFromTitle.ts:1`](../../frontend/src/utils/parseTagsFromTitle.ts#L1)

**Tests**

- New tag parse on edit — verifies hashtag extraction reaches the API
  [`TodoItem.test.tsx:93`](../../frontend/src/components/TodoItem.test.tsx#L93)

- Merge with existing tags — verifies additive merge strategy
  [`TodoItem.test.tsx:111`](../../frontend/src/components/TodoItem.test.tsx#L111)

- No hashtags preserves existing tags — verifies non-destructive edit
  [`TodoItem.test.tsx:129`](../../frontend/src/components/TodoItem.test.tsx#L129)

- Deduplication — verifies Set-based merge prevents duplicates
  [`TodoItem.test.tsx:147`](../../frontend/src/components/TodoItem.test.tsx#L147)

- Empty title rejection — verifies early return keeps editing state open
  [`TodoItem.test.tsx:165`](../../frontend/src/components/TodoItem.test.tsx#L165)
