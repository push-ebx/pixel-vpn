#![cfg(target_os = "macos")]

use network_extension::NETunnelProviderManager;
use network_extension::NETunnelProviderProtocol;
use network_extension::NEVPNConnection;
use network_extension::NEVPNStatus;
use oslog::OsLogger;
use serde::{Deserialize, Serialize};
use std::net::IpAddr;
use std::process::Command;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use std::time::Duration;
use tokio::sync::mpsc;

static TUNNEL_RUNNING: AtomicBool = AtomicBool::new(false);

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TunnelConfig {
    pub server_address: String,
    pub server_port: u16,
    pub xray_config_path: String,
    pub xray_binary_path: String,
    pub tunnel_mtu: u32,
    pub tunnel_address: String,
    pub tunnel_netmask: u32,
    pub dns_servers: Vec<String>,
    pub included_routes: Vec<String>,
    pub excluded_routes: Vec<String>,
}

pub struct PacketTunnelProvider {
    config: TunnelConfig,
    xray_process: Option<std::process::Child>,
}

impl PacketTunnelProvider {
    pub fn new(config: TunnelConfig) -> Self {
        Self {
            config,
            xray_process: None,
        }
    }

    pub async fn start(&mut self) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        if TUNNEL_RUNNING.swap(true, Ordering::SeqCst) {
            return Err("Tunnel is already running".into());
        }

        let logger = OsLogger::new("com.pixelvpn.tunnel")
            .map_level_filter(log::LevelFilter::Info)
            .init();
        if logger.is_err() {
            eprintln!("Failed to initialize logger");
        }

        log::info!("Starting packet tunnel provider");

        self.start_xray().await?;

        tokio::time::sleep(Duration::from_secs(1)).await;

        self.configure_routes().await?;

        log::info!("Packet tunnel started successfully");
        Ok(())
    }

    async fn start_xray(&mut self) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        log::info!("Starting xray with config: {}", self.config.xray_config_path);

        let mut child = Command::new(&self.config.xray_binary_path)
            .args(["run", "-config", &self.config.xray_config_path])
            .spawn()
            .map_err(|e| format!("Failed to start xray: {}", e))?;

        tokio::time::sleep(Duration::from_millis(500)).await;

        if child.try_wait().is_ok_and(|s| s.is_some()) {
            return Err("xray exited immediately".into());
        }

        self.xray_process = Some(child);
        log::info!("xray started successfully");
        Ok(())
    }

    async fn configure_routes(&self) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        log::info!("Configuring network routes");

        Ok(())
    }

    pub async fn stop(&mut self) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        log::info!("Stopping packet tunnel provider");

        if let Some(mut child) = self.xray_process.take() {
            let _ = child.kill();
            let _ = child.wait();
        }

        TUNNEL_RUNNING.store(false, Ordering::SeqCst);

        log::info!("Packet tunnel stopped");
        Ok(())
    }
}

pub fn load_tunnel_config_from_plist() -> Result<TunnelConfig, Box<dyn std::error::Error>> {
    let config_data = std::fs::read("/Library/Preferences/com.pixelvpn.tunnel.plist")?;
    let plist_root: plist::Value = plist::from_bytes(&config_data)?;

    if let plist::Value::Dictionary(dict) = plist_root {
        let server_address = dict
            .get("ServerAddress")
            .and_then(|v| v.as_string())
            .ok_or("Missing ServerAddress")?
            .to_string();

        let server_port = dict
            .get("ServerPort")
            .and_then(|v| v.as_unsigned_integer())
            .ok_or("Missing ServerPort")? as u16;

        let xray_config_path = dict
            .get("XrayConfigPath")
            .and_then(|v| v.as_string())
            .ok_or("Missing XrayConfigPath")?
            .to_string();

        let xray_binary_path = dict
            .get("XrayBinaryPath")
            .and_then(|v| v.as_string())
            .ok_or("Missing XrayBinaryPath")?
            .to_string();

        return Ok(TunnelConfig {
            server_address,
            server_port,
            xray_config_path,
            xray_binary_path,
            tunnel_mtu: 1500,
            tunnel_address: "10.8.0.2".to_string(),
            tunnel_netmask: 24,
            dns_servers: vec!["8.8.8.8".to_string(), "8.8.4.4".to_string()],
            included_routes: vec!["0.0.0.0/0".to_string()],
            excluded_routes: vec![],
        });
    }

    Err("Invalid plist format".into())
}

pub fn save_tunnel_config_to_plist(config: &TunnelConfig) -> Result<(), Box<dyn std::error::Error>> {
    let mut dict = plist::Volume::new();

    dict.insert("ServerAddress", plist::Value::String(config.server_address.clone()));
    dict.insert("ServerPort", plist::Value::Integer(config.server_port as i64));
    dict.insert("XrayConfigPath", plist::Value::String(config.xray_config_path.clone()));
    dict.insert("XrayBinaryPath", plist::Value::String(config.xray_binary_path.clone()));
    dict.insert("TunnelMTU", plist::Value::Integer(config.tunnel_mtu as i64));
    dict.insert("TunnelAddress", plist::Value::String(config.tunnel_address.clone()));
    dict.insert("DNS Servers", plist::Value::Array(
        config.dns_servers.iter().map(|s| plist::Value::String(s.clone())).collect()
    ));

    let xml = plist::to_xml(&dict)?;
    std::fs::write("/Library/Preferences/com.pixelvpn.tunnel.plist", xml)?;

    Ok(())
}

#[no_mangle]
pub extern "C" fn packet_tunnel_provider_start() -> i32 {
    let rt = tokio::runtime::Runtime::new().unwrap();
    rt.block_on(async {
        match load_tunnel_config_from_plist() {
            Ok(config) => {
                let mut provider = PacketTunnelProvider::new(config);
                match provider.start().await {
                    Ok(()) => 0,
                    Err(e) => {
                        eprintln!("Failed to start tunnel: {}", e);
                        -1
                    }
                }
            }
            Err(e) => {
                eprintln!("Failed to load config: {}", e);
                -1
            }
        }
    })
}

#[no_mangle]
pub extern "C" fn packet_tunnel_provider_stop() -> i32 {
    let rt = tokio::runtime::Runtime::new().unwrap();
    rt.block_on(async {
        -1
    })
}
