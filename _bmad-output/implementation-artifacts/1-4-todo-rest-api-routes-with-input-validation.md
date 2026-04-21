# Story 1.4: Todo REST API Routes with Input Validation

Status: done

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

- [x] Task 1: Register `@fastify/cors` plugin in `backend/src/plugins/cors.ts` (AC: 3)
  - [x] Create `cors.ts` as a Fastify plugin
  - [x] Read `CORS_ORIGIN` from `process.env.CORS_ORIGIN` (default: `'http://localhost:3000'`)
  - [x] Register `@fastify/cors` with `origin: corsOrigin`
  - [x] Register the plugin in `server.ts` before routes

- [x] Task 2: Implement `GET /api/todos` route (AC: 1, 4)
  - [x] Register Fastify JSON Schema for optional query params `tags` (string) and `status` (enum: `'all'|'active'|'completed'`)
  - [x] Call `repo.getAll()` — returns `Todo[]` sorted by `order`
  - [x] If `status=active`, filter: `todo.completed === false`
  - [x] If `status=completed`, filter: `todo.completed === true`
  - [x] If `tags` query param present, parse as comma-separated list, filter: todos where `todo.tags` includes at least one of the requested tags (OR logic)
  - [x] Return `200` with `Todo[]`

- [x] Task 3: Implement `POST /api/todos` route (AC: 1, 2, 4)
  - [x] Register Fastify JSON Schema: `{ body: { type: 'object', required: ['title'], properties: { title: { type: 'string', minLength: 1 }, tags: { type: 'array', items: { type: 'string' } } } } }`
  - [x] Sanitise input: trim `title` (reject 400 if empty after trim), trim each tag, deduplicate tags, remove empty tag strings
  - [x] Call `repo.create({ title, tags })` and return `201` with the new `Todo`

- [x] Task 4: Implement `PUT /api/todos/:id` route (AC: 1, 4)
  - [x] Register Fastify JSON Schema: `{ body: { type: 'object', required: ['title', 'completed', 'tags'], properties: { title: { type: 'string', minLength: 1 }, completed: { type: 'boolean' }, tags: { type: 'array', items: { type: 'string' } } } } }`
  - [x] Sanitise: trim `title` (400 if empty after trim), trim each tag, deduplicate, remove empty tags
  - [x] Call `repo.update(id, body)` — returns `404` if `undefined`
  - [x] Return `200` with updated `Todo`

- [x] Task 5: Implement `DELETE /api/todos/:id` route (AC: 1)
  - [x] Call `repo.getById(id)` — return `404` if not found
  - [x] Call `repo.delete(id)`
  - [x] Return `204` No Content

- [x] Task 6: Implement `PUT /api/todos/reorder` route (AC: 1)
  - [x] **IMPORTANT**: Register this route BEFORE `PUT /api/todos/:id` to avoid Fastify matching `/reorder` as `:id`
  - [x] Register Fastify JSON Schema: `{ body: { type: 'object', required: ['ids'], properties: { ids: { type: 'array', items: { type: 'string' }, minItems: 0 } } } }`
  - [x] Call `repo.reorder(body.ids)`
  - [x] Return `204` No Content

- [x] Task 7: Write integration tests in `backend/src/routes/todos.test.ts` (AC: 5)
  - [x] Use `buildServer({ repo })` with an in-memory `SqliteTodoRepository` (run `runMigrations` in `beforeEach`)
  - [x] Test `GET /api/todos`: returns sorted array, empty array when no todos
  - [x] Test `GET /api/todos?status=active`: filters correctly
  - [x] Test `GET /api/todos?status=completed`: filters correctly
  - [x] Test `GET /api/todos?tags=work`: returns todos with that tag
  - [x] Test `POST /api/todos`: 201 with correct Todo, tags parsed/stored
  - [x] Test `POST /api/todos` with empty title: 400
  - [x] Test `POST /api/todos` with whitespace-only title: 400 (after trim)
  - [x] Test `PUT /api/todos/:id`: 200 updated Todo, tags replaced
  - [x] Test `DELETE /api/todos/:id`: 204 and row removed
  - [x] Test `PUT /api/todos/reorder`: 204 and subsequent `GET` reflects new order
  - [x] Verify `tags` is always `string[]` in responses (never null)

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

- Implemented all 5 REST endpoints (`GET`, `POST`, `PUT /:id`, `DELETE /:id`, `PUT /reorder`) in `backend/src/routes/todos.ts` as a single Fastify plugin.
- `PUT /api/todos/reorder` registered before `PUT /api/todos/:id` as required by ARCH pattern to prevent Fastify treating "reorder" as `:id`.
- CORS plugin created at `backend/src/plugins/cors.ts` using `fastify-plugin` (available as transitive dep) and registered in `server.ts` before routes.
- Input sanitisation applied to all string inputs: `sanitiseTitle` trims and throws 400 on empty-after-trim; `sanitiseTags` trims, deduplicates, and removes empty strings.
- JSON Schema `minLength: 1` catches truly empty titles at the schema level; manual trim check catches whitespace-only titles.
- camelCase field names (`createdAt`, `updatedAt`) verified — mapping is in `SqliteTodoRepository` from prior story.
- TypeScript type augmentation `declare module 'fastify'` for `FastifyInstance.repo` added in `todos.ts`.
- All 32 tests pass (15 new route tests + 16 existing repo tests + 1 health test); 0 TypeScript errors.

### File List

- `backend/src/plugins/cors.ts` (new)
- `backend/src/routes/todos.ts` (new)
- `backend/src/routes/todos.test.ts` (new)
- `backend/src/server.ts` (modified)

### Change Log

- 2026-04-21: Implemented story 1-4 — CORS plugin, all `/api/todos` REST routes with JSON Schema validation and input sanitisation, integration tests (15 tests covering all routes and edge cases).

### Review Findings

- [x] [Review][Patch] Missing test: `PUT /api/todos/:id` with whitespace-only title should return 400 — `sanitiseTitle` is called on PUT but no test verifies this path, violating AC5 ("input sanitisation... is verified") [`backend/src/routes/todos.test.ts`]
- [x] [Review][Patch] Unused variable `postRes` in status=active test — declared but value never asserted; silenced with `void postRes` which is a lint smell [`backend/src/routes/todos.test.ts`]
- [x] [Review][Defer] Multi-tag OR filter (`GET /api/todos?tags=a,b`) has no test coverage — OR logic is implemented correctly but untested; not in spec task list [`backend/src/routes/todos.test.ts`] — deferred, pre-existing
- [x] [Review][Defer] `?tags=a&tags=b` multi-key query parameter behaviour is undefined — schema types `tags` as `string`, multi-key submission would produce ambiguous results; out of scope for current story [`backend/src/routes/todos.ts`] — deferred, pre-existing
- [x] [Review][Defer] `PUT /api/todos/reorder` does not validate that `ids` reference existing todos — unknown IDs silently pass to `repo.reorder()`; correctness depends on Story 1-3's implementation [`backend/src/routes/todos.ts`] — deferred, pre-existing
