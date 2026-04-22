# Story 4.1: Status Filter Bar (All / Active / Completed)

Status: review

## Story

As a user,
I want to click a status tab to filter my todo list by completion state,
So that I can focus on only the tasks relevant to me at any given moment.

## Acceptance Criteria

1. **Given** the app renders with todos  
   **When** the `StatusFilterBar` is displayed  
   **Then** three tab-style buttons are shown: "All", "Active", "Completed"  
   **And** the active tab has `font-semibold text-neutral-900`; inactive tabs have `text-neutral-400 hover:text-neutral-600`  
   **And** the tabs are mutually exclusive — only one can be active at a time

2. **Given** the user clicks the "Active" tab  
   **When** the filter is applied  
   **Then** the URL updates to `?status=active` via `useSearchParams()`  
   **And** only todos where `completed === false` are shown in the list  
   **And** no API call is made — filtering is client-side against `TodoContext` todos

3. **Given** the user clicks the "Completed" tab  
   **When** the filter is applied  
   **Then** the URL updates to `?status=completed`  
   **And** only todos where `completed === true` are shown

4. **Given** the user refreshes the page  
   **When** the app loads  
   **Then** the `status` query param is absent — filter state resets to "All" (FR15)

## Tasks / Subtasks

- [x] Task 1: Create `StatusFilterBar.tsx` component (AC: 1, 2, 3)
  - [x] Use `useSearchParams()` from `react-router-dom` to read and update `status` param
  - [x] Render three `<button>` elements: "All", "Active", "Completed"
  - [x] Active tab class: `font-semibold text-paper-text`
  - [x] Inactive tab class: `text-paper-muted hover:text-paper-pencil`
  - [x] On click "All": `setSearchParams(params => { params.delete('status'); return params; })`
  - [x] On click "Active": `setSearchParams(params => { params.set('status', 'active'); return params; })`
  - [x] On click "Completed": `setSearchParams(params => { params.set('status', 'completed'); return params; })`
  - [x] Determine active tab from `searchParams.get('status')` — `null` or `'all'` means "All" is active
  - [x] Focus ring on all buttons: `focus-visible:ring-2 focus-visible:ring-paper-ink focus-visible:ring-offset-2`

- [x] Task 2: Implement client-side status filter logic in `App.tsx` (AC: 2, 3, 4)
  - [x] Read `status` from `useSearchParams()` in `App.tsx`
  - [x] Derive `filteredTodos` from `todos` in `TodoContext`:
    - `status === 'active'` → `todos.filter(t => !t.completed)`
    - `status === 'completed'` → `todos.filter(t => t.completed)`
    - default (`null` or `'all'`) → `todos` (no filter)
  - [x] Pass `filteredTodos` to the todo list render — do NOT filter in `TodoContext` (filter is view-layer only)
  - [x] On page refresh: `searchParams.get('status')` returns `null` → shows all todos (FR15)

- [x] Task 3: Wire `StatusFilterBar` in `App.tsx` (AC: 1)
  - [x] Render `<StatusFilterBar />` between the `AddTodoInput` and the todo list
  - [x] Ensure `App.tsx` is wrapped in `<BrowserRouter>` (or `<Router>`) from `react-router-dom` so `useSearchParams` works

- [x] Task 4: Write `StatusFilterBar.test.tsx` co-located tests (AC: 1, 2, 3)
  - [x] Test: renders "All", "Active", "Completed" buttons
  - [x] Test: "All" tab is active by default (no `status` param)
  - [x] Test: clicking "Active" sets `status=active` in URL
  - [x] Test: clicking "Completed" sets `status=completed` in URL
  - [x] Test: active tab has `font-semibold` class, inactive tabs do not
  - [x] Use `MemoryRouter` with initial entries for testing URL state

## Dev Notes

### ARCH-4: Filter State Exclusively in URL Query Params
Filter state must live in URL query params — NEVER in component `useState`. This is an architectural constraint (ARCH-4). Using `useSearchParams()` from React Router is the only correct approach.

