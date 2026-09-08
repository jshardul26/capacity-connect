# Production deployment

Set non-development values for `POSTGRES_PASSWORD`, `MINIO_SECRET_KEY`, `SECRET_KEY`, `SYNC_HMAC_SECRET`, and `CONTENT_PACK_HMAC_SECRET` in an untracked `.env`, then run:

```bash
docker compose up -d --build
docker compose ps
```

The PostgreSQL health check must pass before the backend starts. The Nginx frontend proxies `/api/` to the backend and serves the compiled React application.

Create a database backup with `deployment/scripts/backup-postgres.sh`; restore a reviewed backup with `deployment/scripts/restore-postgres.sh backup.dump`.

For field deployment, build the frontend, then run `sudo ./deployment/os/build-iso.sh` on Debian 12 with `live-build` installed. The ISO output is `deployment/os/live-image-amd64.hybrid.iso`. The OS profile stages the application at `/opt/capacity-connect`, stores local data at `/var/capacity-connect`, and starts the local backend, sync timer, and kiosk session.
