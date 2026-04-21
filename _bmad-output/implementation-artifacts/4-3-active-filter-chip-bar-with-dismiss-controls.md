# Story 4.3: Active Filter Chip Bar with Dismiss Controls

Status: ready-for-dev

## Story

As a user,
I want to always see which filters are currently active as dismissible chips above the list,
So that I know exactly what lens I'm looking through and can remove any filter instantly.

## Acceptance Criteria

1. **Given** no filters are active  
   **When** the list renders  
   **Then** the `FilterChipBar` is not rendered — no empty bar is shown

2. **Given** one or more filters are active (status or tag)  
   **When** the `FilterChipBar` renders  
   **Then** it appears above the todo list with `motion-safe:animate-in fade-in`  
   **And** each active filter is shown as a `FilterActiveChip`: `bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200`  
   **And** each chip has a × dismiss button with `aria-label="Remove filter [filter name]"`  
   **And** a "Clear all" text link resets all active filters

3. **Given** the user clicks × on an individual `FilterActiveChip`  
   **When** the dismiss fires  
   **Then** that filter is removed from the URL query params  
   **And** the list immediately reflects the updated filter state  
   **And** if no filters remain, the `FilterChipBar` disappears

4. **Given** an active filter chip communicates its active state  
   **When** rendered  
   **Then** the state is communicated via both `bg-indigo-50 text-indigo-700` colour change AND `font-semibold` weight change — not colour alone

## Tasks / Subtasks

- [ ] Task 1: Create `FilterActiveChip.tsx` component (AC: 2, 3, 4)
  - [ ] Props: `label: string`, `onRemove: () => void`
  - [ ] Styling: `bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200 font-semibold rounded-full px-2 py-0.5 text-xs inline-flex items-center gap-1`
  - [ ] Dismiss button inside: `<button type="button" aria-label={`Remove filter ${label}`}>×</button>`
  - [ ] Focus ring on dismiss button: `focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2`
  - [ ] Touch target: ensure ≥44px on the dismiss button

- [ ] Task 2: Create `FilterChipBar.tsx` component (AC: 1, 2, 3)
  - [ ] Use `useSearchParams()` to read `status` and `tags` URL params
  - [ ] Derive `activeFilters: Array<{ label: string, onRemove: () => void }>`:
    - If `status` is `'active'` or `'completed'`: add filter chip `{ label: 'Active' | 'Completed', onRemove: () => remove status param }`
    - For each tag in parsed `tags` param: add `{ label: tag, onRemove: () => remove that tag from param }`
  - [ ] If `activeFilters.length === 0`: return `null` (not rendered — AC: 1)
  - [ ] Render: `<div className="flex flex-wrap gap-2 items-center mb-3 motion-safe:animate-in motion-safe:fade-in">` with `FilterActiveChip` per filter + "Clear all" button
  - [ ] "Clear all" button: clears all URL query params: `setSearchParams({})` or `setSearchParams(new URLSearchParams())`

- [ ] Task 3: Wire `FilterChipBar` in `App.tsx` (AC: 2)
  - [ ] Render `<FilterChipBar />` between `StatusFilterBar` and the todo list
  - [ ] `FilterChipBar` handles its own visibility (`null` when no active filters)

- [ ] Task 4: Write `FilterChipBar.test.tsx` tests (AC: 1, 2, 3)
  - [ ] Test: renders `null` when no `status` or `tags` params
  - [ ] Test: renders status chip when `?status=active`
  - [ ] Test: renders tag chips when `?tags=work,personal`
  - [ ] Test: clicking × on status chip removes `status` from params
  - [ ] Test: clicking × on tag chip removes that tag from `tags` param
  - [ ] Test: "Clear all" removes all params
  - [ ] Use `MemoryRouter` with initial entries for URL state in tests

## Dev Notes

### `FilterChipBar` — Derive Active Filters from URL
```typescript
// FilterChipBar.tsx
const [searchParams, setSearchParams] = useSearchParams();

const status = searchParams.get('status');
const activeTags = (searchParams.get('tags') ?? '').split(',').filter(Boolean);

const activeFilters: Array<{ label: string; onRemove: () => void }> = [];

if (status === 'active' || status === 'completed') {
  activeFilters.push({
    label: status === 'active' ? 'Active' : 'Completed',
    onRemove: () => setSearchParams(prev => { prev.delete('status'); return prev; }),
  });
}

for (const tag of activeTags) {
  activeFilters.push({
    label: tag,
    onRemove: () => setSearchParams(prev => {
      const remaining = activeTags.filter(t => t !== tag);
      if (remaining.length === 0) prev.delete('tags');
      else prev.set('tags', remaining.join(','));
      return prev;
    }),
  });
}

if (activeFilters.length === 0) return null;
```

### `FilterActiveChip` — Colour AND Weight for Active State (UX-DR16)
The chip always uses active styling (it only renders when a filter IS active):
```tsx
<span className="bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200 font-semibold rounded-full px-2 py-0.5 text-xs inline-flex items-center gap-1">
  {label}
  <button
    type="button"
    aria-label={`Remove filter ${label}`}
    onClick={onRemove}
    className="p-1 -mr-1 hover:text-indigo-900 focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-full"
  >
    <span aria-hidden="true">×</span>
  </button>
</span>
```
`font-semibold` is the weight change component (UX-DR16 requires both colour AND weight).

### Entry Animation (UX-DR7)
The `FilterChipBar` wrapper uses `motion-safe:animate-in motion-safe:fade-in` from `tailwindcss-animate`:
```html
<div class="... motion-safe:animate-in motion-safe:fade-in">
```
This respects the user's `prefers-reduced-motion` setting (UX-DR15).

### "Clear all" Button
```tsx
<button
  type="button"
  onClick={() => setSearchParams(new URLSearchParams())}
  className="text-xs text-indigo-600 hover:text-indigo-800 underline focus-visible:ring-2 focus-visible:ring-indigo-500 rounded"
>
  Clear all
</button>
```

### FilterChipBar vs StatusFilterBar Coordination
Both `FilterChipBar` and `StatusFilterBar` use the same URL params. When `FilterChipBar` removes the `status` filter, `StatusFilterBar` automatically re-renders with "All" as active (reads from same `searchParams`). No explicit communication needed — React Router's `useSearchParams` is the single source of truth.

### Project Structure Notes

- `frontend/src/components/FilterActiveChip.tsx` (no test file for simple presentational component — test via `FilterChipBar.test.tsx`)
- `frontend/src/components/FilterChipBar.tsx` + `FilterChipBar.test.tsx`
- `App.tsx` updated to render `<FilterChipBar />`
- `tailwindcss-animate` required for `animate-in fade-in` (installed in Story 2.5)

### References

- [Source: _bmad-output/planning-artifacts/ux-design-specification.md] — UX-DR7 (FilterChipBar), UX-DR16 (colour + weight)
- [Source: _bmad-output/planning-artifacts/architecture.md#Filter State — URL Query Params (ARCH-4)] — ARCH-4
- [Source: _bmad-output/planning-artifacts/epics.md#Story 4.3] — acceptance criteria source
- FR12 (filter by tag), FR14 (combined filters), ARCH-4, UX-DR7, UX-DR15, UX-DR16

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.6

### Debug Log References

### Completion Notes List

### File List
