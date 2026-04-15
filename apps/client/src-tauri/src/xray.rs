use std::path::{Path, PathBuf};
use std::process::{Child, Command};
use std::{io::Read, thread, time::Duration};
#[cfg(target_os = "windows")]
use std::net::{Ipv4Addr, ToSocketAddrs};
#[cfg(target_os = "windows")]
use std::os::windows::process::CommandExt;
#[cfg(target_os = "windows")]
use crate::config::TUN_INTERFACE_NAME;
use crate::config::XrayConfig;
use crate::server::ServerConfig;
use crate::settings::RoutingMode;

#[cfg(target_os = "windows")]
#[derive(Debug, Clone)]
struct RouteState {
    server_ip: Ipv4Addr,
    original_gateway: Ipv4Addr,
    tun_next_hop: String,
    tun_interface_index: u32,
}

#[cfg(target_os = "windows")]
#[derive(Debug)]
struct TunInterfaceInfo {
    ip: Option<Ipv4Addr>,
    interface_index: u32,
}

#[cfg(target_os = "windows")]
#[derive(Debug)]
struct DefaultRouteInfo {
    next_hop: Ipv4Addr,
}

#[cfg(target_os = "windows")]
const CREATE_NO_WINDOW: u32 = 0x08000000;

pub struct XrayManager {
    process: Option<Child>,
    config_path: PathBuf,
    #[cfg(target_os = "windows")]
    route_state: Option<RouteState>,
}

impl XrayManager {
    pub fn new() -> Self {
        let config_path = std::env::temp_dir().join("pixel-vpn-xray-config.json");
        Self {
            process: None,
            config_path,
            #[cfg(target_os = "windows")]
            route_state: None,
        }
    }

    pub fn start(
        &mut self,
        server: &ServerConfig,
        routing_mode: &RoutingMode,
        bypass_domains: &[String],
        bypass_ips: &[String],
    ) -> Result<(), Box<dyn std::error::Error>> {
        if self.is_running() {
            self.stop()?;
        }

        let xray_bin = self.find_xray_binary()?;
        let geodata_available = Self::has_geodata_for_binary(&xray_bin);

        let config = XrayConfig::build(
            server,
            routing_mode,
            bypass_domains,
            bypass_ips,
            geodata_available,
        );
        let config_json = serde_json::to_string_pretty(&config)?;
        std::fs::write(&self.config_path, config_json)?;

        let mut child = Command::new(xray_bin)
            .args(["run", "-config"])
            .arg(&self.config_path)
            .stdout(std::process::Stdio::piped())
            .stderr(std::process::Stdio::piped())
            .pipe_windows_no_window()
            .spawn()?;

        // Fail fast if xray exits immediately (e.g. missing admin rights / wintun for TUN mode).
        thread::sleep(Duration::from_millis(200));
        if let Some(status) = child.try_wait()? {
            let mut stderr_text = String::new();
            let mut stdout_text = String::new();
            if let Some(mut stderr) = child.stderr.take() {
                let mut buf = Vec::new();
                if stderr.read_to_end(&mut buf).is_ok() {
                    stderr_text = String::from_utf8_lossy(&buf).trim().to_string();
                }
            }
            if let Some(mut stdout) = child.stdout.take() {
                let mut buf = Vec::new();
                if stdout.read_to_end(&mut buf).is_ok() {
                    stdout_text = String::from_utf8_lossy(&buf).trim().to_string();
                }
            }

            let details = if !stderr_text.is_empty() {
                stderr_text
            } else if !stdout_text.is_empty() {
                stdout_text
            } else {
                format!("xray exited with status {status}")
            };

            return Err(format!("Failed to start xray: {details}").into());
        }

        self.process = Some(child);

        #[cfg(target_os = "windows")]
        {
            if let Err(err) = self.apply_windows_routes(server) {
                let _ = self.stop();
                return Err(err);
            }
        }

        log::info!("Xray-core started");
        Ok(())
    }

    pub fn stop(&mut self) -> Result<(), Box<dyn std::error::Error>> {
        #[cfg(target_os = "windows")]
        let route_error = self.clear_windows_routes().err();

        if let Some(ref mut child) = self.process {
            child.kill()?;
            child.wait()?;
            log::info!("Xray-core stopped");
        }
        self.process = None;

        #[cfg(target_os = "windows")]
        if let Some(err) = route_error {
            return Err(err);
        }

        Ok(())
    }

