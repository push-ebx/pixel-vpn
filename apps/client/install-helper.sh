#!/bin/bash

set -e

HELPER_NAME="com.pixelvpn.helper"
HELPER_BINARY="/Library/PrivilegedHelperTools/${HELPER_NAME}"
HELPER_PLIST="/Library/LaunchDaemons/${HELPER_NAME}.plist"
SOCKET_PATH="/var/run/${HELPER_NAME}.sock"
LOG_FILE="/var/log/pixel-vpn-helper.log"

echo "=========================================="
echo "  Pixel VPN - Privileged Helper Installer"
echo "=========================================="
echo ""

check_root() {
    if [[ $EUID -ne 0 ]]; then
        echo "This script must be run as root (with sudo)"
        echo "Usage: sudo $0"
        exit 1
    fi
}

find_helper_binary() {
    SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
    
    POSSIBLE_PATHS=(
        "${SCRIPT_DIR}/../src-tauri/target/release/pixel-vpn-helper"
        "${SCRIPT_DIR}/../src-tauri/target/debug/pixel-vpn-helper"
        "${SCRIPT_DIR}/helper/pixel-vpn-helper"
        "/Applications/Pixel VPN.app/Contents/MacOS/pixel-vpn-helper"
        "${HOME}/.pixel-vpn/pixel-vpn-helper"
    )
    
    for path in "${POSSIBLE_PATHS[@]}"; do
        if [[ -f "$path" ]]; then
            echo "$path"
            return 0
        fi
    done
    
    return 1
}

create_plist() {
    cat > "$HELPER_PLIST" << 'PLIST'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.pixelvpn.helper</string>
    <key>ProgramArguments</key>
    <array>
        <string>/Library/PrivilegedHelperTools/com.pixelvpn.helper</string>
    </array>
    <key>MachServices</key>
    <dict>
        <key>com.pixelvpn.helper</key>
        <true/>
    </dict>
    <key>AssociatedBundleIdentifiers</key>
    <string>com.pixelvpn.app</string>
</dict>
</plist>
PLIST
    chmod 644 "$HELPER_PLIST"
    echo "Created launchd plist: $HELPER_PLIST"
}

uninstall() {
    echo "Uninstalling Pixel VPN Helper..."
    
    launchctl unload "$HELPER_PLIST" 2>/dev/null || true
    rm -f "$HELPER_PLIST"
    rm -f "$HELPER_BINARY"
    rm -f "$SOCKET_PATH"
    
    echo "Helper uninstalled successfully."
    exit 0
}

main() {
    check_root
    
    if [[ "$1" == "uninstall" ]]; then
        uninstall
    fi
    
    echo "Step 1: Finding helper binary..."
    HELPER_PATH=$(find_helper_binary)
    
    if [[ -z "$HELPER_PATH" ]]; then
        echo ""
        echo "ERROR: Helper binary not found!"
        echo ""
        echo "Please build the helper first:"
        echo "  cd apps/client/PrivilegedHelper"
        echo "  cargo build --release"
        echo ""
        echo "Then run this script again from the project root:"
        echo "  sudo ./install-helper.sh"
        exit 1
    fi
    
    echo "Found helper at: $HELPER_PATH"
    
    echo ""
    echo "Step 2: Stopping existing helper (if running)..."
    launchctl unload "$HELPER_PLIST" 2>/dev/null || true
    rm -f "$SOCKET_PATH"
    
    echo ""
    echo "Step 3: Installing helper binary..."
    cp -p "$HELPER_PATH" "$HELPER_BINARY"
    chmod 755 "$HELPER_BINARY"
    echo "Installed to: $HELPER_BINARY"
    
    echo ""
    echo "Step 4: Creating launchd configuration..."
    create_plist
    
    echo ""
    echo "Step 5: Loading helper..."
    launchctl load "$HELPER_PLIST"
    
    sleep 1
    
    if [[ -S "$SOCKET_PATH" ]]; then
        echo ""
        echo "=========================================="
        echo "  Installation successful!"
        echo "=========================================="
        echo ""
        echo "The privileged helper is now installed and running."
        echo "VPN connections will not require password input."
        echo ""
        echo "Log file: $LOG_FILE"
        echo ""
    else
        echo ""
        echo "WARNING: Helper may not have started correctly."
        echo "Check the log file: $LOG_FILE"
        echo ""
    fi
}

main "$@"
