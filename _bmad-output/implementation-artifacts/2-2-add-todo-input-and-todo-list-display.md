# Story 2.2: Add Todo Input and Todo List Display

Status: done

## Story

As a user,
I want to type a task title and press Enter to add it to the list, and see all my todos displayed in order,
So that I can quickly capture tasks and see everything I need to do.

## Acceptance Criteria

1. **Given** the app loads  
   **When** the page renders  
   **Then** the `AddTodoInput` component is visible at the top of the content area  
   **And** the input is auto-focused via `useEffect + ref.focus()` — no click required  
   **And** the input has placeholder text "Add a task…" styled `text-neutral-400`  
   **And** the input container uses `border-b border-neutral-200 pb-3 mb-4`

2. **Given** a user types a title and presses Enter  
   **When** the form submits  
   **Then** an optimistic `ADD_TODO_OPTIMISTIC` action is dispatched immediately  
   **And** `POST /api/todos` is called with `{ title, tags: [] }`  
   **And** the input clears and focus returns immediately  
   **And** on API success, no additional UI change occurs  
   **And** on API failure, `ADD_TODO_ROLLBACK` is dispatched and a toast is shown

3. **Given** a user presses Enter with an empty input  
   **When** the form attempts to submit  
   **Then** the submit is silently prevented — no API call, no error text shown

4. **Given** todos exist in `TodoContext`  
   **When** the list renders  
   **Then** todos are displayed as a `divide-y divide-neutral-100` list sorted by `order`  
   **And** each row is `flex items-center gap-3 py-3 group`

## Tasks / Subtasks

- [x] Task 1: Create `AddTodoInput.tsx` component (AC: 1, 2, 3)
  - [x] Render a `<form>` with a single `<input type="text">` ref'd via `useRef`
  - [x] `useEffect` on mount: call `ref.current?.focus()`
  - [x] Input classes: `w-full outline-none text-[15px] text-neutral-900 placeholder:text-neutral-400 bg-transparent`
  - [x] Container classes: `border-b border-neutral-200 pb-3 mb-4`
  - [x] `onKeyDown` handler: if key is `Enter` and `value.trim()` is non-empty, call `handleSubmit`
  - [x] `handleSubmit`: create optimistic temp Todo, dispatch `ADD_TODO_OPTIMISTIC`, clear input, `await createTodo()`, on error dispatch `ADD_TODO_ROLLBACK` + `showToast`
  - [x] On `Escape` key press: clear the input without submitting (UX-DR3)

- [x] Task 2: Create `TodoItem.tsx` component (AC: 4)
  - [x] Accept `todo: Todo` prop
  - [x] Root element classes: `flex items-center gap-3 py-3 group`
  - [x] Render: `[DragHandle placeholder] [Checkbox placeholder] [title text] [tags placeholder] [DeleteButton placeholder]`
  - [x] At this story stage, placeholders can be empty `<div>` elements — they will be filled in subsequent stories
  - [x] Title: `<span className="flex-1 text-[15px] text-neutral-900">{todo.title}</span>`
  - [x] Apply completed styling when `todo.completed`: `line-through text-neutral-400` on title span (UX-DR4)

- [x] Task 3: Create `TodoList.tsx` (or inline list in `App.tsx`) (AC: 4)
  - [x] Render `<ul className="divide-y divide-neutral-100">` wrapping `TodoItem` list
  - [x] Map over `todos` (from `useTodos()`) sorted by `order`
  - [x] Each `TodoItem` keyed by `todo.id`

- [x] Task 4: Create optimistic `ADD_TODO_OPTIMISTIC` flow (AC: 2)
  - [x] Construct a temporary `Todo` object for optimistic dispatch: use `crypto.randomUUID()` for temp id, set `order: todos.length`, `completed: false`, `tags: []`, `createdAt`/`updatedAt`: current ISO string
  - [x] After API call succeeds, the server returns the real Todo — replace the optimistic one in state by dispatching `SET_TODOS` or `UPDATE_TODO_OPTIMISTIC` with the server response (use `ADD_TODO_ROLLBACK` then let `SET_TODOS` follow if needed — simplest approach is to replace after success)
  - [x] Simplest correct approach: dispatch `ADD_TODO_OPTIMISTIC` with temp item → on success dispatch `UPDATE_TODO_OPTIMISTIC` with real response from server

- [x] Task 5: Write `AddTodoInput.test.tsx` co-located tests
  - [x] Test: input is auto-focused on render
  - [x] Test: pressing Enter with non-empty value calls `createTodo`
  - [x] Test: pressing Enter with empty value does NOT call `createTodo`
  - [x] Test: input clears after submission
  - [x] Test: `ADD_TODO_OPTIMISTIC` is dispatched before API call resolves

- [x] Task 6: Write `TodoItem.test.tsx` co-located tests
  - [x] Test: renders todo title
  - [x] Test: applies `line-through text-neutral-400` when `todo.completed = true`

### Review Findings

