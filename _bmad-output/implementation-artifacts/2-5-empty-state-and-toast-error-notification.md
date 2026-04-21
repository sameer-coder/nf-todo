# Story 2.5: Empty State and Toast Error Notification

Status: review

## Story

As a user,
I want to see a clear empty state when I have no todos, and a calm non-blocking toast when an API error occurs,
So that I always understand what the app is showing me and errors never disrupt my workflow.

## Acceptance Criteria

1. **Given** the todo list is empty  
   **When** the app renders  
   **Then** the `EmptyState` component renders with the copy "No todos yet."  
   **And** it is styled `flex flex-col items-center justify-center py-16 text-neutral-400 text-sm`  
   **And** no action button is offered

2. **Given** any API call returns a 5xx error  
   **When** the error is caught in the API client  
   **Then** `showToast('Something went wrong')` is called  
   **And** the `Toast` component renders at `fixed bottom-4 right-4 z-50` with neutral styling: `bg-white border border-neutral-200 text-sm text-neutral-700`  
   **And** the toast has `role="status" aria-live="polite"`  
   **And** the toast auto-dismisses after 4 seconds  
   **And** the toast enters with `motion-safe:animate-in slide-in-from-bottom-2 fade-in`

3. **Given** an API error occurs during any mutation  
   **When** the toast is displayed  
   **Then** the rest of the list remains fully interactive — no page crash or disabled UI

4. **Given** all interactive elements in this epic  
   **When** navigated via keyboard  
   **Then** focus rings use `focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2`  
   **And** all animations/transitions use the `motion-safe:` Tailwind prefix

## Tasks / Subtasks

- [x] Task 1: Create `EmptyState.tsx` component (AC: 1)
  - [x] Props: `variant: 'empty' | 'no-results'` (future-proofed for Story 4.4; default to `'empty'`)
  - [x] For `'empty'` variant: render `"No todos yet."` with no action
  - [x] Styling: `flex flex-col items-center justify-center py-16 text-neutral-400 text-sm`
  - [x] For `'no-results'` variant (prepare stub): `"No todos match your filters."` with a "Clear filters" button (full implementation in Story 4.4)

- [x] Task 2: Create `Toast.tsx` component (AC: 2, 3)
  - [x] Consumes `useToast()` — reads `message` and `clearToast`
  - [x] When `message` is non-null, render a fixed toast at `fixed bottom-4 right-4 z-50`
  - [x] Styling: `bg-white border border-neutral-200 rounded-lg px-4 py-3 text-sm text-neutral-700 shadow-sm`
  - [x] ARIA: `role="status" aria-live="polite"`
  - [x] Entry animation: `motion-safe:animate-in motion-safe:slide-in-from-bottom-2 motion-safe:fade-in`
  - [x] Auto-dismiss: `useEffect` sets `setTimeout(() => clearToast(), 4000)` when `message` becomes non-null
  - [x] Cancel timer on cleanup: return `clearTimeout(timerId)` from effect
  - [x] Render `Toast` at app root level (in `App.tsx`) so it overlays everything

- [x] Task 3: Wire `EmptyState` in the todo list (AC: 1)
  - [x] In `App.tsx` / `TodoList`: when `!isLoading && todos.length === 0`, render `<EmptyState variant="empty" />`
  - [x] Do NOT show `EmptyState` while `isLoading` is true (skeleton rows show instead)

