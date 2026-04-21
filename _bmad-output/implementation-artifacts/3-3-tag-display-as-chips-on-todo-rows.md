# Story 3.3: Tag Display as Chips on Todo Rows

Status: ready-for-dev

## Story

As a user,
I want to see the tags on each todo displayed as small chips inline on the row,
So that I can quickly see how a task is categorized without opening any detail view.

## Acceptance Criteria

1. **Given** a todo has one or more tags  
   **When** the todo row renders  
   **Then** each tag is displayed as a `TagChip` — `rounded-full px-2 py-0.5 text-xs font-medium bg-neutral-100 text-neutral-600` — after the title text

2. **Given** a todo has no tags  
   **When** the todo row renders  
   **Then** no chip area is shown — the row layout is unchanged

3. **Given** a `TagChip` renders  
   **When** inspected for accessibility  
   **Then** the chip is keyboard-focusable with `focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2` ring

## Tasks / Subtasks

- [ ] Task 1: Create `TagChip.tsx` component (AC: 1, 3)
  - [ ] Props: `tag: string`, `onClick?: () => void`, `active?: boolean`
  - [ ] Root element: `<button type="button">` (clickable for filter activation in Story 4.2)
  - [ ] Default styling (inactive): `rounded-full px-2 py-0.5 text-xs font-medium bg-neutral-100 text-neutral-600`
  - [ ] Active styling (Story 4.2): `bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200 font-semibold` (prepare but don't wire filter yet)
  - [ ] Focus ring: `focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2`
  - [ ] Accessible: `aria-label={tag}` or `aria-pressed={active}` when `onClick` provided

- [ ] Task 2: Wire `TagChip` into `TodoItem.tsx` (AC: 1, 2)
  - [ ] After the title span, render a `<div className="flex flex-wrap gap-1 items-center">` containing `TagChip` for each tag
  - [ ] Map over `todo.tags` — render a `TagChip` per tag
  - [ ] If `todo.tags.length === 0` render nothing (no empty container left behind)
  - [ ] `onClick` on each chip: pass a no-op for now (will be wired in Story 4.2 for filter activation)

- [ ] Task 3: Write `TagChip.test.tsx` co-located tests (AC: 1, 2, 3)
  - [ ] Test: renders the tag text
  - [ ] Test: has correct default styling classes
  - [ ] Test: `onClick` called on click
  - [ ] Test: focus-visible ring classes present
  - [ ] Test: active styling classes applied when `active={true}`

## Dev Notes

### `TagChip` Component (UX-DR8 preparation)
```tsx
import { cn } from '../utils/cn';

interface TagChipProps {
  tag: string;
  onClick?: () => void;
  active?: boolean;
}

export function TagChip({ tag, onClick, active = false }: TagChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={tag}
      className={cn(
        'rounded-full px-2 py-0.5 text-xs font-medium',
        'focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2',
        active
          ? 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200 font-semibold'
          : 'bg-neutral-100 text-neutral-600',
      )}
    >
      {tag}
    </button>
  );
}
```

### UX-DR16: Active State Communicates via Both Colour AND Weight
Per accessibility requirements, the active state uses BOTH `bg-indigo-50 text-indigo-700` (colour) AND `font-semibold` (weight change). Not colour alone. This ensures colour-blind users can distinguish active filter chips.

### Tag Chips in `TodoItem` Row Layout
```tsx
{/* In TodoItem.tsx, after title span */}
{todo.tags.length > 0 && (
  <div className="flex flex-wrap gap-1 items-center">
    {todo.tags.map(tag => (
      <TagChip
        key={tag}
        tag={tag}
        onClick={() => {/* wired in Story 4.2 */}}
      />
    ))}
  </div>
)}
```

### Touch Target for TagChip (UX-DR13)
The `TagChip` is `rounded-full px-2 py-0.5` which may be smaller than 44×44px. Per UX-DR13, all interactive elements must meet ≥44×44px. Options:
1. Wrap in a larger hit area with padding: `p-2` on the button, inner span for visual sizing
2. Accept the smaller visual size but ensure the `min-h-[44px]` or hit area padding is applied

Recommended: add `min-w-[44px] min-h-[44px] flex items-center justify-center` to the chip button, with the visual chip styling on an inner `<span>`. This keeps visual appearance compact while touch target is large.

### Single Responsibility
`TagChip` in this story is display-only (tags shown, no filter wiring). Story 4.2 adds the filter activation `onClick` handler. Keep the component's `onClick` prop flexible but don't pass filter logic here.

### Project Structure Notes

- `frontend/src/components/TagChip.tsx` + `TagChip.test.tsx`
- `TodoItem.tsx` updated to render `TagChip` per each item in `todo.tags`
- `cn()` from `src/utils/cn.ts` for conditional class composition

### References

- [Source: _bmad-output/planning-artifacts/ux-design-specification.md] — UX-DR8 (tag chip filter activation), UX-DR13 (touch targets), UX-DR16 (active state colour + weight)
- [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Component Organization] — `TagChip.tsx` location
- [Source: _bmad-output/planning-artifacts/epics.md#Story 3.3] — acceptance criteria source
- FR8 (assign tags), FR10 (multiple tags per todo), ARCH-15 (cn()), UX-DR13, UX-DR16

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.6

### Debug Log References

### Completion Notes List

### File List
