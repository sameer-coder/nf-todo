# Story 4.2: Tag Filter — Click Chip to Filter

Status: ready-for-dev

## Story

As a user,
I want to click a tag chip on any todo row to filter the list to todos with that tag,
So that I can instantly focus on a specific category of tasks.

## Acceptance Criteria

1. **Given** a `TagChip` is displayed on a todo row  
   **When** the user clicks it  
   **Then** the tag is added to the active tag filter in the URL: `?tags=work`  
   **And** the chip on the todo row transitions to active styling: `bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200`  
   **And** the list updates client-side to show only todos that have the selected tag  
   **And** no API call is made — filtering is applied against `TodoContext` todos

2. **Given** a tag filter is already active and the user clicks a different `TagChip`  
   **When** the second tag is added  
   **Then** the URL updates to `?tags=work,personal`  
   **And** the list shows todos that have **either** "work" **or** "personal" — OR logic (FR13)

3. **Given** the user clicks a `TagChip` that is already an active filter  
   **When** it is clicked again  
   **Then** the tag is removed from the active filter set (toggle behaviour)

## Tasks / Subtasks

- [ ] Task 1: Implement `useTagFilter` hook (or helper in `App.tsx`) for managing `tags` URL param (AC: 1, 2, 3)
  - [ ] Use `useSearchParams()` to read `tags` param: parse as comma-separated string → `string[]`
  - [ ] `addTagFilter(tag)`: add tag to array, write back as comma-separated: `setSearchParams(params => { params.set('tags', [...existing, tag].join(',')); return params; })`
  - [ ] `removeTagFilter(tag)`: filter out tag, if empty array → delete `tags` param
  - [ ] `toggleTagFilter(tag)`: if tag in active tags → remove; else → add
  - [ ] `isTagActive(tag)`: returns `boolean`

- [ ] Task 2: Wire `TagChip.onClick` in `TodoItem.tsx` for filter activation (AC: 1, 3)
  - [ ] Pass `onClick={() => toggleTagFilter(tag)}` to each `TagChip`
  - [ ] Pass `active={isTagActive(tag)}` to each `TagChip`
  - [ ] `TagChip` already supports `active` prop from Story 3.3 — this story wires the actual logic

- [ ] Task 3: Implement client-side tag filter logic in `App.tsx` (AC: 1, 2)
  - [ ] Parse `activeTags: string[]` from `searchParams.get('tags')?.split(',').filter(Boolean) ?? []`
  - [ ] Extend `filteredTodos` derivation (from Story 4.1) to also apply tag filter:
    ```
    If activeTags.length > 0: filter to todos where todo.tags has at least one tag in activeTags (OR logic)
    ```
  - [ ] This composable filter applies BOTH status and tag filters simultaneously (FR14 prep for Story 4.4)

- [ ] Task 4: Update `TagChip.test.tsx` for active-state filter integration (AC: 1, 3)
  - [ ] Test: chip renders with active styling when `active={true}`
  - [ ] Test: chip renders with default styling when `active={false}`
  - [ ] Test: clicking an inactive chip calls `onClick`

## Dev Notes

### Parsing `tags` Query Param
The `tags` URL param stores comma-separated tag names: `?tags=work,personal,shopping`.

```typescript
// In App.tsx or a custom hook
const [searchParams, setSearchParams] = useSearchParams();
const activeTags = (searchParams.get('tags') ?? '').split(',').filter(Boolean);
```

### Toggle Tag Filter
```typescript
function toggleTagFilter(tag: string) {
  setSearchParams(prev => {
    const current = (prev.get('tags') ?? '').split(',').filter(Boolean);
    const updated = current.includes(tag)
      ? current.filter(t => t !== tag)
      : [...current, tag];
    if (updated.length === 0) prev.delete('tags');
    else prev.set('tags', updated.join(','));
    return prev;
  });
}
```

### OR Logic for Tag Filter (FR13)
When multiple tags are active, the filter returns todos that match **any** of the selected tags:
```typescript
const tagFiltered = activeTags.length > 0
  ? todos.filter(todo => todo.tags.some(t => activeTags.includes(t)))
  : todos;
```

### Active Chip Styling (UX-DR8, UX-DR16)
```tsx
// In TagChip.tsx (already supports `active` prop from Story 3.3)
active
  ? 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200 font-semibold'  // active filter
  : 'bg-neutral-100 text-neutral-600'                                     // default
```
Per UX-DR16: active state communicates via BOTH colour (`bg-indigo-50 text-indigo-700`) AND weight (`font-semibold`). Never colour alone.

### Passing `toggleTagFilter` and `isTagActive` to `TodoItem`
Options:
1. Pass as props from `App.tsx` down through the list → `TodoItem`
2. Create a custom hook `useTagFilter()` that reads/writes `searchParams` and expose it directly from `TodoItem`

Option 2 is cleaner (no prop drilling). `TodoItem` calls `useTagFilter()` directly:
```typescript
// TodoItem.tsx
const { toggleTagFilter, isTagActive } = useTagFilter();
```
`useTagFilter` uses `useSearchParams()` internally — works in any component inside `<BrowserRouter>`.

### Project Structure Notes

- `frontend/src/hooks/useTagFilter.ts` (or inline in App.tsx if simpler)
- `TagChip.tsx` updated: wire `onClick` to `toggleTagFilter`, `active` to `isTagActive`
- `App.tsx` updated: extend `filteredTodos` to include OR tag filter
- ARCH-4: filter state in URL query params — never `useState`

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Filter State — URL Query Params (ARCH-4)] — ARCH-4
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md] — UX-DR8 (tag chip activates filter), UX-DR16 (colour + weight active state)
- [Source: _bmad-output/planning-artifacts/epics.md#Story 4.2] — acceptance criteria source
- FR12 (filter by tag), FR13 (OR logic multi-tag), ARCH-4, UX-DR8, UX-DR16

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.6

### Debug Log References

### Completion Notes List

### File List
