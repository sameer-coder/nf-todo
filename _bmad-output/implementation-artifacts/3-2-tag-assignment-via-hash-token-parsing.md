# Story 3.2: Tag Assignment via #tag Token Parsing

Status: ready-for-dev

## Story

As a user,
I want to include `#tag` tokens in my task title when creating a todo,
So that tags are automatically parsed and attached to the todo without requiring a separate input.

## Acceptance Criteria

1. **Given** the user types `Buy milk #shopping #errand` in the add-todo input and presses Enter  
   **When** the form submits  
   **Then** the title is stored as `"Buy milk"` (tokens stripped)  
   **And** `POST /api/todos` is called with `{ title: "Buy milk", tags: ["shopping", "errand"] }`  
   **And** the todo appears in the list with title "Buy milk" and tag chips "shopping" and "errand"

2. **Given** a title with no `#tag` tokens  
   **When** the form submits  
   **Then** the title is used as-is and `tags: []` is sent — no change in existing behaviour

3. **Given** duplicate `#tag` tokens in the input (e.g. `Task #work #work`)  
   **When** the tags are parsed  
   **Then** duplicates are deduplicated — only one `"work"` tag is stored

4. **Given** a `#tag` with no content (e.g. `Task #`)  
   **When** the tags are parsed  
   **Then** the empty token is ignored — not stored or displayed

## Tasks / Subtasks

- [ ] Task 1: Create `parseTagsFromTitle` utility function (AC: 1, 2, 3, 4)
  - [ ] Create `frontend/src/utils/parseTagsFromTitle.ts`
  - [ ] Function signature: `parseTagsFromTitle(raw: string): { title: string; tags: string[] }`
  - [ ] Implementation: match all `#\w+` tokens, extract tag names (without `#`), strip tokens from title
  - [ ] Trim the resulting title
  - [ ] Deduplicate tags: `[...new Set(tags)]`
  - [ ] Filter out empty tag strings after extraction
  - [ ] Return `{ title, tags }`

- [ ] Task 2: Integrate `parseTagsFromTitle` into `AddTodoInput.tsx` (AC: 1, 2)
  - [ ] In the `handleSubmit` function, call `parseTagsFromTitle(inputValue)` before creating the todo
  - [ ] Use the returned `{ title, tags }` for the API call: `createTodo({ title, tags })`
  - [ ] Update the optimistic `Todo` object to use the parsed `title` and `tags`

- [ ] Task 3: Write `parseTagsFromTitle.test.ts` co-located tests (AC: 1, 2, 3, 4)
  - [ ] Test: `"Buy milk #shopping #errand"` → `{ title: "Buy milk", tags: ["shopping", "errand"] }`
  - [ ] Test: `"Task without tags"` → `{ title: "Task without tags", tags: [] }`
  - [ ] Test: `"Task #work #work"` → `{ title: "Task", tags: ["work"] }` (deduplication)
  - [ ] Test: `"Task #"` → `{ title: "Task", tags: [] }` (empty token ignored)
  - [ ] Test: `"  #tag title  "` → trimmed title, tag extracted correctly
  - [ ] Test: `"#tag"` → `{ title: "", tags: ["tag"] }` — edge case, empty title (should reject at AddTodoInput level)
  - [ ] Test: `"Buy #groceries milk #groceries"` → deduplication with tag mid-title

## Dev Notes

### `parseTagsFromTitle` Implementation
```typescript
// frontend/src/utils/parseTagsFromTitle.ts

export function parseTagsFromTitle(raw: string): { title: string; tags: string[] } {
  // Match #word tokens (word characters: letters, digits, underscore)
  const tagRegex = /#(\w+)/g;
  const tags: string[] = [];
  let match: RegExpExecArray | null;

  while ((match = tagRegex.exec(raw)) !== null) {
    tags.push(match[1].toLowerCase()); // normalize to lowercase
  }

  // Strip all #token occurrences from title
  const title = raw.replace(/#\w+/g, '').replace(/\s+/g, ' ').trim();

  // Deduplicate tags
  const uniqueTags = [...new Set(tags)].filter(t => t.length > 0);

  return { title, tags: uniqueTags };
}
```

### Regex Explanation
- `/#(\w+)/g` — matches `#` followed by one or more word characters (`\w` = `[a-zA-Z0-9_]`)
- The `#` by itself (no following word chars) is NOT matched because `\w+` requires at least one character
- After removing `#\w+` tokens, `replace(/\s+/g, ' ').trim()` collapses extra whitespace

### Case Normalization
The implementation suggests lowercasing tags (`match[1].toLowerCase()`). This ensures `#Work` and `#work` are treated as the same tag. Verify this aligns with UX expectations — the epics spec doesn't explicitly mention case, but lowercasing is the safer default.

### Integration in `AddTodoInput.tsx`
Replace the direct `inputValue.trim()` usage with:
```typescript
const { title, tags } = parseTagsFromTitle(inputValue);
if (!title) return; // empty title after tag extraction — prevent submit

// Build optimistic todo
const tempTodo: Todo = { /* ... */ title, tags };

// API call
const serverTodo = await createTodo({ title, tags });
```

### Backend Already Handles This
The backend (Story 1.4) also sanitises tags (trim, deduplicate, remove empties) via ARCH-8. The frontend parsing is for UX — extracting `#tag` tokens from the title field. The backend sanitisation is a security/integrity guard. Both must exist independently.

### Project Structure Notes

- `frontend/src/utils/parseTagsFromTitle.ts` + co-located `parseTagsFromTitle.test.ts`
- `AddTodoInput.tsx` updated to import and use `parseTagsFromTitle`
- ARCH-13: Import directly — `import { parseTagsFromTitle } from '../utils/parseTagsFromTitle'`

### References

- [Source: _bmad-output/planning-artifacts/ux-design-specification.md] — UX-DR19 (tag parsing via `#tag` tokens)
- [Source: _bmad-output/planning-artifacts/architecture.md#Input Sanitisation (ARCH-8)] — backend sanitisation at API layer
- [Source: _bmad-output/planning-artifacts/epics.md#Story 3.2] — acceptance criteria source
- FR8 (assign tags), FR10 (multiple tags), UX-DR19, ARCH-8

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.6

### Debug Log References

### Completion Notes List

### File List
