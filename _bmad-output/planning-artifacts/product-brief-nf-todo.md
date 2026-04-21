---
title: "Product Brief: nf-todo"
status: "complete"
created: "2026-03-24"
updated: "2026-03-24"
inputs: ["user brain dump (session)", "github.com/topics/todo-app research"]
---

# Product Brief: NF-Todo

## Executive Summary

NF-Todo is a full-stack, single-user task manager that treats the todo problem as a vehicle — not a destination. The application itself is intentionally simple: create, complete, reorder, tag, filter, and delete tasks from a clean responsive interface. The real subject is the engineering underneath: a decoupled React/Fastify architecture, persistent JSON storage, Docker Compose deployment, comprehensive test coverage spanning unit through Playwright E2E, and zero critical accessibility violations.

There are over 2,700 public todo app repositories on GitHub. The overwhelming majority demonstrate the same surface: a form, a list, a delete button. Almost none show how a professional engineering team would actually ship this. NF-Todo fills that gap — a complete, deployable, well-tested, documented reference implementation that reads like production software, not a tutorial exercise.

## The Problem

Engineers building their portfolio face a specific credibility problem: the todo app is the canonical full-stack demonstration, but every reviewer has seen hundreds of them. The majority share the same failure mode — they prove the developer can wire a frontend to an API, and nothing more. There is no containerization. There is no meaningful test suite. Accessibility is ignored. Documentation stops at "clone and run."

The result is that the single most common portfolio project — the one that should demonstrate engineering depth — instead signals the opposite: that the developer doesn't know what production-ready means.

Meanwhile, intermediate engineers learning full-stack development have no single coherent reference showing all the layers working together: clean API design, frontend architecture, persistent storage, containerized infrastructure, and a test suite that provides real confidence. They piece it together from separate tutorials and blog posts, resulting in projects that are structurally inconsistent and difficult for reviewers to evaluate.

## The Solution

NF-Todo is a minimal but complete task manager built with production discipline as its core design principle. Users can add, edit, complete, reorder via drag-and-drop, apply freeform tags, filter by status, and delete todos. The UI is responsive and accessible. The backend exposes a clean REST API built with Fastify on Node.js, persisting data to a JSON file — storage that is simple by choice, not by accident, and architecturally decoupled to be swappable.

The entire system starts with a single `docker-compose up`. Dockerfiles use multi-stage builds, non-root users, and health checks. Test coverage meets a minimum 70% threshold across unit, integration, and E2E layers, enforced in CI. A structured README covers local setup, architecture overview, testing instructions, and deployment. The codebase doesn't just work — it explains itself.

## What Makes This Different

The todo space rewards feature breadth; NF-Todo rewards engineering depth. The simplicity of the problem domain is deliberate — it removes distractions so the quality of execution is impossible to miss.

Key differentiators from the 2,700+ existing implementations:

- **Full production stack, front to back**: not just code, but containerized (multi-stage Docker, non-root, health checks), tested across all layers, documented, and CI-ready from day one
- **Accessibility as a quality gate**: zero critical WCAG 2.1 AA violations, enforced — not an afterthought applied post-launch
- **Behavioral test coverage**: ≥70% meaningful coverage across unit, integration, and ≥5 Playwright E2E tests that test what users actually do, not just lines of code
- **UX depth beyond the baseline**: drag-and-drop reordering and multi-tag support put NF-Todo a step beyond the create/complete/delete minimum that dominates the category
- **Legible architecture**: React + Tailwind frontend and Fastify backend run as separate containers with a clear, documented boundary — the structure teaches as much as the code

## Who This Serves

**Primary: the technical reviewer.** Engineering hiring managers and senior engineers evaluating a candidate's ability to ship production-quality software. They open this repository looking for evidence of judgment: project structure, test maturity, infrastructure awareness, accessibility literacy, and documentation discipline. NF-Todo is designed to satisfy every one of these criteria without requiring them to ask.

**Secondary: the learning engineer.** Intermediate developers who want a complete, coherent reference implementation of a modern full-stack system — one where they can see containerization, testing, and API design working together in a real codebase, without complex business logic obscuring the architecture.

**The end user**: a single person managing personal tasks. No login screen, no team workspace, no notification inbox. Fast, clean, reliable task tracking — nothing more, nothing less.

## Success Criteria

| Criterion | Measure |
|---|---|
| All CRUD operations functional | Manual verification + integration tests pass |
| Test coverage | ≥70% meaningful coverage (unit + integration + E2E) |
| E2E tests | ≥5 Playwright tests pass in CI |
| Accessibility | Zero critical WCAG 2.1 AA violations |
| Deployment | `docker-compose up` brings the full system online |
| Documentation | README covers setup, architecture, testing, and deployment |
| UX completeness | Drag-and-drop reordering and multi-tag support functional on desktop and mobile |

## Scope

**In scope for v1:**
- Todo CRUD (create, read, update text, delete)
- Complete/incomplete toggle
- Filter by status: all / active / completed
- Filter by tag
- Multiple freeform tags per todo item
- Drag-and-drop manual reordering
- Responsive, accessible UI (React + Tailwind CSS)
- REST API (Node.js + Fastify)
- JSON file persistent storage
- Dockerfiles with multi-stage builds, non-root users, and health checks
- `docker-compose.yml` orchestrating frontend and backend containers
- Unit + integration + Playwright E2E test suite (≥70% coverage, ≥5 E2E tests)
- CI pipeline (GitHub Actions) enforcing test, build, and accessibility checks
- `README.md` covering local setup, architecture, testing, and deployment

**Explicitly out of scope for v1:**
- User authentication or authorization
- Multi-user support / multi-tenancy
- Real-time / collaborative features
- Notifications or reminders
- Due dates, priorities, or recurring tasks
- Relational or document database (e.g., PostgreSQL, MongoDB)
- Cloud deployment, managed hosting, or CDN configuration

## Vision

If NF-Todo succeeds, it becomes the reference implementation engineers reach for when starting a full-stack project — not to copy, but to pattern-match against. The architecture is intentionally modular: the JSON storage layer has a clean abstraction boundary and can be replaced with a proper database without touching the API layer. The frontend and backend are independently containerized and deployable.

Future iterations could extend the feature set with due dates and priority levels, persistent filter preferences, offline/PWA support, or dark mode — but only where these additions reinforce rather than dilute the core thesis. NF-Todo's job is to stay the clearest possible answer to the question: "What does a production-ready full-stack web application actually look like?"
