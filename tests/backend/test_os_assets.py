from pathlib import Path


def test_capacity_connect_os_profile_is_complete_and_includes_lan_stack():
    root = Path(__file__).resolve().parents[2] / "deployment" / "os"
    build = (root / "build-iso.sh").read_text(encoding="utf-8")
    packages = (root / "config" / "package-lists" / "capacity-connect.list.chroot").read_text(encoding="utf-8")
    kiosk = (root / "config" / "includes.chroot" / "etc" / "xdg" / "openbox" / "autostart").read_text(encoding="utf-8")
    assert "live-build" in (root / "README.md").read_text(encoding="utf-8")
    assert "persistence" in build
    assert "chromium" in packages and "hostapd" in packages and "dnsmasq" in packages and "avahi" in packages
    assert "--app=http://127.0.0.1:8000" in kiosk
    for unit in ("capacity-connect.service", "capacity-connect-sync.service", "capacity-connect-sync.timer", "capacity-connect-kiosk.service"):
        assert (root / "config" / "includes.chroot" / "etc" / "systemd" / "system" / unit).is_file()
    toggle = (root / "config" / "includes.chroot" / "usr" / "local" / "sbin" / "cc-lan-toggle").read_text(encoding="utf-8")
    assert "hostapd" in toggle and "dnsmasq" in toggle and "CAPACITY_CONNECT_LAN_PASSPHRASE" in toggle
