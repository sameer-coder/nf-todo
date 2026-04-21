# Story 1.4: Todo REST API Routes with Input Validation

Status: ready-for-dev

## Story

As a developer,
I want all `/api/todos` REST endpoints implemented with Fastify JSON Schema validation and CORS configured,
So that the frontend can perform all todo operations and malformed payloads are rejected before reaching the database.

## Acceptance Criteria

1. **Given** all routes are registered in `backend/src/routes/todos.ts`  
   **When** the backend starts  
   **Then** the following endpoints exist and return correct responses:
   - `GET /api/todos` → `200` array of `Todo[]` sorted by `order`; supports `?tags=` and `?status=` query params for server-side filtering
   - `POST /api/todos` → `201` single `Todo`; body: `{ title: string, tags?: string[] }`
   - `PUT /api/todos/:id` → `200` single `Todo`; body: `{ title: string, completed: boolean, tags: string[] }`
   - `DELETE /api/todos/:id` → `204` No Content
   - `PUT /api/todos/reorder` → `204` No Content; body: `{ ids: string[] }` — assigns `order = index` for each

2. **Given** a `POST /api/todos` request with an empty title (after trim)  
   **When** Fastify validates the schema  
   **Then** a `400 Bad Request` is returned before the handler runs

3. **Given** the `@fastify/cors` plugin is registered  
   **When** the frontend at `http://localhost:3000` makes a cross-origin request  
   **Then** the response includes the correct CORS headers matching `CORS_ORIGIN=http://localhost:3000`

4. **Given** all API JSON responses  
   **When** any todo is returned  
   **Then** all fields use `camelCase` (`createdAt`, `updatedAt`) — never `snake_case`  
   **And** `tags` is always a `string[]` — never null or absent

5. **Given** integration tests run (co-located `todos.test.ts`)  
   **When** Vitest executes them against a test server with in-memory SQLite  
   **Then** all routes are covered, tests pass, and input sanitisation (title trim, tag trim/deduplication/empty-removal) is verified

## Tasks / Subtasks

- [ ] Task 1: Register `@fastify/cors` plugin in `backend/src/plugins/cors.ts` (AC: 3)
  - [ ] Create `cors.ts` as a Fastify plugin
  - [ ] Read `CORS_ORIGIN` from `process.env.CORS_ORIGIN` (default: `'http://localhost:3000'`)
  - [ ] Register `@fastify/cors` with `origin: corsOrigin`
  - [ ] Register the plugin in `server.ts` before routes

- [ ] Task 2: Implement `GET /api/todos` route (AC: 1, 4)
  - [ ] Register Fastify JSON Schema for optional query params `tags` (string) and `status` (enum: `'all'|'active'|'completed'`)
  - [ ] Call `repo.getAll()` — returns `Todo[]` sorted by `order`
  - [ ] If `status=active`, filter: `todo.completed === false`
  - [ ] If `status=completed`, filter: `todo.completed === true`
  - [ ] If `tags` query param present, parse as comma-separated list, filter: todos where `todo.tags` includes at least one of the requested tags (OR logic)
  - [ ] Return `200` with `Todo[]`

- [ ] Task 3: Implement `POST /api/todos` route (AC: 1, 2, 4)
  - [ ] Register Fastify JSON Schema: `{ body: { type: 'object', required: ['title'], properties: { title: { type: 'string', minLength: 1 }, tags: { type: 'array', items: { type: 'string' } } } } }`
  - [ ] Sanitise input: trim `title` (reject 400 if empty after trim), trim each tag, deduplicate tags, remove empty tag strings
  - [ ] Call `repo.create({ title, tags })` and return `201` with the new `Todo`

- [ ] Task 4: Implement `PUT /api/todos/:id` route (AC: 1, 4)
  - [ ] Register Fastify JSON Schema: `{ body: { type: 'object', required: ['title', 'completed', 'tags'], properties: { title: { type: 'string', minLength: 1 }, completed: { type: 'boolean' }, tags: { type: 'array', items: { type: 'string' } } } } }`
  - [ ] Sanitise: trim `title` (400 if empty after trim), trim each tag, deduplicate, remove empty tags
  - [ ] Call `repo.update(id, body)` — returns `404` if `undefined`
  - [ ] Return `200` with updated `Todo`

- [ ] Task 5: Implement `DELETE /api/todos/:id` route (AC: 1)
  - [ ] Call `repo.getById(id)` — return `404` if not found
  - [ ] Call `repo.delete(id)`
  - [ ] Return `204` No Content

- [ ] Task 6: Implement `PUT /api/todos/reorder` route (AC: 1)
  - [ ] **IMPORTANT**: Register this route BEFORE `PUT /api/todos/:id` to avoid Fastify matching `/reorder` as `:id`
  - [ ] Register Fastify JSON Schema: `{ body: { type: 'object', required: ['ids'], properties: { ids: { type: 'array', items: { type: 'string' }, minItems: 0 } } } }`
  - [ ] Call `repo.reorder(body.ids)`
  - [ ] Return `204` No Content

