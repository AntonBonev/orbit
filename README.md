# Orbit — Personal Productivity Hub

A personal Kanban board with a separate frontend, Node.js API, and MongoDB storage.

## Start

Install and start Docker Desktop (or Docker Engine with Compose), then run from this folder:

```sh
docker compose up -d --build
```

Open http://localhost. The first board is empty. Tasks are shared across browsers and saved on the server.

If an old container named `orbit` is using port 80, stop it with `docker stop orbit` first. To use another port:

```sh
ORBIT_PORT=8080 docker compose up -d --build
```

Then open http://localhost:8080.

## Existing browser tasks

Open Orbit at the same address used for the old version. If it finds old browser tasks, choose **Import tasks from this browser**. This adds tasks without replacing existing server tasks; matching ids are skipped. The old browser copy is removed only after a successful import. If using a different address or browser, export a backup from the old board and import it here instead.

## Stop, logs, and backups

```sh
docker compose down
docker compose logs --tail=100 backend
```

Stopping or rebuilding containers preserves tasks in the named `mongo_data` volume. **`docker compose down -v` deletes the database.** Keep this project folder/name stable to reuse the same Compose volume.

Use **Export backup** for a downloadable JSON copy. **Import backup** replaces all server tasks after confirmation. Imports are validated before changing the database, and replacement is atomic. Limits: 10,000 tasks, 8 MB per import, and MongoDB's 16 MB board-document limit. Export regularly and before upgrades.

## Structure

- `frontend/`: HTML, CSS, and browser JavaScript; existing Kanban features retained.
- `backend/src/server.js`: task API and MongoDB storage.
- `backend/src/tasks.js`: task validation.
- `backend/test/`: validation tests.
- `nginx.conf`: static files and same-origin API proxy.
- `compose.yaml`: frontend, backend, MongoDB, health checks, and persistent volume.

The API exposes `GET/POST /api/tasks`, `PATCH/DELETE /api/tasks/:id`, `POST /api/tasks/import`, and `GET /api/health`. Task writes are confirmed before updating the interface. A failed write leaves the current task and editing form intact.

Only the frontend publishes a host port. This iteration has no authentication or HTTPS: use it on a trusted local network; external access comes later in the roadmap.

## Development checks

With Node.js 22 installed:

```sh
cd backend
npm install
npm test
```

Or run validation tests with Docker from the project root:

```sh
docker run --rm -v "$PWD/backend:/app" -w /app node:22-alpine npm test
```
