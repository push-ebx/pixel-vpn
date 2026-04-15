use std::sync::Mutex;
use std::io::{BufRead, BufReader, Write};
use std::net::{TcpStream, ToSocketAddrs};
use std::thread;
use std::time::{Duration, Instant};
use tauri::State;
use crate::server::ServerConfig;
use crate::settings::{AppSettings, RoutingMode};
#[cfg(not(target_os = "android"))]
use crate::xray::XrayManager;
#[cfg(target_os = "android")]
use crate::xray::AndroidVpnBridge;

pub struct AppState {
    #[cfg(not(target_os = "android"))]
    pub xray: Mutex<XrayManager>,
    #[cfg(target_os = "android")]
    pub xray: Mutex<AndroidVpnBridge>,
    pub settings: Mutex<AppSettings>,
}

// ─── Connection commands ────────────────────────────────────────────

#[tauri::command]
pub fn window_start_dragging(window: tauri::Window) -> Result<(), String> {
    #[cfg(any(target_os = "windows", target_os = "macos", target_os = "linux"))]
    {
        return window.start_dragging().map_err(|e| e.to_string());
    }
    #[cfg(not(any(target_os = "windows", target_os = "macos", target_os = "linux")))]
    {
        let _ = window;
        Ok(())
    }
}

#[tauri::command]
pub fn window_minimize(window: tauri::Window) -> Result<(), String> {
    #[cfg(any(target_os = "windows", target_os = "macos", target_os = "linux"))]
    {
        return window.minimize().map_err(|e| e.to_string());
    }
    #[cfg(not(any(target_os = "windows", target_os = "macos", target_os = "linux")))]
    {
        let _ = window;
        Ok(())
    }
}

#[tauri::command]
pub fn window_close(window: tauri::Window) -> Result<(), String> {
    #[cfg(any(target_os = "windows", target_os = "macos", target_os = "linux"))]
    {
        return window.close().map_err(|e| e.to_string());
    }
    #[cfg(not(any(target_os = "windows", target_os = "macos", target_os = "linux")))]
    {
        let _ = window;
        Ok(())
    }
}

#[tauri::command]
pub async fn connect_vpn(
    state: State<'_, AppState>,
    app: tauri::AppHandle,
) -> Result<String, String> {
    let (server, routing_mode, bypass_domains, bypass_ips) = {
        let settings = state.settings.lock().map_err(|e| e.to_string())?;
        let server = settings
            .active_server()
            .cloned()
            .ok_or("No server selected")?;
        (
            server,
            settings.routing_mode.clone(),
            settings.bypass_domains.clone(),
            settings.bypass_ips.clone(),
        )
    };

    {
        let mut xray = state.xray.lock().map_err(|e| e.to_string())?;
        xray.start(&server, &routing_mode, &bypass_domains, &bypass_ips)
            .map_err(|e| e.to_string())?;
    }

    #[cfg(not(target_os = "android"))]
    {
        let _ = &app;
        let readiness = tokio::task::spawn_blocking(|| {
            wait_for_connectivity(Duration::from_secs(15))
        })
        .await
        .map_err(|e| e.to_string())?;

        if let Err(err) = readiness {
            let mut xray = state.xray.lock().map_err(|e| e.to_string())?;
            let _ = xray.stop();
            return Err(err);
        }
    }

    #[cfg(target_os = "android")]
    {
        let config_json = {
            let xray = state.xray.lock().map_err(|e| e.to_string())?;
            xray.take_config().ok_or("No VPN config available")?
        };
        let vpn_plugin = app.state::<crate::vpn_plugin::VpnPluginHandle<tauri::Wry>>();
        vpn_plugin.start_vpn(&config_json)?;
    }

    Ok("Connected".to_string())
}

#[tauri::command]
pub async fn disconnect_vpn(
    state: State<'_, AppState>,
    app: tauri::AppHandle,
) -> Result<String, String> {
    let mut xray = state.xray.lock().map_err(|e| e.to_string())?;
    xray.stop().map_err(|e| e.to_string())?;

    #[cfg(target_os = "android")]
    {
        let vpn_plugin = app.state::<crate::vpn_plugin::VpnPluginHandle<tauri::Wry>>();
        vpn_plugin.stop_vpn()?;
    }

    #[cfg(not(target_os = "android"))]
    let _ = &app;

    Ok("Disconnected".to_string())
}

#[tauri::command]
pub async fn get_connection_status(state: State<'_, AppState>) -> Result<bool, String> {
    let xray = state.xray.lock().map_err(|e| e.to_string())?;
    Ok(xray.is_running())
}

// ─── Server management commands ─────────────────────────────────────

#[tauri::command]
pub async fn get_servers(state: State<'_, AppState>) -> Result<Vec<ServerConfig>, String> {
    let settings = state.settings.lock().map_err(|e| e.to_string())?;
    Ok(settings.servers.clone())
}

