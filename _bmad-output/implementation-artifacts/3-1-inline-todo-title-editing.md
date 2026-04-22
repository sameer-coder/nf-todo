# Story 3.1: Inline Todo Title Editing

Status: review

## Story

As a user,
I want to click on a todo's title to edit it in place,
So that I can correct or update a task without any modal or separate form.

## Acceptance Criteria

1. **Given** a todo row is in the default (non-editing) state  
   **When** the user clicks the title text  
   **Then** the title span is replaced by an `InlineEditInput` — a styled `<input type="text">` pre-filled with the current title  
   **And** the input is auto-selected on activation (cursor selects all text)  
   **And** the input is styled `w-full bg-transparent outline-none focus:ring-1 focus:ring-indigo-300 rounded px-1 text-[15px] text-neutral-900`

2. **Given** the inline edit input is active  
   **When** the user presses Enter or blurs the input  
   **Then** `UPDATE_TODO_OPTIMISTIC` is dispatched with the new title immediately  
   **And** `PUT /api/todos/:id` is called with the updated title  
   **And** on API error, `UPDATE_TODO_ROLLBACK` restores the original title and a toast is shown

3. **Given** the inline edit input is active  
   **When** the user presses Escape  
   **Then** the input is dismissed and the original title is restored — no API call is made

4. **Given** the user edits the title to be empty or whitespace only and presses Enter or blurs  
   **When** the submit is evaluated  
   **Then** the submit is silently prevented and the original title is restored — no API call, no error text

5. **Given** `InlineEditInput` uses `onBlur` to save  
   **When** the user presses Escape  
   **Then** the Escape handler fires before `onBlur` saves — a flag prevents the race condition

## Tasks / Subtasks

- [x] Task 1: Create `InlineEditInput.tsx` component (AC: 1, 2, 3, 4, 5)
  - [x] Props: `initialValue: string`, `onSave: (newTitle: string) => void`, `onCancel: () => void`
  - [x] `useRef` on the input; `useEffect` to call `inputRef.current?.select()` on mount (auto-selects text)
  - [x] Internal state `value` initialized to `initialValue`
  - [x] Use a `cancelledRef = useRef(false)` flag to prevent `onBlur` from saving after Escape
  - [x] `onKeyDown`: if `Enter` → trim value, if non-empty call `onSave(trimmed)`, else call `onCancel()`; if `Escape` → set `cancelledRef.current = true`, call `onCancel()`
  - [x] `onBlur`: if `cancelledRef.current === true` → reset flag and return (do nothing); else → trim value, if non-empty call `onSave(trimmed)`, else call `onCancel()`
  - [x] Input styling: `w-full bg-transparent outline-none focus:ring-1 focus:ring-indigo-300 rounded px-1 text-[15px] text-neutral-900`

- [x] Task 2: Wire `InlineEditInput` in `TodoItem.tsx` (AC: 1, 2, 3)
  - [x] Add `isEditing: boolean` local state to `TodoItem`
  - [x] On title span click: set `isEditing = true` (UX-DR12: single click, not double-click)
  - [x] Conditionally render: `isEditing ? <InlineEditInput ...> : <span onClick={...}>{todo.title}</span>`
  - [x] `handleSave(newTitle)`: snapshot `previousTodo`, dispatch `UPDATE_TODO_OPTIMISTIC` with `{ ...todo, title: newTitle }`, set `isEditing = false`, call `updateTodo(todo.id, { ...todo, title: newTitle })`, on error dispatch `UPDATE_TODO_ROLLBACK` + `showToast`
  - [x] `handleCancel()`: set `isEditing = false` (no dispatch, restore original)
  - [x] Do NOT trigger edit mode on checkbox or delete button clicks (ensure click handler is only on the title span)

- [x] Task 3: Write `InlineEditInput.test.tsx` co-located tests (AC: 1, 2, 3, 4, 5)
  - [x] Test: input auto-selects text on render
  - [x] Test: pressing Enter with valid text calls `onSave` with trimmed value
  - [x] Test: pressing Enter with empty/whitespace calls `onCancel`, not `onSave`
  - [x] Test: pressing Escape calls `onCancel`, not `onSave`
  - [x] Test: blurring with valid text calls `onSave`
  - [x] Test: blurring after Escape does NOT call `onSave` (Escape → blur race condition prevention)

## Dev Notes

