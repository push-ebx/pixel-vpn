extern crate libc;
extern crate log;

use libc::*;
use std::fs;
use std::io::Write;
use std::path::Path;
use std::process;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Mutex;
use std::thread;
use std::time::Duration;

static RUNNING: AtomicBool = AtomicBool::new(true);
static HELPER_ACTIVE: AtomicBool = AtomicBool::new(false);

struct XrayState {
    pid: Option<u32>,
    config_path: String,
}

lazy_static::lazy_static! {
    static ref XRAY_STATE: Mutex<Option<XrayState>> = Mutex::new(None);
}

const HELPER_VERSION: &str = "1.0.0";
const HELPER_IDENTIFIER: &str = "com.pixelvpn.helper";

#[repr(C)]
struct sockaddr_un {
    sun_family: sa_family_t,
    sun_path: [c_char; 104],
}

fn get_socket_path() -> String {
    format!("/var/run/{}.sock", HELPER_IDENTIFIER)
}

fn log_message(level: &str, msg: &str) {
    let timestamp = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_secs())
        .unwrap_or(0);

    if let Ok(mut file) = fs::OpenOptions::new()
        .create(true)
        .append(true)
        .open("/var/log/pixel-vpn-helper.log")
    {
        let _ = writeln!(file, "[{}] [{}] {}", timestamp, level, msg);
    }
    eprintln!("[{}] {}", level, msg);
}

fn run_command(cmd: &str) -> Result<String, String> {
    log_message("INFO", &format!("Executing: {}", cmd));

    let output = process::Command::new("/bin/zsh")
        .arg("-c")
        .arg(cmd)
        .output()
        .map_err(|e| format!("Failed to execute: {}", e))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("Command failed: {}", stderr));
    }

    Ok(String::from_utf8_lossy(&output.stdout).to_string())
}

fn setup_xray(config_path: &str, xray_path: &str) -> Result<u32, String> {
    let pid_file = "/tmp/pixel-vpn-xray.pid";

    let cmd = format!(
        "\"{}\" run -config \"{}\" >/tmp/pixel-vpn-xray.log 2>&1 & sleep 1 && pgrep -n xray >{} && cat {}",
        xray_path, config_path, pid_file, pid_file
    );

    run_command(&cmd)?;

    let pid_str = fs::read_to_string(pid_file)
        .map_err(|e| format!("Failed to read PID: {}", e))?
        .trim()
        .to_string();

    let pid: u32 = pid_str
        .parse()
        .map_err(|_| format!("Invalid PID: {}", pid_str))?;

    log_message("INFO", &format!("Xray started with PID: {}", pid));
    Ok(pid)
}

fn stop_xray(pid: u32) -> Result<(), String> {
    run_command(&format!(
        "kill {} 2>/dev/null; kill -9 {} 2>/dev/null; true",
        pid, pid
    ))?;
    log_message("INFO", &format!("Xray stopped (PID: {})", pid));
    Ok(())
}

fn add_route(server_ip: &str, gateway: &str, interface: &str) -> Result<(), String> {
    run_command(&format!(
        "route -n add -host {} {} && route -n change default -interface {}",
        server_ip, gateway, interface
    ))?;
    log_message(
        "INFO",
        &format!(
            "Route added: {} via {} on {}",
            server_ip, gateway, interface
        ),
    );
    Ok(())
}

fn remove_route(server_ip: &str, gateway: &str) -> Result<(), String> {
    run_command(&format!(
        "route -n change default {} && route -n delete -host {} {} 2>/dev/null; true",
        gateway, server_ip, gateway
    ))?;
    log_message(
        "INFO",
        &format!("Route removed: {} via {}", server_ip, gateway),
    );
    Ok(())
}

