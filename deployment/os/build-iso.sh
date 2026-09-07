#!/usr/bin/env bash
set -euo pipefail
command -v lb >/dev/null || { echo "Install live-build first: apt install live-build"; exit 1; }
lb config --distribution bookworm --architectures amd64 --binary-images iso-hybrid --bootappend-live "boot=live components persistence"
lb build
