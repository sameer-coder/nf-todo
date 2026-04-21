---
title: "Product Brief Distillate: nf-todo"
type: llm-distillate
source: "product-brief-nf-todo.md"
created: "2026-03-24"
purpose: "Token-efficient context for downstream PRD and architecture creation"
---

# NF-Todo — Detail Pack

## Project Identity

- **Project name:** nf-todo
- **Primary purpose:** Portfolio/showcase piece demonstrating enterprise-grade engineering practices on a simple domain
- **Secondary purpose:** Learning reference for intermediate full-stack developers
- **End user:** Single individual managing personal tasks — no auth, no multi-tenancy, no collaboration

## Tech Stack (Confirmed, Prescribed)

- **Frontend:** React + Tailwind CSS (no specific React framework mandated — plain React assumed, not Next.js)
- **Backend:** Node.js + Fastify — REST API pattern
- **Storage:** JSON file — intentionally simple, NOT a database; storage layer must be abstracted/decoupled so it can be swapped in future
- **Containerization:** Dockerfiles for both frontend and backend; multi-stage builds, non-root users, health checks required
- **Orchestration:** `docker-compose.yml` — single `docker-compose up` must start the full system
- **CI:** GitHub Actions (confirmed)

## Feature Requirements (Requirements Hints)

### Core CRUD
- Create a todo item (title/text required at minimum)
- Read/list all todo items
- Update todo item text (in-place edit implied)
- Delete todo item (with or without confirmation — to be defined in PRD)
- Toggle complete / incomplete per item

### Filtering
- Filter by status: **all**, **active** (incomplete), **completed**
- Filter by tag — **confirmed in scope for v1**; filtering by one or more tags narrows the visible todo list

### Drag-and-Drop Reordering
- Manual reorder of todos via drag-and-drop
- Reorder must be persisted (order stored in JSON file)
- DnD library choice not specified — common options: `@dnd-kit/core`, `react-beautiful-dnd` (deprecated), `react-dnd`; recommend `@dnd-kit` as it is actively maintained and accessible

### Tags
- Multiple tags per todo item (user creates them freeform — no predefined taxonomy)
- Tags are strings associated with a todo; no separate tag management entity needed unless PRD decides otherwise
- **Open question:** Is there a maximum tag count per item? PRD should define.
- **Open question:** Is filtering by tag in scope for v1? (User did not confirm)

### UI / UX
- Responsive — must function on mobile and desktop viewports
- No specific breakpoints mandated; standard Tailwind responsive prefixes sufficient
- Accessible — zero critical WCAG 2.1 AA violations
- WCAG enforcement tool not specified — recommend axe-core (available as Jest plugin and Playwright integration)

## Quality Requirements (Non-Negotiable)

- **Test coverage:** ≥70% — explicitly described as "meaningful" (not line-count padding)
- **E2E tests:** ≥5 Playwright tests; these count toward the 70% but Playwright is a separate concern
- **Accessibility:** Zero critical WCAG 2.1 AA violations
- **CI gates:** Tests must pass in CI; build must succeed
- **README:** Must cover local setup, architecture overview, testing instructions, and deployment

## Test Strategy Signals

- **Unit tests:** Pure functions, utilities, data transformation logic (frontend + backend)
- **Integration tests:** API route handlers with mocked/real file storage; testing CRUD operations end-to-end at the API layer
- **E2E (Playwright):** At least 5 tests covering key user journeys: create todo, complete todo, delete todo, reorder, filter — PRD should enumerate specific scenarios
- **Testing library not specified for frontend unit tests** — Vitest + React Testing Library is the natural choice given React + Vite ecosystem; Jest as alternative

## Architecture Signals

- Frontend and backend are **separate containers** — they communicate over HTTP (REST), not sharing a runtime
- Backend owns the JSON file — frontend never directly reads/writes to disk
- Storage abstraction required: backend should have a repository/adapter pattern so JSON file can be replaced with a database without touching route handlers
- Port mapping: standard convention (e.g., frontend on 3000, backend on 4000) — to be defined in architecture doc
- **No SSR required** — plain React SPA served as static files (nginx or equivalent in frontend container)

## Scope Decisions (Confirmed Out of Scope for v1)

- Authentication / authorization
- Multi-user / multi-tenancy
- Real-time / WebSocket / SSE
- Notifications, reminders
- Due dates, priorities, recurring tasks
- Relational or document database (PostgreSQL, MongoDB, SQLite, etc.)
- Cloud deployment, managed hosting, CDN

## Competitive Context (For PRD Positioning)

- 2,765+ public todo-app repos on GitHub — market is saturated with throwaway demos
- Most lack: containerization, meaningful test coverage, accessibility compliance, CI enforcement
- Notable references in the space:
  - `maciekt07/TodoApp` — React todo with P2P sync, PWA, theme customization — feature-heavy, not an engineering quality reference
  - `taniarascia/mvc` — clean MVC plain JS todo — architecture-focused but no testing or infra
  - TodoMVC — framework comparison tool, not a production reference
- NF-Todo's differentiation is **engineering discipline**, not feature breadth — this must be maintained as the primary narrative throughout all downstream docs

## Open Questions (Not Resolved in Brief)

1. **Todo item data model:** What fields beyond text and complete status? Created-at timestamp? Updated-at? ID format (UUID vs sequential)?
2. **In-line editing vs. modal:** How does the user edit a todo's text? PRD must define the interaction pattern.
3. **Delete confirmation:** Is a confirmation step required on delete, or is it immediate? (Accessibility considerations apply to both.)
4. **Empty state:** What does the UI show when there are no todos, or no todos matching the active filter?
5. **Maximum tag count per item:** Implied unlimited; PRD should set a practical limit or confirm unbounded.
6. **Tag filter behavior:** When multiple tags are selected, does the filter use AND (item must have all selected tags) or OR (item must have at least one)? PRD must define.

## Resolved Decisions

- **Tag filtering in v1:** Confirmed in scope
- **CI platform:** GitHub Actions (confirmed)

## Rejected / Deferred Ideas (Do Not Re-Propose for v1)

- **Database (PostgreSQL, SQLite, MongoDB):** Intentionally avoided to keep architecture legible. Storage abstraction makes this trivially addable in v2.
- **Authentication:** Explicitly out of scope for v1. Not a missing feature — a deliberate scope constraint.
- **Real-time updates / WebSockets:** Out of scope. Single user, no collaboration use case.
- **Cloud/managed deployment:** Out of scope. Local Docker Compose is the deployment target.
- **Due dates / priorities / recurring tasks:** Out of scope for v1 — would shift the product narrative from "engineering reference" toward "full-featured task manager."
- **PWA / offline support:** Possible v2 direction, not v1.
