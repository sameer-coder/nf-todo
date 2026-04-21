---
stepsCompleted: ['step-01-init', 'step-02-context', 'step-03-starter', 'step-04-decisions', 'step-05-patterns', 'step-06-structure', 'step-07-validation', 'step-08-complete']
workflowStatus: complete
completedAt: '2026-03-30'
inputDocuments:
  - '_bmad-output/planning-artifacts/prd.md'
  - '_bmad-output/planning-artifacts/product-brief-nf-todo.md'
  - '_bmad-output/planning-artifacts/product-brief-nf-todo-distillate.md'
  - '_bmad-output/planning-artifacts/ux-design-specification.md'
workflowType: 'architecture'
project_name: 'nf-todo'
user_name: 'Sameer'
date: '2026-03-29'
lastStep: 'step-08-complete'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**
The project contains 29 FRs across seven capability areas: Todo CRUD (FR1–FR7), Tags (FR8–FR10), Filtering (FR11–FR15), Ordering via drag-and-drop (FR16–FR18), Empty & edge states (FR19–FR20), Error handling (FR21–FR23), and Infrastructure/Docs (FR24–FR29). All FRs are in scope for v1 — this is a complete feature delivery, not a staged MVP reduction.

**Non-Functional Requirements:**
- Performance: API responses ≤300ms under single-user load; drag-and-drop renders at 60fps; frontend mutations appear instant via optimistic UI
- Security: All incoming request body fields validated and sanitised before database write (NFR4); system runs isolated within a local Docker network
- Quality: ≥70% meaningful test coverage (unit + integration + E2E) enforced in CI; ≥5 Playwright E2E tests; GitHub Actions CI blocks merge on failure (NFR6–NFR8)
- Accessibility: WCAG 2.1 AA compliance — all interactive elements ≥44×44px touch target, keyboard navigable, `focus-visible` rings, `prefers-reduced-motion` respected

**Scale & Complexity:**
The domain is intentionally simple (single user, no auth, no real-time). The engineering complexity is infrastructure, testing infrastructure, and operational standards — not domain logic.

- Primary domain: Full-stack web (React SPA + REST API)
- Complexity level: Low
- Estimated architectural components: ~8 frontend components, ~5 backend route groups, 1 repository abstraction layer, 1 docker-compose orchestration file, 1 CI pipeline

### Tech Stack (Prescribed — No Decision Required)

| Layer | Technology |
|---|---|
| Frontend | React (SPA) + Vite + Tailwind CSS |
| Frontend serving | nginx (multi-stage Docker) |
| Backend | Node.js + Fastify (REST API) |
| Storage | SQLite via `better-sqlite3` (named Docker volume) |
| Storage abstraction | Repository/adapter interface |
| DnD | @dnd-kit/core |
| State management | React Context API or Zustand (client-side only) |
| Routing | React Router (client-side, filter state in URL query params) |
| UI utilities | clsx + tailwind-merge (`cn()` helper) |
| Styling | Tailwind CSS utility-first, Inter font (Google Fonts) |
| Containerization | Multi-stage Dockerfiles, non-root users, health checks |
| Orchestration | docker-compose (`docker-compose up` cold start) |
| CI/CD | GitHub Actions (lint + unit + integration + E2E on every push) |
| Unit testing | Vitest + React Testing Library (frontend); Vitest (backend) |
| E2E testing | Playwright (≥5 tests) |

### Technical Constraints & Dependencies

- **Two separate containers** — frontend (nginx) and backend (Fastify) communicate strictly over HTTP REST; no shared runtime, no shared filesystem at runtime
- **SQLite file** stored in a **named Docker volume** on the backend container — ensures persistence across container restarts
- **Single `docker-compose up`** must bring the entire system online — no manual setup steps beyond Docker being installed
- **CI enforces coverage threshold** — the build fails if test coverage drops below 70%; this is a hard constraint, not aspirational
- **No authentication** — the application is entirely single-user; no identity, session, or authorization layer is needed or permitted in v1

### Cross-Cutting Concerns Identified

