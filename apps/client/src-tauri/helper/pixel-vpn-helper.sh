#!/bin/bash

SOCKET_PATH="/var/run/com.pixelvpn.helper.sock"
LOG_FILE="/var/log/pixel-vpn-helper.log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

log "Pixel VPN Helper starting..."

# Create Unix socket
rm -f "$SOCKET_PATH"

# Use socat or netcat for IPC, or Python
if command -v python3 &> /dev/null; then
    python3 << 'PYEOF' &
import socket
import os
import subprocess
import threading
import sys

SOCKET_PATH = "/var/run/com.pixelvpn.helper.sock"
LOG_FILE = "/var/log/pixel-vpn-helper.log"

def log(msg):
    with open(LOG_FILE, "a") as f:
        f.write(f"[{os.popen('date \"+%Y-%m-%d %H:%M:%S\"').read().strip()}] {msg}\n")

def run_script(script):
    try:
        result = subprocess.run(
            ["osascript", "-e", script],
            capture_output=True,
            text=True,
            timeout=30
        )
        return result.stdout.strip(), result.returncode == 0
    except Exception as e:
        log(f"Error running script: {e}")
        return str(e), False

def handle_client(conn, addr):
    try:
        data = conn.recv(4096).decode("utf-8").strip()
        log(f"Received: {data}")

        if data == "START_XRAY":
            script = f"do shell script \"{XRAY_BIN} run -config {XRAY_CONFIG} >/tmp/pixel-vpn-xray.log 2>&1 & sleep 2; pgrep -x xray || echo 0\" with administrator privileges"
            stdout, ok = run_script(script)
            conn.sendall(f"OK:{stdout}\n".encode())
            log(f"START_XRAY result: {stdout}, ok: {ok}")

        elif data == "STOP_XRAY":
            script = 'do shell script "pkill -9 xray 2>/dev/null || true" with administrator privileges'
            run_script(script)
            conn.sendall(b"OK\n")
            log("STOP_XRAY done")

        elif data.startswith("ENABLE_PROXY"):
            script = '''do shell script "
                services=$(networksetup -listallnetworkservices | tail -n +2 | grep -v '^\*')
                for s in $services; do
                    networksetup -setsocksfirewallproxy $s 127.0.0.1 10808
                    networksetup -setsocksfirewallproxystate $s on 2>/dev/null
                done
            " with administrator privileges'''
            stdout, ok = run_script(script)
            conn.sendall(f"OK:{stdout}\n".encode())
            log(f"ENABLE_PROXY result: {ok}")

        elif data.startswith("DISABLE_PROXY"):
            script = '''do shell script "
                services=$(networksetup -listallnetworkservices | tail -n +2 | grep -v '^\*')
                for s in $services; do
                    networksetup -setsocksfirewallproxystate $s off 2>/dev/null
                done
            " with administrator privileges'''
            stdout, ok = run_script(script)
            conn.sendall(f"OK:{stdout}\n".encode())
            log(f"DISABLE_PROXY result: {ok}")

        elif data == "PING":
            conn.sendall(b"PONG\n")

        else:
            conn.sendall(b"UNKNOWN_COMMAND\n")

    except Exception as e:
        log(f"Error handling client: {e}")
    finally:
        conn.close()

# Unix domain socket server
server = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)

try:
    os.remove(SOCKET_PATH)
except:
    pass

server.bind(SOCKET_PATH)
server.listen(5)
os.chmod(SOCKET_PATH, 0o666)

log("Socket server listening")

while True:
    try:
        conn, addr = server.accept()
        threading.Thread(target=handle_client, args=(conn, addr), daemon=True).start()
    except Exception as e:
        log(f"Accept error: {e}")
        break

PYEOF
    PID=$!
    echo $PID > /tmp/pixel-vpn-helper.pid
    log "Helper started with PID $PID"
else
    log "python3 not found, cannot start helper"
    exit 1
fi
