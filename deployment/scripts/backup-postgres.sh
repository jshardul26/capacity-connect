#!/usr/bin/env bash
set -euo pipefail

: "${POSTGRES_USER:?Set POSTGRES_USER}"
: "${POSTGRES_DB:?Set POSTGRES_DB}"
backup_dir=${BACKUP_DIR:-./backups}
mkdir -p "$backup_dir"
docker compose exec -T postgres pg_dump -U "$POSTGRES_USER" -Fc "$POSTGRES_DB" > "$backup_dir/capacity-connect-$(date -u +%Y%m%dT%H%M%SZ).dump"
