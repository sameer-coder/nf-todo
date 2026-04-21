---
stepsCompleted: ['step-01-validate-prerequisites', 'step-02-design-epics', 'step-03-create-stories', 'step-04-final-validation']
workflowStatus: complete
inputDocuments:
  - '_bmad-output/planning-artifacts/prd.md'
  - '_bmad-output/planning-artifacts/architecture.md'
  - '_bmad-output/planning-artifacts/ux-design-specification.md'
---

# nf-todo - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for nf-todo, decomposing the requirements from the PRD, UX Design Specification, and Architecture into implementable stories.

## Requirements Inventory

### Functional Requirements

**Todo Management**

FR1: The user can create a new todo item with a title.
FR2: The user can view all todo items in an ordered list.
FR3: The user can edit a todo item's title inline.
FR4: The user can delete a todo item immediately, with no confirmation dialog.
FR5: The user can mark a todo item as complete.
FR6: The user can mark a completed todo item as incomplete (toggle).
FR7: All todo state changes (create, edit, delete, complete, reorder) persist across page refresh and container restart.

**Tags**

FR8: The user can assign one or more freeform text tags to a todo item.
FR9: The user can remove a tag from a todo item.
FR10: A todo item can have multiple tags simultaneously.

**Filtering**

FR11: The user can filter the todo list by status: all, active (incomplete), or completed.
FR12: The user can filter the todo list by one or more tags.
FR13: When multiple tags are selected, the filter returns todos that have at least one of the selected tags (OR logic).
FR14: Status filter and tag filter can be applied simultaneously.
FR15: Filter state resets to "all" on page refresh.

**Ordering**

FR16: The user can manually reorder todo items via drag-and-drop.
FR17: The reordered position of todo items persists across page refresh and container restart.
FR18: Drag-and-drop reordering is initiated via pointer device (mouse or touch pointer events) only.

**Empty & Edge States**

FR19: When no todo items exist, the application displays an empty state message.
FR20: When active filters match no todo items, the application displays a "no results" message distinct from the empty state.

**Error Handling**

FR21: When the API returns a server error (5xx), the application displays a non-blocking toast notification in the bottom-right corner.
FR22: The toast notification auto-dismisses after a short duration.
FR23: API errors do not cause data loss or crash the interface.

**Infrastructure & Operations**

FR24: The full system (frontend and backend) starts with a single `docker-compose up` command.
FR25: The backend exposes a REST API consumed by the frontend.
FR26: Todo data persists in a SQLite database file stored in a named Docker volume on the backend container.
FR27: The storage layer is abstracted behind a repository interface, isolating it from route handlers.
FR28: The CI pipeline runs all tests and fails the build on test failure.

**Documentation**

FR29: A README documents local setup, architecture overview, testing instructions, and deployment.

---

### NonFunctional Requirements

**Performance**

NFR1: API responses for all todo CRUD operations complete in under 300ms under normal single-user load.
NFR2: The frontend renders updates (create, complete, delete) without full-page reload, providing an immediate visual response.
NFR3: Drag-and-drop reordering renders at 60fps during pointer movement; no frame drops visible during a drag sequence.

**Security**

NFR4: The backend validates and sanitises all incoming request body fields before writing to the database, protecting against injection via malformed input.
NFR5: The application runs entirely within a local Docker network; no authentication is required and no port is exposed externally beyond what docker-compose defines.

**Reliability & Quality**

NFR6: The unit and integration test suite achieves a minimum of 70% code coverage. The CI pipeline enforces this threshold and fails the build if not met.
NFR7: The end-to-end (Playwright) test suite contains a minimum of 5 tests covering the primary user flows.
NFR8: The CI pipeline (GitHub Actions) runs linting, unit tests, and E2E tests on every push to the main branch, blocking merge on failure.
NFR9: All writes to the SQLite database use ACID-compliant transactions to prevent data corruption on crash or unexpected shutdown.

---

### Additional Requirements

_Technical and infrastructure requirements from the Architecture document that constrain implementation._

