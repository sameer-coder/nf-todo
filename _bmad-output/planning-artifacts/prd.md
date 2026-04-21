---
stepsCompleted: ['step-01-init', 'step-02-discovery', 'step-02b-vision', 'step-02c-executive-summary', 'step-03-success', 'step-04-journeys', 'step-05-domain-skipped', 'step-06-innovation-skipped', 'step-07-project-type', 'step-08-scoping', 'step-09-functional', 'step-10-nonfunctional', 'step-11-polish', 'step-12-complete']
workflowStatus: complete
inputDocuments:
  - '_bmad-output/planning-artifacts/product-brief-nf-todo.md'
  - '_bmad-output/planning-artifacts/product-brief-nf-todo-distillate.md'
workflowType: 'prd'
classification:
  projectType: web_app
  domain: general
  complexity: low
  projectContext: greenfield
---

# Product Requirements Document - nf-todo

**Author:** Sameer
**Date:** 2026-03-24

## Executive Summary

NF-Todo is a full-stack, single-user task manager. The application supports creating, editing, completing, reordering via drag-and-drop, tagging, filtering, and deleting tasks through a responsive interface. React (SPA) communicates over REST with a Fastify/Node.js backend; data is persisted to a SQLite database file via `better-sqlite3` — file-based, serverless, ACID-compliant, with no external hosting required. The storage layer is abstracted behind a repository interface and is swappable. The full system starts with a single `docker-compose up`.

Engineering standards applied reflect what production software requires: multi-stage Docker builds with non-root users and health checks, ≥70% meaningful test coverage spanning unit, integration, and Playwright E2E layers, and documentation covering setup, architecture, testing, and deployment.

**Target user:** A single individual managing personal tasks. No authentication, no multi-tenancy, no collaboration required.

### Project Classification

| Attribute | Value |
|---|---|
| **Project Type** | Web Application — React SPA + REST API |
| **Domain** | General / Personal Productivity |
| **Complexity** | Low — clean domain, single user, no regulatory requirements |
| **Project Context** | Greenfield — built from scratch |

### Resolved Design Decisions

| Decision | Resolution |
|---|---|
| Todo ID format | UUID |
| Todo fields | `id`, `title`, `completed`, `order`, `tags`, `createdAt`, `updatedAt` |
| Edit interaction | Inline editing |
| Delete confirmation | None — immediate delete |
| Empty state | Display a "no todos" message |
| Tag filter logic | OR — item must have at least one selected tag |
| DnD reordering | Pointer-based drag only; no keyboard reordering |
| API error handling | 500 response shows a "something went wrong" toast (bottom right) |
| Storage | SQLite via `better-sqlite3` — file-based, no server required |

## Success Criteria

### User Success

- The user can create, edit (inline), complete, reorder, tag, filter, and delete todos without errors
- All state changes (completion, reorder, edits, deletes) persist across page refresh
- Filtering by status (all / active / completed) and by tag (OR logic) returns correct results immediately
- Drag-and-drop reordering is smooth and the new order persists after drop
- API errors surface as a "something went wrong" toast in the bottom right; the UI does not crash or silently discard data
- Empty states render a clear "no todos" message rather than a blank or broken UI

### Technical Success

- ≥70% meaningful test coverage across unit, integration, and Playwright E2E layers
- ≥5 Playwright E2E tests covering key user journeys (create, complete, delete, reorder, filter)
- CI pipeline (GitHub Actions) passes on every push: tests, build, and linting
- Full system starts with a single `docker-compose up` — frontend and backend both running
- Dockerfiles use multi-stage builds, non-root users, and health checks
- SQLite database file persists data reliably across container restarts
- README covers local setup, architecture overview, testing instructions, and deployment

### Measurable Outcomes

| Outcome | Measure |
|---|---|
| All CRUD operations functional | Integration tests pass; manual verification |
| Test coverage | ≥70% (unit + integration + E2E) |
| E2E tests | ≥5 Playwright tests pass in CI |
| Deployment | `docker-compose up` brings the full system online |
| Persistence | All data survives container restart |
| Error handling | API failures show toast; no silent data loss |

## Product Scope

### MVP — v1 (This PRD)

- Todo CRUD: create, read, update title (inline edit), delete (immediate, no confirmation)
- Complete / incomplete toggle
- Drag-and-drop manual reordering (persisted, pointer-based only)
- Freeform tags — multiple tags per todo item
- Filter by status: all / active / completed
- Filter by tag: OR logic (item must have at least one selected tag)
- Empty state: display a "no todos" message
- Toast notification on API error (500 → "something went wrong", bottom right)
- Responsive UI (React + Tailwind CSS)
- REST API (Node.js + Fastify)
- SQLite persistent storage (`better-sqlite3`) with repository/adapter abstraction
- Dockerfiles: multi-stage builds, non-root users, health checks
- `docker-compose.yml` orchestrating frontend and backend
- Unit + integration + Playwright E2E test suite (≥70% coverage, ≥5 E2E tests)
- CI pipeline (GitHub Actions): tests, build, lint
- README: setup, architecture, testing, deployment