### Escape/Blur Race Condition (UX-DR12, AC: 5)
This is a tricky browser behaviour: pressing Escape fires `keydown`, then the browser may fire `blur`. If both fire `onSave`, the title reverts to original (from Rollback) then saves the old value (from blur). Solution using a ref flag:

```typescript
const cancelledRef = useRef(false);

const handleKeyDown = (e: React.KeyboardEvent) => {
  if (e.key === 'Enter') {
    const trimmed = value.trim();
    if (trimmed) onSave(trimmed);
    else onCancel();
  } else if (e.key === 'Escape') {
    cancelledRef.current = true; // flag: blur will see this and skip
    onCancel();
  }
};

const handleBlur = () => {
  if (cancelledRef.current) {
    cancelledRef.current = false; // reset for next time
    return; // skip save — Escape already handled this
  }
  const trimmed = value.trim();
  if (trimmed) onSave(trimmed);
  else onCancel();
};
```

### `InlineEditInput` Full Component
```tsx
import { useRef, useEffect, useState } from 'react';

interface InlineEditInputProps {
  initialValue: string;
  onSave: (newTitle: string) => void;
  onCancel: () => void;
}

export function InlineEditInput({ initialValue, onSave, onCancel }: InlineEditInputProps) {
  const [value, setValue] = useState(initialValue);
  const inputRef = useRef<HTMLInputElement>(null);
  const cancelledRef = useRef(false);

  useEffect(() => {
    inputRef.current?.select(); // auto-select all text on mount
  }, []);

  // ... keydown and blur handlers as above

  return (
    <input
      ref={inputRef}
      type="text"
      value={value}
      onChange={e => setValue(e.target.value)}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
      className="w-full bg-transparent outline-none focus:ring-1 focus:ring-indigo-300 rounded px-1 text-[15px] text-neutral-900"
    />
  );
}
```

### Single Click Activation (UX-DR12)
The epics spec is clear: inline edit activates on **single click** on the title. Not double-click. Ensure the `onClick` handler on the `<span>` triggers `setIsEditing(true)`:
```tsx
<span
  onClick={() => setIsEditing(true)}
  className="flex-1 text-[15px] text-neutral-900 cursor-text"
  role="button"
  tabIndex={0}
  onKeyDown={e => e.key === 'Enter' && setIsEditing(true)}
>
  {todo.title}
</span>
```

### Optimistic Update Pattern for Edit (ARCH-6)
```typescript
async function handleSave(newTitle: string) {
  const previousTodo = todo; // snapshot
  const updated = { ...todo, title: newTitle };
  
  setIsEditing(false);
  dispatch({ type: 'UPDATE_TODO_OPTIMISTIC', payload: updated }); // instant UI

  try {
    await updateTodo(todo.id, { title: newTitle, completed: todo.completed, tags: todo.tags });
    // success: no-op
  } catch {
    dispatch({ type: 'UPDATE_TODO_ROLLBACK', payload: previousTodo }); // restore
    showToast('Something went wrong');
  }
}
```

### Project Structure Notes

- `frontend/src/components/InlineEditInput.tsx` + `InlineEditInput.test.tsx`
- `TodoItem.tsx` is updated to add `isEditing` state and conditional rendering
- Import chain: `TodoItem` → `InlineEditInput` (direct import, no barrel files)

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Optimistic Mutation Pattern] — ARCH-6 update rollback
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md] — UX-DR3 (Escape), UX-DR12 (single click, blur debounce, Escape cancel)
- [Source: _bmad-output/planning-artifacts/epics.md#Story 3.1] — acceptance criteria source
- FR3 (inline editing), ARCH-6, UX-DR3, UX-DR12, UX-DR14

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.6

### Debug Log References

### Completion Notes List

- Created `InlineEditInput.tsx` with `cancelledRef` flag to solve Escape/blur race condition
- Wired into `TodoItem.tsx` with `isEditing` state; single-click activation on title span (UX-DR12)
- `handleSave` uses optimistic dispatch + rollback on error (ARCH-6)
- 8 tests written and passing: auto-select, Enter/Escape/blur behaviours, trim, race condition prevention, styling

### File List

- frontend/src/components/InlineEditInput.tsx (new)
- frontend/src/components/InlineEditInput.test.tsx (new)
- frontend/src/components/TodoItem.tsx (modified)