- **ARCH-1 (Starter / Scaffold):** Both services must be initialized via canonical scaffolding tools — `npm create vite@latest frontend -- --template react-ts` for the frontend and `npm init` + Fastify for the backend. This sets TypeScript strict-mode, Vite build tooling, and project structure. This is the first implementation story (Epic 1 / Story 1).
- **ARCH-2 (Tags Schema):** Tags stored in a separate SQLite junction table `todo_tags(todo_id TEXT, tag TEXT)` with a composite primary key and `ON DELETE CASCADE` on `todo_id`; an index `idx_todo_tags_tag` on the `tag` column. All `GET /api/todos` responses must JOIN `todo_tags` — a todo must never be returned without its tags array.
- **ARCH-3 (Order Persistence):** `order INTEGER` column on the `todos` table; reorder endpoint is `PUT /api/todos/reorder` accepting `{ ids: string[] }` — backend assigns `order = index` for each ID. `GET /api/todos` sorts by `ORDER BY "order" ASC`.
- **ARCH-4 (Filter State in URL):** Status filter and active tag filters stored exclusively in URL query params (`?status=active&tags=work,personal`) via React Router's `useSearchParams()`. No filter state in component `useState`. Filter logic applied client-side against todos from context — no API call on filter change.
- **ARCH-5 (State Management):** React Context API with `useReducer` for todo state (`TodoContext`) and a separate `ToastContext`. No Zustand or other state library. `useTodos()` and `useToast()` custom hooks wrap context consumption.
- **ARCH-6 (Optimistic UI Pattern):** ALL mutations (create, complete, edit, delete, reorder) must follow the optimistic update + rollback pattern: snapshot previous state → dispatch optimistic action → call API → on error dispatch rollback + show toast. No exceptions.
- **ARCH-7 (API Client):** Custom typed fetch wrappers in `frontend/src/api/todos.ts` only — no Axios, no React Query. Functions return typed Promises and throw on error; callers handle the error and trigger toast.
- **ARCH-8 (Input Validation):** Fastify JSON Schema validation on every route body (via ajv). All string fields trimmed of whitespace before DB write; title rejected (400) if empty after trim; tags deduplicated, trimmed, empty strings removed before insert.
- **ARCH-9 (CORS):** `@fastify/cors` registered as a Fastify plugin; `CORS_ORIGIN` environment variable controls allowed origin (docker-compose sets `CORS_ORIGIN=http://localhost:3000`).
- **ARCH-10 (CI Structure):** Two GitHub Actions jobs: `test` (lint + unit + integration for both frontend and backend, ≥70% coverage threshold hard-enforced as build failure) and `e2e` (needs: test; docker-compose up --build → playwright test → docker-compose down).
- **ARCH-11 (ID Generation):** `crypto.randomUUID()` (Node.js built-in) for all UUID generation. No external UUID library.
- **ARCH-12 (Date Format):** All datetimes stored and returned as ISO 8601 strings in API responses — never Unix timestamps.
- **ARCH-13 (No Barrel Files):** No barrel `index.ts` files anywhere in the project — all imports must reference the file directly.
- **ARCH-14 (Co-located Tests):** All unit and integration tests co-located as `*.test.ts` / `*.test.tsx` alongside source files. Playwright E2E tests in `frontend/e2e/` directory.
- **ARCH-15 (cn() Helper):** `cn()` (clsx + tailwind-merge) used for all conditional Tailwind class composition — never call `clsx()` or `twMerge()` directly.
- **ARCH-16 (Loading State):** `isLoading: boolean` in TodoContext initial state for the initial `GET /api/todos` fetch only. Three skeleton rows (`h-10 bg-neutral-100 rounded animate-pulse`) shown during load — no loading spinners on any mutation.
- **ARCH-17 (API Response Shape):** Canonical `Todo` TypeScript interface: `{ id: string, title: string, completed: boolean, order: number, tags: string[], createdAt: string, updatedAt: string }`. All API JSON fields in `camelCase` — never `snake_case` in responses.

---

### UX Design Requirements

_Actionable UX requirements from the UX Design Specification that generate stories with testable acceptance criteria._

UX-DR1: The add-todo input must be auto-focused on app load with no click required — implemented via `useEffect + ref.focus()` on mount.
UX-DR2: After submitting with Enter, the add-todo input must auto-clear and return focus immediately — supporting rapid sequential entry (≥5 tasks in 10 seconds without lifting hands from keyboard).
UX-DR3: Pressing Escape on the add-todo input clears the input without submitting; pressing Escape during inline edit cancels and restores the original title.
UX-DR4: Completed todo items must render with `line-through text-neutral-400` on the title text — visually communicating "done" state distinct from active items.
UX-DR5: Drag handle (≡ icon) must be positioned at the left edge of each todo row as the sole drag affordance; touch target must be ≥44×44px (`w-11 h-full flex items-center justify-center`).
UX-DR6: Drag handle and delete button must use progressive disclosure: `opacity-0 group-hover:opacity-100` with `motion-safe:transition-opacity`; on touch devices these must be visible at reduced opacity (not fully hidden).
UX-DR7: FilterChipBar must render only when ≥1 filter is active; each active filter is shown as an individually dismissible chip (×); a "Clear all" link resets all active filters; bar enters with `motion-safe:animate-in fade-in`.
UX-DR8: TagChip on each todo row is clickable to activate that tag as a filter — adds the tag chip to the FilterChipBar with active styling (`bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200`).
UX-DR9: StatusFilterBar renders three mutually exclusive tab-style buttons (All / Active / Completed); active tab: `font-semibold text-neutral-900`; inactive: `text-neutral-400 hover:text-neutral-600`.
UX-DR10: EmptyState has two visually and textually distinct variants: (a) "No todos yet." — true empty list, no action offered; (b) "No todos match your filters." — filters active but no match, includes "Clear filters" action.
UX-DR11: On initial app load, display 3 skeleton loading rows (`h-10 bg-neutral-100 rounded animate-pulse`) while `GET /api/todos` resolves; no spinners on mutations (optimistic UI masks latency).
UX-DR12: Inline edit activated by single click on a todo title (not double-click); Enter or blur saves; Escape cancels and restores original title; `onBlur` must be debounced to avoid race with Escape key.
UX-DR13: All interactive elements must meet ≥44×44px touch targets — checkbox, delete button, drag handle, filter chips, tag chips (WCAG 2.5.5 AAA).
UX-DR14: All interactive elements must use `focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2`; outlines must never be removed without a visible replacement.
UX-DR15: All CSS animations and transitions must be gated with the `motion-safe:` Tailwind prefix to respect `prefers-reduced-motion` user preference.
UX-DR16: Active filter chip state must communicate activity via both colour change AND `font-semibold` weight change — not colour alone (colour-blind accessibility compliance).
UX-DR17: Toast must use neutral styling (`bg-white border border-neutral-200 text-sm text-neutral-700`), `role="status" aria-live="polite"`, auto-dismiss after 4 seconds; enters with `motion-safe:animate-in slide-in-from-bottom-2 fade-in`.
UX-DR18: App page layout is a single centred column: `min-h-screen bg-white`, content area `mx-auto max-w-2xl px-4 pt-12`; todo list rendered as `divide-y divide-neutral-100` — no card shadows, no borders per row ("Editorial" design direction).
UX-DR19: Tag input via `#tag` tokens in the title field, parsed on submit (space- or comma-separated, e.g. "Buy milk #shopping #errand"); parsed tags separated from the title and stored individually; tags rendered as chips after title text in the row.
UX-DR20: Checkbox implemented as `<button role="checkbox">` (not native `<input type="checkbox">`) for full style control; must have `aria-checked` and `aria-label="Mark complete"`; filled indigo (`bg-indigo-600`) when checked.