    pub fn is_running(&self) -> bool {
        self.process.is_some()
    }

    fn find_xray_binary(&self) -> Result<PathBuf, Box<dyn std::error::Error>> {
        let mut search_roots = Vec::new();

        if let Ok(cwd) = std::env::current_dir() {
            Self::push_unique_path(&mut search_roots, cwd);
        }

        if let Ok(current_exe) = std::env::current_exe() {
            if let Some(exe_dir) = current_exe.parent() {
                let mut dir = Some(exe_dir.to_path_buf());
                for _ in 0..6 {
                    if let Some(current) = dir {
                        Self::push_unique_path(&mut search_roots, current.clone());
                        dir = current.parent().map(|parent| parent.to_path_buf());
                    } else {
                        break;
                    }
                }
            }
        }

        let mut possible_paths = Vec::new();
        for root in &search_roots {
            Self::push_unique_path(&mut possible_paths, root.join("xray.exe"));
            Self::push_unique_path(&mut possible_paths, root.join("binaries").join("xray.exe"));
            Self::push_unique_path(
                &mut possible_paths,
                root.join("src-tauri").join("binaries").join("xray.exe"),
            );
            Self::push_unique_path(&mut possible_paths, root.join("resources").join("xray.exe"));
            Self::push_unique_path(
                &mut possible_paths,
                root.join("resources").join("binaries").join("xray.exe"),
            );
        }

        if let Some(path_binary) = Self::find_in_path("xray.exe") {
            Self::push_unique_path(&mut possible_paths, path_binary);
        }
        if let Some(path_binary) = Self::find_in_path("xray") {
            Self::push_unique_path(&mut possible_paths, path_binary);
        }

        for path in &possible_paths {
            if path.is_file() {
                return Ok(path.clone());
            }
        }

        let searched = possible_paths
            .iter()
            .map(|path| path.display().to_string())
            .collect::<Vec<_>>()
            .join("; ");

        Err(format!("Xray binary not found. Searched paths: {searched}").into())
    }

    fn find_in_path(binary_name: &str) -> Option<PathBuf> {
        let path_env = std::env::var_os("PATH")?;
        std::env::split_paths(&path_env)
            .map(|dir| dir.join(binary_name))
            .find(|candidate| candidate.exists() && Self::is_executable_file(candidate))
    }

    fn is_executable_file(path: &Path) -> bool {
        path.is_file()
    }

    fn has_geodata_for_binary(xray_bin: &Path) -> bool {
        let Some(parent) = xray_bin.parent() else {
            return false;
        };

        let geoip = parent.join("geoip.dat");
        let geosite = parent.join("geosite.dat");
        geoip.is_file() && geosite.is_file()
    }

    fn push_unique_path(list: &mut Vec<PathBuf>, candidate: PathBuf) {
        if !list.iter().any(|path| path == &candidate) {
            list.push(candidate);
        }
    }

    #[cfg(target_os = "windows")]
    fn apply_windows_routes(
        &mut self,
        server: &ServerConfig,
    ) -> Result<(), Box<dyn std::error::Error>> {
        self.clear_windows_routes().ok();

        let tun = self.wait_tun_interface_info(Duration::from_secs(12))?;
        let server_ip = Self::resolve_server_ipv4(server)?;
        let default_route = Self::get_default_ipv4_route_excluding(tun.interface_index)?;

        Self::route_add(
            &[
                "add",
                &server_ip.to_string(),
                "mask",
                "255.255.255.255",
                &default_route.next_hop.to_string(),
                "metric",
                "1",
            ],
            true,
        )?;

        // Xray's TUN inbound does not change system routes automatically.
        // Route all IPv4 traffic via TUN and keep a dedicated route to server endpoint.
        let tun_next_hop = tun
            .ip
            .map(|ip| ip.to_string())
            .unwrap_or_else(|| "0.0.0.0".to_string());

        Self::route_add(
            &[
                "add",
                "0.0.0.0",
                "mask",
                "0.0.0.0",
                &tun_next_hop,
                "if",
                &tun.interface_index.to_string(),
                "metric",
                "3",
            ],
            true,
        )?;

        self.route_state = Some(RouteState {
            server_ip,
            original_gateway: default_route.next_hop,
            tun_next_hop,
            tun_interface_index: tun.interface_index,
        });

        Ok(())
    }

