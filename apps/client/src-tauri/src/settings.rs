use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use crate::server::ServerConfig;

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq)]
pub enum RoutingMode {
    Global,         // All traffic through VPN
    BypassRussia,   // RU sites go direct
    BypassCN,       // CN sites go direct
    BypassCustom,   // Only custom bypass lists
}

impl Default for RoutingMode {
    fn default() -> Self {
        Self::Global
    }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AppSettings {
    pub routing_mode: RoutingMode,
    pub bypass_domains: Vec<String>,
    pub bypass_ips: Vec<String>,
    pub servers: Vec<ServerConfig>,
    pub active_server_id: Option<String>,
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            routing_mode: RoutingMode::Global,
            bypass_domains: Vec::new(),
            bypass_ips: Vec::new(),
            servers: Vec::new(),
            active_server_id: None,
        }
    }
}

impl AppSettings {
    fn config_path() -> PathBuf {
        let dir = dirs::config_dir()
            .unwrap_or_else(|| PathBuf::from("."))
            .join("pixel-vpn");
        let _ = std::fs::create_dir_all(&dir);
        dir.join("settings.json")
    }

    pub fn load() -> Self {
        let path = Self::config_path();
        match std::fs::read_to_string(&path) {
            Ok(contents) => serde_json::from_str(&contents).unwrap_or_default(),
            Err(_) => Self::default(),
        }
    }

    pub fn save(&self) -> Result<(), String> {
        let path = Self::config_path();
        let json = serde_json::to_string_pretty(self).map_err(|e| e.to_string())?;
        std::fs::write(&path, json).map_err(|e| e.to_string())
    }

    pub fn active_server(&self) -> Option<&ServerConfig> {
        let id = self.active_server_id.as_ref()?;
        self.servers.iter().find(|s| &s.id == id)
    }

    pub fn add_server(&mut self, server: ServerConfig) {
        // Replace if same id exists
        if let Some(pos) = self.servers.iter().position(|s| s.id == server.id) {
            self.servers[pos] = server;
        } else {
            let id = server.id.clone();
            self.servers.push(server);
            // Auto-select if first server
            if self.active_server_id.is_none() {
                self.active_server_id = Some(id);
            }
        }
    }

    pub fn remove_server(&mut self, id: &str) {
        self.servers.retain(|s| s.id != id);
        if self.active_server_id.as_deref() == Some(id) {
            self.active_server_id = self.servers.first().map(|s| s.id.clone());
        }
    }
}