---

### FR Coverage Map

FR1: Epic 2 — Create a new todo item with a title
FR2: Epic 2 — View all todo items in an ordered list
FR3: Epic 3 — Inline title editing
FR4: Epic 2 — Delete a todo immediately, no confirmation
FR5: Epic 2 — Mark a todo as complete
FR6: Epic 2 — Toggle incomplete (complete ↔ incomplete)
FR7: Epic 2 — Persist all state across page refresh and container restart
FR8: Epic 3 — Assign one or more freeform tags to a todo
FR9: Epic 3 — Remove a tag from a todo
FR10: Epic 3 — Multiple tags per todo item
FR11: Epic 4 — Filter by status (all / active / completed)
FR12: Epic 4 — Filter by one or more tags
FR13: Epic 4 — Multi-tag OR logic filter
FR14: Epic 4 — Combined status + tag filter
FR15: Epic 4 — Filter state resets to "all" on page refresh
FR16: Epic 5 — Manual drag-and-drop reordering
FR17: Epic 5 — Persisted reorder across refresh and restart
FR18: Epic 5 — Pointer-only DnD initiation
FR19: Epic 2 — Empty state message when no todos exist
FR20: Epic 4 — No-results message distinct from empty state when filters match nothing
FR21: Epic 2 — Toast notification on 5xx API error
FR22: Epic 2 — Toast auto-dismisses
FR23: Epic 2 — API errors cause no data loss or crash
FR24: Epic 1 — Full system starts with `docker-compose up`
FR25: Epic 1 — Backend exposes a REST API
FR26: Epic 1 — SQLite data file in named Docker volume
FR27: Epic 1 — Storage layer behind repository abstraction interface
FR28: Epic 1 — CI pipeline runs all tests and fails on failure
FR29: Epic 6 — README documenting setup, architecture, testing, deployment

## Epic List

### Epic 1: Project Foundation & Infrastructure
The full-stack monorepo is scaffolded and fully runnable with a single `docker-compose up`. The SQLite schema (todos + todo_tags), repository abstraction, Fastify routes with JSON Schema validation, CORS, and GitHub Actions CI pipeline are in place. A health check endpoint confirms the system is live.
**FRs covered:** FR24, FR25, FR26, FR27, FR28
**NFRs addressed:** NFR4 (input validation), NFR5 (Docker network isolation), NFR9 (ACID transactions)
**ARCH addressed:** ARCH-1, ARCH-2, ARCH-3, ARCH-8, ARCH-9, ARCH-10

### Epic 2: Core Todo Management
The user can create, view, complete/incomplete toggle, and delete todos. All state (create, complete, delete) persists across page refresh and container restart. The empty state renders when no todos exist. API errors surface as a neutral auto-dismissing toast in the bottom-right corner — the UI never crashes or silently discards data.
**FRs covered:** FR1, FR2, FR4, FR5, FR6, FR7, FR19, FR21, FR22, FR23
**NFRs addressed:** NFR1 (≤300ms API), NFR2 (no full-page reload)
**UX-DRs addressed:** UX-DR1, UX-DR2, UX-DR4, UX-DR10 (no-todos variant), UX-DR11, UX-DR13, UX-DR14, UX-DR15, UX-DR17, UX-DR18, UX-DR20

### Epic 3: Inline Editing & Tags
The user can edit a todo's title by clicking it in place (inline). The user can assign freeform tags via `#tag` token syntax in the title field on creation; tags display as removable chips inline on each todo row. The user can click the × on any chip to remove that tag.
**FRs covered:** FR3, FR8, FR9, FR10
**UX-DRs addressed:** UX-DR3, UX-DR12, UX-DR19

### Epic 4: Filtering
The user can filter todos by status (all / active / completed) and by one or more tags using OR logic. Both filter types can be applied simultaneously. Active filters are always visible as individually dismissible chips above the list (FilterChipBar). A distinct no-results message with a "Clear filters" action appears when active filters match no todos. Filter state lives in URL query params and resets on page refresh.
**FRs covered:** FR11, FR12, FR13, FR14, FR15, FR20
**UX-DRs addressed:** UX-DR7, UX-DR8, UX-DR9, UX-DR10 (no-results variant), UX-DR16
**ARCH addressed:** ARCH-4

### Epic 5: Drag-and-Drop Reordering
The user can manually reorder todos by dragging the explicit drag handle (≡) at the left edge of each row. The new order persists across page refresh and container restart. Reordering is pointer-based only.
**FRs covered:** FR16, FR17, FR18
**NFRs addressed:** NFR3 (60fps DnD)
**UX-DRs addressed:** UX-DR5, UX-DR6
**ARCH addressed:** ARCH-3 (PUT /api/todos/reorder bulk update)

### Epic 6: E2E Test Suite & Documentation
A Playwright E2E test suite with ≥5 tests covers all primary user flows (create, complete, delete, reorder, filter) and passes in CI. The README fully documents local setup, architecture overview, testing instructions, and deployment.
**FRs covered:** FR29
**NFRs addressed:** NFR6 (≥70% coverage enforced in CI), NFR7 (≥5 Playwright tests), NFR8 (CI blocks on failure)

---

## Epic 1: Project Foundation & Infrastructure

The full-stack monorepo is scaffolded and fully runnable with a single `docker-compose up`. The SQLite schema (todos + todo_tags), repository abstraction, Fastify routes with JSON Schema validation, CORS, and GitHub Actions CI pipeline are in place. A health check endpoint confirms the system is live.