fn handle_request(request: &[u8]) -> Vec<u8> {
    if let Ok(request_str) = String::from_utf8(request.to_vec()) {
        log_message("DEBUG", &format!("Request: {}", request_str));

        if request_str.starts_with("VERSION") {
            return HELPER_VERSION.as_bytes().to_vec();
        }

        if request_str.starts_with("START_XRAY:") {
            let parts: Vec<&str> = request_str.splitn(3, ':').collect();
            if parts.len() >= 3 {
                let config_path = parts[1];
                let xray_path = parts[2];

                match setup_xray(config_path, xray_path) {
                    Ok(pid) => {
                        if let Ok(mut state) = XRAY_STATE.lock() {
                            *state = Some(XrayState {
                                pid: Some(pid),
                                config_path: config_path.to_string(),
                            });
                        }
                        return format!("OK:PID:{}\n", pid).into_bytes();
                    }
                    Err(e) => {
                        return format!("ERROR:{}\n", e).into_bytes();
                    }
                }
            }
            return b"ERROR:Invalid START_XRAY command\n".to_vec();
        }

        if request_str.starts_with("STOP_XRAY") {
            if let Ok(mut state) = XRAY_STATE.lock() {
                if let Some(ref mut xray) = *state {
                    if let Some(pid) = xray.pid.take() {
                        let _ = stop_xray(pid);
                    }
                }
                *state = None;
            }
            return b"OK\n".to_vec();
        }

        if request_str.starts_with("ADD_ROUTE:") {
            let parts: Vec<&str> = request_str.splitn(4, ':').collect();
            if parts.len() >= 4 {
                let server_ip = parts[1];
                let gateway = parts[2];
                let interface = parts[3];

                match add_route(server_ip, gateway, interface) {
                    Ok(()) => return b"OK\n".to_vec(),
                    Err(e) => return format!("ERROR:{}\n", e).into_bytes(),
                }
            }
            return b"ERROR:Invalid ADD_ROUTE command\n".to_vec();
        }

        if request_str.starts_with("REMOVE_ROUTE:") {
            let parts: Vec<&str> = request_str.splitn(3, ':').collect();
            if parts.len() >= 3 {
                let server_ip = parts[1];
                let gateway = parts[2];

                match remove_route(server_ip, gateway) {
                    Ok(()) => return b"OK\n".to_vec(),
                    Err(e) => return format!("ERROR:{}\n", e).into_bytes(),
                }
            }
            return b"ERROR:Invalid REMOVE_ROUTE command\n".to_vec();
        }

        if request_str.starts_with("STATUS") {
            if let Ok(state) = XRAY_STATE.lock() {
                if let Some(ref xray) = *state {
                    if let Some(pid) = xray.pid {
                        let is_running = run_command(&format!(
                            "ps -p {} >/dev/null 2>&1 && echo running || echo stopped",
                            pid
                        ))
                        .map(|s| s.contains("running"))
                        .unwrap_or(false);
                        return format!("OK:RUNNING:{}\n", if is_running { "yes" } else { "no" })
                            .into_bytes();
                    }
                }
            }
            return b"OK:RUNNING:no\n".to_vec();
        }

        if request_str.starts_with("SHUTDOWN") {
            if let Ok(mut state) = XRAY_STATE.lock() {
                if let Some(ref mut xray) = *state {
                    if let Some(pid) = xray.pid.take() {
                        let _ = stop_xray(pid);
                    }
                }
                *state = None;
            }
            RUNNING.store(false, Ordering::SeqCst);
            return b"OK\n".to_vec();
        }
    }

    b"ERROR:Unknown command\n".to_vec()
}

fn create_socket() -> Result<c_int, String> {
    let socket_path = get_socket_path();

    if Path::new(&socket_path).exists() {
        fs::remove_file(&socket_path).map_err(|e| format!("Failed to remove old socket: {}", e))?;
    }

    let sock_fd = unsafe { socket(AF_UNIX, SOCK_STREAM, 0) };
    if sock_fd < 0 {
        return Err("Failed to create socket".to_string());
    }

    let mut addr = sockaddr_un {
        sun_family: AF_UNIX as sa_family_t,
        sun_path: [0; 104],
    };

    let path_bytes = socket_path.as_bytes();
    let len = path_bytes.len().min(103);
    for (i, &byte) in path_bytes.iter().enumerate().take(103) {
        addr.sun_path[i] = byte as c_char;
    }

    let addr_len = std::mem::size_of::<sa_family_t>() + len + 1;

    if unsafe {
        bind(
            sock_fd,
            &addr as *const _ as *const sockaddr,
            addr_len as socklen_t,
        )
    } < 0
    {
        return Err("Failed to bind socket".to_string());
    }

    if unsafe { listen(sock_fd, 10) } < 0 {
        return Err("Failed to listen".to_string());
    }

    unsafe { chmod(socket_path.as_ptr() as *const i8, 0o666) };

    log_message("INFO", &format!("Socket listening at {}", socket_path));
    Ok(sock_fd)
}

fn handle_client(client_fd: c_int) {
    let mut buffer = [0u8; 4096];

    match unsafe { read(client_fd, buffer.as_mut_ptr() as *mut c_void, buffer.len()) } {
        n if n > 0 => {
            let request = &buffer[..n as usize];
            let response = handle_request(request);

            let _ = unsafe {
                write(
                    client_fd,
                    response.as_ptr() as *const c_void,
                    response.len(),
                )
            };
        }
        _ => {}
    }

    let _ = unsafe { close(client_fd) };
}

fn main() {
    let _ = env_logger::try_init();

    log_message("INFO", "Pixel VPN Helper starting...");

    let socket_fd = match create_socket() {
        Ok(fd) => fd,
        Err(e) => {
            log_message("ERROR", &format!("Failed to create socket: {}", e));
            process::exit(1);
        }
    };

    HELPER_ACTIVE.store(true, Ordering::SeqCst);
    log_message("INFO", "Pixel VPN Helper is ready");

    while RUNNING.load(Ordering::SeqCst) {
        let mut client_addr: sockaddr_un = unsafe { std::mem::zeroed() };
        let mut addr_len: socklen_t = std::mem::size_of::<sockaddr_un>() as socklen_t;

        let client_fd = unsafe {
            accept(
                socket_fd,
                &mut client_addr as *mut _ as *mut sockaddr,
                &mut addr_len,
            )
        };

        if client_fd < 0 {
            thread::sleep(Duration::from_millis(100));
            continue;
        }

        thread::spawn(move || {
            handle_client(client_fd);
        });
    }

    let _ = unsafe { close(socket_fd) };
    let socket_path = get_socket_path();
    let _ = fs::remove_file(&socket_path);

    log_message("INFO", "Pixel VPN Helper stopped");
}