- [x] [Review][Patch] Toast failures are written to context state but never rendered in the UI, so the promised error toast is not actually shown [frontend/src/context/ToastContext.tsx:16]
- [x] [Review][Patch] Optimistic add uses `state.todos.length` for the temporary `order`, which can place a new todo in the wrong position when existing order values are non-contiguous [frontend/src/components/AddTodoInput.tsx:25]

## Dev Notes

### Optimistic `ADD` Pattern (ARCH-6)
```typescript
async function handleAddTodo(title: string) {
  const trimmed = title.trim();
  if (!trimmed) return;

  // 1. Build optimistic todo with temp ID
  const tempTodo: Todo = {
    id: crypto.randomUUID(),
    title: trimmed,
    completed: false,
    order: todos.length,
    tags: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // 2. Optimistic dispatch
  dispatch({ type: 'ADD_TODO_OPTIMISTIC', payload: tempTodo });
  clearInput();

  // 3. API call
  try {
    const serverTodo = await createTodo({ title: trimmed, tags: [] });
    // 4. Replace temp with server-assigned todo (server has real id, order, timestamps)
    dispatch({ type: 'DELETE_TODO_OPTIMISTIC', payload: tempTodo.id });
    dispatch({ type: 'ADD_TODO_OPTIMISTIC', payload: serverTodo });
  } catch {
    // 5. Rollback
    dispatch({ type: 'ADD_TODO_ROLLBACK', payload: tempTodo.id });
    showToast('Something went wrong');
  }
}
```

### UX Keyboard Behaviour (UX-DR1, UX-DR2, UX-DR3)
- Auto-focus on mount: `useEffect(() => { inputRef.current?.focus(); }, [])`
- After Enter submit: clear input, call `inputRef.current?.focus()` immediately (returns focus to input)
- Escape key: `e.key === 'Escape'` → `setInputValue('')` — no submit, no toast

### Completed Todo Styling (UX-DR4)
```tsx
<span
  className={cn(
    'flex-1 text-[15px]',
    todo.completed ? 'line-through text-neutral-400' : 'text-neutral-900'
  )}
>
  {todo.title}
</span>
```
Always use `cn()` from `src/utils/cn.ts` for conditional classes (ARCH-15).

### Tag Parsing Note (for Story 3.2)
At this story stage, title submission does NOT parse `#tag` tokens. Basic `{ title, tags: [] }` only. Tag parsing is implemented in Story 3.2. Do not add this functionality prematurely.

### Project Structure Notes

- `frontend/src/components/AddTodoInput.tsx` + `AddTodoInput.test.tsx`
- `frontend/src/components/TodoItem.tsx` + `TodoItem.test.tsx`
- No barrel files — import directly: `import { AddTodoInput } from '../components/AddTodoInput'`
- `crypto.randomUUID()` available in modern browsers (no import needed)
- `VITE_API_URL` is accessed via `import.meta.env.VITE_API_URL` (Vite environment variables)

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Optimistic Mutation Pattern] — ARCH-6 complete pattern
- [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Component Organization] — file locations
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md] — UX-DR1, UX-DR2, UX-DR3, UX-DR4
- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.2] — acceptance criteria source
- FR1 (create todo), FR2 (view todos), NFR2 (no full-page reload)
- ARCH-6 (optimistic UI), ARCH-15 (cn() helper), UX-DR1, UX-DR2, UX-DR3, UX-DR4, UX-DR18

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

### Completion Notes List

- Created `AddTodoInput` component with auto-focus, Enter-to-submit, Escape-to-clear, and full optimistic add flow (dispatch → API → replace temp with server todo, or rollback + toast on failure)
- Created `TodoItem` component with placeholder slots for drag handle, checkbox, tags, and delete button; conditional `line-through text-neutral-400` styling via `cn()` for completed todos
- Created `TodoList` component consuming `useTodos()`, rendering sorted-by-order `<ul>` with `divide-y divide-neutral-100`
- Updated `App.tsx` to render `AddTodoInput` + `TodoList` after loading completes
- Wrote 6 tests for `AddTodoInput` (auto-focus, submit with value, reject empty, clear after submit, optimistic dispatch before API resolves, Escape clears input)
- Wrote 3 tests for `TodoItem` (renders title, completed styling applied, incomplete styling correct)
- All 21 frontend tests pass; lint and typecheck clean
- Note: used `div` container with `onKeyDown` instead of `<form>` element — functionally equivalent, handles Enter/Escape as specified
- Optimistic replace strategy: `DELETE_TODO_OPTIMISTIC(tempId)` + `ADD_TODO_OPTIMISTIC(serverTodo)` on success (per Dev Notes pattern)

### Change Log

- 2026-04-21: Implemented Story 2.2 — AddTodoInput, TodoItem, TodoList components with optimistic add flow and 9 co-located tests

### File List

- frontend/src/components/AddTodoInput.tsx (new)
- frontend/src/components/AddTodoInput.test.tsx (new)
- frontend/src/components/TodoItem.tsx (new)
- frontend/src/components/TodoItem.test.tsx (new)
- frontend/src/components/TodoList.tsx (new)
- frontend/src/App.tsx (modified)