1. **Optimistic UI + rollback** — Every mutation (create, complete, edit, delete, reorder) must update the UI before API confirmation and revert on error. This is a pervasive pattern that affects frontend state structure for all features.
2. **Toast / error notification system** — A single `Toast` component is needed as a global concern, rendering from any failed API call anywhere in the app.
3. **Repository abstraction** — The backend storage layer must be behind an interface that isolates route handlers from SQLite specifics; swappability is a stated requirement.
4. **Accessibility** — ARIA roles, keyboard navigation maps, touch target sizing, and `prefers-reduced-motion` gates apply across all interactive components globally.
5. **CI/CD enforcement** — Test coverage gates and Playwright E2E are infrastructure-level concerns that influence component testability from day one.
6. **Containerization standards** — Multi-stage builds, non-root execution, health checks apply to both containers; this affects Dockerfile architecture for frontend and backend.

## Starter Template Evaluation

### Primary Technology Domain

Full-stack web application — two discrete services in a monorepo:
- **Frontend:** React SPA (Vite) — served as static files via nginx
- **Backend:** REST API (Node.js + Fastify) — owns all data persistence

### Starter Options

The tech stack is fully prescribed in the PRD. No starter selection decision is required. Both services are initialized via their canonical scaffolding tools.

### Frontend: Vite + React + TypeScript

**Initialization Command:**
```bash
npm create vite@latest frontend -- --template react-ts
cd frontend
npm install
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
npm install clsx tailwind-merge
npm install react-router-dom
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
npm install -D vitest @vitest/coverage-v8 @testing-library/react @testing-library/user-event jsdom
npm install -D @playwright/test
```