    #[cfg(target_os = "windows")]
    fn clear_windows_routes(&mut self) -> Result<(), Box<dyn std::error::Error>> {
        let Some(state) = self.route_state.take() else {
            return Ok(());
        };

        Self::route_delete(
            &[
                "delete",
                "0.0.0.0",
                "mask",
                "0.0.0.0",
                &state.tun_next_hop,
                "if",
                &state.tun_interface_index.to_string(),
            ],
            true,
        )?;

        Self::route_delete(
            &[
                "delete",
                &state.server_ip.to_string(),
                "mask",
                "255.255.255.255",
                &state.original_gateway.to_string(),
            ],
            true,
        )?;

        Ok(())
    }

    #[cfg(target_os = "windows")]
    fn wait_tun_interface_info(&mut self, timeout: Duration) -> Result<TunInterfaceInfo, Box<dyn std::error::Error>> {
        let deadline = std::time::Instant::now() + timeout;
        while std::time::Instant::now() < deadline {
            if let Ok(info) = Self::get_tun_interface_info() {
                return Ok(info);
            }

            if self.xray_exited() {
                let details = self.take_xray_output().unwrap_or_else(|| "xray process exited unexpectedly".to_string());
                return Err(format!("Failed to start xray: {details}").into());
            }
            thread::sleep(Duration::from_millis(120));
        }
        Err("Failed to detect TUN interface".into())
    }

    #[cfg(target_os = "windows")]
    fn get_tun_interface_info() -> Result<TunInterfaceInfo, Box<dyn std::error::Error>> {
        if let Ok(interface_index) = Self::get_tun_interface_index_from_route_print() {
            return Ok(TunInterfaceInfo {
                ip: None,
                interface_index,
            });
        }
        Err("No TUN interface yet".into())
    }

