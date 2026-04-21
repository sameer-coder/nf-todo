# Story 4.4: Combined Status + Tag Filter and No-Results State

Status: ready-for-dev

## Story

As a user,
I want status and tag filters to work together simultaneously, and see a clear message with a reset action when my combined filters match nothing,
So that I have full filtering power without ever landing on a confusing blank screen.

## Acceptance Criteria

1. **Given** both a status filter (`?status=active`) and a tag filter (`?tags=work`) are active  
   **When** the list is derived  
   **Then** the list shows only todos that are **both** active (incomplete) **and** have the tag "work" — both filters apply simultaneously (FR14)

2. **Given** the active filters match no todos  
   **When** the filtered list is empty  
   **Then** the `EmptyState` "no-results" variant renders: `"No todos match your filters."` with a "Clear filters" `<button>` inline  
   **And** clicking "Clear filters" resets all URL query params and shows the full list

3. **Given** the "no-results" state  
   **When** inspected  
   **Then** it is visually and textually distinct from the "No todos yet." true-empty state — different copy, different action offered (FR20)

4. **Given** the user refreshes the page with active filters in the URL  
   **When** the app loads  
   **Then** filter state is absent — the list defaults to showing all todos (FR15)

## Tasks / Subtasks

- [ ] Task 1: Finalize combined filter logic in `App.tsx` (AC: 1, 4)
  - [ ] Read both `status` and `tags` from `useSearchParams()`
  - [ ] Apply status filter first: if `status === 'active'`, filter `!completed`; if `status === 'completed'`, filter `completed`
  - [ ] Apply tag filter second: if `activeTags.length > 0`, additionally filter `todo.tags.some(t => activeTags.includes(t))`
  - [ ] Result: `filteredTodos` = todos that pass BOTH filters simultaneously
  - [ ] On page refresh (no URL params): `filteredTodos === todos` (all shown)

- [ ] Task 2: Wire `EmptyState` "no-results" variant in `App.tsx` (AC: 2, 3)
  - [ ] Determine display state:
    - `!isLoading && todos.length === 0` → `<EmptyState variant="empty" />`
    - `!isLoading && todos.length > 0 && filteredTodos.length === 0` → `<EmptyState variant="no-results" onClearFilters={clearAllFilters} />`
    - Otherwise: render the todo list
  - [ ] `clearAllFilters`: `setSearchParams(new URLSearchParams())`

- [ ] Task 3: Verify `EmptyState` "no-results" variant is visually distinct (AC: 3)
  - [ ] "empty" copy: `"No todos yet."` — no action button
  - [ ] "no-results" copy: `"No todos match your filters."` — "Clear filters" button below
  - [ ] `EmptyState` component was stubbed in Story 2.5 — complete the `'no-results'` variant now

- [ ] Task 4: Write or update integration tests for combined filter (AC: 1, 2, 3)
  - [ ] Test: active + tag filter shows only todos matching BOTH conditions
  - [ ] Test: `EmptyState` "no-results" renders when filters match nothing
  - [ ] Test: clicking "Clear filters" removes all URL params and shows full list
  - [ ] Test: "No todos yet." (empty) vs "No todos match your filters." (no-results) are different copy

## Dev Notes

### Combined Filter Logic
```typescript
// App.tsx
const status = searchParams.get('status');
const activeTags = (searchParams.get('tags') ?? '').split(',').filter(Boolean);

const filteredTodos = useMemo(() => {
  let result = todos;
  // Step 1: Status filter
  if (status === 'active') result = result.filter(t => !t.completed);
  else if (status === 'completed') result = result.filter(t => t.completed);
  // Step 2: Tag filter (OR logic — todo must have at least one active tag)
  if (activeTags.length > 0) {
    result = result.filter(t => t.tags.some(tag => activeTags.includes(tag)));
  }
  return result;
}, [todos, status, activeTags]);
```
Both filters are applied in sequence, creating AND logic between status and tags (per FR14).

### Display State Logic
```typescript
// App.tsx render
if (isLoading) return <SkeletonRows />;

const hasAnyFilters = !!status || activeTags.length > 0;

if (todos.length === 0) {
  return <EmptyState variant="empty" />;
}

if (filteredTodos.length === 0 && hasAnyFilters) {
  return <EmptyState variant="no-results" onClearFilters={() => setSearchParams(new URLSearchParams())} />;
}

return <TodoList todos={filteredTodos} />;
```

### Two Distinct Empty State Variants (FR20, UX-DR10)
| Scenario | Variant | Copy | Action |
|---|---|---|---|
| `todos.length === 0` | `empty` | "No todos yet." | None |
| `filteredTodos.length === 0 && todos.length > 0` | `no-results` | "No todos match your filters." | "Clear filters" button |

These must be visually and textually different — same component, different `variant` prop.

### Page Refresh Resets Filters (FR15)
By design, URL query params aren't stored in sessionStorage or localStorage. On page reload, the browser loads a fresh URL without query params (unless accessed via a bookmarked URL with params). `searchParams.get('status')` → `null` → all todos shown.

### `EmptyState` Complete Implementation (Building on Story 2.5 stub)
```tsx
interface EmptyStateProps {
  variant: 'empty' | 'no-results';
  onClearFilters?: () => void;
}

export function EmptyState({ variant, onClearFilters }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-neutral-400 text-sm">
      {variant === 'empty' ? (
        <p>No todos yet.</p>
      ) : (
        <>
          <p className="mb-2">No todos match your filters.</p>
          <button
            onClick={onClearFilters}
            className={cn(
              'text-indigo-600 hover:text-indigo-800 underline',
              'focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 rounded'
            )}
          >
            Clear filters
          </button>
        </>
      )}
    </div>
  );
}
```

### Project Structure Notes

- `App.tsx` updated: combined filter logic, `EmptyState` variant switching
- `EmptyState.tsx` updated: complete `'no-results'` variant (was stubbed in 2.5)
- No new component files required — this story ties together existing components

### References

- [Source: _bmad-output/planning-artifacts/ux-design-specification.md] — UX-DR10 (two distinct empty state variants)
- [Source: _bmad-output/planning-artifacts/architecture.md#Filter State — URL Query Params (ARCH-4)] — ARCH-4
- [Source: _bmad-output/planning-artifacts/epics.md#Story 4.4] — acceptance criteria source
- FR13 (OR logic), FR14 (combined status + tag filter), FR15 (reset on refresh), FR20 (distinct no-results state)
- ARCH-4, UX-DR10

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.6

### Debug Log References

### Completion Notes List

### File List
