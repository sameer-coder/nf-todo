# Story 2.3: Complete/Incomplete Toggle

Status: review

## Story

As a user,
I want to click a checkbox on any todo to mark it complete or incomplete,
So that I can track what I've done and what still needs attention.

## Acceptance Criteria

1. **Given** a todo is in the active (incomplete) state  
   **When** the user clicks its `Checkbox`  
   **Then** `UPDATE_TODO_OPTIMISTIC` is dispatched immediately — the checkbox visually fills to `bg-indigo-600` and the title renders `line-through text-neutral-400`  
   **And** `PUT /api/todos/:id` is called with `completed: true`  
   **And** on API error, `UPDATE_TODO_ROLLBACK` is dispatched and a toast is shown

2. **Given** a todo is in the completed state  
   **When** the user clicks its `Checkbox`  
   **Then** the optimistic action reverses the completed state — checkbox empties and strikethrough is removed  
   **And** `PUT /api/todos/:id` is called with `completed: false`

3. **Given** the `Checkbox` component renders  
   **When** inspected  
   **Then** it is implemented as `<button role="checkbox">` (not native `<input type="checkbox">`)  
   **And** it has `aria-checked` set to the current completed state and `aria-label="Mark complete"`  
   **And** its touch target meets ≥44×44px  
   **And** it has `focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2`

## Tasks / Subtasks

- [x] Task 1: Create `Checkbox.tsx` component (AC: 1, 2, 3)
  - [x] Element: `<button type="button" role="checkbox">`
  - [x] Props: `checked: boolean`, `onChange: () => void`
  - [x] `aria-checked={checked}`, `aria-label="Mark complete"`
  - [x] Touch target: `w-11 h-11 flex items-center justify-center` (≥44×44px per UX-DR13)
  - [x] Visual: when `checked` — inner square/circle `bg-indigo-600 rounded`; unchecked — `border-2 border-neutral-300 rounded bg-transparent`
  - [x] Focus ring: `focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2`
  - [x] Call `onChange()` on click

- [x] Task 2: Wire `Checkbox` in `TodoItem.tsx` with optimistic toggle (AC: 1, 2)
  - [x] Import `Checkbox` into `TodoItem.tsx`
  - [x] `handleToggle` function: snapshot `previousTodo`, dispatch `UPDATE_TODO_OPTIMISTIC` with `completed: !todo.completed`, call `updateTodo(todo.id, { ...todo, completed: !todo.completed })`, on error dispatch `UPDATE_TODO_ROLLBACK` + `showToast`
  - [x] Pass `checked={todo.completed}` and `onChange={handleToggle}` to `Checkbox`
  - [x] Ensure title span `line-through text-neutral-400` is toggled based on `todo.completed` (from Story 2.2)

- [x] Task 3: Write `Checkbox.test.tsx` co-located tests (AC: 3)
  - [x] Test: renders with `role="checkbox"` attribute
  - [x] Test: `aria-checked="false"` when `checked={false}`
  - [x] Test: `aria-checked="true"` when `checked={true}`
  - [x] Test: `onChange` called once on click
  - [x] Test: visual class `bg-indigo-600` present when checked
  - [x] Test: focus-visible ring classes present

## Dev Notes

### `Checkbox` Component (UX-DR20)
```tsx
import { cn } from '../utils/cn';

interface CheckboxProps {
  checked: boolean;
  onChange: () => void;
}

export function Checkbox({ checked, onChange }: CheckboxProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label="Mark complete"
      onClick={onChange}
      className={cn(
        'w-11 h-11 flex items-center justify-center flex-shrink-0',
        'focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 rounded',
      )}
    >
      <span
        className={cn(
          'w-5 h-5 rounded border-2 flex items-center justify-center',
          checked
            ? 'bg-indigo-600 border-indigo-600'
            : 'bg-white border-neutral-300'
        )}
      >
        {checked && (
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 12 12">
            <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </span>
    </button>
  );
}
```

### Optimistic Toggle Pattern (ARCH-6)
```typescript
async function handleToggle() {
  const previousTodo = todo; // snapshot
  const updated = { ...todo, completed: !todo.completed };

  dispatch({ type: 'UPDATE_TODO_OPTIMISTIC', payload: updated }); // instant UI

  try {
    await updateTodo(todo.id, { title: todo.title, completed: updated.completed, tags: todo.tags });
  } catch {
    dispatch({ type: 'UPDATE_TODO_ROLLBACK', payload: previousTodo }); // revert
    showToast('Something went wrong');
  }
}
```

### Touch Target Requirement (UX-DR13)
Minimum 44×44px touch target for the checkbox button. The `w-11 h-11` classes produce 44px × 44px (4px × 11 = 44px in Tailwind). The visual indicator inside is smaller, but the clickable area is the full button.

### ARIA Accessibility (UX-DR20)
- `role="checkbox"` on the `<button>` — not a native `<input type="checkbox">`
- `aria-checked` MUST reflect the `checked` prop boolean (not the todo's `completed` value directly — they are the same but pass via props)
- `aria-label="Mark complete"` — screen reader announcement

### Project Structure Notes

- `frontend/src/components/Checkbox.tsx` + `Checkbox.test.tsx`
- `TodoItem.tsx` is updated in this story to import and wire `Checkbox`
- All conditional Tailwind classes use `cn()` — never string concatenation

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Optimistic Mutation Pattern] — ARCH-6 complete pattern
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md] — UX-DR4, UX-DR13, UX-DR14, UX-DR20
- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.3] — acceptance criteria source
- FR5 (mark complete), FR6 (toggle incomplete), FR7 (persistence via API)
- ARCH-6 (optimistic UI), ARCH-15 (cn()), UX-DR4, UX-DR13, UX-DR14, UX-DR20

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.6

### Debug Log References

### Completion Notes List

- Created Checkbox component with full ARIA accessibility (role, aria-checked, aria-label)
- Wired optimistic toggle pattern in TodoItem with rollback + toast on error
- 8 unit tests for Checkbox, 6 for TodoItem — all passing, zero regressions across 34 total frontend tests

### Change Log

- 2026-04-21: Implemented Story 2-3 — Checkbox component, optimistic toggle, unit tests

### File List

- frontend/src/components/Checkbox.tsx (new)
- frontend/src/components/Checkbox.test.tsx (new)
- frontend/src/components/TodoItem.tsx (modified)
- frontend/src/components/TodoItem.test.tsx (modified)