### Story 1.1: Initialize Monorepo Scaffolding and Project Structure

As a developer,
I want the monorepo initialized with both the frontend and backend scaffolded using their canonical tooling,
So that all subsequent development has a consistent, typed, and correctly structured starting point.

**Acceptance Criteria:**

**Given** a clean checkout of the repo
**When** the developer runs `npm create vite@latest frontend -- --template react-ts` and installs all dependencies per the architecture spec (Tailwind, clsx, tailwind-merge, react-router-dom, @dnd-kit/core, @dnd-kit/sortable, Vitest, Playwright, @testing-library/react)
**Then** `frontend/` exists with `src/` structure matching the architecture spec (components/, hooks/, context/, api/, types/, utils/)
**And** `tailwind.config.js` is configured with `fontFamily: { sans: ['Inter', 'sans-serif'] }`
**And** `vite.config.ts` is configured with Vitest and coverage (v8 provider, 70% threshold enforced)

**Given** the backend scaffold is initialized
**When** the developer runs `npm init` and installs Fastify, better-sqlite3, TypeScript, ts-node, and Vitest per the architecture spec
**Then** `backend/` exists with `src/` structure matching the architecture spec (routes/, repository/, db/, plugins/, types/)
**And** `tsconfig.json` is configured with strict TypeScript mode
**And** a root `.gitignore` covers `node_modules`, `dist`, `*.db`, `.env`
**And** a root `docker-compose.yml` skeleton and `.github/workflows/ci.yml` placeholder exist at the monorepo root

### Story 1.2: Docker Containerization and Cold-Start

As a developer,
I want both services containerized and orchestrated by docker-compose,
So that the entire system starts with a single `docker-compose up` and the health check endpoint confirms liveness.

**Acceptance Criteria:**

**Given** Docker is installed
**When** `docker-compose up --build` is run from the repo root
**Then** the frontend container (nginx) is accessible at `http://localhost:3000`
**And** the backend container (Fastify) is accessible at `http://localhost:4000`
**And** `GET http://localhost:4000/api/health` returns `200 OK`
**And** no manual setup steps are required beyond Docker being installed

**Given** the backend Dockerfile
**When** it is built
**Then** it uses a multi-stage build (build stage + runtime stage), runs as a non-root user, and includes a Docker `HEALTHCHECK` directive targeting `/api/health`

**Given** the frontend Dockerfile
**When** it is built
**Then** it uses a multi-stage build (Vite build stage + nginx runtime stage), runs as a non-root user, and includes an `nginx.conf` that serves `index.html` for all routes (SPA fallback)

**Given** the docker-compose configuration
**When** the backend container restarts
**Then** the named volume `backend_data` (mounted at `/data`) persists — no data is lost
**And** `CORS_ORIGIN`, `PORT`, and `DB_PATH` environment variables are set correctly via docker-compose

### Story 1.3: Database Schema and Repository Abstraction

As a developer,
I want the SQLite schema created via a migration runner and storage access isolated behind a repository interface,
So that route handlers never call `better-sqlite3` directly and the storage layer is swappable.

**Acceptance Criteria:**

**Given** the backend starts
**When** `migrate.ts` runs (called from `index.ts` on startup)
**Then** the `todos` table exists: `(id TEXT PRIMARY KEY, title TEXT NOT NULL, completed INTEGER NOT NULL DEFAULT 0, "order" INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)`
**And** the `todo_tags` table exists: `(todo_id TEXT NOT NULL REFERENCES todos(id) ON DELETE CASCADE, tag TEXT NOT NULL, PRIMARY KEY (todo_id, tag))`
**And** the index `idx_todo_tags_tag` exists on `todo_tags(tag)`

**Given** `ITodoRepository` is defined
**When** `SqliteTodoRepository` is instantiated
**Then** it implements every method of `ITodoRepository` (getAll, getById, create, update, delete, reorder)
**And** `getAll` returns todos sorted by `ORDER BY "order" ASC` with tags as `string[]` via LEFT JOIN
**And** `create` generates IDs via `crypto.randomUUID()` and stores `createdAt`/`updatedAt` as ISO 8601 strings
**And** `update` deletes + re-inserts `todo_tags` rows for the given `todo_id` on every call
**And** all writes use ACID-compliant transactions (better-sqlite3 `.transaction()`)

**Given** `SqliteTodoRepository` unit tests run
**When** an in-memory SQLite DB is used as the test fixture
**Then** all CRUD operations are tested and pass
**And** the test file is co-located at `SqliteTodoRepository.test.ts`

### Story 1.4: Todo REST API Routes with Input Validation

As a developer,
I want all `/api/todos` REST endpoints implemented with Fastify JSON Schema validation and CORS configured,
So that the frontend can perform all todo operations and malformed payloads are rejected before reaching the database.

**Acceptance Criteria:**

**Given** all routes are registered in `backend/src/routes/todos.ts`
**When** the backend starts
**Then** the following endpoints exist and return correct responses:
- `GET /api/todos` → `200` array of `Todo[]` sorted by `order`; supports `?tags=` and `?status=` query params for server-side filtering
- `POST /api/todos` → `201` single `Todo`; body: `{ title: string, tags?: string[] }`
- `PUT /api/todos/:id` → `200` single `Todo`; body: `{ title: string, completed: boolean, tags: string[] }`
- `DELETE /api/todos/:id` → `204` No Content
- `PUT /api/todos/reorder` → `204` No Content; body: `{ ids: string[] }` — assigns `order = index` for each

**Given** a POST `/api/todos` request with an empty title (after trim)
**When** Fastify validates the schema
**Then** a `400 Bad Request` is returned before the handler runs

