# Orbit — Personal Board

A small, local-first personal Kanban board. Create, edit, move and filter tasks; assign priorities, projects and due dates; export and import JSON backups.

## Run with Docker

```bash
docker build -t orbit:1.0 .
docker run -d --name orbit --restart unless-stopped -p 80:80 orbit:1.0
```

Open http://localhost in your browser.

If port 80 is already occupied, stop the conflicting service first, or use `-p 8080:80` and visit http://localhost:8080 instead.

## Stop

```bash
docker stop orbit
docker rm orbit
```

## Storage and backups

Tasks are stored in your **browser's localStorage**, not inside the Docker container. They persist through refreshes and container restarts when using the same browser and origin. They do **not** automatically sync across browsers/devices, and clearing site data will remove them. Use **Export backup** regularly, and **Import backup** to restore.

## Tech

Static HTML, CSS and JavaScript served by Nginx on container port 80. No build tool, database, account or backend is required for this version.

## Version 1 scope

Kanban columns, drag-and-drop and mobile move controls, task details, projects, priority, due dates, search/filter, progress counts, backup import/export.
