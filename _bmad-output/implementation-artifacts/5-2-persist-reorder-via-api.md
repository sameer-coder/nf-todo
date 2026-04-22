# Story 5.2: Persist Reorder via API

Status: review

## Story

As a user,
I want the new order of my todos to persist after I drop them in a new position,
So that my manually arranged list survives page refresh and container restart.

## Acceptance Criteria

1. **Given** the user drops a todo in a new position  
   **When** the `onDragEnd` handler fires  
   **Then** `REORDER_OPTIMISTIC` is dispatched immediately with the reordered `Todo[]` array — the list reflects the new order before API confirmation  
   **And** `PUT /api/todos/reorder` is called with `{ ids: string[] }` in the new order  
   **And** on API success, no further UI change occurs (optimistic state is already correct)  
   **And** on API error, `REORDER_ROLLBACK` is dispatched restoring the previous order and a toast is shown

2. **Given** `PUT /api/todos/reorder` is called  
   **When** the backend processes it  
   **Then** the backend assigns `order = index` for each id in the array  
   **And** subsequent `GET /api/todos` returns todos sorted by the new `order` values  
   **And** the order persists across page refresh and container restart (FR17)

3. **Given** the reorder is pointer-based only (FR18)  
   **When** the drag is initiated  
   **Then** only pointer events trigger the drag — the `PointerSensor` from @dnd-kit is configured as the primary sensor

## Tasks / Subtasks

- [x] Task 1: Add API call in `handleDragEnd` in `App.tsx` / `TodoList.tsx` (AC: 1)
  - [x] After dispatching `REORDER_OPTIMISTIC`, call `reorderTodos(reordered.map(t => t.id))`
  - [x] Snapshot previous order before optimistic dispatch: `const previousTodos = todos`
  - [x] On error: dispatch `REORDER_ROLLBACK` with `previousTodos` + `showToast('Something went wrong')`

- [x] Task 2: Verify `reorderTodos` function exists in `frontend/src/api/todos.ts` (AC: 1)
  - [x] `reorderTodos(ids: string[]): Promise<void>` — calls `PUT /api/todos/reorder` with `{ ids }`
  - [x] Function created in Story 2.1 — verify it exists and handles 204 No Content response correctly

- [x] Task 3: Verify backend `PUT /api/todos/reorder` correctness (AC: 2)
  - [x] Implemented in Story 1.4 — verify the route assigns `order = index` for each id
  - [x] Verify `GET /api/todos` returns todos in new `order` after reorder
  - [x] Verify the order persists across backend restart (stored in SQLite, not in-memory)

- [x] Task 4: Confirm `PointerSensor` as primary sensor (AC: 3, FR18)
  - [x] Verify `PointerSensor` is used in `useSensors()` (configured in Story 5.1)
  - [x] Per FR18: reordering must be initiated via pointer device only — `PointerSensor` covers mouse and touch pointer events
  - [x] `KeyboardSensor` provides accessibility for keyboard navigation but doesn't violate "pointer-only" — it's an accessibility requirement

## Dev Notes

### Full Optimistic Reorder Pattern (ARCH-6)
```typescript
const handleDragEnd = async ({ active, over }: DragEndEvent) => {
  if (!over || active.id === over.id) return;

  const oldIndex = todos.findIndex(t => t.id === active.id);
  const newIndex = todos.findIndex(t => t.id === over.id);

  const previousTodos = todos; // snapshot for rollback
  const reordered = arrayMove(todos, oldIndex, newIndex);

  // 1. Optimistic update — immediate visual reorder
  dispatch({ type: 'REORDER_OPTIMISTIC', payload: reordered });

  // 2. API call
  try {
    await reorderTodos(reordered.map(t => t.id));
    // 3. Success: no-op (state already correct)
  } catch {
    // 4. Rollback on error
    dispatch({ type: 'REORDER_ROLLBACK', payload: previousTodos });
    showToast('Something went wrong');
  }
};
```

### `reorderTodos` API Function
```typescript
// frontend/src/api/todos.ts
export async function reorderTodos(ids: string[]): Promise<void> {
  const res = await fetch(`${API_BASE}/api/todos/reorder`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids }),
  });
  if (!res.ok) throw new Error(`Reorder failed: ${res.status}`);
  // 204 No Content — no body to parse
}
```

### Backend `PUT /api/todos/reorder` Verification
The backend route (Story 1.4) must:
1. Accept `{ ids: string[] }` body
2. In a transaction: `UPDATE todos SET "order" = ? WHERE id = ?` for each id at its index
3. Return `204` No Content
4. After this, `GET /api/todos` returns todos sorted by the new `"order"` values (ascending)

SQLite persistence means the order survives container restart (data in named volume `backend_data`).

### `PointerSensor` and FR18 Compliance
FR18 requires: "Drag-and-drop reordering is initiated via pointer device (mouse or touch pointer events) only."

@dnd-kit's `PointerSensor` handles both mouse and touch pointer events (using the `PointerEvents` API). The `KeyboardSensor` is an accessibility feature that allows keyboard users to reorder — it doesn't violate FR18 as it's optional accessibility augmentation, not a primary interaction mode.

### Persistence Verification
The order is stored as an `INTEGER` column in SQLite. Since the backend uses a named Docker volume (`backend_data` mounted at `/data`), the SQLite file at `/data/todos.db` survives container restarts:
```
docker-compose down    # container stops
docker-compose up      # container restarts
GET /api/todos         # returns todos in previously saved order ✓
```

### Project Structure Notes

- `App.tsx` or `TodoList.tsx` updated: add async API call and rollback logic to `handleDragEnd`
- `frontend/src/api/todos.ts`: `reorderTodos` function (verify exists from Story 2.1)
- No new component files required for this story

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#REST Endpoint Structure] — `PUT /api/todos/reorder` spec
- [Source: _bmad-output/planning-artifacts/architecture.md#Optimistic Mutation Pattern] — ARCH-6 reorder pattern
- [Source: _bmad-output/planning-artifacts/architecture.md#Order Field — Integer Bulk Update (ARCH-3)] — ARCH-3
- [Source: _bmad-output/planning-artifacts/epics.md#Story 5.2] — acceptance criteria source
- FR16 (manual reordering), FR17 (persisted order), FR18 (pointer-only), NFR3 (60fps)
- ARCH-3, ARCH-6

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

No issues encountered. All verification tasks confirmed pre-existing implementations were correct.

### Completion Notes List

- Updated `handleDragEnd` in `TodoList.tsx`: added `previousTodos` snapshot, async API call via `reorderTodos()`, and rollback + toast on error
- Verified `reorderTodos` in `frontend/src/api/todos.ts`: correctly calls `PUT /api/todos/reorder` with `{ ids }` body, handles 204 No Content
- Verified backend `PUT /api/todos/reorder`: assigns `order = index` in a transaction for each id, returns 204, persists in SQLite
- Verified `PointerSensor` is primary sensor with `activationConstraint: { distance: 8 }`, `KeyboardSensor` for accessibility
- All 108 frontend tests passing, no regressions

### File List

- frontend/src/components/TodoList.tsx (modified — added async API call with rollback to handleDragEnd)
- frontend/src/components/TodoList.test.tsx (modified — updated reorderTodos mock)