**Given** the `@fastify/cors` plugin is registered
**When** the frontend at `http://localhost:3000` makes a cross-origin request
**Then** the response includes the correct CORS headers matching `CORS_ORIGIN=http://localhost:3000`

**Given** all API JSON responses
**When** any todo is returned
**Then** all fields use `camelCase` (`createdAt`, `updatedAt`) — never `snake_case`
**And** `tags` is always a `string[]` — never null or absent

**Given** integration tests run (co-located `todos.test.ts`)
**When** Vitest executes them against a test server with in-memory SQLite
**Then** all routes are covered, tests pass, and input sanitisation (title trim, tag trim/deduplication/empty-removal) is verified

### Story 1.5: GitHub Actions CI Pipeline

As a developer,
I want a GitHub Actions CI pipeline with lint, unit/integration tests (with coverage enforcement), and E2E sequencing,
So that every push to main is automatically validated and the build fails if quality gates are not met.

**Acceptance Criteria:**

**Given** a push to the `main` branch
**When** the `test` job runs
**Then** ESLint and TypeScript type-checking runs for both frontend and backend
**And** Vitest runs all unit and integration tests for both frontend and backend
**And** the build fails if test coverage drops below 70% (Vitest coverage threshold config)

**Given** the `test` job passed
**When** the `e2e` job runs
**Then** the job is declared with `needs: test` to enforce sequencing
**And** `docker-compose up --build` brings the system online
**And** Playwright runs the E2E test suite (even if only a smoke test placeholder at this stage)
**And** `docker-compose down` tears the system down afterwards

**Given** any job in the pipeline fails
**When** a PR targets the `main` branch
**Then** the merge is blocked and the failing step is clearly identified in the GitHub Actions UI

---

## Epic 2: Core Todo Management

The user can create, view, complete/incomplete toggle, and delete todos. All state persists across page refresh and container restart. The empty state renders when no todos exist. API errors surface as a neutral auto-dismissing toast in the bottom-right corner — the UI never crashes or silently discards data.

### Story 2.1: App Shell, Layout, and Global State Infrastructure

As a developer,
I want the React app shell, TodoContext, ToastContext, and API client wired together with the Editorial layout,
So that all subsequent UI stories have the shared infrastructure they need to render and mutate state.

**Acceptance Criteria:**

**Given** the app renders
**When** it loads in the browser
**Then** the root layout is `min-h-screen bg-white font-sans` using Inter (loaded via `<link>` preconnect in `index.html`)
**And** the content area is `mx-auto max-w-2xl px-4 pt-12`
**And** `TodoContext` (with `useReducer`) and `ToastContext` are both provided at the app root
**And** `App.tsx` dispatches an initial `GET /api/todos` fetch on mount and populates `TodoContext` via `SET_TODOS`
**And** `useTodos()` and `useToast()` custom hooks are implemented and exported from their respective context files

**Given** the initial fetch is in flight
**When** `isLoading` is `true` in `TodoContext`
**Then** 3 skeleton rows are shown: `h-10 bg-neutral-100 rounded animate-pulse`

**Given** the `cn()` helper is needed anywhere in the app
**When** a component imports it
**Then** it is imported from `src/utils/cn.ts` — no direct `clsx()` or `twMerge()` calls elsewhere

### Story 2.2: Add Todo Input and Todo List Display

As a user,
I want to type a task title and press Enter to add it to the list, and see all my todos displayed in order,
So that I can quickly capture tasks and see everything I need to do.

**Acceptance Criteria:**

**Given** the app loads
**When** the page renders
**Then** the `AddTodoInput` component is visible at the top of the content area
**And** the input is auto-focused via `useEffect + ref.focus()` — no click required
**And** the input has placeholder text "Add a task…" styled `text-neutral-400`
**And** the input container uses `border-b border-neutral-200 pb-3 mb-4`

**Given** a user types a title and presses Enter
**When** the form submits
**Then** an optimistic `ADD_TODO_OPTIMISTIC` action is dispatched immediately — the item appears in the list before API confirmation
**And** `POST /api/todos` is called with `{ title, tags: [] }`
**And** the input clears and focus returns to it immediately
**And** on API success, no additional UI change occurs (optimistic state is already correct)
**And** on API failure, `ADD_TODO_ROLLBACK` is dispatched (item removed) and a toast is shown

**Given** a user presses Enter with an empty input
**When** the form attempts to submit
**Then** the submit is silently prevented — no API call, no error text shown

**Given** todos exist in `TodoContext`
**When** the list renders
**Then** todos are displayed as a `divide-y divide-neutral-100` list sorted by `order`
**And** each row is `flex items-center gap-3 py-3 group`

### Story 2.3: Complete/Incomplete Toggle

As a user,
I want to click a checkbox on any todo to mark it complete or incomplete,
So that I can track what I've done and what still needs attention.

**Acceptance Criteria:**

**Given** a todo is in the active (incomplete) state
**When** the user clicks its `Checkbox`
**Then** `UPDATE_TODO_OPTIMISTIC` is dispatched immediately — the checkbox visually fills to `bg-indigo-600` and the title renders `line-through text-neutral-400`
**And** `PUT /api/todos/:id` is called with `completed: true`
**And** on API error, `UPDATE_TODO_ROLLBACK` is dispatched and a toast is shown

**Given** a todo is in the completed state
**When** the user clicks its `Checkbox`
**Then** the optimistic action reverses the completed state — checkbox empties and strikethrough is removed
**And** `PUT /api/todos/:id` is called with `completed: false`

**Given** the `Checkbox` component renders
**When** inspected
**Then** it is implemented as `<button role="checkbox">` (not native `<input type="checkbox">`)
**And** it has `aria-checked` set to the current completed state and `aria-label="Mark complete"`
**And** its touch target meets ≥44×44px
**And** it has `focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2`

