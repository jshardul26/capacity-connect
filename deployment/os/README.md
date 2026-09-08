# Capacity Connect OS

This Debian 12 live-build profile runs the existing local FastAPI application with SQLite/WAL and the Phase 10 queue worker. It includes the Phase 12 field LAN stack (`hostapd`, `dnsmasq`, `avahi-daemon`) so a station can share its local content to nearby devices when no WAN is available.

Build on Debian 12 x86_64 with `sudo apt install live-build`: run `sudo ./build-iso.sh`. Write the resulting ISO to USB using a tool that preserves the separate `casper-rw` ext4 persistence partition. At boot, the local service starts before Chromium kiosk mode; disconnected learning uses `/var/capacity-connect` and sync resumes when `CENTRAL_SYNC_URL` is configured.

## Field LAN mode (Phase 12)

The station is preinstalled with `hostapd`, `dnsmasq`, `avahi-daemon`, and the `cc-lan-toggle` script. Enable the hotspot with:

```
sudo CAPACITY_CONNECT_LAN_PASSPHRASE="<wpa-passphrase>" cc-lan-toggle on wlan0
```

This broadcasts the `CapacityConnect-FieldNet` SSID on `192.168.4.1/24`, serves the local FastAPI application over `http://capacityconnect.local:8000`, and caches the station's content on the LAN. Disable with `sudo cc-lan-toggle off`. 

Note: ISO build and physical boot cannot be validated from a non-Linux build host; the live-build profile and units are provided and exercised by the automated OS asset tests.
