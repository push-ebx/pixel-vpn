//! Tauri plugin that bridges Rust commands to the Kotlin VpnPlugin on Android.
//! On desktop, this plugin is a no-op.

use tauri::{
    plugin::{Builder, TauriPlugin},
    Runtime,
};
#[cfg(target_os = "android")]
use tauri::Manager;

#[cfg(target_os = "android")]
use tauri::plugin::PluginHandle;

#[cfg(target_os = "android")]
use serde::{Deserialize, Serialize};
#[cfg(target_os = "android")]
use serde_json::json;

#[cfg(target_os = "android")]
#[derive(Serialize)]
struct EmptyRequest {}

#[cfg(target_os = "android")]
#[derive(Deserialize)]
struct PluginResponse {
    #[allow(dead_code)]
    status: Option<String>,
    #[allow(dead_code)]
    running: Option<bool>,
}

#[cfg(target_os = "android")]
pub struct VpnPluginHandle<R: Runtime>(pub PluginHandle<R>);

#[cfg(target_os = "android")]
impl<R: Runtime> VpnPluginHandle<R> {
    pub fn start_vpn(&self, config_json: &str) -> Result<(), String> {
        let payload = json!({
            "configJson": config_json,
            "config_json": config_json,
        });

        self.0
            .run_mobile_plugin::<PluginResponse>(
                "startVpn",
                payload,
            )
            .map(|_| ())
            .map_err(|e| format!("Failed to start Android VPN: {e}"))
    }

    pub fn stop_vpn(&self) -> Result<(), String> {
        self.0
            .run_mobile_plugin::<PluginResponse>("stopVpn", EmptyRequest {})
            .map(|_| ())
            .map_err(|e| format!("Failed to stop Android VPN: {e}"))
    }
}

pub fn init<R: Runtime>() -> TauriPlugin<R> {
    Builder::new("vpn-android")
        .setup(|app, _api| {
            #[cfg(target_os = "android")]
            {
                let handle = _api.register_android_plugin("com.pixelvpn.app", "VpnPlugin")?;
                app.manage(VpnPluginHandle(handle));
            }
            #[cfg(not(target_os = "android"))]
            {
                let _ = app;
            }
            Ok(())
        })
        .build()
}