### Story 2.4: Delete Todo

As a user,
I want to delete a todo by clicking the delete icon on its row,
So that I can permanently remove tasks I no longer need without any confirmation step.

**Acceptance Criteria:**

**Given** a todo row
**When** the user hovers over it
**Then** the `DeleteButton` icon becomes visible via `opacity-0 group-hover:opacity-100 motion-safe:transition-opacity`
**And** on touch devices the icon is visible at reduced opacity (not fully hidden)

**Given** the user clicks the `DeleteButton`
**When** the click fires
**Then** `DELETE_TODO_OPTIMISTIC` is dispatched immediately — the row is removed from the list
**And** `DELETE /api/todos/:id` is called
**And** on API error, `DELETE_TODO_ROLLBACK` is dispatched (row reappears) and a toast is shown

**Given** the `DeleteButton` renders
**When** inspected
**Then** it has `aria-label="Delete todo"` and a touch target of ≥44×44px
**And** hover state shows `text-rose-500`; resting state shows `text-neutral-400`

### Story 2.5: Empty State and Toast Error Notification

As a user,
I want to see a clear empty state when I have no todos, and a calm non-blocking toast when an API error occurs,
So that I always understand what the app is showing me and errors never disrupt my workflow.

**Acceptance Criteria:**

**Given** the todo list is empty
**When** the app renders
**Then** the `EmptyState` component renders with the copy "No todos yet."
**And** it is styled `flex flex-col items-center justify-center py-16 text-neutral-400 text-sm`
**And** no action button is offered (the add input above is the call to action)

**Given** any API call returns a 5xx error
**When** the error is caught in the API client
**Then** `showToast('Something went wrong')` is called
**And** the `Toast` component renders at `fixed bottom-4 right-4 z-50` with neutral styling: `bg-white border border-neutral-200 text-sm text-neutral-700`
**And** the toast has `role="status" aria-live="polite"`
**And** the toast auto-dismisses after 4 seconds
**And** the toast enters with `motion-safe:animate-in slide-in-from-bottom-2 fade-in`

**Given** an API error occurs during any mutation
**When** the toast is displayed
**Then** the rest of the list remains fully interactive — no page crash or disabled UI

**Given** all interactive elements in this epic
**When** navigated via keyboard
**Then** focus rings use `focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2`
**And** all animations/transitions use the `motion-safe:` Tailwind prefix

---

## Epic 3: Inline Editing & Tags

The user can edit a todo's title by clicking it in place (inline). The user can assign freeform tags via `#tag` token syntax in the title field on creation; tags display as removable chips inline on each todo row. The user can click the × on any chip to remove that tag.

### Story 3.1: Inline Todo Title Editing

As a user,
I want to click on a todo's title to edit it in place,
So that I can correct or update a task without any modal or separate form.

**Acceptance Criteria:**

**Given** a todo row is in the default (non-editing) state
**When** the user clicks the title text
**Then** the title span is replaced by an `InlineEditInput` — a styled `<input type="text">` pre-filled with the current title
**And** the input is auto-selected on activation (cursor selects all text)
**And** the input is styled `w-full bg-transparent outline-none focus:ring-1 focus:ring-indigo-300 rounded px-1 text-[15px] text-neutral-900`

**Given** the inline edit input is active
**When** the user presses Enter or blurs the input
**Then** `UPDATE_TODO_OPTIMISTIC` is dispatched with the new title immediately
**And** `PUT /api/todos/:id` is called with the updated title
**And** on API error, `UPDATE_TODO_ROLLBACK` restores the original title and a toast is shown

**Given** the inline edit input is active
**When** the user presses Escape
**Then** the input is dismissed and the original title is restored — no API call is made

**Given** the user edits the title to be empty or whitespace only and presses Enter or blurs
**When** the submit is evaluated
**Then** the submit is silently prevented and the original title is restored — no API call, no error text

**Given** `InlineEditInput` uses `onBlur` to save
**When** the user presses Escape
**Then** the Escape handler fires before `onBlur` saves — a debounce or flag prevents the race condition

### Story 3.2: Tag Assignment via #tag Token Parsing

As a user,
I want to include `#tag` tokens in my task title when creating a todo,
So that tags are automatically parsed and attached to the todo without requiring a separate input.

**Acceptance Criteria:**

**Given** the user types `Buy milk #shopping #errand` in the add-todo input and presses Enter
**When** the form submits
**Then** the title is stored as `"Buy milk"` (tokens stripped)
**And** `POST /api/todos` is called with `{ title: "Buy milk", tags: ["shopping", "errand"] }`
**And** the todo appears in the list with title "Buy milk" and tag chips "shopping" and "errand"

**Given** a title with no `#tag` tokens
**When** the form submits
**Then** the title is used as-is and `tags: []` is sent — no change in existing behaviour

**Given** duplicate `#tag` tokens in the input (e.g. `Task #work #work`)
**When** the tags are parsed
**Then** duplicates are deduplicated — only one `"work"` tag is stored

**Given** a `#tag` with no content (e.g. `Task #`)
**When** the tags are parsed
**Then** the empty token is ignored — not stored or displayed

### Story 3.3: Tag Display as Chips on Todo Rows

As a user,
I want to see the tags on each todo displayed as small chips inline on the row,
So that I can quickly see how a task is categorized without opening any detail view.

**Acceptance Criteria:**

**Given** a todo has one or more tags
**When** the todo row renders
**Then** each tag is displayed as a `TagChip` — `rounded-full px-2 py-0.5 text-xs font-medium bg-neutral-100 text-neutral-600` — after the title text

**Given** a todo has no tags
**When** the todo row renders
**Then** no chip area is shown — the row layout is unchanged