- [x] Task 4: Wire `Toast` in `App.tsx` (AC: 2)
  - [x] Render `<Toast />` inside `App.tsx` at the layout root (outside the content column — it's fixed positioned)
  - [x] `Toast` renders `null` when `message` is `null`

- [x] Task 5: Add `tailwindcss-animate` for entry animations (AC: 2)
  - [x] Install `tailwindcss-animate` package: `npm install tailwindcss-animate`
  - [x] Add to `tailwind.config.js` plugins: `require('tailwindcss-animate')`
  - [x] This enables `animate-in`, `slide-in-from-bottom-2`, `fade-in` utilities

- [x] Task 6: Write `EmptyState.test.tsx` tests (AC: 1)
  - [x] Test: renders "No todos yet." when `variant="empty"`
  - [x] Test: no action button in `variant="empty"`

- [x] Task 7: Write `Toast.test.tsx` tests (AC: 2)
  - [x] Test: renders nothing when `message` is `null`
  - [x] Test: renders message text when `message` is non-null
  - [x] Test: has `role="status"` and `aria-live="polite"`
  - [x] Test: `clearToast` called after 4 seconds (use fake timers)

## Dev Notes

### `Toast` Auto-Dismiss using `useEffect` (UX-DR17)
```typescript
export function Toast() {
  const { message, clearToast } = useToast();

  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(clearToast, 4000);
    return () => clearTimeout(timer); // cleanup prevents memory leaks
  }, [message, clearToast]);

  if (!message) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'fixed bottom-4 right-4 z-50',
        'bg-white border border-neutral-200 rounded-lg px-4 py-3',
        'text-sm text-neutral-700 shadow-sm',
        'motion-safe:animate-in motion-safe:slide-in-from-bottom-2 motion-safe:fade-in',
      )}
    >
      {message}
    </div>
  );
}
```

### `EmptyState` Component (UX-DR10)
```typescript
interface EmptyStateProps {
  variant: 'empty' | 'no-results';
  onClearFilters?: () => void; // only needed for 'no-results'
}

export function EmptyState({ variant, onClearFilters }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-neutral-400 text-sm">
      {variant === 'empty' ? (
        <p>No todos yet.</p>
      ) : (
        <>
          <p>No todos match your filters.</p>
          <button
            onClick={onClearFilters}
            className="mt-2 text-indigo-600 hover:text-indigo-800 underline focus-visible:ring-2 focus-visible:ring-indigo-500 rounded"
          >
            Clear filters
          </button>
        </>
      )}
    </div>
  );
}
```
Note: the `'no-results'` variant with "Clear filters" is wired up in Story 4.4 — stub it here.

### `tailwindcss-animate` Package
The `motion-safe:animate-in` utility requires the `tailwindcss-animate` plugin. Add to `tailwind.config.js`:
```js
plugins: [require('tailwindcss-animate')],
```

### Rendering `Toast` at App Root
The `Toast` component must be rendered at the app root so it overlays all content. In `App.tsx`:
```tsx
return (
  <TodoProvider>
    <ToastProvider>
      <main className="min-h-screen bg-white font-sans">
        <div className="mx-auto max-w-2xl px-4 pt-12">
          {/* App content */}
        </div>
      </main>
      <Toast /> {/* Fixed positioned — sits outside the content column */}
    </ToastProvider>
  </TodoProvider>
);
```

### Non-Blocking Toast (FR23)
The toast renders at a fixed position and never blocks any interactive elements. Using `pointer-events-none` on the toast wrapper is optional since `fixed bottom-4 right-4` is typically out of the way of content.

### Project Structure Notes

- `frontend/src/components/EmptyState.tsx` + `EmptyState.test.tsx`
- `frontend/src/components/Toast.tsx` + `Toast.test.tsx`
- `App.tsx` updated to render `<Toast />` and conditionally render `<EmptyState>`
- `tailwindcss-animate` added to `package.json` dev dependencies

### References

- [Source: _bmad-output/planning-artifacts/ux-design-specification.md] — UX-DR10 (empty state variants), UX-DR17 (toast styling and timing)
- [Source: _bmad-output/planning-artifacts/architecture.md#Error Handling] — toast triggered only on API errors
- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.5] — acceptance criteria source
- FR19 (empty state), FR21 (toast on 5xx), FR22 (toast auto-dismisses), FR23 (no data loss/crash)
- ARCH-5 (ToastContext), UX-DR10, UX-DR14, UX-DR15, UX-DR17

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.6

### Debug Log References

### Completion Notes List

- Created EmptyState component with 'empty' and 'no-results' variants (no-results prepared for Story 4.4)
- Created Toast component with role="status", aria-live="polite", 4s auto-dismiss, motion-safe entry animation
- Replaced inline ToastViewport in App.tsx with dedicated Toast component (updated role from alert→status, timing 3s→4s)
- Wired EmptyState in TodoList — shown when !isLoading && todos.length === 0
- Installed tailwindcss-animate plugin for animate-in/slide-in/fade-in utilities
- 4 EmptyState tests, 4 Toast tests — all passing, 48 total frontend tests with zero regressions
- Backend test failures are pre-existing (better-sqlite3 native bindings issue), unrelated to these changes

### Change Log

- 2026-04-21: Implemented Story 2-5 — EmptyState, Toast, tailwindcss-animate, unit tests

### File List

- frontend/src/components/EmptyState.tsx (new)
- frontend/src/components/EmptyState.test.tsx (new)
- frontend/src/components/Toast.tsx (new)
- frontend/src/components/Toast.test.tsx (new)
- frontend/src/components/TodoList.tsx (modified)
- frontend/src/App.tsx (modified — replaced inline ToastViewport with Toast component)
- frontend/src/App.test.tsx (modified — updated toast role from alert to status)
- frontend/tailwind.config.js (modified — added tailwindcss-animate plugin)
- frontend/package.json (modified — added tailwindcss-animate dependency)
