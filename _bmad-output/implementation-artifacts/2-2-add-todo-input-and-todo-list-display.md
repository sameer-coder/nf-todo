# Story 2.2: Add Todo Input and Todo List Display

Status: ready-for-dev

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

- [ ] Task 1: Create `AddTodoInput.tsx` component (AC: 1, 2, 3)
  - [ ] Render a `<form>` with a single `<input type="text">` ref'd via `useRef`
  - [ ] `useEffect` on mount: call `ref.current?.focus()`
  - [ ] Input classes: `w-full outline-none text-[15px] text-neutral-900 placeholder:text-neutral-400 bg-transparent`
  - [ ] Container classes: `border-b border-neutral-200 pb-3 mb-4`
  - [ ] `onKeyDown` handler: if key is `Enter` and `value.trim()` is non-empty, call `handleSubmit`
  - [ ] `handleSubmit`: create optimistic temp Todo, dispatch `ADD_TODO_OPTIMISTIC`, clear input, `await createTodo()`, on error dispatch `ADD_TODO_ROLLBACK` + `showToast`
  - [ ] On `Escape` key press: clear the input without submitting (UX-DR3)

- [ ] Task 2: Create `TodoItem.tsx` component (AC: 4)
  - [ ] Accept `todo: Todo` prop
  - [ ] Root element classes: `flex items-center gap-3 py-3 group`
  - [ ] Render: `[DragHandle placeholder] [Checkbox placeholder] [title text] [tags placeholder] [DeleteButton placeholder]`
  - [ ] At this story stage, placeholders can be empty `<div>` elements — they will be filled in subsequent stories
  - [ ] Title: `<span className="flex-1 text-[15px] text-neutral-900">{todo.title}</span>`
  - [ ] Apply completed styling when `todo.completed`: `line-through text-neutral-400` on title span (UX-DR4)

- [ ] Task 3: Create `TodoList.tsx` (or inline list in `App.tsx`) (AC: 4)
  - [ ] Render `<ul className="divide-y divide-neutral-100">` wrapping `TodoItem` list
  - [ ] Map over `todos` (from `useTodos()`) sorted by `order`
  - [ ] Each `TodoItem` keyed by `todo.id`

- [ ] Task 4: Create optimistic `ADD_TODO_OPTIMISTIC` flow (AC: 2)
  - [ ] Construct a temporary `Todo` object for optimistic dispatch: use `crypto.randomUUID()` for temp id, set `order: todos.length`, `completed: false`, `tags: []`, `createdAt`/`updatedAt`: current ISO string
  - [ ] After API call succeeds, the server returns the real Todo — replace the optimistic one in state by dispatching `SET_TODOS` or `UPDATE_TODO_OPTIMISTIC` with the server response (use `ADD_TODO_ROLLBACK` then let `SET_TODOS` follow if needed — simplest approach is to replace after success)
  - [ ] Simplest correct approach: dispatch `ADD_TODO_OPTIMISTIC` with temp item → on success dispatch `UPDATE_TODO_OPTIMISTIC` with real response from server

- [ ] Task 5: Write `AddTodoInput.test.tsx` co-located tests
  - [ ] Test: input is auto-focused on render
  - [ ] Test: pressing Enter with non-empty value calls `createTodo`
  - [ ] Test: pressing Enter with empty value does NOT call `createTodo`
  - [ ] Test: input clears after submission
  - [ ] Test: `ADD_TODO_OPTIMISTIC` is dispatched before API call resolves

- [ ] Task 6: Write `TodoItem.test.tsx` co-located tests
  - [ ] Test: renders todo title
  - [ ] Test: applies `line-through text-neutral-400` when `todo.completed = true`

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

Claude Sonnet 4.6

### Debug Log References

### Completion Notes List

### File List