**Given** a `TagChip` renders
**When** inspected for accessibility
**Then** the chip is keyboard-focusable with a `focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2` ring

### Story 3.4: Tag Removal from a Todo

As a user,
I want to remove an individual tag from a todo by clicking the × on its chip,
So that I can keep my tags accurate without re-creating the entire todo.

**Acceptance Criteria:**

**Given** a todo row displays tag chips
**When** the user clicks the × button on a `TagChip`
**Then** `UPDATE_TODO_OPTIMISTIC` is dispatched with the tag removed from the tags array
**And** `PUT /api/todos/:id` is called with the full updated todo body (title, completed, remaining tags)
**And** the chip disappears from the row immediately
**And** on API error, `UPDATE_TODO_ROLLBACK` restores the original tag set and a toast is shown

**Given** a `TagChip` × button
**When** inspected
**Then** it has `aria-label="Remove tag [tag name]"` and a touch target of ≥44×44px

**Given** removing the last tag from a todo
**When** the × is clicked
**Then** the todo row still renders correctly with no chip area — no visual artifact left behind
---

## Epic 4: Filtering

The user can filter todos by status (all / active / completed) and by one or more tags using OR logic. Both filter types can be applied simultaneously. Active filters are always visible as individually dismissible chips above the list (FilterChipBar). A distinct no-results message with a "Clear filters" action appears when active filters match no todos. Filter state lives in URL query params and resets on page refresh.

### Story 4.1: Status Filter Bar (All / Active / Completed)

As a user,
I want to click a status tab to filter my todo list by completion state,
So that I can focus on only the tasks relevant to me at any given moment.

**Acceptance Criteria:**

**Given** the app renders with todos
**When** the `StatusFilterBar` is displayed
**Then** three tab-style buttons are shown: "All", "Active", "Completed"
**And** the active tab has `font-semibold text-neutral-900`; inactive tabs have `text-neutral-400 hover:text-neutral-600`
**And** the tabs are mutually exclusive — only one can be active at a time

**Given** the user clicks the "Active" tab
**When** the filter is applied
**Then** the URL updates to `?status=active` via `useSearchParams()`
**And** only todos where `completed === false` are shown in the list
**And** no API call is made — filtering is client-side against `TodoContext` todos

**Given** the user clicks the "Completed" tab
**When** the filter is applied
**Then** the URL updates to `?status=completed`
**And** only todos where `completed === true` are shown

**Given** the user refreshes the page
**When** the app loads
**Then** the `status` query param is absent — filter state resets to "All" (FR15)

### Story 4.2: Tag Filter — Click Chip to Filter

As a user,
I want to click a tag chip on any todo row to filter the list to todos with that tag,
So that I can instantly focus on a specific category of tasks.

**Acceptance Criteria:**

**Given** a `TagChip` is displayed on a todo row
**When** the user clicks it
**Then** the tag is added to the active tag filter in the URL: `?tags=work`
**And** the chip on the todo row transitions to active styling: `bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200`
**And** the list updates client-side to show only todos that have the selected tag
**And** no API call is made — filtering is applied against `TodoContext` todos

**Given** a tag filter is already active and the user clicks a different `TagChip`
**When** the second tag is added
**Then** the URL updates to `?tags=work,personal`
**And** the list shows todos that have **either** "work" **or** "personal" — OR logic (FR13)

**Given** the user clicks a `TagChip` that is already an active filter
**When** it is clicked again
**Then** the tag is removed from the active filter set (toggle behaviour)

### Story 4.3: Active Filter Chip Bar with Dismiss Controls

As a user,
I want to always see which filters are currently active as dismissible chips above the list,
So that I know exactly what lens I'm looking through and can remove any filter instantly.

**Acceptance Criteria:**

**Given** no filters are active
**When** the list renders
**Then** the `FilterChipBar` is not rendered — no empty bar is shown

**Given** one or more filters are active (status or tag)
**When** the `FilterChipBar` renders
**Then** it appears above the todo list with `motion-safe:animate-in fade-in`
**And** each active filter is shown as a `FilterActiveChip`: `bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200`
**And** each chip has a × dismiss button with `aria-label="Remove filter [filter name]"`
**And** a "Clear all" text link resets all active filters

**Given** the user clicks × on an individual `FilterActiveChip`
**When** the dismiss fires
**Then** that filter is removed from the URL query params
**And** the list immediately reflects the updated filter state
**And** if no filters remain, the `FilterChipBar` disappears

**Given** an active filter chip communicates its active state
**When** rendered
**Then** the state is communicated via both `bg-indigo-50 text-indigo-700` colour change AND `font-semibold` weight change — not colour alone

### Story 4.4: Combined Status + Tag Filter and No-Results State

As a user,
I want status and tag filters to work together simultaneously, and see a clear message with a reset action when my combined filters match nothing,
So that I have full filtering power without ever landing on a confusing blank screen.

**Acceptance Criteria:**

**Given** both a status filter (`?status=active`) and a tag filter (`?tags=work`) are active
**When** the list is derived
**Then** the list shows only todos that are **both** active (incomplete) **and** have the tag "work" — both filters apply simultaneously (FR14)

**Given** the active filters match no todos
**When** the filtered list is empty
**Then** the `EmptyState` "no-results" variant renders: `"No todos match your filters."` with a "Clear filters" `<button>` inline
**And** clicking "Clear filters" resets all URL query params and shows the full list

**Given** the "no-results" state
**When** inspected
**Then** it is visually and textually distinct from the "No todos yet." true-empty state — different copy, different action offered (FR20)

**Given** the user refreshes the page with active filters in the URL
**When** the app loads
**Then** filter state is absent — the list defaults to showing all todos (FR15)

---

