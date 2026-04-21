# Story 5.1: Drag Handle Component and DnD Wiring

Status: ready-for-dev

## Story

As a user,
I want to press and hold the drag handle on a todo row to initiate a drag,
So that I have an explicit, unambiguous affordance for reordering that doesn't conflict with clicking to edit.

## Acceptance Criteria

1. **Given** a todo row renders  
   **When** in the default state  
   **Then** a `DragHandle` (≡ icon) is visible at the left edge of the row at `opacity-0`  
   **And** on row hover it becomes `opacity-100` via `motion-safe:transition-opacity group-hover:opacity-100`  
   **And** on touch devices it is visible at reduced opacity (not fully hidden)  
   **And** the touch target is `w-11 h-full flex items-center justify-center` (≥44×44px)

2. **Given** the app uses @dnd-kit  
   **When** the todo list renders  
   **Then** the list is wrapped in a `DndContext` and `SortableContext` (from @dnd-kit/sortable)  
   **And** each `TodoItem` uses the `useSortable` hook  
   **And** the `DragHandle` element is set as the drag activator — drag initiates only from the handle, not the full row

3. **Given** a user presses and holds the `DragHandle`  
   **When** the pointer moves  
   **Then** the dragged row lifts with `shadow-md opacity-75 bg-white`  
   **And** other rows shift to indicate the drop target position  
   **And** the interaction renders at 60fps with no visible frame drops (NFR3)

4. **Given** the `DragHandle`  
   **When** inspected for accessibility  
   **Then** it has `aria-label="Drag to reorder"`  
   **And** @dnd-kit's keyboard sensor is active, enabling keyboard-based reordering

## Tasks / Subtasks

- [ ] Task 1: Create `DragHandle.tsx` component (AC: 1, 4)
  - [ ] Element: `<button type="button">` with `aria-label="Drag to reorder"`
  - [ ] Touch target: `w-11 h-full flex items-center justify-center flex-shrink-0`
  - [ ] Progressive disclosure: `opacity-0 group-hover:opacity-100 motion-safe:transition-opacity`
  - [ ] Touch device override: visible at reduced opacity (not fully hidden) — `[@media(pointer:coarse)]:opacity-40`
  - [ ] Icon: horizontal lines (≡) SVG or Heroicon `Bars3Icon`
  - [ ] Color: `text-neutral-400`
  - [ ] The button will receive `{...listeners}` from `useSortable` spread — see wiring step

- [ ] Task 2: Wire `DndContext` and `SortableContext` around the todo list (AC: 2)
  - [ ] In `App.tsx` or a `TodoList.tsx` component, import `DndContext`, `SortableContext`, `PointerSensor`, `KeyboardSensor`, `useSensor`, `useSensors` from `@dnd-kit/core`
  - [ ] Import `sortableKeyboardCoordinates`, `verticalListSortingStrategy` from `@dnd-kit/sortable`
  - [ ] Configure sensors: `PointerSensor` (primary, FR18 — pointer only for DnD initiation) + `KeyboardSensor` (accessibility, AC: 4)
  - [ ] Wrap the list with `<DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>`
  - [ ] Wrap items with `<SortableContext items={todos.map(t => t.id)} strategy={verticalListSortingStrategy}>`

- [ ] Task 3: Wire `useSortable` in `TodoItem.tsx` (AC: 2, 3)
  - [ ] Import `useSortable` from `@dnd-kit/sortable`
  - [ ] Call `useSortable({ id: todo.id })` — destructure `{ attributes, listeners, setNodeRef, transform, transition, isDragging }`
  - [ ] Apply `ref={setNodeRef}`, `style={{ transform: CSS.Transform.toString(transform), transition }}` to the root `<div>` of `TodoItem`
  - [ ] Apply `{...attributes}` to the root element
  - [ ] Pass `listeners` down to `DragHandle` — the handle spreads them: `<button {...listeners}>`
  - [ ] When `isDragging`: apply `shadow-md opacity-75 bg-white` to the row (AC: 3)
  - [ ] **IMPORTANT**: Do NOT spread `listeners` onto the entire `TodoItem` row — only the `DragHandle` button activates drag initiation

