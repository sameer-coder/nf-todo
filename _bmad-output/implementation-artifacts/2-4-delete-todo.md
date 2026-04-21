# Story 2.4: Delete Todo

Status: review

## Story

As a user,
I want to delete a todo by clicking the delete icon on its row,
So that I can permanently remove tasks I no longer need without any confirmation step.

## Acceptance Criteria

1. **Given** a todo row  
   **When** the user hovers over it  
   **Then** the `DeleteButton` icon becomes visible via `opacity-0 group-hover:opacity-100 motion-safe:transition-opacity`  
   **And** on touch devices the icon is visible at reduced opacity (not fully hidden)

2. **Given** the user clicks the `DeleteButton`  
   **When** the click fires  
   **Then** `DELETE_TODO_OPTIMISTIC` is dispatched immediately — the row is removed from the list  
   **And** `DELETE /api/todos/:id` is called  
   **And** on API error, `DELETE_TODO_ROLLBACK` is dispatched (row reappears) and a toast is shown

3. **Given** the `DeleteButton` renders  
   **When** inspected  
   **Then** it has `aria-label="Delete todo"` and a touch target of ≥44×44px  
   **And** hover state shows `text-rose-500`; resting state shows `text-neutral-400`

## Tasks / Subtasks

- [x] Task 1: Create `DeleteButton.tsx` component (AC: 1, 3)
  - [x] Element: `<button type="button">` with `aria-label="Delete todo"`
  - [x] Touch target: `w-11 h-11 flex items-center justify-center` (≥44×44px)
  - [x] Icon: trash/×  SVG icon (`text-neutral-400`)
  - [x] Classes: `opacity-0 group-hover:opacity-100 motion-safe:transition-opacity hover:text-rose-500`
  - [x] Touch device overrides: `sm:opacity-0 opacity-30` (visible at reduced opacity on touch, hidden via hover on pointer devices)
  - [x] Focus ring: `focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 rounded`

- [x] Task 2: Wire `DeleteButton` in `TodoItem.tsx` with optimistic delete (AC: 2)
  - [x] Import `DeleteButton` into `TodoItem.tsx`
  - [x] `handleDelete` function: snapshot `previousTodo`, dispatch `DELETE_TODO_OPTIMISTIC` (row disappears), call `deleteTodo(todo.id)`, on error dispatch `DELETE_TODO_ROLLBACK` + `showToast`
  - [x] Pass `onDelete={handleDelete}` to `DeleteButton`
  - [x] Ensure `TodoItem` root has `group` class for `group-hover` to work

- [x] Task 3: Write `DeleteButton.test.tsx` co-located tests
  - [x] Test: `aria-label="Delete todo"` present
  - [x] Test: `onClick` called once on click
  - [x] Test: button has `opacity-30` class in default state
  - [x] Test: `group-hover:opacity-100` class present (for CSS group hover)

## Dev Notes

### `DeleteButton` Component (UX-DR6)
```tsx
interface DeleteButtonProps {
  onDelete: () => void;
}

export function DeleteButton({ onDelete }: DeleteButtonProps) {
  return (
    <button
      type="button"
      aria-label="Delete todo"
      onClick={onDelete}
      className={cn(
        'w-11 h-11 flex items-center justify-center flex-shrink-0',
        // Progressive disclosure: hidden by default, shown on row hover
        'opacity-0 group-hover:opacity-100',
        // Respect reduced motion
        'motion-safe:transition-opacity',
        // Colour: neutral resting, rose on hover
        'text-neutral-400 hover:text-rose-500',
        // Touch devices: reduced opacity visible
        'touch:opacity-30',
        // Focus ring
        'focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 rounded',
      )}
    >
      {/* Trash icon SVG */}
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
    </button>
  );
}
```

### `group` Class on `TodoItem` (UX-DR6)
The `TodoItem` root element MUST have the `group` Tailwind class for `group-hover:` utilities to work on children:
```tsx
<div className="flex items-center gap-3 py-3 group">
  {/* DragHandle, Checkbox, title, TagChips, DeleteButton */}
</div>
```
Both `DragHandle` (Story 5.1) and `DeleteButton` use `group-hover:opacity-100` — they share the same parent `group`.

### Touch Device Visibility (UX-DR6)
On touch devices, buttons must be visible at reduced opacity (not fully hidden). Options:
- Use `@media (pointer: fine)` media query in CSS for pointer=fine (mouse) devices only
- In Tailwind, you can use a custom variant or apply `[@media(pointer:coarse)]:opacity-30` to ensure touch visibility

Simplest implementation: render the button with `opacity-30 md:opacity-0 md:group-hover:opacity-100` — small screens (likely touch) always show at 30%, pointer devices hide until hover.

### Optimistic Delete Pattern (ARCH-6)
```typescript
async function handleDelete() {
  const previousTodo = todo; // snapshot entire todo for rollback

  dispatch({ type: 'DELETE_TODO_OPTIMISTIC', payload: todo.id }); // instant removal

  try {
    await deleteTodo(todo.id);
    // success: nothing to do, state already reflects deletion
  } catch {
    dispatch({ type: 'DELETE_TODO_ROLLBACK', payload: previousTodo }); // restore row
    showToast('Something went wrong');
  }
}
```

### No Confirmation Dialog (FR4)
Per the PRD: delete is immediate with no confirmation dialog. The `handleDelete` function fires the optimistic delete immediately on button click — no modal, no `window.confirm`.

### Project Structure Notes

- `frontend/src/components/DeleteButton.tsx` + `DeleteButton.test.tsx`
- `TodoItem.tsx` updated to import `DeleteButton` and add `handleDelete` function
- `TodoItem` root element must keep `group` class (needed for `DragHandle` in Story 5.1 as well)

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Optimistic Mutation Pattern] — ARCH-6 rollback pattern
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md] — UX-DR6 progressive disclosure, UX-DR13 touch targets, UX-DR14 focus rings, UX-DR15 motion-safe
- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.4] — acceptance criteria source
- FR4 (delete immediately, no confirmation), FR7 (state persists via API delete)
- ARCH-6 (optimistic UI), ARCH-15 (cn()), UX-DR6, UX-DR13, UX-DR14, UX-DR15

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.6

### Debug Log References

### Completion Notes List

- Created DeleteButton component with trash icon, progressive disclosure (opacity-30 on touch, hidden on pointer until hover)
- Wired optimistic delete in TodoItem with rollback + toast on error
- 4 unit tests for DeleteButton, 8 for TodoItem — all passing, zero regressions across 40 total frontend tests
- Touch device visibility: uses `opacity-30 md:opacity-0 md:group-hover:opacity-100` pattern

### Change Log

- 2026-04-21: Implemented Story 2-4 — DeleteButton component, optimistic delete, unit tests

### File List

- frontend/src/components/DeleteButton.tsx (new)
- frontend/src/components/DeleteButton.test.tsx (new)
- frontend/src/components/TodoItem.tsx (modified)
- frontend/src/components/TodoItem.test.tsx (modified)
