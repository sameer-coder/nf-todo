# Deferred Work

This file tracks issues deferred during code reviews. Items here are real but not actionable at review time.

---

## Deferred from: code review of 1-5-github-actions-ci-pipeline (2026-04-21)

- No CI artifact upload for HTML reports (coverage + Playwright) — generated locally but not persisted as GitHub Actions job artifacts; failed runs require local reproduction to inspect test output. [`ci.yml`]

---

## Deferred from: code review of 1-3-database-schema-and-repository-abstraction (2026-04-21)

- Default `DB_PATH` falls back to `':memory:'` — server silently starts with an in-memory database if env var is missing; all data is lost on restart. Should log a warning or fail fast. [`backend/src/index.ts`]
- `delete()` returns `void` — the route layer cannot distinguish a 404 (todo not found) from a successful delete. `delete()` should return a boolean or the affected row count. Actionable in story 1-4 when routes are added. [`SqliteTodoRepository.ts`] ~~**Resolved in Story 1-4** via `getById`-before-delete pattern~~

## Deferred from: code review of 2-3-complete-incomplete-toggle (2026-04-22)

- Missing regression coverage for the completed-to-incomplete toggle path in Story 2.3 — deferred because the user asked not to update non-failing test cases. [`frontend/src/components/TodoItem.test.tsx`] 

## Deferred from: code review of story-3.1 and story-3.4 (2026-04-22)

- Missing visible keyboard focus state on clickable todo title — deferred by user to keep Story 3.1 closed without additional UI polish work. [`frontend/src/components/TodoItem.tsx`]
- Remove-tag button does not meet the required 44×44 touch target — deferred by user to keep Story 3.4 closed without resizing the chip controls. [`frontend/src/components/TagChip.tsx`]

## Deferred from: code review of stories 4-1 to 4-4 (2026-04-22)

- Double-click race condition on delete button — `handleDelete` has no re-entry guard; if user clicks delete twice rapidly before component unmounts, duplicate `DELETE_TODO_OPTIMISTIC` dispatches can break rollback logic. Pre-existing issue not introduced by this diff. [`frontend/src/components/TodoItem.tsx`]

## Deferred from: code review of 1-4-todo-rest-api-routes-with-input-validation (2026-04-21)

- Multi-tag OR filter (`GET /api/todos?tags=a,b`) has no test coverage — OR logic is correctly implemented but no test exercises more than one tag; not in spec task list. [`backend/src/routes/todos.test.ts`]
- `?tags=a&tags=b` multi-key query parameter behaviour is undefined — schema types `tags` as `string`; if a client sends duplicate keys, AJV behaviour is unpredictable. Consider restricting or documenting this. [`backend/src/routes/todos.ts`]
- `PUT /api/todos/reorder` does not validate that `ids` reference existing todos — silently delegates to `repo.reorder()` which may produce ordering gaps if unknown IDs are passed. [`backend/src/routes/todos.ts`]
- Invalid `PORT` env var produces `NaN` passed silently to `server.listen()` — startup validation deferred; out of scope for this story. [`backend/src/index.ts`]
- `update()` returns a manually constructed object instead of re-fetching from DB — `order` is read before the write transaction, so a race (hypothetical in single-threaded Node.js) could return a stale value. Low practical risk; revisit if worker threads are ever adopted. [`SqliteTodoRepository.ts → update()`]
- Empty-string tags pass through unchecked and are stored/returned — input validation belongs at the route/validation layer (story 1-4). [`SqliteTodoRepository.ts → create(), update()`]
- No secondary sort key for todos with equal `order` values — `ORDER BY "order" ASC` alone produces non-deterministic ordering within ties. Add `, todos.created_at ASC` as a tiebreaker when the `order=0` default issue is resolved. [`SqliteTodoRepository.ts → getAll()`]

---

## Deferred from: code review of 1-1-initialize-monorepo-scaffolding-and-project-structure (2026-04-07)

- `@fastify/cors` is installed in `backend/package.json` but never registered in `server.ts` — intentional stub, wiring deferred to story 1.3/1.4
- Frontend and backend `src/types/todo.ts` are identical copies with no sharing mechanism — they will drift over time; a shared types package or monorepo workspace import is a future architecture decision
- Root `.gitignore` missing `.DS_Store` and `*.log` entries — minor quality gap
- `frontend/playwright.config.ts` baseURL hardcoded to `http://localhost:3000` — revisit in story 6.1 when CI/CD and E2E infrastructure is finalized
- `backend/src/types/todo.ts` + `frontend/src/types/todo.ts`: `UpdateTodoBody` has all fields required (`title`, `completed`, `tags`) — no optional fields; partial updates will require sending full object; API contract to be defined in story 1.4
