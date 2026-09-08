#!/usr/bin/env bash
set -euo pipefail

: "${POSTGRES_USER:?Set POSTGRES_USER}"
: "${POSTGRES_DB:?Set POSTGRES_DB}"
: "${1:?Usage: restore-postgres.sh path/to/backup.dump}"
docker compose exec -T postgres pg_restore --clean --if-exists -U "$POSTGRES_USER" -d "$POSTGRES_DB" < "$1"