### Out of Scope — v1

- Authentication / authorization
- Multi-user / multi-tenancy
- Real-time / collaborative features
- Notifications or reminders
- Due dates, priorities, or recurring tasks
- Cloud deployment, managed hosting, or CDN

### Potential v2 Additions (Not Committed)

- Dark mode / theme support
- PWA / offline support
- Due dates and priorities

## User Journeys

### Journey 1 — First Use: Getting Started

Alex opens the app for the first time. There are no todos — the empty state shows a clear "no todos" message with the input field prominent. Alex types a task title and hits Enter. The todo appears in the list. Alex adds a few more, then adds tags to some ("work", "personal"). The list feels organized immediately, with no friction.

**Capabilities revealed:** Todo creation, empty state rendering, tag assignment, instant list update.

### Journey 2 — Daily Use: Working Through a List

Alex has 12 todos from yesterday. Some are done, some aren't. Alex checks off 3 completed items using the toggle — they visually shift to a "completed" state. Alex filters by "active" to focus only on what's left. One item's title needs updating — Alex clicks it, edits inline, and presses Enter to save. The list reflects the change immediately. At end of day, Alex filters by "completed" to review what was accomplished.

**Capabilities revealed:** Complete toggle, status filtering (all / active / completed), inline edit (save on Enter or blur), visual distinction between active and completed states.

### Journey 3 — Organization: Tags and Reordering

Alex has a mixed list of work and personal todos. Alex selects the "work" tag filter — only work items appear. Alex then selects both "work" and "urgent" — items with either tag are shown (OR logic). Satisfied with the filter, Alex switches back to "all" and drags a high-priority item to the top of the list. The new order persists after a page refresh.

**Capabilities revealed:** Multi-tag filter with OR logic, tag filter UI (selectable chips/badges), drag-and-drop reorder (pointer-based), order persistence.

### Journey 4 — Error Recovery: API Failure

Alex adds a new todo. The backend is temporarily unreachable — the API returns a 500. A "something went wrong" toast appears in the bottom right and auto-dismisses. The UI does not crash; Alex's existing todos are still visible and interactable. Alex retries once connectivity resumes — the todo saves successfully.

**Capabilities revealed:** Toast error notification (bottom right), graceful degradation on API failure, no data loss on failed write.

### Journey Requirements Summary

| Capability Area | Journeys |
|---|---|
| Todo list management (CRUD) | 1, 2, 3, 4 |
| Status toggle + filtering | 2 |
| Inline editing | 2 |
| Tag assignment + tag filtering (OR) | 1, 3 |
| Drag-and-drop reordering (persisted) | 3 |
| Empty state | 1 |
| Error toast (API failures) | 4 |

## Web Application Specific Requirements

### Project-Type Overview

NF-Todo is a single-page application (SPA) — a React frontend served as static files via nginx inside a Docker container. All application state and data flow through REST API calls to the Fastify backend. There is no server-side rendering, no SEO concern, and no real-time communication layer.

### Technical Architecture Considerations

- **Frontend delivery:** React SPA built with Vite, served as static files via nginx in the frontend container
- **API communication:** All data operations are REST calls over HTTP to the backend container; no shared runtime between frontend and backend
- **State management:** Client-side only — React component state and/or lightweight state management (e.g., Context API or Zustand); no SSR state hydration
- **Routing:** Client-side routing (React Router or equivalent) — single HTML entry point
- **Styling:** Tailwind CSS utility classes; responsive layout using standard Tailwind breakpoints

### Responsive Design

- Layout must function on mobile and desktop viewports
- No minimum viewport width enforced; standard Tailwind responsive prefixes (`sm`, `md`, `lg`) are sufficient
- Drag-and-drop reordering is pointer-based only — no touch-specific DnD requirement, though pointer events on mobile should degrade gracefully

### Performance Targets

- No hard latency SLOs defined
- Vite build optimization (tree-shaking, code splitting) expected as part of the production build
- Docker image size should be minimized via multi-stage build (build stage separate from nginx serving stage)
- SQLite database file stored in a named Docker volume on the backend container to ensure persistence across restarts

## Project Scoping & Phased Development

### MVP Strategy

**MVP Approach:** Complete feature delivery — v1 ships the full stated feature set. There is no reduced MVP within this scope; the feature set is already minimal by design.

**Solo developer project** — no team size constraints; Docker Compose handles full environment setup.

### MVP Feature Set (Phase 1)

