# Story 2.1: App Shell, Layout, and Global State Infrastructure

Status: review

## Story

As a developer,
I want the React app shell, TodoContext, ToastContext, and API client wired together with the Editorial layout,
So that all subsequent UI stories have the shared infrastructure they need to render and mutate state.

## Acceptance Criteria

1. **Given** the app renders  
   **When** it loads in the browser  
   **Then** the root layout is `min-h-screen bg-white font-sans` using Inter (loaded via `<link>` preconnect in `index.html`)  
   **And** the content area is `mx-auto max-w-2xl px-4 pt-12`  
   **And** `TodoContext` (with `useReducer`) and `ToastContext` are both provided at the app root  
   **And** `App.tsx` dispatches an initial `GET /api/todos` fetch on mount and populates `TodoContext` via `SET_TODOS`  
   **And** `useTodos()` and `useToast()` custom hooks are implemented and exported from their respective context files

2. **Given** the initial fetch is in flight  
   **When** `isLoading` is `true` in `TodoContext`  
   **Then** 3 skeleton rows are shown: `h-10 bg-neutral-100 rounded animate-pulse`

3. **Given** the `cn()` helper is needed anywhere in the app  
   **When** a component imports it  
   **Then** it is imported from `src/utils/cn.ts` — no direct `clsx()` or `twMerge()` calls elsewhere

## Tasks / Subtasks

- [x] Task 1: Update `index.html` with Inter font preconnect (AC: 1)
  - [x] Add `<link rel="preconnect" href="https://fonts.googleapis.com">` and `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>`
  - [x] Add `<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet">`
  - [x] Set `<title>nf-todo</title>`

- [x] Task 2: Create `TodoContext.tsx` (AC: 1, 2)
  - [x] Define `TodoState`: `{ todos: Todo[], isLoading: boolean }`
  - [x] Define `TodoAction` union type with all 9 action types:
    - `SET_TODOS`, `ADD_TODO_OPTIMISTIC`, `ADD_TODO_ROLLBACK`
    - `UPDATE_TODO_OPTIMISTIC`, `UPDATE_TODO_ROLLBACK`
    - `DELETE_TODO_OPTIMISTIC`, `DELETE_TODO_ROLLBACK`
    - `REORDER_OPTIMISTIC`, `REORDER_ROLLBACK`
  - [x] Implement `todoReducer` handling all action types
  - [x] Create `TodoContext` with `React.createContext`
  - [x] Create `TodoProvider` component wrapping children with the context
  - [x] Export `useTodos()` custom hook that reads from `TodoContext`

- [x] Task 3: Create `ToastContext.tsx` (AC: 1)
  - [x] Define `ToastState`: `{ message: string | null }`
  - [x] Create `ToastContext` and `ToastProvider`
  - [x] Expose `showToast(message: string): void` and `clearToast(): void` from provider
  - [x] Export `useToast()` custom hook

- [x] Task 4: Create `frontend/src/api/todos.ts` (AC: 1)
  - [x] Implement `fetchTodos(): Promise<Todo[]>` — `GET /api/todos`
  - [x] Implement `createTodo(body: CreateTodoBody): Promise<Todo>` — `POST /api/todos`
  - [x] Implement `updateTodo(id: string, body: UpdateTodoBody): Promise<Todo>` — `PUT /api/todos/:id`
  - [x] Implement `deleteTodo(id: string): Promise<void>` — `DELETE /api/todos/:id`
  - [x] Implement `reorderTodos(ids: string[]): Promise<void>` — `PUT /api/todos/reorder`
  - [x] All functions `throw` on non-2xx responses so callers can `try/catch` and show toast

- [x] Task 5: Wire `App.tsx` (AC: 1, 2)
  - [x] Wrap children in `<TodoProvider>` and `<ToastProvider>`
  - [x] On mount (`useEffect`), call `fetchTodos()`, dispatch `SET_TODOS` on success
  - [x] Set `isLoading: true` before fetch, `isLoading: false` after
  - [x] Render layout: `<main className="min-h-screen bg-white font-sans"><div className="mx-auto max-w-2xl px-4 pt-12">...</div></main>`
  - [x] While `isLoading`, render 3 skeleton rows

- [x] Task 6: Implement skeleton loading rows (AC: 2)
  - [x] Create inline or dedicated skeleton component: 3× `<div className="h-10 bg-neutral-100 rounded animate-pulse motion-safe:animate-pulse mb-2" />`

- [x] Task 7: Write `App.test.tsx` tests
  - [x] Test: skeleton rows render while loading
  - [x] Test: `SET_TODOS` populated after fetch (mock `fetchTodos`)
  - [x] Test: `TodoContext` and `ToastContext` are accessible from child components

## Dev Notes

### `TodoAction` Type (Complete Definition — ARCH-5)
```typescript
type TodoAction =
  | { type: 'SET_TODOS'; payload: Todo[] }
  | { type: 'ADD_TODO_OPTIMISTIC'; payload: Todo }
  | { type: 'ADD_TODO_ROLLBACK'; payload: string }       // id to remove
  | { type: 'UPDATE_TODO_OPTIMISTIC'; payload: Todo }
  | { type: 'UPDATE_TODO_ROLLBACK'; payload: Todo }      // previous todo state
  | { type: 'DELETE_TODO_OPTIMISTIC'; payload: string }  // id to remove
  | { type: 'DELETE_TODO_ROLLBACK'; payload: Todo }      // todo to restore
  | { type: 'REORDER_OPTIMISTIC'; payload: Todo[] }
  | { type: 'REORDER_ROLLBACK'; payload: Todo[] };
```
All 9 action types MUST exist. Future stories will use these actions.