**Architectural Decisions Established by Starter:**
- **Language:** TypeScript (strict mode)
- **Build tooling:** Vite (HMR in dev, tree-shaking + code-splitting in prod)
- **Module format:** ESModules
- **Entry point:** `src/main.tsx` → `public/index.html`
- **Static asset serving:** nginx in production (not Vite's dev server)

**Project Structure Established:**
```
frontend/
  src/
    components/    # All React components
    hooks/         # Custom hooks (useOptimisticTodos, useToast, etc.)
    api/           # API client functions (fetch wrappers per resource)
    types/         # Shared TypeScript interfaces (Todo, Tag, etc.)
    utils/         # cn() helper, misc utilities
    App.tsx
    main.tsx
  public/
  index.html
  tailwind.config.js
  vite.config.ts
  playwright.config.ts
  Dockerfile
```

### Backend: Fastify + TypeScript + better-sqlite3

**Initialization Command:**
```bash
mkdir backend && cd backend
npm init -y
npm install fastify @fastify/cors better-sqlite3
npm install -D typescript ts-node @types/node @types/better-sqlite3
npm install -D vitest @vitest/coverage-v8
npx tsc --init
```

**Architectural Decisions Established by Starter:**
- **Language:** TypeScript (Node.js runtime, ESM)
- **Framework:** Fastify (schema-based validation via JSON Schema, built-in serialization)
- **Process model:** Single process, synchronous SQLite (`better-sqlite3` is synchronous by design — no async/await at the DB layer)
- **Server port:** 4000 (frontend proxied to this in docker-compose)

**Project Structure Established:**
```
backend/
  src/
    routes/        # Fastify route handlers (todos.ts)
    repository/    # Repository interface + SqliteTodoRepository
    db/            # DB initialisation, schema migrations (migrate.ts)
    types/         # Shared TypeScript interfaces
    plugins/       # Fastify plugin registrations (cors, etc.)
    server.ts      # Fastify app factory
    index.ts       # Entry point — starts server
  Dockerfile
  tsconfig.json
```

### Monorepo Root

**Root Structure:**
```
nf-todo/
  frontend/
  backend/
  docker-compose.yml
  .github/
    workflows/
      ci.yml
  README.md
```

**Note:** Project initialization using these commands is the first implementation story (Epic 0 / Story 0 — project scaffold).

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**
- Tags storage model (junction table)
- Order persistence strategy (integer bulk update)
- API update pattern (PUT full replacement)
- State management library (React Context API)
- Input validation approach (Fastify JSON Schema)

**Important Decisions (Shape Architecture):**
- CORS configuration strategy
- Error response shape
- API communication layer (custom fetch wrappers)
- Port mapping
- CI pipeline structure

**Deferred Decisions (Post-MVP):**
- Dark mode / theming
- PWA / offline support
- Database migration tooling beyond initial schema

---

### Data Architecture

**Tags Storage — Separate Junction Table**
- Decision: `todo_tags(todo_id TEXT, tag TEXT)` junction table
- Rationale: Enables SQL-layer tag filtering (`WHERE tag IN (...)`) — cleaner than application-layer filtering over a JSON column
- Cascade: `ON DELETE CASCADE` on `todo_id` foreign key — deleting a todo automatically cleans up its tags
- Affects: `GET /api/todos` (LEFT JOIN todo_tags), `PUT /api/todos/:id` (delete + re-insert tags on update), `GET /api/todos?tags=work,personal` query param handling

**SQLite Schema:**
```sql
CREATE TABLE todos (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  completed INTEGER NOT NULL DEFAULT 0,
  "order" INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE todo_tags (
  todo_id TEXT NOT NULL REFERENCES todos(id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  PRIMARY KEY (todo_id, tag)
);

CREATE INDEX idx_todo_tags_tag ON todo_tags(tag);
```

**Order Field — Integer, Bulk Update**
- Decision: `order INTEGER` on todos table; reorder endpoint accepts full ordered array
- Rationale: Simple, no floating-point drift, safe at single-user scale
- Endpoint: `PUT /api/todos/reorder` body: `{ ids: string[] }` — backend assigns `order = index` for each
- Affects: `GET /api/todos` returns todos sorted by `ORDER BY "order" ASC`

---

### Security

**Input Validation — Fastify JSON Schema**
- Decision: Fastify native schema validation on all route bodies (via `ajv` under the hood)
- Rationale: Idiomatic Fastify pattern; rejects malformed payloads before handler runs; satisfies NFR4
- Implementation: Each route registers a `schema.body` object; Fastify returns 400 automatically on violation

**CORS — `@fastify/cors` with environment variable origin**
- Decision: `@fastify/cors` registered as a plugin; `CORS_ORIGIN` env var controls allowed origin
- Rationale: Frontend and backend run as separate containers; origin must match the frontend's host:port
- docker-compose sets: `CORS_ORIGIN=http://localhost:3000`

---

### API & Communication Patterns

**REST Endpoint Structure:**

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/todos` | List all todos (with optional `?tags=` and `?status=` query params) |
| `POST` | `/api/todos` | Create todo |
| `PUT` | `/api/todos/:id` | Full replacement update (title, completed, tags) |
| `DELETE` | `/api/todos/:id` | Delete todo |
| `PUT` | `/api/todos/reorder` | Bulk update order (`{ ids: string[] }`) |
| `GET` | `/api/health` | Health check for Docker |

**Update Pattern — `PUT` (Full Replacement)**
- Decision: `PUT /api/todos/:id` requires full todo body
- Rationale: Simpler backend; frontend always has full todo state in store; consistent with single-user single-source-of-truth model
- Cascading: On every PUT, backend deletes all `todo_tags` for the id then re-inserts from the request body's `tags` array

**Error Response Shape:**
```json
{ "statusCode": 400, "error": "Bad Request", "message": "description" }
```
Standard Fastify error shape — consistent across all routes, no custom error body needed.

**API Communication Layer — Custom Fetch Wrappers**
- Decision: `src/api/todos.ts` with typed functions wrapping `fetch()`; no Axios, no React Query
- Rationale: Simple scope; no caching requirements; keeps bundle lean
- Pattern: Each function returns `Promise<Todo[]>` or throws; caller (Zustand action / hook) handles error and triggers toast

---

### Frontend Architecture

**State Management — React Context API**
- Decision: React Context API with `useReducer` for todo state
- Rationale: No additional dependency; sufficient for single-list, single-page app; Context + useReducer covers optimistic mutations cleanly
- Structure: `TodoContext` provides `{ todos, dispatch }`; `useTodos()` custom hook wraps context consumption
- Optimistic pattern: dispatch optimistic action → call API → on error dispatch rollback action + trigger toast

**Optimistic UI + Rollback Pattern:**
```
1. Capture snapshot: store previous state
2. dispatch({ type: 'OPTIMISTIC_UPDATE', payload })
3. await apiCall()
4. On success: no-op (state already reflects change)
5. On error: dispatch({ type: 'ROLLBACK', payload: snapshot }) + showToast()
```

**Filter State — URL Query Params**
- Decision: Status filter and active tag filters stored in URL query params (`?status=active&tags=work,personal`)
- Rationale: Specified in UX design spec; enables back-button behaviour; shareable URLs
- Implementation: `useSearchParams()` from React Router; filter logic applied client-side against `todos` from Context

---

### Infrastructure & Deployment

**Port Mapping:**

| Service | Container port | Host port |
|---|---|---|
| Frontend (nginx) | 80 | 3000 |
| Backend (Fastify) | 4000 | 4000 |

**Environment Configuration:**
- Frontend: `VITE_API_URL` build-time env var set in docker-compose (`http://localhost:4000`)
- Backend: `PORT=4000`, `CORS_ORIGIN=http://localhost:3000`, `DB_PATH=/data/todos.db`
- SQLite volume: named volume `backend_data` mounted at `/data` in backend container

**CI Pipeline — GitHub Actions (2 jobs):**

```yaml
jobs:
  test:
    # lint + unit + integration (frontend & backend)
    # enforces ≥70% coverage threshold — fails build if not met
  e2e:
    needs: test
    # docker-compose up --build
    # playwright test
    # docker-compose down
```

---

### Decision Impact Analysis

**Implementation Sequence (order matters):**
1. Monorepo scaffold + docker-compose skeleton
2. Backend: DB schema + repository interface + SqliteTodoRepository
3. Backend: Fastify routes with schema validation
4. Frontend: Vite scaffold + Tailwind + TodoContext
5. Frontend: Core components (AddTodoInput, TodoItem, Checkbox, EmptyState)
6. Frontend: Filter components (StatusFilterBar, FilterChipBar, TagChip)
7. Frontend: DnD wiring (@dnd-kit + reorder API call)
8. Frontend: Toast system
9. Dockerfiles + docker-compose full wiring
10. CI pipeline (GitHub Actions)
11. Playwright E2E tests
12. README

**Cross-Component Dependencies:**
- Toast system must exist before any API call can trigger it — build early
- TodoContext must be scaffolded before any component can render todos
- Repository interface must be defined before routes reference it
- docker-compose env vars must be set before frontend API URL resolves

## Implementation Patterns & Consistency Rules

### Naming Patterns

**Database Naming Conventions (SQLite):**
- Tables: `snake_case` plural — `todos`, `todo_tags`
- Columns: `snake_case` — `todo_id`, `created_at`, `updated_at`
- Reserved word quoting: `"order"` (order is a SQL keyword, must be quoted in queries)
- Primary keys: `id TEXT` (UUID string)
- Foreign keys: `{table_singular}_id` — `todo_id`
- Indexes: `idx_{table}_{column}` — `idx_todo_tags_tag`

**API Naming Conventions:**
- Endpoints: `kebab-case`, plural nouns — `/api/todos`, `/api/todos/:id`
- Route params: `:id` (Fastify style)
- Query params: `camelCase` — `?status=active&tags=work,personal`
- JSON body/response fields: `camelCase` — `createdAt`, `todoId`
- HTTP methods: GET list, POST create, PUT full replace, DELETE remove, PUT bulk action

**Code Naming Conventions:**
- React components: `PascalCase` files and exports — `TodoItem.tsx`, `export function TodoItem`
- Hooks: `camelCase` prefixed `use` — `useTodos`, `useToast`
- API functions: `camelCase` verb-noun — `fetchTodos`, `createTodo`, `updateTodo`, `deleteTodo`, `reorderTodos`
- TypeScript interfaces: `PascalCase` — `Todo`, `CreateTodoBody`, `UpdateTodoBody`
- Constants: `SCREAMING_SNAKE_CASE` — `API_BASE_URL`
- CSS utility helper: `cn()` only (clsx + tailwind-merge) — never `clsx()` or `twMerge()` directly

### Structure Patterns

**Project Organization:**
- Tests: co-located as `*.test.ts` / `*.test.tsx` alongside source files
- Playwright E2E: `frontend/e2e/` directory
- Component files: one component per file, co-located with its test
- No barrel `index.ts` files — import directly from the file path
- Shared TypeScript types: `src/types/` in both frontend and backend

**Backend Route Organization:**
- One file per resource: `src/routes/todos.ts`
- Route handler files export a Fastify plugin function (registered in `server.ts`)
- Repository always injected — never instantiated inside a route handler
- All DB access goes through the repository interface — never call `better-sqlite3` directly in a route handler

**Frontend Component Organization:**
```
src/components/
  AddTodoInput.tsx (+.test.tsx)
  TodoItem.tsx (+.test.tsx)
  Checkbox.tsx (+.test.tsx)
  InlineEditInput.tsx (+.test.tsx)
  TagChip.tsx (+.test.tsx)
  DragHandle.tsx
  DeleteButton.tsx
  FilterChipBar.tsx (+.test.tsx)
  FilterActiveChip.tsx
  StatusFilterBar.tsx (+.test.tsx)
  EmptyState.tsx (+.test.tsx)
  Toast.tsx (+.test.tsx)
src/hooks/
  useTodos.ts        # consumes TodoContext
  useToast.ts        # consumes ToastContext
src/context/
  TodoContext.tsx    # TodoContext + TodoProvider + useReducer
  ToastContext.tsx   # ToastContext + ToastProvider
src/api/
  todos.ts           # all fetch wrappers for /api/todos
src/types/
  todo.ts            # Todo, CreateTodoBody, UpdateTodoBody interfaces
src/utils/
  cn.ts              # cn() helper
```

### Format Patterns

**API Response Formats:**
- Success (list): `200` → array of Todo objects directly (no wrapper envelope)
- Success (single): `200` → single Todo object directly
- Success (reorder): `204` No Content
- Success (delete): `204` No Content
- Error: `{ statusCode: number, error: string, message: string }` (Fastify default shape)

**Todo Data Shape (canonical):**
```typescript
interface Todo {
  id: string;          // UUID
  title: string;
  completed: boolean;
  order: number;
  tags: string[];      // array of tag strings from todo_tags JOIN
  createdAt: string;   // ISO 8601
  updatedAt: string;   // ISO 8601
}
```

**Date Format:** ISO 8601 strings in all API responses — `"2026-03-30T10:00:00.000Z"`. Never Unix timestamps.

**Boolean in JSON:** `true`/`false` (native JSON booleans). In SQLite: stored as `INTEGER` (0/1), converted at the repository layer.

**Reorder Request Body:**
```typescript
{ ids: string[] }  // ordered array of todo UUIDs
```

### State Management Patterns

**TodoContext Reducer Actions:**
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
  | { type: 'REORDER_ROLLBACK'; payload: Todo[] };       // previous order
```

**Optimistic Mutation Pattern (apply to ALL mutations):**
```typescript
// 1. Snapshot previous state
const prev = state.todos;
// 2. Dispatch optimistic update
dispatch({ type: 'UPDATE_TODO_OPTIMISTIC', payload: updated });
// 3. Call API
try {
  await updateTodo(id, body);
} catch {
  // 4. Rollback + toast on error
  dispatch({ type: 'UPDATE_TODO_ROLLBACK', payload: previousTodo });
  showToast('Something went wrong');
}
```

### Process Patterns

**Error Handling:**
- API errors in route handlers: throw Fastify `createError()` with explicit `statusCode`
- Frontend API errors: always caught in the mutation function; never allow unhandled promise rejections
- Toast triggering: only on API error (5xx); never on client validation errors
- Client validation: prevent submit silently (empty title → block Enter, no red text)

**Loading States:**
- No loading spinners on mutations — optimistic UI means state updates instantly
- Initial page load only: 3 skeleton rows while `GET /api/todos` resolves
- `isLoading: boolean` in TodoContext initial state for initial fetch only

**Input Sanitisation (Backend):**
- All string fields: trimmed of leading/trailing whitespace before DB write
- Title: reject if empty after trim (400)
- Tags: deduplicated, each tag trimmed, empty strings removed before insert
- UUID generation: `crypto.randomUUID()` (Node.js built-in — no external library)

### Enforcement Guidelines

**All AI Agents MUST:**
- Use `camelCase` for all JSON API fields — never `snake_case` in API responses
- Quote `"order"` when referencing the SQLite order column in raw SQL
- Return `tags: string[]` on every todo response — always JOIN `todo_tags`, never return a todo without its tags
- Gate all animations/transitions with `motion-safe:` Tailwind prefix
- Use `cn()` for all conditional Tailwind class composition — never string concatenation
- Follow the optimistic mutation pattern for ALL state mutations — no exceptions
- Use `crypto.randomUUID()` for ID generation — no external UUID library
- Store all datetimes as ISO 8601 strings — no Unix timestamps anywhere

**Anti-Patterns (never do these):**
- ❌ Calling `better-sqlite3` directly inside a Fastify route handler
- ❌ Fetching todos without JOINing `todo_tags` (returns todos with missing tags)
- ❌ Using `snake_case` field names in API JSON responses
- ❌ Managing filter state in React component local state (must be URL query params)
- ❌ Adding transitions without `motion-safe:` Tailwind prefix
- ❌ Using `clsx()` or `twMerge()` directly instead of `cn()`
- ❌ Throwing unhandled promise rejections from API calls in frontend code

## Project Structure & Boundaries

### Complete Project Directory Structure

```
nf-todo/
├── README.md
├── docker-compose.yml
├── .gitignore
├── .github/
│   └── workflows/
│       └── ci.yml
│
├── frontend/
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── playwright.config.ts
│   ├── index.html
│   ├── .env.example              # VITE_API_URL=http://localhost:4000
│   ├── e2e/
│   │   ├── todos.spec.ts         # ≥5 Playwright tests
│   │   └── fixtures/
│   │       └── index.ts
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       ├── App.test.tsx
│       ├── components/
│       │   ├── AddTodoInput.tsx
│       │   ├── AddTodoInput.test.tsx
│       │   ├── Checkbox.tsx
│       │   ├── Checkbox.test.tsx
│       │   ├── DeleteButton.tsx
│       │   ├── DragHandle.tsx
│       │   ├── EmptyState.tsx
│       │   ├── EmptyState.test.tsx
│       │   ├── FilterActiveChip.tsx
│       │   ├── FilterChipBar.tsx
│       │   ├── FilterChipBar.test.tsx
│       │   ├── InlineEditInput.tsx
│       │   ├── InlineEditInput.test.tsx
│       │   ├── StatusFilterBar.tsx
│       │   ├── StatusFilterBar.test.tsx
│       │   ├── TagChip.tsx
│       │   ├── TagChip.test.tsx
│       │   ├── Toast.tsx
│       │   ├── Toast.test.tsx
│       │   ├── TodoItem.tsx
│       │   └── TodoItem.test.tsx
│       ├── context/
│       │   ├── TodoContext.tsx    # TodoContext, TodoProvider, useReducer, TodoAction
│       │   └── ToastContext.tsx   # ToastContext, ToastProvider
│       ├── hooks/
│       │   ├── useTodos.ts        # convenience wrapper over TodoContext
│       │   └── useToast.ts        # convenience wrapper over ToastContext
│       ├── api/
│       │   └── todos.ts           # fetchTodos, createTodo, updateTodo, deleteTodo, reorderTodos
│       ├── types/
│       │   └── todo.ts            # Todo, CreateTodoBody, UpdateTodoBody
│       └── utils/
│           └── cn.ts              # cn() = clsx + tailwind-merge
│
└── backend/
    ├── Dockerfile
    ├── package.json
    ├── tsconfig.json
    ├── .env.example               # PORT=4000, CORS_ORIGIN=http://localhost:3000, DB_PATH=/data/todos.db
    └── src/
        ├── index.ts               # entry point — buildServer().listen()
        ├── server.ts              # buildServer() factory — registers plugins + routes
        ├── plugins/
        │   └── cors.ts            # @fastify/cors registration
        ├── routes/
        │   └── todos.ts           # Fastify plugin — all /api/todos routes with JSON schemas + tests
        ├── routes/
        │   └── todos.test.ts      # integration tests for route handlers
        ├── repository/
        │   ├── ITodoRepository.ts           # interface definition
        │   ├── SqliteTodoRepository.ts      # better-sqlite3 implementation
        │   └── SqliteTodoRepository.test.ts # unit tests for repository
        ├── db/
        │   └── migrate.ts         # run-once schema migration
        └── types/
            └── todo.ts            # Todo, CreateTodoBody, UpdateTodoBody
```

### Architectural Boundaries

**API Boundary (Frontend → Backend):**
- All communication over HTTP REST at `VITE_API_URL` (default: `http://localhost:4000`)
- Frontend never reads/writes SQLite directly
- Backend never serves static files (nginx handles that)
- Single API prefix: `/api/` on all routes
- Health check endpoint: `GET /api/health` for Docker health checks

**Repository Boundary (Routes → Storage):**
- Route handlers interact only with `ITodoRepository` interface
- `SqliteTodoRepository` is the only file that calls `better-sqlite3`
- Interface is injectable — swap for in-memory mock in unit tests without touching route logic

**Context Boundary (Components → State):**
- Components never call `fetch()` directly — all API calls go through `src/api/todos.ts`
- Components consume state only via `useTodos()` and `useToast()` hooks
- Filter state lives exclusively in URL query params, read via `useSearchParams()`
- No component manages filter state in local `useState`

**Container Boundary:**
- Frontend container (nginx): serves static files at port 80 (host: 3000)
- Backend container (Fastify): API only at port 4000
- Named Docker volume `backend_data` mounted at `/data` — SQLite file lives at `/data/todos.db`
- Containers communicate on internal docker-compose network; only host ports are exposed

### Requirements to Structure Mapping

| FR Group | Primary Location |
|---|---|
| FR1–FR7 (Todo CRUD) | `backend/src/routes/todos.ts` + `backend/src/repository/` + `frontend/src/context/TodoContext.tsx` |
| FR8–FR10 (Tags) | `backend/src/db/migrate.ts` (todo_tags schema) + `frontend/src/components/TagChip.tsx` |
| FR11–FR15 (Filtering) | `frontend/src/components/StatusFilterBar.tsx` + `FilterChipBar.tsx` + URL query params in `App.tsx` |
| FR16–FR18 (Reorder/DnD) | `frontend/src/components/DragHandle.tsx` + `TodoItem.tsx` + `backend/src/routes/todos.ts` (PUT /reorder) |
| FR19–FR20 (Empty states) | `frontend/src/components/EmptyState.tsx` |
| FR21–FR23 (Error toast) | `frontend/src/context/ToastContext.tsx` + `frontend/src/components/Toast.tsx` + `frontend/src/api/todos.ts` |
| FR24–FR26 (Docker/SQLite) | `docker-compose.yml` + both `Dockerfile`s + `backend/src/db/migrate.ts` |
| FR27 (Repository abstraction) | `backend/src/repository/ITodoRepository.ts` + `SqliteTodoRepository.ts` |
| FR28 (CI pipeline) | `.github/workflows/ci.yml` |
| FR29 (README) | `README.md` |
| NFR6–NFR7 (Test coverage + E2E) | `*.test.ts` / `*.test.tsx` co-located + `frontend/e2e/todos.spec.ts` |

### Data Flow

**Read path (page load):**
```
App mounts
→ TodoContext dispatches initial fetch
→ fetchTodos() → GET /api/todos
→ Backend: SELECT todos LEFT JOIN todo_tags ORDER BY "order" ASC
→ Response: Todo[]
→ dispatch SET_TODOS
→ Components render from context
```

**Write path (optimistic mutation — e.g., complete toggle):**
```
User clicks checkbox
→ useTodos().toggleComplete(id)
→ dispatch UPDATE_TODO_OPTIMISTIC (instant UI update)
→ updateTodo(id, { ...todo, completed: true }) → PUT /api/todos/:id
→ Backend validates schema → updates todos row + deletes/re-inserts todo_tags
→ On success: no-op (UI already reflects change)
→ On error: dispatch UPDATE_TODO_ROLLBACK + showToast('Something went wrong')
```

**Filter path:**
```
User clicks status filter tab or tag chip
→ useSearchParams().set('status', 'active') or append('tags', 'work')
→ App.tsx reads searchParams → derives filteredTodos from context todos
→ Components re-render with filtered list (no API call — client-side only)
```

## Architecture Validation Results

### Coherence Validation ✅

**Decision Compatibility:**
All technology choices are compatible and well-matched:
- `better-sqlite3` (synchronous) + Fastify (async framework) — compatible; synchronous DB calls within async route handlers have no blocking issues at single-user scale
- React Context + `useReducer` + @dnd-kit — standard React patterns with no conflicts
- Vite + Tailwind + TypeScript — canonical pairing
- URL query params for filter state + React Router `useSearchParams` — correct, matching pairing

**Pattern Consistency:**
- `camelCase` JSON API fields ↔ `snake_case` SQLite columns: consistent; conversion happens exclusively in the repository layer ✅
- Optimistic UI pattern defined for ALL mutations ↔ no loading spinners rule — consistent ✅
- `motion-safe:` Tailwind prefix ↔ WCAG `prefers-reduced-motion` requirement — correctly aligned ✅

### Requirements Coverage Validation ✅

| FR Group | Status |
|---|---|
| FR1–FR7 (Todo CRUD) | ✅ Routes + repository + TodoContext + core components |
| FR8–FR10 (Tags) | ✅ `todo_tags` junction table + TagChip + frontend tag parsing |
| FR11–FR15 (Filtering) | ✅ Client-side filter via URL query params + StatusFilterBar + FilterChipBar |
| FR16–FR18 (DnD reorder) | ✅ @dnd-kit in TodoItem/DragHandle + `PUT /api/todos/reorder` |
| FR19–FR20 (Empty states) | ✅ EmptyState component — two distinct variants |
| FR21–FR23 (Error toast) | ✅ ToastContext + Toast component + catch in `api/todos.ts` |
| FR24–FR26 (Docker/SQLite) | ✅ Both Dockerfiles + docker-compose + named volume |
| FR27 (Repo abstraction) | ✅ `ITodoRepository` interface + `SqliteTodoRepository` |
| FR28 (CI) | ✅ `.github/workflows/ci.yml` with 2-job structure |
| FR29 (README) | ✅ Root `README.md` |
| NFR1–NFR8 | ✅ All NFRs covered — see cross-reference in Requirements to Structure Mapping |

### Gap Analysis & Resolutions

**Tag Input Parsing — RESOLVED**
The UX spec defines `#tag` token parsing from the add-todo input (e.g., `Buy milk #shopping #errand` → title: `Buy milk`, tags: `["shopping", "errand"]`). Architectural decision: **parse on the frontend** in the `AddTodoInput.tsx` submit handler. The API always receives pre-parsed `{ title: string, tags: string[] }` — the backend never sees raw `#tag` syntax. This keeps the backend clean and the parsing logic co-located with the input component.

**Test Coverage Configuration — RESOLVED**
Both frontend and backend Vitest configurations must enforce the 70% coverage threshold:

```typescript
// vite.config.ts (frontend) and vitest.config.ts (backend)
test: {
  coverage: {
    provider: 'v8',
    thresholds: {
      lines: 70,
      functions: 70,
      branches: 70,
      statements: 70,
    },
  },
}
```

CI pipeline runs `vitest run --coverage` for both projects. Build fails if any threshold is not met.

**nginx.conf — Implementation Note**
Configure as static file server with SPA fallback: all non-asset requests fall back to `index.html` to support React Router client-side routing.

### Architecture Completeness Checklist

- [x] Project context thoroughly analyzed
- [x] Scale and complexity assessed
- [x] Technical constraints identified
- [x] Cross-cutting concerns mapped
- [x] Critical decisions documented
- [x] Technology stack fully specified
- [x] Integration patterns defined
- [x] Performance considerations addressed
- [x] Naming conventions established
- [x] Structure patterns defined
- [x] Communication patterns specified
- [x] Process patterns documented
- [x] Complete directory structure defined
- [x] Component boundaries established
- [x] Integration points mapped
- [x] Requirements to structure mapping complete
- [x] Gap analysis complete — all gaps resolved

### Architecture Readiness Assessment

**Overall Status: READY FOR IMPLEMENTATION**
**Confidence Level: High**

**Key Strengths:**
- Tech stack fully prescribed — zero ambiguity for AI agents
- All 29 FRs and 8 NFRs architecturally covered
- Optimistic UI pattern explicitly defined with reducer action types
- Repository abstraction isolates storage from business logic
- Anti-patterns explicitly listed to prevent common AI agent mistakes

**Areas for Future Enhancement (post-v1):**
- Dark mode: add `dark:` Tailwind variants when v2 scope is confirmed
- PWA/offline: add service worker layer in the frontend container
- Database migration tooling: add a proper migration runner (e.g., `better-sqlite3-migrations`) if schema evolves

### Implementation Handoff

**AI Agent Guidelines:**
- Follow all architectural decisions exactly as documented — no creative interpretation
- Use the optimistic mutation pattern for every write operation without exception
- Never access `better-sqlite3` outside of `SqliteTodoRepository.ts`
- Never manage filter state in React local state — URL query params only
- Always JOIN `todo_tags` when querying todos — never return a todo without its `tags` array
- Parse `#tag` tokens in `AddTodoInput.tsx` submit handler before API call
- Configure Vitest coverage thresholds at 70% in both `vite.config.ts` and backend `vitest.config.ts`

**First Implementation Step:**
```bash
# Monorepo scaffold
mkdir nf-todo && cd nf-todo
git init
npm create vite@latest frontend -- --template react-ts
mkdir backend && cd backend && npm init -y
```