### `StatusFilterBar` Component
```tsx
import { useSearchParams } from 'react-router-dom';
import { cn } from '../utils/cn';

type StatusFilter = 'all' | 'active' | 'completed';

export function StatusFilterBar() {
  const [searchParams, setSearchParams] = useSearchParams();
  const current = (searchParams.get('status') ?? 'all') as StatusFilter;

  const setStatus = (status: StatusFilter) => {
    setSearchParams(prev => {
      if (status === 'all') prev.delete('status');
      else prev.set('status', status);
      return prev;
    });
  };

  return (
    <div className="flex gap-4 mb-4" role="tablist" aria-label="Filter todos by status">
      {(['all', 'active', 'completed'] as StatusFilter[]).map(status => (
        <button
          key={status}
          role="tab"
          aria-selected={current === status}
          onClick={() => setStatus(status)}
          className={cn(
            'text-sm capitalize',
            'focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 rounded',
            current === status
              ? 'font-semibold text-neutral-900'
              : 'text-neutral-400 hover:text-neutral-600'
          )}
        >
          {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
        </button>
      ))}
    </div>
  );
}
```

### Client-Side Filter Derivation in `App.tsx`
```typescript
// App.tsx
const [searchParams] = useSearchParams();
const status = searchParams.get('status');

const filteredTodos = useMemo(() => {
  if (status === 'active') return todos.filter(t => !t.completed);
  if (status === 'completed') return todos.filter(t => t.completed);
  return todos;
}, [todos, status]);
```

### Page Refresh Resets Filter (FR15)
No filter persistence on refresh is by design. The URL query params are NOT stored in localStorage or any persistent storage. On page refresh the URL loads without query params (unless the browser restores them), and `searchParams.get('status')` returns `null` → default "All" view.

### Combined Filter (Story 4.4)
In Story 4.4, both `status` and `tags` filters are applied simultaneously. The filter derivation in `App.tsx` should be designed to compose:
```typescript
// Prepare for Story 4.4 by building composable filter:
let result = todos;
if (status === 'active') result = result.filter(t => !t.completed);
if (status === 'completed') result = result.filter(t => t.completed);
// tags filter added in Story 4.4
```

### `BrowserRouter` Wrapping
In `main.tsx`, wrap `<App />` in `<BrowserRouter>`:
```tsx
import { BrowserRouter } from 'react-router-dom';
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
```
Without this, `useSearchParams` will throw: "No router found."

### Project Structure Notes

- `frontend/src/components/StatusFilterBar.tsx` + `StatusFilterBar.test.tsx`
- `App.tsx` updated: add `filteredTodos` derivation, render `<StatusFilterBar />`, wrap root in `<BrowserRouter>`
- ARCH-4 mandates URL query params — never `useState` for filter state

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Filter State — URL Query Params (ARCH-4)] — ARCH-4 decision
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md] — UX-DR9 (status filter bar styling)
- [Source: _bmad-output/planning-artifacts/epics.md#Story 4.1] — acceptance criteria source
- FR11 (filter by status), FR15 (filter resets on refresh), ARCH-4, UX-DR9, UX-DR14

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.6

### Debug Log References

### Completion Notes List

- Created `StatusFilterBar.tsx` with three tab buttons using `useSearchParams()` per ARCH-4
- Updated `App.tsx` with `filteredTodos` derivation using `useMemo` for status + tag filtering
- Added `BrowserRouter` wrapper in `main.tsx` for router context
- Refactored `TodoList` to accept `todos` prop instead of reading from context directly
- Moved empty state logic from `TodoList` into `App.tsx` for filter-aware variant switching
- Updated `App.test.tsx` to wrap `<App />` in `<MemoryRouter>` for router context
- 7 passing tests in `StatusFilterBar.test.tsx`
- Adapted styling from story spec (indigo/neutral → paper-* theme) to match project design system

### Change Log

- 2026-04-22: Implemented StatusFilterBar, filter logic, BrowserRouter wrapping, and tests

### File List

- frontend/src/main.tsx (modified — added BrowserRouter wrapper)
- frontend/src/App.tsx (modified — added useSearchParams, filteredTodos, StatusFilterBar, EmptyState logic)
- frontend/src/components/StatusFilterBar.tsx (new)
- frontend/src/components/StatusFilterBar.test.tsx (new)
- frontend/src/components/TodoList.tsx (modified — accepts todos prop)
- frontend/src/App.test.tsx (modified — MemoryRouter wrapper)