#[tauri::command]
pub async fn add_server(state: State<'_, AppState>, vless_uri: String) -> Result<ServerConfig, String> {
    let server = ServerConfig::from_vless_uri(&vless_uri)?;
    let result = server.clone();
    let mut settings = state.settings.lock().map_err(|e| e.to_string())?;
    settings.add_server(server);
    settings.save()?;
    Ok(result)
}

#[tauri::command]
pub async fn remove_server(state: State<'_, AppState>, id: String) -> Result<(), String> {
    let mut settings = state.settings.lock().map_err(|e| e.to_string())?;
    settings.remove_server(&id);
    settings.save()
}

#[tauri::command]
pub async fn select_server(state: State<'_, AppState>, id: String) -> Result<(), String> {
    let mut settings = state.settings.lock().map_err(|e| e.to_string())?;
    if !settings.servers.iter().any(|s| s.id == id) {
        return Err("Server not found".to_string());
    }
    settings.active_server_id = Some(id);
    settings.save()
}

#[tauri::command]
pub async fn get_active_server_id(state: State<'_, AppState>) -> Result<Option<String>, String> {
    let settings = state.settings.lock().map_err(|e| e.to_string())?;
    Ok(settings.active_server_id.clone())
}

#[tauri::command]
pub async fn ping_server(state: State<'_, AppState>, id: String) -> Result<Option<u32>, String> {
    let server = {
        let settings = state.settings.lock().map_err(|e| e.to_string())?;
        settings
            .servers
            .iter()
            .find(|s| s.id == id)
            .cloned()
            .ok_or_else(|| "Server not found".to_string())?
    };

    let ping_id = id.clone();
    let latency = tokio::task::spawn_blocking(move || server.ping())
        .await
        .map_err(|e| e.to_string())?;

    // Update stored latency
    {
        let mut settings = state.settings.lock().map_err(|e| e.to_string())?;
        if let Some(s) = settings.servers.iter_mut().find(|s| s.id == ping_id) {
            s.latency_ms = latency;
        }
    }

    Ok(latency)
}

// ─── Routing / settings commands ────────────────────────────────────

#[tauri::command]
pub async fn get_settings(state: State<'_, AppState>) -> Result<AppSettings, String> {
    let settings = state.settings.lock().map_err(|e| e.to_string())?;
    Ok(settings.clone())
}

#[tauri::command]
pub async fn set_routing_mode(state: State<'_, AppState>, mode: RoutingMode) -> Result<(), String> {
    let mut settings = state.settings.lock().map_err(|e| e.to_string())?;
    settings.routing_mode = mode;
    settings.save()
}

#[tauri::command]
pub async fn set_bypass_lists(
    state: State<'_, AppState>,
    domains: Vec<String>,
    ips: Vec<String>,
) -> Result<(), String> {
    let mut settings = state.settings.lock().map_err(|e| e.to_string())?;
    settings.bypass_domains = domains;
    settings.bypass_ips = ips;
    settings.save()
}

const CONNECTIVITY_ENDPOINTS: [(&str, &str); 5] = [
    ("example.com", "/"),                                  // 200
    ("neverssl.com", "/"),                                 // 200
    ("www.msftconnecttest.com", "/connecttest.txt"),       // 200
    ("connectivitycheck.gstatic.com", "/generate_204"),    // 204
    ("clients3.google.com", "/generate_204"),              // 204
];

fn wait_for_connectivity(timeout: Duration) -> Result<(), String> {
    let deadline = Instant::now() + timeout;
    while Instant::now() < deadline {
        for (host, path) in CONNECTIVITY_ENDPOINTS {
            if let Ok(status) = fetch_http_status(host, path) {
                if (200..400).contains(&status) {
                    return Ok(());
                }
            }
        }
        thread::sleep(Duration::from_millis(250));
    }

    Err("VPN tunnel is up, but internet check did not return HTTP 2xx/3xx in time".to_string())
}

fn fetch_http_status(host: &str, path: &str) -> Result<u16, String> {
    let addrs = (host, 80)
        .to_socket_addrs()
        .map_err(|e| e.to_string())?
        .collect::<Vec<_>>();

    for addr in addrs {
        let mut stream = match TcpStream::connect_timeout(&addr, Duration::from_secs(2)) {
            Ok(s) => s,
            Err(_) => continue,
        };
        let _ = stream.set_read_timeout(Some(Duration::from_secs(2)));
        let _ = stream.set_write_timeout(Some(Duration::from_secs(2)));

        let request = format!(
            "GET {} HTTP/1.1\r\nHost: {}\r\nConnection: close\r\nUser-Agent: PixelVPN/1.0\r\n\r\n",
            path, host
        );
        if stream.write_all(request.as_bytes()).is_err() {
            continue;
        }

        let mut status_line = String::new();
        let mut reader = BufReader::new(stream);
        if reader.read_line(&mut status_line).is_err() {
            continue;
        }

        if let Some(code) = status_line
            .split_whitespace()
            .nth(1)
            .and_then(|v| v.parse::<u16>().ok())
        {
            return Ok(code);
        }
    }

    Err(format!("No HTTP response from {}", host))
}
