# Story 6.2: Project README

Status: ready-for-dev

## Story

As a developer (or any person evaluating the project),
I want a comprehensive README at the repo root,
So that I can set up, run, test, and understand the project without any prior context.

## Acceptance Criteria

1. **Given** the `README.md` at the monorepo root  
   **When** read by a developer with no prior context  
   **Then** it contains all of the following sections, each complete and accurate:
   1. **Project Overview** — what nf-todo is, the tech stack (React, Fastify, SQLite, Docker), and the single-user scope
   2. **Local Setup** — prerequisites (Docker, Node.js versions), `git clone` → `docker-compose up` walkthrough with exact commands
   3. **Architecture Overview** — monorepo structure, frontend/backend separation, repository abstraction, SQLite volume, and communication pattern
   4. **Testing Instructions** — how to run unit tests (`npm test` in each service), how to run E2E tests locally (Playwright command), and how coverage is enforced
   5. **Deployment** — how `docker-compose up --build` starts the full system; description of what each container does; how to verify health via `/api/health`

2. **Given** the README setup instructions  
   **When** followed from a clean environment (only Docker installed)  
   **Then** the full system is running at `http://localhost:3000` with no additional manual steps

3. **Given** the README  
   **When** reviewed  
   **Then** it contains no placeholder text, no TODO comments, and no unresolved sections (FR29)

## Tasks / Subtasks

- [ ] Task 1: Write Section 1 — Project Overview (AC: 1.1)
  - [ ] Brief description of nf-todo: personal todo app, single-user, no auth
  - [ ] Tech stack table: React (Vite, TypeScript, Tailwind), Fastify (Node.js, TypeScript), SQLite (better-sqlite3), Docker (multi-stage), GitHub Actions CI
  - [ ] Scope: local-only development tool, runs in Docker

- [ ] Task 2: Write Section 2 — Local Setup (AC: 1.2, 2)
  - [ ] Prerequisites: Docker Desktop (latest), Git
  - [ ] Step-by-step quickstart:
    ```
    git clone <repo-url>
    cd nf-todo
    docker-compose up --build
    ```
  - [ ] Access URLs: `http://localhost:3000` (app), `http://localhost:4000/api/health` (backend health)
  - [ ] Note: no additional manual steps required

- [ ] Task 3: Write Section 3 — Architecture Overview (AC: 1.3)
  - [ ] Monorepo structure: `/frontend` (React SPA, served by nginx), `/backend` (Fastify REST API)
  - [ ] Communication: frontend calls backend via HTTP REST (`http://localhost:4000/api/todos`)
  - [ ] Data persistence: SQLite file at `/data/todos.db` in named Docker volume `backend_data`
  - [ ] Repository abstraction: routes only talk to `ITodoRepository`, not `better-sqlite3` directly
  - [ ] State management: React Context API + useReducer, optimistic UI on all mutations
  - [ ] Filter state: URL query params via React Router
  - [ ] Monorepo directory tree (simplified)

- [ ] Task 4: Write Section 4 — Testing Instructions (AC: 1.4)
  - [ ] Unit tests (frontend): `cd frontend && npm test`
  - [ ] Unit/integration tests (backend): `cd backend && npm test`
  - [ ] Coverage report: `npm run test:coverage` in each directory
  - [ ] Coverage threshold: 70% enforced by Vitest — build fails if below
  - [ ] E2E tests (local): `docker-compose up --build -d && cd frontend && npx playwright install chromium && npm run test:e2e`
  - [ ] CI: GitHub Actions runs all tests on every push to `main`

- [ ] Task 5: Write Section 5 — Deployment (AC: 1.5)
  - [ ] `docker-compose up --build` — builds and starts everything:
    - `frontend` container: Vite build → nginx serving static files at port 3000 (host)
    - `backend` container: TypeScript compile → Node.js Fastify API at port 4000 (host)
  - [ ] Health verification: `curl http://localhost:4000/api/health` → `{"status":"ok"}`
  - [ ] Data persistence: named volume `backend_data` survives `docker-compose down`; use `docker-compose down -v` to wipe data
  - [ ] Stopping: `docker-compose down`

- [ ] Task 6: Review for completeness (AC: 3)
  - [ ] No placeholder text (e.g., `<repo-url>` should be the actual repo URL if known)
  - [ ] No TODO/FIXME comments
  - [ ] All commands tested / verified against the actual working implementation

## Dev Notes

### README Structure Template
```markdown
# nf-todo

A minimal, keyboard-friendly todo app built as a full-stack engineering demonstration.

## Table of Contents

- [Project Overview](#project-overview)
- [Local Setup](#local-setup)
- [Architecture Overview](#architecture-overview)
- [Testing Instructions](#testing-instructions)
- [Deployment](#deployment)

---

## Project Overview

nf-todo is a single-user todo app designed to demonstrate ...

**Tech Stack:**
| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, TypeScript, Tailwind CSS |
| Backend | Node.js, Fastify, TypeScript |
| Database | SQLite (via better-sqlite3) |
| Infrastructure | Docker, docker-compose, GitHub Actions CI |

---

## Local Setup

### Prerequisites
- Docker Desktop (v4.x or later)
- Git

### Quickstart

...

---

## Architecture Overview

...

---

## Testing Instructions

...

---

## Deployment

...
```

### Key Technical Details to Include
- **State management**: React Context API + `useReducer` (no Redux/Zustand)
- **Optimistic UI**: All mutations update the UI before API confirmation; rollback on error
- **Filter state**: URL query params (`?status=active&tags=work`) via React Router
- **DnD**: @dnd-kit/core with pointer sensor + explicit drag handle
- **Repository abstraction**: `ITodoRepository` interface isolates routes from `better-sqlite3`

### No Placeholder Text Policy (FR29, AC: 3)
Every section must be complete with real values. If the git repository URL is not known at story creation time, use a placeholder like `https://github.com/your-org/nf-todo` but note it must be replaced before merging.

### Accuracy Requirement
The README must accurately reflect the ACTUAL implementation. Write or finalize this story AFTER all implementation stories (1.x through 5.x) are complete and verified. Commands (`docker-compose up --build`, `npm test`, etc.) should be empirically verified.

### Project Structure Notes

- `README.md` lives at the monorepo root `nf-todo/README.md`
- This is the only story with no frontend/backend code changes — docs only
- No co-located test file needed for documentation

### References

- [Source: _bmad-output/planning-artifacts/architecture.md] — all architecture decisions referenced in README
- [Source: _bmad-output/planning-artifacts/prd.md] — project scope and requirements for project overview
- [Source: _bmad-output/planning-artifacts/epics.md#Story 6.2] — acceptance criteria source
- FR29 (README documenting setup, architecture, testing, deployment)
- NFR6 (coverage enforcement), NFR7/NFR8 (CI requirements)

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.6

### Debug Log References

### Completion Notes List

### File List
