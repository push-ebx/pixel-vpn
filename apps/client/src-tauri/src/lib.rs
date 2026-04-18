mod commands;
mod config;
#[cfg(not(target_os = "macos"))]
mod elevation;
#[cfg(target_os = "macos")]
mod helper_client;
#[cfg(target_os = "macos")]
mod helper_installer;
mod server;
mod settings;
mod system_proxy;
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
    #[cfg(not(target_os = "macos"))]
    {
        // In `tauri dev`, relaunching via ShellExecute("runas") drops Tauri dev context,
        // which leads to white screen and ELIFECYCLE in the original process.
        // Keep mandatory elevation for release builds; allow explicit opt-in in debug.
        let should_elevate = !cfg!(debug_assertions) || std::env::var_os("PIXEL_FORCE_ELEVATION").is_some();

        if should_elevate {
            match elevation::ensure_admin_or_relaunch() {
                Ok(true) => {}
                Ok(false) => return,
                Err(error) => {
                    eprintln!("{error}");
                    return;
                }
            }
        }
    }

    #[cfg(target_os = "macos")]
    log::info!("Starting Pixel VPN (using privileged helper for admin operations)");

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
            // Helper (macOS)
            install_helper,
            uninstall_helper,
            get_helper_status,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
