# Deferred Work

This file tracks issues deferred during code reviews. Items here are real but not actionable at review time.

---

## Deferred from: code review of 1-3-database-schema-and-repository-abstraction (2026-04-21)

- Default `DB_PATH` falls back to `':memory:'` — server silently starts with an in-memory database if env var is missing; all data is lost on restart. Should log a warning or fail fast. [`backend/src/index.ts`]
- `delete()` returns `void` — the route layer cannot distinguish a 404 (todo not found) from a successful delete. `delete()` should return a boolean or the affected row count. Actionable in story 1-4 when routes are added. [`SqliteTodoRepository.ts`]
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