- [ ] Task 4: Implement `handleDragEnd` (optimistic reorder, no persist yet — Story 5.2 persists) (AC: 2)
  - [ ] In `handleDragEnd({ active, over })`:
    - If `!over || active.id === over.id`: return (dropped in place)
    - Find `oldIndex` and `newIndex` in `todos` by id
    - Use `arrayMove` from `@dnd-kit/sortable` to compute new order
    - Dispatch `REORDER_OPTIMISTIC` with reordered array
    - (Persistence call is added in Story 5.2)

- [ ] Task 5: Configure `PointerSensor` with activation constraints (AC: 2, FR18)
  - [ ] Use `PointerSensor` with `activationConstraint: { distance: 8 }` to prevent accidental drag on click
  - [ ] This ensures inline edit clicks and checkbox clicks don't trigger drag

## Dev Notes

### @dnd-kit Installation
Already installed in Story 1.1: `@dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities`

### DndContext + SortableContext Setup
```tsx
import { DndContext, PointerSensor, KeyboardSensor, useSensor, useSensors, closestCenter } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';

function TodoList({ todos }: { todos: Todo[] }) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 }, // prevents accidental drag on click
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const oldIndex = todos.findIndex(t => t.id === active.id);
    const newIndex = todos.findIndex(t => t.id === over.id);
    const reordered = arrayMove(todos, oldIndex, newIndex);
    dispatch({ type: 'REORDER_OPTIMISTIC', payload: reordered });
    // API call added in Story 5.2
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={todos.map(t => t.id)} strategy={verticalListSortingStrategy}>
        <ul className="divide-y divide-neutral-100">
          {todos.map(todo => <TodoItem key={todo.id} todo={todo} />)}
        </ul>
      </SortableContext>
    </DndContext>
  );
}
```

### `useSortable` in `TodoItem`
```tsx
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function TodoItem({ todo }: { todo: Todo }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: todo.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={cn(
        'flex items-center gap-3 py-3 group bg-white',
        isDragging ? 'shadow-md opacity-75' : ''
      )}
    >
      <DragHandle listeners={listeners} />
      {/* Checkbox, title, tags, delete button */}
    </div>
  );
}
```

### DragHandle Must Receive `listeners` — NOT the Full Row
If `{...listeners}` is spread on the entire `TodoItem` div, then clicking anywhere on the row (title, checkbox, delete button) could initiate a drag. The `listeners` MUST only be on the `DragHandle` button. The `activationConstraint: { distance: 8 }` helps, but isolating to the handle is architecturally required.

### 60fps Requirement (NFR3)
@dnd-kit uses CSS transforms for positioning during drag — no layout recalculations. Ensure:
- No expensive computations in `onDragMove`
- `transform: CSS.Transform.toString(transform)` applied via `style` prop (not class)
- No `height` or `margin` transitions during drag (only `transform` and `opacity`)

### Keyboard Accessibility (UX-DR5, AC: 4)
The `KeyboardSensor` from @dnd-kit enables Space/Enter to pick up, arrow keys to move, Enter/Space/Escape to drop/cancel. This requires `sortableKeyboardCoordinates` as the coordinate getter.

### Project Structure Notes

- `frontend/src/components/DragHandle.tsx` (no test file required — tested via integration in TodoItem)
- `TodoItem.tsx` updated: import `useSortable`, apply ref/style/attributes, pass `listeners` to `DragHandle`
- `App.tsx` or new `TodoList.tsx` updated: wrap list with `DndContext` + `SortableContext`

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Tech Stack] — @dnd-kit/core + @dnd-kit/sortable
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md] — UX-DR5 (drag handle), UX-DR6 (progressive disclosure on handle)
- [Source: _bmad-output/planning-artifacts/epics.md#Story 5.1] — acceptance criteria source
- FR16 (drag-and-drop reordering), FR18 (pointer-only DnD), NFR3 (60fps)
- ARCH-3 (order persistence), UX-DR5, UX-DR6, UX-DR15

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.6

### Debug Log References

### Completion Notes List

### File List
