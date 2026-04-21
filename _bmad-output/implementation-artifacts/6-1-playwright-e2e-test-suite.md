# Story 6.1: Playwright E2E Test Suite (≥5 Tests)

Status: ready-for-dev

## Story

As a developer,
I want a Playwright E2E test suite with at least 5 tests covering the primary user flows,
So that CI can verify the full user experience end-to-end before any merge to main.

## Acceptance Criteria

1. **Given** the Playwright test suite in `frontend/e2e/todos.spec.ts`  
   **When** all tests run against a live `docker-compose up --build` environment  
   **Then** the following 5 tests (minimum) exist and pass:
   1. **Create todo** — user types a title, presses Enter, item appears in the list
   2. **Complete todo** — user clicks the checkbox, item shows strikethrough and completed styling
   3. **Delete todo** — user hovers a row, clicks the delete icon, item is removed from the list
   4. **Reorder todos** — user drags a todo to a new position; after page refresh the new order is maintained
   5. **Filter by status** — user clicks "Active", completed todos are hidden; user clicks "All", they reappear

2. **Given** a test runs  
   **When** an API call is part of the flow  
   **Then** the test waits for the network request to settle before asserting (no arbitrary timeouts)

3. **Given** the E2E tests run in CI  
   **When** the `e2e` GitHub Actions job executes  
   **Then** all tests pass without flakiness on the first run  
   **And** a failing test causes the CI job to fail and blocks merge (NFR8)

4. **Given** the Playwright configuration (`playwright.config.ts`)  
   **When** inspected  
   **Then** it targets `http://localhost:3000` (the nginx frontend container)  
   **And** it is configured to run in CI headless mode

## Tasks / Subtasks

- [ ] Task 1: Complete `frontend/playwright.config.ts` (AC: 4)
  - [ ] Set `testDir: './e2e'`
  - [ ] Set `use.baseURL: 'http://localhost:3000'`
  - [ ] Set `use.headless: true`
  - [ ] Set `reporter: [['html', { open: 'never' }], ['list']]`
  - [ ] No `webServer` entry — CI uses `docker-compose up` to start services

- [ ] Task 2: Implement Test 1 — Create todo (AC: 1.1)
  - [ ] Navigate to `/`
  - [ ] Wait for page to be ready (ADD input visible)
  - [ ] Type a unique title (e.g., `"Buy groceries"`) in the add-todo input
  - [ ] Press Enter
  - [ ] `await page.waitForResponse(res => res.url().includes('/api/todos') && res.request().method() === 'POST')`
  - [ ] Assert: `page.getByText('Buy groceries')` is visible

- [ ] Task 3: Implement Test 2 — Complete todo (AC: 1.2)
  - [ ] Create a todo via API directly (`page.evaluate` or `request.post`) for isolation
  - [ ] Or: create via UI and wait for POST to settle
  - [ ] Click the checkbox button on the todo
  - [ ] `await page.waitForResponse(...)` for the PUT request
  - [ ] Assert: title has `line-through` text decoration (or check `aria-checked="true"`)

- [ ] Task 4: Implement Test 3 — Delete todo (AC: 1.3)
  - [ ] Create a todo with a unique title
  - [ ] Hover over the todo row to reveal the delete button
  - [ ] Click the delete button (`aria-label="Delete todo"`)
  - [ ] `await page.waitForResponse(...)` for the DELETE request
  - [ ] Assert: `page.getByText(unique title)` is hidden / not in DOM

- [ ] Task 5: Implement Test 4 — Reorder and persist (AC: 1.4)
  - [ ] Create two todos (A and B) in order A→B via API or UI
  - [ ] Locate `DragHandle` for todo A (`aria-label="Drag to reorder"`)
  - [ ] Perform drag using Playwright's `dragTo` helper or a mouse-drag sequence
  - [ ] `await page.waitForResponse(...)` for `PUT /api/todos/reorder`
  - [ ] Reload the page
  - [ ] Assert: the visual order of todos reflects the new order (B appears before A in the DOM)

- [ ] Task 6: Implement Test 5 — Filter by status (AC: 1.5)
  - [ ] Create one active todo and one completed todo (via API or UI + click checkbox)
  - [ ] Click the "Active" filter tab
  - [ ] Assert: completed todo is NOT visible; active todo IS visible
  - [ ] Click the "All" filter tab
  - [ ] Assert: both todos are visible