- [ ] Task 7: Write integration tests in `backend/src/routes/todos.test.ts` (AC: 5)
  - [ ] Use `buildServer({ repo })` with an in-memory `SqliteTodoRepository` (run `runMigrations` in `beforeEach`)
  - [ ] Test `GET /api/todos`: returns sorted array, empty array when no todos
  - [ ] Test `GET /api/todos?status=active`: filters correctly
  - [ ] Test `GET /api/todos?status=completed`: filters correctly
  - [ ] Test `GET /api/todos?tags=work`: returns todos with that tag
  - [ ] Test `POST /api/todos`: 201 with correct Todo, tags parsed/stored
  - [ ] Test `POST /api/todos` with empty title: 400
  - [ ] Test `POST /api/todos` with whitespace-only title: 400 (after trim)
  - [ ] Test `PUT /api/todos/:id`: 200 updated Todo, tags replaced
  - [ ] Test `DELETE /api/todos/:id`: 204 and row removed
  - [ ] Test `PUT /api/todos/reorder`: 204 and subsequent `GET` reflects new order
  - [ ] Verify `tags` is always `string[]` in responses (never null)

## Dev Notes

### Fastify Route Registration Order for `/reorder`
Fastify matches routes in registration order. `PUT /api/todos/reorder` MUST be registered before `PUT /api/todos/:id`, otherwise Fastify will treat `"reorder"` as the `:id` parameter.

```typescript
// todos.ts — register in this order:
fastify.put('/api/todos/reorder', reorderSchema, reorderHandler);
fastify.put('/api/todos/:id', updateSchema, updateHandler);
```

### Input Sanitisation Logic (Required by ARCH-8)
Apply to all string inputs **before** passing to repository:
```typescript
function sanitiseTitle(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) throw fastify.httpErrors.badRequest('Title cannot be empty');
  return trimmed;
}

function sanitiseTags(raw: string[] = []): string[] {
  return [...new Set(raw.map(t => t.trim()).filter(t => t.length > 0))];
}
```

### camelCase ↔ snake_case Mapping
The database uses `snake_case` column names (`created_at`, `updated_at`). The repository maps these to `camelCase` for API responses. Verify this mapping exists in `SqliteTodoRepository`; never expose `snake_case` fields in JSON responses.

### Error Response Shape (Fastify Default)
Fastify automatically returns:
```json
{ "statusCode": 400, "error": "Bad Request", "message": "body/title must NOT have fewer than 1 characters" }
```
Do NOT create a custom error body unless absolutely necessary — use Fastify's built-in error handling.

### CORS Plugin Registration
```typescript
// backend/src/plugins/cors.ts
import fp from 'fastify-plugin';
import cors from '@fastify/cors';

export default fp(async (fastify) => {
  await fastify.register(cors, {
    origin: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
  });
});
```
Register in `server.ts` via `fastify.register(corsPlugin)` BEFORE route registration.

### Integration Test Pattern
```typescript
// todos.test.ts
import { describe, it, beforeEach, expect } from 'vitest';
import Database from 'better-sqlite3';
import { buildServer } from '../server';
import { SqliteTodoRepository } from '../repository/SqliteTodoRepository';
import { runMigrations } from '../db/migrate';

describe('todos routes', () => {
  let app: ReturnType<typeof buildServer>;
  
  beforeEach(async () => {
    const db = new Database(':memory:');
    runMigrations(db);
    const repo = new SqliteTodoRepository(db);
    app = buildServer({ repo });
    await app.ready();
  });

  it('GET /api/todos returns empty array initially', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/todos' });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual([]);
  });
});
```

### Project Structure Notes

- All routes in `backend/src/routes/todos.ts` — one file per resource (ARCH pattern)
- Route file exports a Fastify plugin function registered in `server.ts`
- CORS plugin in `backend/src/plugins/cors.ts`
- Integration test co-located at `backend/src/routes/todos.test.ts` (ARCH-14)
- Repository injected into routes via Fastify decoration — never instantiated inside a route handler (ARCH boundary rule)

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#REST Endpoint Structure] — full endpoint table
- [Source: _bmad-output/planning-artifacts/architecture.md#Security — Input Validation] — ARCH-8 sanitisation rules
- [Source: _bmad-output/planning-artifacts/architecture.md#Security — CORS] — ARCH-9
- [Source: _bmad-output/planning-artifacts/architecture.md#API Response Formats] — response shape specs
- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.4] — acceptance criteria source
- FR25 (REST API), NFR4 (input validation), NFR1 (≤300ms responses)
- ARCH-7 (API patterns), ARCH-8 (input validation), ARCH-9 (CORS), ARCH-17 (API response shape)

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.6

### Debug Log References

### Completion Notes List

### File List
