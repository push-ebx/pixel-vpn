mod commands;
mod config;
mod elevation;
mod server;
mod settings;
mod vpn_plugin;
mod xray;

use std::sync::Mutex;
use commands::*;
use settings::AppSettings;
#[cfg(not(target_os = "android"))]
use xray::XrayManager;
#[cfg(target_os = "android")]
use xray::AndroidVpnBridge;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    match elevation::ensure_admin_or_relaunch() {
        Ok(true) => {}
        Ok(false) => return,
        Err(error) => {
            eprintln!("{error}");
            return;
        }
    }

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(vpn_plugin::init())
        .manage(AppState {
            #[cfg(not(target_os = "android"))]
            xray: Mutex::new(XrayManager::new()),
            #[cfg(target_os = "android")]
            xray: Mutex::new(AndroidVpnBridge::new()),
            settings: Mutex::new(AppSettings::load()),
        })
        .invoke_handler(tauri::generate_handler![
            // Window
            window_start_dragging,
            window_minimize,
            window_close,
            // Connection
            connect_vpn,
            disconnect_vpn,
            get_connection_status,
            // Servers
            get_servers,
            add_server,
            remove_server,
            select_server,
            get_active_server_id,
            ping_server,
            // Settings
            get_settings,
            set_routing_mode,
            set_bypass_lists,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
