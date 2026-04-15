# macOS client guide

This repository uses a single cross-platform client built with **Tauri (Vite + Rust)**.

On **macOS**, Pixel VPN uses a **Privileged Helper Tool** to handle VPN operations. This approach:
- Requires password input **only once** during installation
- VPN connects/disconnects **without password prompts**
- Works without Apple Developer account

## How It Works

1. **Privileged Helper**: A small root helper runs as a launch daemon
2. **Socket Communication**: Main app communicates with helper via Unix socket
3. **No Password**: Helper already has root privileges, no AppleScript prompts needed

## Prerequisites

- Node.js + `pnpm`
- Rust toolchain
- Xcode Command Line Tools

## Installation

### Step 1: Build the helper

```bash
cd apps/client/PrivilegedHelper
cargo build --release
```

### Step 2: Install the helper (requires password ONCE)

```bash
cd apps/client
sudo ./install-helper.sh
```

### Step 3: Provide `xray` binary

Pixel VPN searches for `xray` in:

- `apps/client/src-tauri/binaries/xray`
- `resources/xray` (when bundled)
- your `PATH` as `xray`

Place a macOS build of `xray` at:

```bash
cp /path/to/xray apps/client/src-tauri/binaries/xray
chmod +x apps/client/src-tauri/binaries/xray
```

If you also place `geoip.dat` and `geosite.dat` next to `xray`, routing modes that rely on geodata will work better.

## Development run

From repo root:

```bash
pnpm -C apps/client install
pnpm -C apps/client tauri dev
```

## Release build

```bash
pnpm -C apps/client tauri build
```

## Uninstall Helper

```bash
sudo ./install-helper.sh uninstall
```

## Troubleshooting

### Helper not starting
```bash
# Check if helper is loaded
launchctl list | grep pixelvpn

# Check logs
cat /var/log/pixel-vpn-helper.log
```

### "Connection refused" errors
```bash
# Reinstall helper
sudo ./install-helper.sh uninstall
sudo ./install-helper.sh
```

### Permission denied on socket
```bash
ls -la /var/run/com.pixelvpn.helper.sock
```
