#!/usr/bin/env bash
set -euo pipefail
command -v lb >/dev/null || { echo "Install live-build first: apt install live-build"; exit 1; }
root_dir="$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)"
stage_dir="$(dirname -- "$0")/config/includes.chroot/opt/capacity-connect"
rm -rf "$stage_dir"
mkdir -p "$stage_dir"
cp -a "$root_dir/backend" "$stage_dir/backend"
if [ -d "$root_dir/frontend/dist" ]; then
  cp -a "$root_dir/frontend/dist" "$stage_dir/frontend"
else
  echo "Build frontend first: (cd frontend && npm run build)" >&2
  exit 1
fi
lb config --distribution bookworm --architectures amd64 --binary-images iso-hybrid --bootappend-live "boot=live components persistence"
lb build