    #[cfg(target_os = "windows")]
    fn get_tun_interface_index_from_route_print() -> Result<u32, Box<dyn std::error::Error>> {
        let output = Command::new("route")
            .arg("print")
            .pipe_windows_no_window()
            .output()?;
        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr).trim().to_string();
            return Err(format!("route print failed: {stderr}").into());
        }

        let text = String::from_utf8_lossy(&output.stdout);
        let mut fallback: Option<u32> = None;

        for line in text.lines() {
            let trimmed = line.trim();
            if trimmed.is_empty() {
                continue;
            }

            let Some(dot_pos) = trimmed.find("...") else {
                continue;
            };

            let idx_str = trimmed[..dot_pos].trim();
            let Ok(index) = idx_str.parse::<u32>() else {
                continue;
            };

            let name = if let Some(sep) = trimmed.rfind("......") {
                trimmed[sep + 6..].trim()
            } else {
                trimmed
            };
            let name_lc = name.to_lowercase();

            if name.eq_ignore_ascii_case(TUN_INTERFACE_NAME) {
                return Ok(index);
            }

            if name_lc.contains("xray") || name_lc.contains("pixel") {
                return Ok(index);
            }

            if fallback.is_none() && (name_lc.contains("tunnel") || name_lc.contains("wintun")) {
                fallback = Some(index);
            }
        }

        fallback.ok_or_else(|| "TUN interface not present in route print".into())
    }

    #[cfg(target_os = "windows")]
    fn get_default_ipv4_route_excluding(
        excluded_interface_index: u32,
    ) -> Result<DefaultRouteInfo, Box<dyn std::error::Error>> {
        let output = Command::new("route")
            .args(["print", "0.0.0.0"])
            .pipe_windows_no_window()
            .output()?;
        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr).trim().to_string();
            return Err(format!("route print failed: {stderr}").into());
        }

        let text = String::from_utf8_lossy(&output.stdout);
        let mut best: Option<(u32, Ipv4Addr)> = None;
        for line in text.lines() {
            let trimmed = line.trim();
            if !trimmed.starts_with("0.0.0.0") {
                continue;
            }
            let parts = trimmed.split_whitespace().collect::<Vec<_>>();
            if parts.len() < 5 {
                continue;
            }
            let gateway = parts[2].parse::<Ipv4Addr>().ok();
            let metric = parts[4].parse::<u32>().ok();
            let Some(gateway) = gateway else {
                continue;
            };
            let Some(metric) = metric else {
                continue;
            };
            if gateway == Ipv4Addr::new(0, 0, 0, 0) {
                continue;
            }

            // best metric wins; excluded interface index is currently used only in old PS path
            let _ = excluded_interface_index;
            if best.as_ref().is_none_or(|(best_metric, _)| metric < *best_metric) {
                best = Some((metric, gateway));
            }
        }

        let Some((_, next_hop)) = best else {
            return Err("Default IPv4 route not found".into());
        };
        Ok(DefaultRouteInfo { next_hop })
    }

    #[cfg(target_os = "windows")]
    fn resolve_server_ipv4(server: &ServerConfig) -> Result<Ipv4Addr, Box<dyn std::error::Error>> {
        if let Ok(ip) = server.address.parse::<Ipv4Addr>() {
            return Ok(ip);
        }

        let target = format!("{}:{}", server.address, server.port);
        let resolved = target
            .to_socket_addrs()?
            .find_map(|socket| match socket.ip() {
                std::net::IpAddr::V4(ipv4) => Some(ipv4),
                _ => None,
            });

        resolved.ok_or_else(|| "Failed to resolve IPv4 for VPN server".into())
    }

    #[cfg(target_os = "windows")]
    fn route_add(args: &[&str], ignore_exists: bool) -> Result<(), Box<dyn std::error::Error>> {
        let output = Command::new("route")
            .args(args)
            .pipe_windows_no_window()
            .output()?;
        if output.status.success() {
            return Ok(());
        }

        let stderr = String::from_utf8_lossy(&output.stderr).to_string();
        let stdout = String::from_utf8_lossy(&output.stdout).to_string();
        let combined = format!("{stdout}\n{stderr}");
        let normalized = combined.to_lowercase();

        if ignore_exists && (normalized.contains("already exists") || normalized.contains("уже существует")) {
            return Ok(());
        }

        Err(format!("route add failed: {}", combined.trim()).into())
    }

    #[cfg(target_os = "windows")]
    fn route_delete(args: &[&str], ignore_missing: bool) -> Result<(), Box<dyn std::error::Error>> {
        let output = Command::new("route")
            .args(args)
            .pipe_windows_no_window()
            .output()?;
        if output.status.success() {
            return Ok(());
        }

        let stderr = String::from_utf8_lossy(&output.stderr).to_string();
        let stdout = String::from_utf8_lossy(&output.stdout).to_string();
        let combined = format!("{stdout}\n{stderr}");
        let normalized = combined.to_lowercase();

        if ignore_missing
            && (normalized.contains("not found")
                || normalized.contains("не найден")
                || normalized.contains("элемент не найден"))
        {
            return Ok(());
        }

        Err(format!("route delete failed: {}", combined.trim()).into())
    }

    fn xray_exited(&mut self) -> bool {
        let Some(child) = self.process.as_mut() else {
            return false;
        };
        child.try_wait().ok().flatten().is_some()
    }

    fn take_xray_output(&mut self) -> Option<String> {
        let child = self.process.as_mut()?;
        let mut stderr_text = String::new();
        let mut stdout_text = String::new();

        if let Some(mut stderr) = child.stderr.take() {
            let mut buf = Vec::new();
            if stderr.read_to_end(&mut buf).is_ok() {
                stderr_text = String::from_utf8_lossy(&buf).trim().to_string();
            }
        }
        if let Some(mut stdout) = child.stdout.take() {
            let mut buf = Vec::new();
            if stdout.read_to_end(&mut buf).is_ok() {
                stdout_text = String::from_utf8_lossy(&buf).trim().to_string();
            }
        }

        if !stderr_text.is_empty() {
            Some(stderr_text)
        } else if !stdout_text.is_empty() {
            Some(stdout_text)
        } else {
            None
        }
    }
}

trait CommandExtNoWindow {
    fn pipe_windows_no_window(&mut self) -> &mut Self;
}

impl CommandExtNoWindow for Command {
    fn pipe_windows_no_window(&mut self) -> &mut Self {
        #[cfg(target_os = "windows")]
        {
            self.creation_flags(CREATE_NO_WINDOW);
        }
        self
    }
}

impl Drop for XrayManager {
    fn drop(&mut self) {
        let _ = self.stop();
    }
}
