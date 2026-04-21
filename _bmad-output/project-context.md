---
project_name: 'nf-todo'
user_name: 'Sameer'
date: '2026-03-31'
workflowStatus: complete
sections_completed: ['technology_stack', 'language_rules', 'framework_rules', 'testing_rules', 'code_quality_rules', 'critical_rules']
---

# Project Context for AI Agents

_This file contains critical rules and patterns that AI agents must follow when implementing code in this project. Focus on unobvious details that agents might otherwise miss._

---

## Technology Stack & Versions

### Frontend
- React 18 (SPA, no SSR)
- Vite (build tool + dev server)
- TypeScript — strict mode enabled
- Tailwind CSS (utility-first)
- clsx + tailwind-merge via `cn()` helper
- React Router (client-side routing, URL query params for filter state)
- React Context API + `useReducer` (state management — no Redux/Zustand)
- @dnd-kit/core + @dnd-kit/sortable + @dnd-kit/utilities (drag-and-drop)

### Backend
- Node.js + Fastify (REST API)
- TypeScript (strict mode, ESM)
- better-sqlite3 (synchronous SQLite driver — NO async/await at DB layer)
- @fastify/cors (CORS plugin)

### Testing
- Vitest + @vitest/coverage-v8 (unit/integration, both frontend & backend)
- React Testing Library + @testing-library/user-event (frontend component tests)
- Playwright (E2E, minimum 5 tests)

### Infrastructure
- Docker (multi-stage builds, non-root users, health checks)
- docker-compose (single `docker-compose up` cold start)
- GitHub Actions CI (lint + unit + integration + E2E on every push)
- nginx (frontend static file serving in production, port 80 → host 3000)
- SQLite named Docker volume `backend_data` mounted at `/data`

### Ports
- Frontend (nginx): container 80 → host 3000
- Backend (Fastify): container 4000 → host 4000

### Environment Variables
- Frontend: `VITE_API_URL=http://localhost:4000` (build-time)
- Backend: `PORT=4000`, `CORS_ORIGIN=http://localhost:3000`, `DB_PATH=/data/todos.db`

---

## Language-Specific Rules

### TypeScript
- Strict mode is ON in both `frontend/tsconfig.json` and `backend/tsconfig.json` — no `any` escapes, no implicit `any`
- ESModules throughout — use `import`/`export`, never `require()`
- All shared type interfaces live in `src/types/todo.ts` in each service — never inline types in component or route files
- The canonical `Todo` interface:
  ```typescript
  interface Todo {
    id: string;        // UUID string
    title: string;
    completed: boolean;
    order: number;
    tags: string[];    // always present — never undefined or omitted
    createdAt: string; // ISO 8601
    updatedAt: string; // ISO 8601
  }
  ```
- UUID generation: `crypto.randomUUID()` (Node.js built-in) — do NOT install `uuid` or `nanoid`
- Date/time: always ISO 8601 strings (`new Date().toISOString()`) — never Unix timestamps, never `Date` objects in API payloads
- `boolean` in API JSON: native `true`/`false` — SQLite stores as `INTEGER` (0/1); repository layer MUST convert (`!!row.completed`)
- Async/await: used at route handler level and in frontend API functions; `better-sqlite3` is synchronous — no `await` at the DB layer
- Error handling: route handlers throw `createError()` (from `@fastify/error` or `http-errors`); frontend API functions `throw` on non-ok responses; callers always `try/catch`

---

## Framework-Specific Rules

### React
- State management: React Context API + `useReducer` only — no Zustand, no Redux, no MobX
- Two contexts: `TodoContext` (todos + dispatch) and `ToastContext` (toast state + trigger)
- Components consume state via `useTodos()` and `useToast()` hooks only — never consume Context directly with `useContext` in components
- Components NEVER call `fetch()` directly — all API calls go through `src/api/todos.ts`
- Filter state lives exclusively in URL query params via `useSearchParams()` — never in component `useState` or context
- No barrel `index.ts` re-exports — import directly from the source file path
- One component per file, named identically to the file: `TodoItem.tsx` exports `function TodoItem`
- All conditional Tailwind class composition: use `cn()` (clsx + tailwind-merge) — never string concatenation, never `clsx()` or `twMerge()` directly
- All animations/transitions: MUST be gated with `motion-safe:` Tailwind prefix — e.g., `motion-safe:transition-opacity`
- Drag-and-drop: use `@dnd-kit/core` + `@dnd-kit/sortable` — never HTML5 drag API, never react-beautiful-dnd