### `todoReducer` Implementation (Required Cases)
```typescript
function todoReducer(state: TodoState, action: TodoAction): TodoState {
  switch (action.type) {
    case 'SET_TODOS':
      return { ...state, todos: action.payload, isLoading: false };
    case 'ADD_TODO_OPTIMISTIC':
      return { ...state, todos: [...state.todos, action.payload] };
    case 'ADD_TODO_ROLLBACK':
      return { ...state, todos: state.todos.filter(t => t.id !== action.payload) };
    case 'UPDATE_TODO_OPTIMISTIC':
      return { ...state, todos: state.todos.map(t => t.id === action.payload.id ? action.payload : t) };
    case 'UPDATE_TODO_ROLLBACK':
      return { ...state, todos: state.todos.map(t => t.id === action.payload.id ? action.payload : t) };
    case 'DELETE_TODO_OPTIMISTIC':
      return { ...state, todos: state.todos.filter(t => t.id !== action.payload) };
    case 'DELETE_TODO_ROLLBACK':
      return { ...state, todos: [...state.todos, action.payload].sort((a, b) => a.order - b.order) };
    case 'REORDER_OPTIMISTIC':
      return { ...state, todos: action.payload };
    case 'REORDER_ROLLBACK':
      return { ...state, todos: action.payload };
    default:
      return state;
  }
}
```

### API Client Pattern (ARCH-7)
```typescript
// frontend/src/api/todos.ts
const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const fetchTodos = (): Promise<Todo[]> => apiFetch('/api/todos');
// ... etc
```

### Optimistic UI Initial Wiring (ARCH-6)
Setting up the infrastructure here. Actual optimistic dispatch calls happen in Story 2.2+. The context infrastructure (dispatch, snapshot, rollback pattern) must be ready for Story 2.2 to use.

### `SET_TODOS` on Initial Load — Handle Loading State
```typescript
// App.tsx
useEffect(() => {
  fetchTodos()
    .then(todos => dispatch({ type: 'SET_TODOS', payload: todos }))
    .catch(() => showToast('Failed to load todos'));
}, []);
```
`isLoading` starts as `true` in the initial state. `SET_TODOS` reducer sets it to `false`.

### Project Structure Notes

- `frontend/src/context/TodoContext.tsx` — context + provider + reducer + `useTodos()` hook
- `frontend/src/context/ToastContext.tsx` — context + provider + `useToast()` hook
- `frontend/src/hooks/useTodos.ts` — thin wrapper re-exporting from context (for ergonomic imports)
- `frontend/src/hooks/useToast.ts` — thin wrapper re-exporting from context
- `frontend/src/api/todos.ts` — all fetch wrappers, single source for API calls
- No components should call `fetch()` directly — always use `src/api/todos.ts` functions (ARCH-7)
- ARCH-13: No barrel files — import `useTodos` as `import { useTodos } from '../context/TodoContext'`

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#State Management — React Context API (ARCH-5)] — Context + useReducer decision
- [Source: _bmad-output/planning-artifacts/architecture.md#API Communication Layer (ARCH-7)] — custom fetch wrappers
- [Source: _bmad-output/planning-artifacts/architecture.md#State Management Patterns] — TodoAction types, reducer actions
- [Source: _bmad-output/planning-artifacts/architecture.md#Loading States] — ARCH-16 skeleton rows
- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.1] — acceptance criteria source
- UX-DR11 (skeleton loading), UX-DR18 (editorial layout), ARCH-5, ARCH-6, ARCH-7, ARCH-16

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.6

### Debug Log References

### Completion Notes List

- Implemented `TodoContext.tsx` with `useReducer`, all 9 `TodoAction` types, `todoReducer`, `TodoProvider`, and `useTodos()` hook. Initial state has `isLoading: true`.
- Implemented `ToastContext.tsx` with `ToastProvider`, `showToast`, `clearToast`, and `useToast()` hook.
- Created `api/todos.ts` with `apiFetch` base function and all 5 API wrappers (`fetchTodos`, `createTodo`, `updateTodo`, `deleteTodo`, `reorderTodos`). All throw on non-2xx. Uses `VITE_API_URL` env var with fallback to `localhost:4000`.
- Rewrote `App.tsx` — `AppContent` inner component uses context hooks; `useEffect` dispatches `SET_TODOS` on mount; on error dispatches `SET_TODOS` with empty array and shows toast. Layout: `min-h-screen bg-white font-sans` / `mx-auto max-w-2xl px-4 pt-12`. Renders 3 `SkeletonRow` components while `isLoading`.
- Updated `index.html` with Inter font preconnect and stylesheet link.
- Added file-level `/* eslint-disable react-refresh/only-export-components */` to both context files (standard pattern for context + hook co-location).
- All 12 tests pass (9 new + 3 pre-existing). Lint clean.

### File List

- `frontend/index.html` — added Inter font preconnect and stylesheet links
- `frontend/src/App.tsx` — rewritten with providers, layout, skeleton, initial fetch
- `frontend/src/App.test.tsx` — new; 9 tests covering skeleton, SET_TODOS, context accessibility
- `frontend/src/context/TodoContext.tsx` — new; TodoState, TodoAction, todoReducer, TodoProvider, useTodos()
- `frontend/src/context/ToastContext.tsx` — new; ToastState, ToastProvider, showToast, clearToast, useToast()
- `frontend/src/api/todos.ts` — new; fetchTodos, createTodo, updateTodo, deleteTodo, reorderTodos

## Change Log

- 2026-04-21: Story implemented — TodoContext, ToastContext, API client, App shell with layout and skeleton loading (Agent: Claude Sonnet 4.6)
