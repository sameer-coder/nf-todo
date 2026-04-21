# Story 1.2: Docker Containerization and Cold-Start

Status: ready-for-dev

## Story

As a developer,
I want both services containerized and orchestrated by docker-compose,
So that the entire system starts with a single `docker-compose up` and the health check endpoint confirms liveness.

## Acceptance Criteria

1. **Given** Docker is installed  
   **When** `docker-compose up --build` is run from the repo root  
   **Then** the frontend container (nginx) is accessible at `http://localhost:3000`  
   **And** the backend container (Fastify) is accessible at `http://localhost:4000`  
   **And** `GET http://localhost:4000/api/health` returns `200 OK`  
   **And** no manual setup steps beyond Docker being installed are required

2. **Given** the backend Dockerfile  
   **When** it is built  
   **Then** it uses a multi-stage build (build stage + runtime stage)  
   **And** it runs as a non-root user  
   **And** it includes a Docker `HEALTHCHECK` directive targeting `/api/health`

3. **Given** the frontend Dockerfile  
   **When** it is built  
   **Then** it uses a multi-stage build (Vite build stage + nginx runtime stage)  
   **And** it runs as a non-root user  
   **And** it includes an `nginx.conf` that serves `index.html` for all routes (SPA fallback)

4. **Given** the docker-compose configuration  
   **When** the backend container restarts  
   **Then** the named volume `backend_data` (mounted at `/data`) persists — no data is lost  
   **And** `CORS_ORIGIN`, `PORT`, and `DB_PATH` environment variables are set correctly via docker-compose

## Tasks / Subtasks

- [ ] Task 1: Create backend Dockerfile (AC: 2)
  - [ ] Stage 1 (`builder`): `node:20-alpine`, copy `package*.json`, `npm ci`, copy `src/`, run `tsc`
  - [ ] Stage 2 (`runtime`): `node:20-alpine`, `addgroup -S app && adduser -S app -G app`, copy built dist from builder, `USER app`
  - [ ] Add `HEALTHCHECK CMD wget -qO- http://localhost:4000/api/health || exit 1`
  - [ ] Expose port 4000, set `CMD ["node", "dist/index.js"]`

- [ ] Task 2: Create frontend Dockerfile (AC: 3)
  - [ ] Stage 1 (`builder`): `node:20-alpine`, copy `package*.json`, `npm ci`, copy `src/` + config files, run `npm run build`
  - [ ] Stage 2 (`runtime`): `nginx:alpine`, `addgroup -S app && adduser -S app -G app`, copy built `dist/` to `/usr/share/nginx/html`
  - [ ] Copy `nginx.conf` to `/etc/nginx/conf.d/default.conf`
  - [ ] Expose port 80

- [ ] Task 3: Create `frontend/nginx.conf` (AC: 3)
  - [ ] Configure to listen on port 80
  - [ ] Serve files from `/usr/share/nginx/html`
  - [ ] Add `try_files $uri $uri/ /index.html` for SPA fallback routing

- [ ] Task 4: Write `docker-compose.yml` (AC: 1, 4)
  - [ ] Define `frontend` service: build `./frontend`, ports `"3000:80"`, depends_on `backend`
  - [ ] Define `backend` service: build `./backend`, ports `"4000:4000"`, environment vars, volume mount
  - [ ] Set backend environment: `PORT=4000`, `CORS_ORIGIN=http://localhost:3000`, `DB_PATH=/data/todos.db`
  - [ ] Define named volume `backend_data`, mount at `/data` on the backend service
  - [ ] Set `VITE_API_URL=http://localhost:4000` as build arg for the frontend service

- [ ] Task 5: Implement `/api/health` endpoint (AC: 1)
  - [ ] Add `GET /api/health` route in `backend/src/server.ts` returning `{ status: 'ok' }` with `200`
  - [ ] Ensure the route is registered before other plugins/routes for fast startup confirmation

- [ ] Task 6: Create `.env.example` files
  - [ ] `frontend/.env.example`: `VITE_API_URL=http://localhost:4000`
  - [ ] `backend/.env.example`: `PORT=4000`, `CORS_ORIGIN=http://localhost:3000`, `DB_PATH=/data/todos.db`

## Dev Notes

### Backend Dockerfile Template
```dockerfile
# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Runtime
FROM node:20-alpine AS runtime
RUN addgroup -S app && adduser -S app -G app
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
USER app
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:4000/api/health || exit 1
CMD ["node", "dist/index.js"]
```

### Frontend Dockerfile Template
```dockerfile
# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG VITE_API_URL=http://localhost:4000
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# Stage 2: Runtime
FROM nginx:alpine AS runtime
RUN addgroup -S app && adduser -S app -G app
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### `nginx.conf` Template
```nginx
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Disable caching for the SPA entry point
    location = /index.html {
        add_header Cache-Control "no-store, no-cache, must-revalidate";
    }
}
```

### `docker-compose.yml` Template
```yaml
version: '3.9'

services:
  backend:
    build: ./backend
    ports:
      - "4000:4000"
    environment:
      PORT: "4000"
      CORS_ORIGIN: "http://localhost:3000"
      DB_PATH: "/data/todos.db"
    volumes:
      - backend_data:/data
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:4000/api/health"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 10s

  frontend:
    build:
      context: ./frontend
      args:
        VITE_API_URL: "http://localhost:4000"
    ports:
      - "3000:80"
    depends_on:
      backend:
        condition: service_healthy

volumes:
  backend_data:
```

### Health Endpoint in `server.ts`
```typescript
fastify.get('/api/health', async (_request, reply) => {
  return reply.status(200).send({ status: 'ok' });
});
```
Register this directly on the Fastify instance before other plugins.

### Key Constraints
- **NFR5**: System runs within local Docker network — frontend and backend communicate over the docker-compose internal network
- The named volume `backend_data` ensures SQLite data at `/data/todos.db` survives container restarts (FR26)
- Frontend build passes `VITE_API_URL` as a build-arg so the bundled JS has the correct API base URL baked in
- `depends_on backend condition: service_healthy` ensures the frontend container only starts when the backend health check passes

### Project Structure Notes

- `docker-compose.yml` lives at the monorepo root (not inside `frontend/` or `backend/`)
- `nginx.conf` lives at `frontend/nginx.conf` (copied into image during build)
- Both `Dockerfile`s use multi-stage builds to keep image size minimal
- Named volume `backend_data` is defined in the `volumes:` section of `docker-compose.yml`

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Infrastructure & Deployment] — port mapping table
- [Source: _bmad-output/planning-artifacts/architecture.md#Technical Constraints & Dependencies] — single `docker-compose up` cold start requirement
- [Source: _bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure] — Dockerfile locations
- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.2] — acceptance criteria source
- FR24 (single `docker-compose up`), FR26 (SQLite named volume), NFR5 (Docker network isolation)
- ARCH-9 (CORS via env var), ARCH-10 (CI structure requiring docker-compose)

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.6

### Debug Log References

### Completion Notes List

### File List
