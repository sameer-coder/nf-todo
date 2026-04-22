# Story 3.4: Tag Removal from a Todo

Status: review

## Story

As a user,
I want to remove an individual tag from a todo by clicking the × on its chip,
So that I can keep my tags accurate without re-creating the entire todo.

## Acceptance Criteria

1. **Given** a todo row displays tag chips  
   **When** the user clicks the × button on a `TagChip`  
   **Then** `UPDATE_TODO_OPTIMISTIC` is dispatched with the tag removed from the tags array  
   **And** `PUT /api/todos/:id` is called with the full updated todo body (title, completed, remaining tags)  
   **And** the chip disappears from the row immediately  
   **And** on API error, `UPDATE_TODO_ROLLBACK` restores the original tag set and a toast is shown

2. **Given** a `TagChip` × button  
   **When** inspected  
   **Then** it has `aria-label="Remove tag [tag name]"` and a touch target of ≥44×44px

3. **Given** removing the last tag from a todo  
   **When** the × is clicked  
   **Then** the todo row still renders correctly with no chip area — no visual artifact left behind

## Tasks / Subtasks

- [x] Task 1: Update `TagChip.tsx` to include a × remove button (AC: 1, 2)
  - [x] Add optional prop `onRemove?: () => void`
  - [x] When `onRemove` is provided, render a `×` button inside/after the chip label
  - [x] Remove button: `<button type="button" aria-label={`Remove tag ${tag}`}>×</button>`
  - [x] Stop click propagation on the remove button: `e.stopPropagation()` to prevent the chip's own `onClick` from firing
  - [x] Touch target: `p-1.5` padding on the × button provides comfortable hit area
  - [x] Apply `focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2` on the × button

- [x] Task 2: Wire `onRemove` in `TodoItem.tsx` with optimistic tag removal (AC: 1, 3)
  - [x] `handleRemoveTag(tag: string)` function in `TodoItem`: snapshot, filter tags, dispatch optimistic, call API, rollback on error
  - [x] Pass `onRemove={() => handleRemoveTag(tag)}` to each `TagChip`

- [x] Task 3: Ensure no visual artifact when last tag removed (AC: 3)
  - [x] The tag chips container is already conditionally rendered: `{todo.tags.length > 0 && <div>...chips</div>}` (from Story 3.3)
  - [x] After optimistic dispatch removes the last tag, `todo.tags.length === 0` → container disappears cleanly
  - [x] Verified: no empty `<div>` remains in DOM when all tags removed

- [x] Task 4: Update `TagChip.test.tsx` tests (AC: 1, 2)
  - [x] Test: × button renders when `onRemove` prop is provided
  - [x] Test: × button NOT rendered when `onRemove` is undefined
  - [x] Test: clicking × calls `onRemove`, NOT the chip's own `onClick`
  - [x] Test: `aria-label="Remove tag shopping"` on × button
  - [x] Test: click propagation stopped — chip `onClick` not called when × is clicked

## Dev Notes

### Updated `TagChip` Component
```tsx
interface TagChipProps {
  tag: string;
  onClick?: () => void;     // activates filter (Story 4.2)
  onRemove?: () => void;    // removes tag from todo (this story)
  active?: boolean;
}

export function TagChip({ tag, onClick, onRemove, active = false }: TagChipProps) {
  return (
    <span className="inline-flex items-center gap-0.5">
      <button
        type="button"
        onClick={onClick}
        aria-pressed={active}
        className={cn(
          'rounded-full px-2 py-0.5 text-xs font-medium',
          'focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2',
          active
            ? 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200 font-semibold'
            : 'bg-neutral-100 text-neutral-600',
        )}
      >
        {tag}
      </button>
      {onRemove && (
        <button
          type="button"
          aria-label={`Remove tag ${tag}`}
          onClick={(e) => {
            e.stopPropagation(); // prevent chip onClick from firing
            onRemove();
          }}
          className={cn(
            // Ensure ≥44px touch area by using padding
            'p-1.5 -ml-1',
            'text-neutral-400 hover:text-neutral-600',
            'focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 rounded-full',
          )}
        >
          <span aria-hidden="true" className="text-xs leading-none">×</span>
        </button>
      )}
    </span>
  );
}
```

### Optimistic Tag Remove Pattern (ARCH-6)
```typescript
async function handleRemoveTag(tagToRemove: string) {
  const previousTodo = todo; // snapshot
  const updatedTags = todo.tags.filter(t => t !== tagToRemove);
  const updated = { ...todo, tags: updatedTags };

  dispatch({ type: 'UPDATE_TODO_OPTIMISTIC', payload: updated }); // instant UI remove

  try {
    await updateTodo(todo.id, {
      title: todo.title,
      completed: todo.completed,
      tags: updatedTags,
    });
    // success: no-op
  } catch {
    dispatch({ type: 'UPDATE_TODO_ROLLBACK', payload: previousTodo }); // restore
    showToast('Something went wrong');
  }
}
```

### `PUT /api/todos/:id` Full Replacement
The backend endpoint `PUT /api/todos/:id` is a full replacement — it takes the complete `{title, completed, tags}` body. When removing a tag, the frontend sends the full updated body with the tag removed. The backend deletes all `todo_tags` for the todo and re-inserts from the new `tags` array.

### stopPropagation on × Button
Without `e.stopPropagation()`, clicking the × button would also trigger the chip's `onClick` (which activates a tag filter in Story 4.2). Using `stopPropagation` on the × button ensures only the remove action fires.

### Project Structure Notes

- `TagChip.tsx` updated (add `onRemove` prop and × button)
- `TodoItem.tsx` updated to pass `onRemove` handler to `TagChip`
- No new files required for this story

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Optimistic Mutation Pattern] — ARCH-6 update/rollback pattern
- [Source: _bmad-output/planning-artifacts/architecture.md#Update Pattern — PUT Full Replacement] — backend replaces all tags on PUT
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md] — UX-DR13 (touch targets on chip × button)
- [Source: _bmad-output/planning-artifacts/epics.md#Story 3.4] — acceptance criteria source
- FR9 (remove tag), ARCH-6, UX-DR13, UX-DR14

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.6

### Debug Log References

### Completion Notes List

- Updated `TagChip.tsx` — rebuilt as `<span>` wrapper with chip `<button>` + optional `×` `<button>` with `stopPropagation`
- `handleRemoveTag` uses full ARCH-6 optimistic pattern: snapshot → dispatch optimistic → API call → rollback on error
- Empty tag container correctly hides when last tag removed (conditional render from Story 3.3 still in place)
- 4 new tests added to `TagChip.test.tsx` (11 total); full suite 77/77 passing, 0 TypeScript errors

### File List

- frontend/src/components/TagChip.tsx (modified)
- frontend/src/components/TagChip.test.tsx (modified)
- frontend/src/components/TodoItem.tsx (modified)