### Optimistic UI Pattern (MANDATORY for ALL mutations)
Every state mutation must follow this exact sequence:
```typescript
// 1. Snapshot previous state
const prev = todos;
// 2. Dispatch optimistic update immediately
dispatch({ type: 'UPDATE_TODO_OPTIMISTIC', payload: updated });
// 3. Call API
try {
  await updateTodo(id, body);
} catch {
  // 4. On error: rollback + toast
  dispatch({ type: 'UPDATE_TODO_ROLLBACK', payload: prev });
  showToast('Something went wrong');
}
```
No mutation ever waits for the API before updating the UI.

### TodoContext Reducer Action Types
```typescript
type TodoAction =
  | { type: 'SET_TODOS'; payload: Todo[] }
  | { type: 'ADD_TODO_OPTIMISTIC'; payload: Todo }
  | { type: 'ADD_TODO_ROLLBACK'; payload: string }       // id to remove
  | { type: 'UPDATE_TODO_OPTIMISTIC'; payload: Todo }
  | { type: 'UPDATE_TODO_ROLLBACK'; payload: Todo }      // previous todo
  | { type: 'DELETE_TODO_OPTIMISTIC'; payload: string }  // id
  | { type: 'DELETE_TODO_ROLLBACK'; payload: Todo }      // todo to restore
  | { type: 'REORDER_OPTIMISTIC'; payload: Todo[] }
  | { type: 'REORDER_ROLLBACK'; payload: Todo[] };
```

### Fastify (Backend)
- All routes exported as a Fastify plugin function — registered in `server.ts` via `fastify.register()`
- All route bodies MUST have a `schema.body` JSON Schema object — Fastify returns 400 automatically on violation (no manual validation)
- Repository always injected into route plugin — never instantiated inside a route handler
- Only `SqliteTodoRepository.ts` calls `better-sqlite3` — never in route handlers or any other file
- CORS: controlled by `CORS_ORIGIN` env var set in docker-compose — never hardcode the origin
- `GET /api/health` endpoint must exist for Docker health checks

---

## Testing Rules

### General
- Test files co-located alongside source: `TodoItem.tsx` → `TodoItem.test.tsx`, `todos.ts` → `todos.test.ts`
- Playwright E2E tests live in `frontend/e2e/` (not co-located with components)
- Minimum 5 Playwright E2E tests — this is a hard CI requirement, not aspirational
- Coverage threshold: ≥70% meaningful coverage enforced by CI (`@vitest/coverage-v8`) — build fails below this

### Frontend (Vitest + React Testing Library)
- Use `@testing-library/user-event` for user interactions — never `fireEvent` directly
- Test components via behavior/output, not implementation details — no snapshot tests
- Mock `src/api/todos.ts` functions when testing components that trigger mutations
- `useTodos()` and `useToast()` hooks require their Context providers — always wrap in `TodoProvider` + `ToastProvider` in test setup
- Do NOT test that `dispatch` was called — test the resulting rendered state

### Backend (Vitest)
- Route tests (`todos.test.ts`): use `fastify.inject()` — never start a real server; inject a mock `ITodoRepository`
- Repository tests (`SqliteTodoRepository.test.ts`): use an **in-memory** SQLite database (`:memory:`) — never write test files to disk
- Test the repository interface contract, not internal SQL strings

### Playwright E2E
- Tests run against the fully built docker-compose stack (`docker-compose up --build`)
- `frontend/e2e/` directory; config in `playwright.config.ts` at the frontend root
- Cover the core user journeys: create todo, complete todo, delete todo, filter by status, drag to reorder
- Each test must be independent — no shared state between tests; use `beforeEach` to reset via API if needed

---

## Code Quality & Style Rules

### Naming Conventions
- React components: `PascalCase` file and export — `TodoItem.tsx` → `export function TodoItem`
- Hooks: `camelCase` prefixed `use` — `useTodos`, `useToast`
- API functions: `camelCase` verb-noun — `fetchTodos`, `createTodo`, `updateTodo`, `deleteTodo`, `reorderTodos`
- TypeScript interfaces: `PascalCase` — `Todo`, `CreateTodoBody`, `UpdateTodoBody`
- Constants: `SCREAMING_SNAKE_CASE` — `API_BASE_URL`
- SQLite tables: `snake_case` plural — `todos`, `todo_tags`
- SQLite columns: `snake_case` — `todo_id`, `created_at`; quote reserved words — `"order"`
- API endpoints: `kebab-case` plural nouns — `/api/todos`, `/api/todos/:id`
- JSON API fields: `camelCase` — `createdAt`, `updatedAt` — never `snake_case`
- Query params: `camelCase` — `?status=active&tags=work`

