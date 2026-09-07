# Capacity Connect OS

This Debian 12 live-build profile runs the existing local FastAPI application with SQLite/WAL and the Phase 10 queue worker. It intentionally excludes LAN/hotspot configuration.

Build on Debian 12 x86_64 with `sudo apt install live-build`: run `sudo ./build-iso.sh`. Write the resulting ISO to USB using a tool that preserves the separate `casper-rw` ext4 persistence partition. At boot, the local service starts before Chromium kiosk mode; disconnected learning uses `/var/capacity-connect` and sync resumes when `CENTRAL_SYNC_URL` is configured.
