#!/usr/bin/env python3
import socket
import os
import subprocess
import threading
import sys
import time

SOCKET_PATH = "/var/run/com.pixelvpn.helper.sock"
LOG_FILE = "/var/log/pixel-vpn-helper.log"

def log(msg):
    try:
        with open(LOG_FILE, "a") as f:
            f.write(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] {msg}\n")
    except:
        pass

def run_privileged(script, timeout=30):
    try:
        result = subprocess.run(
            ["osascript", "-e", script],
            capture_output=True,
            text=True,
            timeout=timeout
        )
        return result.stdout.strip(), result.stderr.strip(), result.returncode == 0
    except subprocess.TimeoutExpired:
        return "", "Timeout", False
    except Exception as e:
        return "", str(e), False

def handle_client(conn):
    try:
        data = conn.recv(4096).decode("utf-8").strip()
        log(f"CMD: {data}")

        if data == "PING":
            conn.sendall(b"PONG\n")

        elif data == "START_XRAY":
            script = 'do shell script "/Applications/Pixel\\ VPN.app/Contents/MacOS/pixel-vpn --xray-only >/tmp/pixel-vpn-xray.log 2>&1 & sleep 2; pgrep -x xray || echo 0" with administrator privileges'
            stdout, stderr, ok = run_privileged(script)
            if ok:
                conn.sendall(f"OK:{stdout}\n".encode())
            else:
                conn.sendall(f"ERR:{stderr}\n".encode())

        elif data == "STOP_XRAY":
            script = 'do shell script "pkill -9 xray 2>/dev/null || true" with administrator privileges'
            stdout, stderr, ok = run_privileged(script, 5)
            conn.sendall(b"OK\n")

        elif data == "ENABLE_PROXY":
            script = '''do shell script "
                services=$(networksetup -listallnetworkservices | tail -n +2 | grep -v '^\*')
                for s in $services; do
                    networksetup -setsocksfirewallproxy $s 127.0.0.1 10808
                    networksetup -setsocksfirewallproxystate $s on 2>/dev/null
                done
                echo done
            " with administrator privileges'''
            stdout, stderr, ok = run_privileged(script)
            conn.sendall(f"OK:{stdout}\n".encode())

        elif data == "DISABLE_PROXY":
            script = '''do shell script "
                services=$(networksetup -listallnetworkservices | tail -n +2 | grep -v '^\*')
                for s in $services; do
                    networksetup -setsocksfirewallproxystate $s off 2>/dev/null
                done
                echo done
            " with administrator privileges'''
            stdout, stderr, ok = run_privileged(script)
            conn.sendall(f"OK:{stdout}\n".encode())

        else:
            conn.sendall(b"UNKNOWN\n")

    except Exception as e:
        log(f"Error: {e}")
    finally:
        try:
            conn.close()
        except:
            pass

def main():
    log("Helper starting...")

    # Clean up old socket
    try:
        os.remove(SOCKET_PATH)
    except:
        pass

    server = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
    server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)

    try:
        server.bind(SOCKET_PATH)
        os.chmod(SOCKET_PATH, 0o666)
        server.listen(5)
        log(f"Listening on {SOCKET_PATH}")

        # Pre-authenticate with osascript to cache credentials
        log("Caching admin credentials...")
        test_script = 'do shell script "echo ok" with administrator privileges'
        stdout, stderr, ok = run_privileged(test_script, 60)
        if ok:
            log("Admin credentials cached")
        else:
            log(f"Warning: credentials not cached: {stderr}")

        while True:
            try:
                conn, _ = server.accept()
                threading.Thread(target=handle_client, args=(conn,), daemon=True).start()
            except KeyboardInterrupt:
                break
            except Exception as e:
                log(f"Accept error: {e}")
                break

    finally:
        server.close()
        try:
            os.remove(SOCKET_PATH)
        except:
            pass
        log("Helper stopped")

if __name__ == "__main__":
    main()