## Epic 5: Drag-and-Drop Reordering

The user can manually reorder todos by dragging the explicit drag handle (≡) at the left edge of each row. The new order persists across page refresh and container restart. Reordering is pointer-based only.

### Story 5.1: Drag Handle Component and DnD Wiring

As a user,
I want to press and hold the drag handle on a todo row to initiate a drag,
So that I have an explicit, unambiguous affordance for reordering that doesn't conflict with clicking to edit.

**Acceptance Criteria:**

**Given** a todo row renders
**When** in the default state
**Then** a `DragHandle` (≡ icon) is visible at the left edge of the row at `opacity-0`
**And** on row hover it becomes `opacity-100` via `motion-safe:transition-opacity group-hover:opacity-100`
**And** on touch devices it is visible at reduced opacity (not fully hidden)
**And** the touch target is `w-11 h-full flex items-center justify-center` (≥44×44px)

**Given** the app uses @dnd-kit
**When** the todo list renders
**Then** the list is wrapped in a `DndContext` and `SortableContext` (from @dnd-kit/sortable)
**And** each `TodoItem` uses the `useSortable` hook
**And** the `DragHandle` element is set as the drag activator — drag initiates only from the handle, not the full row

**Given** a user presses and holds the `DragHandle`
**When** the pointer moves
**Then** the dragged row lifts with `shadow-md opacity-75 bg-white`
**And** other rows shift to indicate the drop target position
**And** the interaction renders at 60fps with no visible frame drops (NFR3)

**Given** the `DragHandle`
**When** inspected for accessibility
**Then** it has `aria-label="Drag to reorder"`
**And** @dnd-kit's keyboard sensor is active, enabling keyboard-based reordering

### Story 5.2: Persist Reorder via API

As a user,
I want the new order of my todos to persist after I drop them in a new position,
So that my manually arranged list survives page refresh and container restart.

**Acceptance Criteria:**

**Given** the user drops a todo in a new position
**When** the `onDragEnd` handler fires
**Then** `REORDER_OPTIMISTIC` is dispatched immediately with the reordered `Todo[]` array — the list reflects the new order before API confirmation
**And** `PUT /api/todos/reorder` is called with `{ ids: string[] }` in the new order
**And** on API success, no further UI change occurs (optimistic state is already correct)
**And** on API error, `REORDER_ROLLBACK` is dispatched restoring the previous order and a toast is shown

**Given** `PUT /api/todos/reorder` is called
**When** the backend processes it
**Then** the backend assigns `order = index` for each id in the array
**And** subsequent `GET /api/todos` returns todos sorted by the new `order` values
**And** the order persists across page refresh and container restart (FR17)

**Given** the reorder is pointer-based only (FR18)
**When** the drag is initiated
**Then** only pointer events trigger the drag — the `PointerSensor` from @dnd-kit is configured as the primary sensor
---

## Epic 6: E2E Test Suite & Documentation

A Playwright E2E test suite with ≥5 tests covers all primary user flows (create, complete, delete, reorder, filter) and passes in CI. The README fully documents local setup, architecture overview, testing instructions, and deployment.

### Story 6.1: Playwright E2E Test Suite (≥5 Tests)

As a developer,
I want a Playwright E2E test suite with at least 5 tests covering the primary user flows,
So that CI can verify the full user experience end-to-end before any merge to main.

**Acceptance Criteria:**

**Given** the Playwright test suite in `frontend/e2e/todos.spec.ts`
**When** all tests run against a live `docker-compose up --build` environment
**Then** the following 5 tests (minimum) exist and pass:
1. **Create todo** — user types a title, presses Enter, item appears in the list
2. **Complete todo** — user clicks the checkbox, item shows strikethrough and completed styling
3. **Delete todo** — user hovers a row, clicks the delete icon, item is removed from the list
4. **Reorder todos** — user drags a todo to a new position; after page refresh the new order is maintained
5. **Filter by status** — user clicks "Active", completed todos are hidden; user clicks "All", they reappear

**Given** a test runs
**When** an API call is part of the flow
**Then** the test waits for the network request to settle before asserting (no arbitrary timeouts)

**Given** the E2E tests run in CI
**When** the `e2e` GitHub Actions job executes
**Then** all tests pass without flakiness on the first run
**And** a failing test causes the CI job to fail and blocks merge (NFR8)

**Given** the Playwright configuration (`playwright.config.ts`)
**When** inspected
**Then** it targets `http://localhost:3000` (the nginx frontend container)
**And** it is configured to run in CI headless mode

### Story 6.2: Project README

As a developer (or any person evaluating the project),
I want a comprehensive README at the repo root,
So that I can set up, run, test, and understand the project without any prior context.

**Acceptance Criteria:**

**Given** the `README.md` at the monorepo root
**When** read by a developer with no prior context
**Then** it contains all of the following sections, each complete and accurate:
1. **Project Overview** — what nf-todo is, the tech stack (React, Fastify, SQLite, Docker), and the single-user scope
2. **Local Setup** — prerequisites (Docker, Node.js versions), `git clone` → `docker-compose up` walkthrough with exact commands
3. **Architecture Overview** — monorepo structure, frontend/backend separation, repository abstraction, SQLite volume, and communication pattern
4. **Testing Instructions** — how to run unit tests (`npm test` in each service), how to run E2E tests locally (Playwright command), and how coverage is enforced
5. **Deployment** — how `docker-compose up --build` starts the full system; description of what each container does; how to verify health via `/api/health`

**Given** the README setup instructions
**When** followed from a clean environment (only Docker installed)
**Then** the full system is running at `http://localhost:3000` with no additional manual steps

**Given** the README
**When** reviewed
**Then** it contains no placeholder text, no TODO comments, and no unresolved sections (FR29)