**Core user journeys supported:** All four journeys (first use, daily use, organization, error recovery)

**Must-have capabilities:**
- Complete/incomplete toggle
- Drag-and-drop reorder (persisted, pointer-based)
- Freeform tags (multi-tag per item)
- Status filter (all / active / completed)
- Tag filter (OR logic)
- Empty state ("no todos" message)
- Error toast on API failure (bottom right)
- Responsive layout
- SQLite persistence (`better-sqlite3`) behind repository abstraction
- Docker Compose deployment
- CI pipeline + test suite (≥70% coverage, ≥5 E2E tests)
- README

### Post-MVP Roadmap

**Phase 2:** Dark mode / theme support

**Phase 3:** PWA / offline support; due dates and priorities

### Risk Mitigation

**Technical:** No novel technology choices — all stack decisions are established and well-supported. SQLite is the most deployed database in existence; `better-sqlite3` is synchronous and straightforward to use with Fastify.

**Scope creep:** Explicit out-of-scope list in this PRD; any additions require PRD amendment.

**Data integrity:** SQLite provides ACID transactions — unlike JSON file storage, writes are safe against corruption on crash. Repository abstraction keeps storage concerns isolated from route handlers.

---

## Functional Requirements

### Todo Management

- **FR1:** The user can create a new todo item with a title.
- **FR2:** The user can view all todo items in an ordered list.
- **FR3:** The user can edit a todo item's title inline.
- **FR4:** The user can delete a todo item immediately, with no confirmation dialog.
- **FR5:** The user can mark a todo item as complete.
- **FR6:** The user can mark a completed todo item as incomplete (toggle).
- **FR7:** All todo state changes (create, edit, delete, complete, reorder) persist across page refresh and container restart.

### Tags

- **FR8:** The user can assign one or more freeform text tags to a todo item.
- **FR9:** The user can remove a tag from a todo item.
- **FR10:** A todo item can have multiple tags simultaneously.

### Filtering

- **FR11:** The user can filter the todo list by status: all, active (incomplete), or completed.
- **FR12:** The user can filter the todo list by one or more tags.
- **FR13:** When multiple tags are selected, the filter returns todos that have at least one of the selected tags (OR logic).
- **FR14:** Status filter and tag filter can be applied simultaneously.
- **FR15:** Filter state resets to "all" on page refresh.

### Ordering

- **FR16:** The user can manually reorder todo items via drag-and-drop.
- **FR17:** The reordered position of todo items persists across page refresh and container restart.
- **FR18:** Drag-and-drop reordering is initiated via pointer device (mouse or touch pointer events) only.

### Empty & Edge States

- **FR19:** When no todo items exist, the application displays an empty state message.
- **FR20:** When active filters match no todo items, the application displays a "no results" message distinct from the empty state.

### Error Handling

- **FR21:** When the API returns a server error (5xx), the application displays a non-blocking toast notification in the bottom-right corner.
- **FR22:** The toast notification auto-dismisses after a short duration.
- **FR23:** API errors do not cause data loss or crash the interface.

### Infrastructure & Operations

- **FR24:** The full system (frontend and backend) starts with a single `docker-compose up` command.
- **FR25:** The backend exposes a REST API consumed by the frontend.
- **FR26:** Todo data persists in a SQLite database file stored in a named Docker volume on the backend container.
- **FR27:** The storage layer is abstracted behind a repository interface, isolating it from route handlers.
- **FR28:** The CI pipeline runs all tests and fails the build on test failure.

### Documentation

- **FR29:** A README documents local setup, architecture overview, testing instructions, and deployment.

---

## Non-Functional Requirements

### Performance

- **NFR1:** API responses for all todo CRUD operations complete in under 300ms under normal single-user load.
- **NFR2:** The frontend renders updates (create, complete, delete) without full-page reload, providing an immediate visual response.
- **NFR3:** Drag-and-drop reordering renders at 60fps during pointer movement; no frame drops visible during a drag sequence.

### Security

- **NFR4:** The backend validates and sanitises all incoming request body fields before writing to the database, protecting against injection via malformed input.
- **NFR5:** The application runs entirely within a local Docker network; no authentication is required and no port is exposed externally beyond what docker-compose defines.

### Reliability & Quality

- **NFR6:** The unit and integration test suite achieves a minimum of 70% code coverage. The CI pipeline enforces this threshold and fails the build if not met.
- **NFR7:** The end-to-end (Playwright) test suite contains a minimum of 5 tests covering the primary user flows.
- **NFR8:** The CI pipeline (GitHub Actions) runs linting, unit tests, and E2E tests on every push to the main branch, blocking merge on failure.
- **NFR9:** All writes to the SQLite database use ACID-compliant transactions to prevent data corruption on crash or unexpected shutdown.
