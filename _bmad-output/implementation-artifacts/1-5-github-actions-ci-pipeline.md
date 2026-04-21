# Story 1.5: GitHub Actions CI Pipeline

Status: ready-for-dev

## Story

As a developer,
I want a GitHub Actions CI pipeline with lint, unit/integration tests (with coverage enforcement), and E2E sequencing,
So that every push to main is automatically validated and the build fails if quality gates are not met.

## Acceptance Criteria

1. **Given** a push to the `main` branch  
   **When** the `test` job runs  
   **Then** ESLint and TypeScript type-checking runs for both frontend and backend  
   **And** Vitest runs all unit and integration tests for both frontend and backend  
   **And** the build fails if test coverage drops below 70% (Vitest coverage threshold config)

2. **Given** the `test` job passed  
   **When** the `e2e` job runs  
   **Then** the job is declared with `needs: test` to enforce sequencing  
   **And** `docker-compose up --build` brings the system online  
   **And** Playwright runs the E2E test suite  
   **And** `docker-compose down` tears the system down afterwards

3. **Given** any job in the pipeline fails  
   **When** a PR targets the `main` branch  
   **Then** the merge is blocked and the failing step is clearly identified in the GitHub Actions UI

## Tasks / Subtasks

- [x] Task 1: Create `.github/workflows/ci.yml` (AC: 1, 2, 3)
  - [x] Define job `test` with steps for both frontend and backend
  - [x] Add frontend steps: checkout, Node 20, `npm ci` in `./frontend`, ESLint, TypeScript check (`tsc --noEmit`), Vitest with coverage
  - [x] Add backend steps: `npm ci` in `./backend`, ESLint, TypeScript check (`tsc --noEmit`), Vitest with coverage
  - [x] Define job `e2e` with `needs: test`
  - [x] E2E job steps: docker-compose up --build, wait for health check, Playwright test, docker-compose down (always)
  - [x] Set workflow trigger: `on: push: branches: [main]` and `on: pull_request: branches: [main]`

- [x] Task 2: Configure ESLint for frontend (AC: 1)
  - [x] Install `eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin eslint-plugin-react eslint-plugin-react-hooks` as dev deps in `frontend/`
  - [x] Create `frontend/.eslintrc.cjs` with TypeScript + React rules
  - [x] Add `"lint": "eslint src --ext .ts,.tsx"` script to `frontend/package.json`
  - [x] Add `"typecheck": "tsc --noEmit"` script to `frontend/package.json`

- [x] Task 3: Configure ESLint for backend (AC: 1)
  - [x] Install `eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin` as dev deps in `backend/`
  - [x] Create `backend/.eslintrc.cjs` with TypeScript rules
  - [x] Add `"lint": "eslint src --ext .ts"` script to `backend/package.json`
  - [x] Add `"typecheck": "tsc --noEmit"` script to `backend/package.json`

- [x] Task 4: Add npm scripts for CI (AC: 1)
  - [x] Frontend `package.json`: `"test": "vitest run"`, `"test:coverage": "vitest run --coverage"`, `"build": "vite build"`
  - [x] Backend `package.json`: `"test": "vitest run"`, `"test:coverage": "vitest run --coverage"`, `"build": "tsc"`

- [x] Task 5: Configure Playwright for CI (AC: 2)
  - [x] Ensure `frontend/playwright.config.ts` has `use: { baseURL: 'http://localhost:3000' }` and CI-compatible settings
  - [x] Add `"test:e2e": "playwright test"` script to `frontend/package.json`
  - [x] Create `frontend/e2e/todos.spec.ts` placeholder with at least one smoke test that passes

## Dev Notes

### CI Workflow File (`.github/workflows/ci.yml`)
```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    name: Lint & Unit/Integration Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: |
            frontend/package-lock.json
            backend/package-lock.json

      - name: Install frontend deps
        run: npm ci
        working-directory: frontend

      - name: Frontend lint
        run: npm run lint
        working-directory: frontend

      - name: Frontend typecheck
        run: npm run typecheck
        working-directory: frontend

      - name: Frontend unit tests (with coverage)
        run: npm run test:coverage
        working-directory: frontend

      - name: Install backend deps
        run: npm ci
        working-directory: backend

      - name: Backend lint
        run: npm run lint
        working-directory: backend

      - name: Backend typecheck
        run: npm run typecheck
        working-directory: backend

      - name: Backend unit/integration tests (with coverage)
        run: npm run test:coverage
        working-directory: backend

  e2e:
    name: E2E Tests
    runs-on: ubuntu-latest
    needs: test
    steps:
      - uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install Playwright browsers
        run: npx playwright install --with-deps chromium
        working-directory: frontend

      - name: Start services
        run: docker-compose up -d --build

      - name: Wait for backend health
        run: |
          for i in $(seq 1 30); do
            curl -sf http://localhost:4000/api/health && echo "Backend ready" && break
            echo "Waiting for backend... ($i/30)"
            sleep 3
          done

      - name: Run Playwright E2E tests
        run: npm run test:e2e
        working-directory: frontend

      - name: Tear down
        if: always()
        run: docker-compose down
```

### Coverage Enforcement (Vitest)
The 70% coverage threshold is configured in `vite.config.ts` — Vitest will exit with a non-zero code if coverage falls below the threshold, causing the CI step to fail automatically:
```typescript
coverage: {
  provider: 'v8',
  thresholds: {
    lines: 70,
    branches: 70,
    functions: 70,
    statements: 70,
  },
},
```
The backend's `vitest.config.ts` should have equivalent settings.

### E2E Placeholder Smoke Test
At this story stage, `frontend/e2e/todos.spec.ts` only needs to hold a placeholder that verifies the app loads:
```typescript
import { test, expect } from '@playwright/test';

test('app loads', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/nf-todo/i);
});
```
The full E2E suite (≥5 tests) is implemented in Story 6.1.

### Playwright Config for CI
```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  use: {
    baseURL: 'http://localhost:3000',
    headless: true,
  },
  reporter: 'html',
  webServer: undefined, // CI uses docker-compose; no local dev server needed in CI
});
```

### NFR8 Constraint
The pipeline must block PRs on failure — this is automatically satisfied by GitHub's branch protection rules when all required status checks are set to the `test` and `e2e` jobs. The jobs themselves exit non-zero on failure.

### Project Structure Notes

- `.github/workflows/ci.yml` lives at the monorepo root under `.github/`
- `frontend/.eslintrc.cjs` and `backend/.eslintrc.cjs` — co-located with their respective services
- All test scripts (`npm run test:coverage`) must be runnable independently from their service directory
- E2E tests live in `frontend/e2e/todos.spec.ts` (ARCH-14 equivalent for Playwright)
- ARCH-10 mandates 2 jobs: `test` and `e2e` with `needs: test` sequencing

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#CI Pipeline — GitHub Actions] — 2-job structure
- [Source: _bmad-output/planning-artifacts/architecture.md#Decision — CI Structure (ARCH-10)] — coverage threshold enforcement
- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.5] — acceptance criteria source
- FR28 (CI runs all tests), NFR6 (70% coverage), NFR7 (≥5 Playwright tests), NFR8 (blocks merge on failure)
- ARCH-10 (CI structure)

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.6

### Debug Log References

### Completion Notes List

### File List