### Project Structure Rules
- No barrel `index.ts` files anywhere — import from direct file paths
- One component per file, co-located with its test file
- `src/types/` holds shared interfaces in both `frontend/` and `backend/`
- `src/utils/cn.ts` is the only place `clsx` + `tailwind-merge` are called; everywhere else uses `cn()`
- Backend: one file per resource in `src/routes/` — `todos.ts` only

### API Response Shape Rules
- List: `200` → bare `Todo[]` array (no wrapper envelope like `{ data: [] }`)
- Single: `200` → bare `Todo` object
- Delete: `204` No Content
- Reorder: `204` No Content
- Error: `{ statusCode: number, error: string, message: string }` (Fastify default — never customize this shape)

### Input Sanitisation (Backend — always apply before DB write)
- All string fields: trim leading/trailing whitespace
- `title`: reject with `400` if empty after trim
- `tags`: deduplicate, trim each tag, remove empty strings before insert
- Never trust client-provided `id` on create — always generate with `crypto.randomUUID()`

### Loading & Error UX Rules
- No loading spinners on mutations — optimistic UI makes them unnecessary
- Initial page load only: render 3 skeleton rows while `GET /api/todos` resolves
- Toast: trigger only on failed API calls (5xx/network errors) — never on client-side validation errors
- Client-side validation: block submit silently (e.g., disable Enter on empty title) — no inline red error text
- All interactive elements: minimum 44×44px touch target (`min-h-[44px] min-w-[44px]`)
- Keyboard navigation required on all interactive elements; `focus-visible` rings must be visible

---

## Critical Don't-Miss Rules

### Hard Anti-Patterns (NEVER do these)
- ❌ Call `better-sqlite3` directly anywhere except `SqliteTodoRepository.ts`
- ❌ Fetch todos without JOINing `todo_tags` — every todo response MUST include `tags: string[]`
- ❌ Use `snake_case` field names in any API JSON response or request body
- ❌ Manage filter state in component `useState` — it belongs exclusively in URL query params
- ❌ Add CSS transitions/animations without `motion-safe:` Tailwind prefix
- ❌ Use `clsx()` or `twMerge()` directly — always use the `cn()` wrapper
- ❌ Leave unhandled promise rejections in frontend API calls — always `try/catch`
- ❌ Instantiate `SqliteTodoRepository` inside a route handler — always inject via plugin
- ❌ Hardcode `CORS_ORIGIN` — always read from environment variable
- ❌ Install an external UUID library — use `crypto.randomUUID()` (Node.js built-in)
- ❌ Store `Date` objects or Unix timestamps in API payloads — always ISO 8601 strings
- ❌ Write `require()` imports — ESModules only (`import`/`export`)

### SQLite Gotchas
- The column `order` is a SQL reserved word — ALWAYS quote it as `"order"` in every raw SQL query
- `better-sqlite3` is fully synchronous — never `await` a database call; it will silently return `undefined`
- Boolean `completed` stored as `INTEGER` in SQLite — repository MUST convert: `!!row.completed`
- Tags are NOT stored on the `todos` table — they live in `todo_tags`; any query that omits the LEFT JOIN returns todos with no tags

### Architecture Boundaries (never cross these)
- Frontend never reads/writes SQLite directly
- Backend never serves static files (nginx handles that in production)
- Components never call `fetch()` directly — all through `src/api/todos.ts`
- Route handlers never touch `better-sqlite3` — only through `ITodoRepository`
- Filter state never in React state/context — URL query params only

### Data Flow Reminders
- Reorder endpoint: `PUT /api/todos/reorder` with body `{ ids: string[] }` — assigns `order = index` for each; returns `204`
- On `PUT /api/todos/:id`: backend deletes ALL `todo_tags` for that id then re-inserts from `tags[]` in request body
- `GET /api/todos` always returns todos sorted by `ORDER BY "order" ASC`
- `isLoading` in `TodoContext` is ONLY for the initial page load fetch — not for mutations

---

## Usage Guidelines

**For AI Agents:**
- Read this file before implementing any code in this project
- Follow ALL rules exactly as documented — these are not suggestions
- When in doubt, prefer the more restrictive option
- The anti-patterns section lists things that will silently produce wrong results — treat them as hard blockers

**For Humans:**
- Keep this file lean and focused on unobvious agent needs
- Update when technology stack changes or new patterns emerge
- Remove rules that become obvious over time to preserve signal density

_Last Updated: 2026-03-31_