- [ ] Task 7: Add `fixtures/index.ts` with API helper utilities (AC: 2)
  - [ ] Create `frontend/e2e/fixtures/index.ts` with `createTodo(page, title)` helper
  - [ ] Helper uses `page.request.post('http://localhost:4000/api/todos', ...)` for direct API creation (faster, no UI interaction)
  - [ ] Use helpers in tests for setup (creating seed data) — keeps tests focused on the behaviour being tested

## Dev Notes

### `playwright.config.ts` (Complete)
```typescript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.spec.ts',
  timeout: 30_000,
  retries: 0,
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    baseURL: 'http://localhost:3000',
    headless: true,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
});
```

### Waiting for Network Requests (AC: 2)
Never use `page.waitForTimeout()` — it causes flakiness. Instead:
```typescript
// Wait for specific API response
const responsePromise = page.waitForResponse(
  res => res.url().includes('/api/todos') && res.request().method() === 'POST' && res.ok()
);
await page.keyboard.press('Enter');
await responsePromise;
```
Or use `page.waitForResponse` in parallel with the action:
```typescript
const [response] = await Promise.all([
  page.waitForResponse(res => res.url().includes('/api/todos') && res.status() === 201),
  page.getByPlaceholder('Add a task…').press('Enter'),
]);
```

### Drag Test (Test 4)
@dnd-kit uses pointer events. Playwright supports drag via:
```typescript
// Option 1: Using dragTo
const dragHandle = page.getByRole('button', { name: 'Drag to reorder' }).first();
const targetRow = page.getByTestId('todo-item').nth(1); // target position
await dragHandle.dragTo(targetRow);

// Option 2: Manual mouse drag (more control)
const handleBbox = await dragHandle.boundingBox();
await page.mouse.move(handleBbox!.x + handleBbox!.width / 2, handleBbox!.y + handleBbox!.height / 2);
await page.mouse.down();
await page.mouse.move(/* target coordinates */, { steps: 10 });
await page.mouse.up();
```
The `{ steps: 10 }` parameter creates a smooth movement that @dnd-kit's `PointerSensor` recognizes.

### API Fixture Helper
```typescript
// e2e/fixtures/index.ts
import { APIRequestContext } from '@playwright/test';

export async function createTodo(request: APIRequestContext, title: string, tags: string[] = []) {
  const response = await request.post('http://localhost:4000/api/todos', {
    data: { title, tags },
  });
  return response.json();
}

export async function clearAllTodos(request: APIRequestContext) {
  const todos = await request.get('http://localhost:4000/api/todos');
  const data = await todos.json();
  for (const todo of data) {
    await request.delete(`http://localhost:4000/api/todos/${todo.id}`);
  }
}
```
Use `beforeEach` to clear todos for test isolation.

### Test Isolation
Each test should start with a clean state. Use `beforeEach` with `clearAllTodos` fixture, or use unique enough titles and assertions to avoid cross-test interference.

### 5 Minimum Tests — Consider Adding More
The acceptance criteria requires ≥5 tests. Consider adding:
- Test 6: **Tag filter** — create todo with tags, click tag chip, list filters to matching todos
- Test 7: **Empty state** — clear all todos, assert "No todos yet." is visible
- These are optional for this story but improve confidence in CI

### Running Locally (Pre-CI)
```bash
# Start the app
docker-compose up --build -d

# Install Playwright browsers (first time)
cd frontend && npx playwright install chromium

# Run tests
npm run test:e2e

# View results
npx playwright show-report
```

### Project Structure Notes

- `frontend/playwright.config.ts` — complete config (replacing placeholder from Story 1.5)
- `frontend/e2e/todos.spec.ts` — all ≥5 E2E tests
- `frontend/e2e/fixtures/index.ts` — API helpers for test setup
- Tests run in CI via `e2e` GitHub Actions job (configured in Story 1.5)

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#CI Pipeline — GitHub Actions (ARCH-10)] — E2E job setup
- [Source: _bmad-output/planning-artifacts/epics.md#Story 6.1] — acceptance criteria source
- FR29 (only indirectly), NFR6 (70% coverage), NFR7 (≥5 Playwright tests), NFR8 (CI blocks on failure)
- ARCH-10, ARCH-14

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.6

### Debug Log References

### Completion Notes List

### File List
