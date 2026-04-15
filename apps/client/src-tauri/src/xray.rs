#[cfg(not(target_os = "android"))]
use crate::config::XrayConfig;
#[cfg(target_os = "windows")]
use crate::config::TUN_INTERFACE_NAME;
use crate::helper_client::PrivilegedHelperClient;
use crate::server::ServerConfig;
use crate::settings::RoutingMode;
#[cfg(not(target_os = "android"))]
use std::io::Read;
#[cfg(target_os = "macos")]
use std::net::{IpAddr, Ipv4Addr, ToSocketAddrs};
#[cfg(target_os = "windows")]
use std::net::{Ipv4Addr, ToSocketAddrs};
#[cfg(target_os = "windows")]
use std::os::windows::process::CommandExt;
#[cfg(not(target_os = "android"))]
use std::path::{Path, PathBuf};
#[cfg(not(target_os = "android"))]
use std::process::{Child, Command};
#[cfg(not(target_os = "android"))]
use std::{thread, time::Duration};

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

#[cfg(not(target_os = "android"))]
pub struct XrayManager {
    process: Option<Child>,
    config_path: PathBuf,
    #[cfg(target_os = "windows")]
    route_state: Option<RouteState>,
    #[cfg(target_os = "macos")]
    helper_client: Option<PrivilegedHelperClient>,
    #[cfg(target_os = "macos")]
    macos_route_state: Option<MacosRouteState>,
    #[cfg(target_os = "macos")]
    macos_pid: Option<u32>,
    #[cfg(target_os = "macos")]
    macos_log_path: PathBuf,
}

#[cfg(not(target_os = "android"))]
impl XrayManager {
    pub fn new() -> Self {
        let config_path = std::env::temp_dir().join("pixel-vpn-xray-config.json");
        Self {
            process: None,
            config_path,
            #[cfg(target_os = "windows")]
            route_state: None,
            #[cfg(target_os = "macos")]
            helper_client: None,
            #[cfg(target_os = "macos")]
            macos_route_state: None,
            #[cfg(target_os = "macos")]
            macos_pid: None,
            #[cfg(target_os = "macos")]
            macos_log_path: std::env::temp_dir().join("pixel-vpn-xray.log"),
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

        #[cfg(target_os = "macos")]
        {
            let config = XrayConfig::build_proxy_only(
                server,
                routing_mode,
                bypass_domains,
                bypass_ips,
                geodata_available,
            );
            let config_json = serde_json::to_string_pretty(&config)?;
            std::fs::write(&self.config_path, &config_json)?;
            self.start_xray_macos(&xray_bin)?;
            self.enable_macos_proxy()?;
            return Ok(());
        }

        #[cfg(not(target_os = "macos"))]
        let mut config = XrayConfig::build(
            server,
            routing_mode,
            bypass_domains,
            bypass_ips,
            geodata_available,
        );

        #[cfg(target_os = "macos")]
        let _ = (routing_mode, bypass_domains, bypass_ips);

        #[cfg(not(target_os = "macos"))]
        {
            #[cfg(target_os = "windows")]
            {
                let utun_name = pick_utun_name_macos().unwrap_or_else(|_| "utun0".to_string());
                for inbound in &mut config.inbounds {
                    if inbound.protocol == "tun" {
                        if let Some(obj) = inbound.settings.as_object_mut() {
                            obj.insert("name".to_string(), serde_json::json!(utun_name));
                        }
                    }
                }
            }

            let config_json = serde_json::to_string_pretty(&config)?;
            std::fs::write(&self.config_path, &config_json)?;

            let mut child = Command::new(&xray_bin)
                .args(["run", "-config"])
                .arg(&self.config_path)
                .stdout(std::process::Stdio::piped())
                .stderr(std::process::Stdio::piped())
                .pipe_windows_no_window()
                .spawn()?;

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
        }

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
        #[cfg(target_os = "macos")]
        {
            self.disable_macos_proxy()?;
            self.stop_xray_macos()?;
        }

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
        #[cfg(target_os = "macos")]
        {
            return self.macos_pid.is_some();
        }

        #[cfg(not(target_os = "macos"))]
        {
            self.process.is_some()
        }
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
            #[cfg(target_os = "windows")]
            let bin_name = "xray.exe";
            #[cfg(not(target_os = "windows"))]
            let bin_name = "xray";

            Self::push_unique_path(&mut possible_paths, root.join(bin_name));
            Self::push_unique_path(&mut possible_paths, root.join("binaries").join(bin_name));
            Self::push_unique_path(
                &mut possible_paths,
                root.join("src-tauri").join("binaries").join(bin_name),
            );
            Self::push_unique_path(&mut possible_paths, root.join("resources").join(bin_name));
            Self::push_unique_path(
                &mut possible_paths,
                root.join("resources").join("binaries").join(bin_name),
            );
        }

        if let Some(path_binary) = Self::find_in_path("xray") {
            Self::push_unique_path(&mut possible_paths, path_binary);
        }
        #[cfg(target_os = "windows")]
        if let Some(path_binary) = Self::find_in_path("xray.exe") {
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

    #[cfg(target_os = "macos")]
    fn start_xray_macos(&mut self, xray_bin: &Path) -> Result<(), Box<dyn std::error::Error>> {
        let mut client = PrivilegedHelperClient::new();

        let pid = client
            .start_xray(
                &self.config_path.display().to_string(),
                &xray_bin.display().to_string(),
            )
            .map_err(|e| format!("Failed to start xray: {}", e))?;

        thread::sleep(Duration::from_millis(500));

        let is_running = std::process::Command::new("pgrep")
            .args(["-x", "xray"])
            .output()
            .map(|o| o.status.success())
            .unwrap_or(false);

        if !is_running {
            let log_content = std::fs::read_to_string("/tmp/pixel-vpn-xray.log")
                .unwrap_or_else(|_| "No log".to_string());
            return Err(format!("xray exited immediately. Log:\n{}", log_content).into());
        }

        self.macos_pid = Some(pid);
        self.helper_client = Some(client);

        log::info!("Xray started (PID: {})", pid);
        Ok(())
    }

    #[cfg(target_os = "macos")]
    fn enable_macos_proxy(&mut self) -> Result<(), Box<dyn std::error::Error>> {
        if let Some(ref mut client) = self.helper_client {
            client
                .enable_proxy()
                .map_err(|e| format!("Failed to enable proxy: {}", e))?;
        }
        log::info!("System proxy enabled");
        Ok(())
    }

    #[cfg(target_os = "macos")]
    fn disable_macos_proxy(&mut self) -> Result<(), Box<dyn std::error::Error>> {
        if let Some(ref mut client) = self.helper_client {
            let _ = client.disable_proxy();
        }
        log::info!("System proxy disabled");
        Ok(())
    }

    #[cfg(target_os = "macos")]
    fn stop_xray_macos(&mut self) -> Result<(), Box<dyn std::error::Error>> {
        if let Some(ref mut client) = self.helper_client {
            let _ = client.stop_xray();
        }
        self.helper_client = None;
        self.macos_pid = None;
        Ok(())
    }

    #[cfg(target_os = "macos")]
    fn apply_macos_routes(
        &mut self,
        server: &ServerConfig,
    ) -> Result<(), Box<dyn std::error::Error>> {
        if self.helper_client.is_none() {
            return Err("Helper client not initialized".into());
        }

        self.clear_macos_routes().ok();

        let server_ip = Self::resolve_server_ipv4_macos(server)?;
        let default = Self::get_default_route_macos()?;
        let utun = self.wait_utun_interface(Duration::from_secs(12))?;

        if let Some(ref mut client) = self.helper_client {
            client
                .add_route(&server_ip.to_string(), &default.gateway, &utun)
                .map_err(|e| format!("Failed to add route: {}", e))?;
        }

        self.macos_route_state = Some(MacosRouteState {
            server_ip,
            original_gateway: default.gateway,
            original_interface: default.interface,
            utun,
        });

        Ok(())
    }

    #[cfg(target_os = "macos")]
    fn clear_macos_routes(&mut self) -> Result<(), Box<dyn std::error::Error>> {
        let Some(state) = self.macos_route_state.take() else {
            return Ok(());
        };

        if let Some(ref mut client) = self.helper_client {
            let _ = client.remove_route(&state.server_ip.to_string(), &state.original_gateway);
        }

        let _ = state.original_interface;
        Ok(())
    }

    #[cfg(target_os = "macos")]
    fn resolve_server_ipv4_macos(
        server: &ServerConfig,
    ) -> Result<Ipv4Addr, Box<dyn std::error::Error>> {
        if let Ok(ip) = server.address.parse::<Ipv4Addr>() {
            return Ok(ip);
        }

        let target = format!("{}:{}", server.address, server.port);
        let resolved = target
            .to_socket_addrs()?
            .find_map(|socket| match socket.ip() {
                IpAddr::V4(ipv4) => Some(ipv4),
                _ => None,
            });

        resolved.ok_or_else(|| "Failed to resolve IPv4 for VPN server".into())
    }

    #[cfg(target_os = "macos")]
    fn get_default_route_macos() -> Result<MacosDefaultRoute, Box<dyn std::error::Error>> {
        let output = Command::new("route")
            .args(["-n", "get", "default"])
            .output()?;

        let text = String::from_utf8_lossy(&output.stdout);
        let mut gateway = String::new();
        let mut interface = String::new();

        for line in text.lines() {
            let line = line.trim();
            if line.starts_with("gateway:") {
                gateway = line.split_whitespace().nth(1).unwrap_or("").to_string();
            }
            if line.starts_with("interface:") {
                interface = line.split_whitespace().nth(1).unwrap_or("").to_string();
            }
        }

        if gateway.is_empty() || interface.is_empty() {
            return Err("Could not determine default route".into());
        }

        Ok(MacosDefaultRoute { gateway, interface })
    }

    #[cfg(target_os = "macos")]
    fn wait_utun_interface(&self, timeout: Duration) -> Result<String, Box<dyn std::error::Error>> {
        let start = std::time::Instant::now();

        while start.elapsed() < timeout {
            let output = Command::new("ifconfig").output()?;
            let text = String::from_utf8_lossy(&output.stdout);

            for line in text.lines() {
                if line.starts_with("utun") {
                    let parts: Vec<&str> = line.split(':').collect();
                    if parts.len() >= 1 {
                        let name = parts[0].trim().to_string();
                        if !name.is_empty()
                            && name
                                .chars()
                                .all(|c| c.is_ascii_digit() || c == 'u' || c == 't' || c == 'n')
                        {
                            return Ok(name);
                        }
                    }
                }
            }

            std::thread::sleep(Duration::from_millis(500));
        }

        Err("Timeout waiting for utun interface".into())
    }

    // ─── Windows routing helpers ─────────────────────────────────────────

    #[cfg(target_os = "windows")]
    fn apply_windows_routes(
        &mut self,
        server: &ServerConfig,
    ) -> Result<(), Box<dyn std::error::Error>> {
        self.clear_windows_routes().ok();

        let server_ip = Self::resolve_server_ipv4_windows(server)?;
        let default = Self::get_default_route_windows()?;
        let tun = Self::get_tun_interface_info_windows()?;

        let tun_ip = tun.ip.ok_or("TUN interface has no IP address")?;

        Command::new("route")
            .args(["add", &server_ip.to_string(), default.next_hop.to_string()])
            .creation_flags(CREATE_NO_WINDOW)
            .output()?;

        Command::new("route")
            .args(["delete", "0.0.0.0", "0.0.0.0"])
            .creation_flags(CREATE_NO_WINDOW)
            .output()?;

        Command::new("route")
            .args(["add", "0.0.0.0", "0.0.0.0", tun_ip.to_string()])
            .creation_flags(CREATE_NO_WINDOW)
            .output()?;

        self.route_state = Some(RouteState {
            server_ip,
            original_gateway: default.next_hop,
            tun_next_hop: tun_ip.to_string(),
            tun_interface_index: tun.interface_index,
        });

        Ok(())
    }

    #[cfg(target_os = "windows")]
    fn clear_windows_routes(&mut self) -> Result<(), Box<dyn std::error::Error>> {
        let Some(state) = self.route_state.take() else {
            return Ok(());
        };

        let _ = Command::new("route")
            .args(["delete", "0.0.0.0", "0.0.0.0", &state.tun_next_hop])
            .creation_flags(CREATE_NO_WINDOW)
            .output();

        let _ = Command::new("route")
            .args([
                "add",
                "0.0.0.0",
                "0.0.0.0",
                state.original_gateway.to_string(),
            ])
            .creation_flags(CREATE_NO_WINDOW)
            .output();

        let _ = Command::new("route")
            .args([
                "delete",
                &state.server_ip.to_string(),
                state.original_gateway.to_string(),
            ])
            .creation_flags(CREATE_NO_WINDOW)
            .output();

        Ok(())
    }

    #[cfg(target_os = "windows")]
    fn resolve_server_ipv4_windows(
        server: &ServerConfig,
    ) -> Result<Ipv4Addr, Box<dyn std::error::Error>> {
        if let Ok(ip) = server.address.parse::<Ipv4Addr>() {
            return Ok(ip);
        }

        let target = format!("{}:{}", server.address, server.port);
        let resolved = target
            .to_socket_addrs()?
            .find_map(|socket| match socket.ip() {
                IpAddr::V4(ipv4) => Some(ipv4),
                _ => None,
            });

        resolved.ok_or_else(|| "Failed to resolve IPv4 for VPN server".into())
    }

    #[cfg(target_os = "windows")]
    fn get_default_route_windows() -> Result<DefaultRouteInfo, Box<dyn std::error::Error>> {
        let output = Command::new("route")
            .args(["print", "0.0.0.0"])
            .creation_flags(CREATE_NO_WINDOW)
            .output()?;

        let text = String::from_utf8_lossy(&output.stdout);
        for line in text.lines() {
            let parts: Vec<_> = line.split_whitespace().collect();
            if parts.len() >= 3 && parts[0] == "0.0.0.0" && parts[1] == "0.0.0.0" {
                if let Ok(gateway) = parts[2].parse::<Ipv4Addr>() {
                    return Ok(DefaultRouteInfo { next_hop: gateway });
                }
            }
        }

        Err("Could not determine default gateway".into())
    }

    #[cfg(target_os = "windows")]
    fn get_tun_interface_info_windows() -> Result<TunInterfaceInfo, Box<dyn std::error::Error>> {
        let output = Command::new("ipconfig").output()?;

        let text = String::from_utf8_lossy(&output.stdout);
        let mut current_adapter: Option<String> = None;
        let mut current_ip: Option<Ipv4Addr> = None;
        let mut current_index: Option<u32> = None;
        let mut index: u32 = 0;

        for line in text.lines() {
            let line = line.trim();

            if line.ends_with(':') && !line.starts_with(" ") {
                if current_adapter.is_some() && current_ip.is_some() {
                    if current_adapter
                        .as_ref()
                        .unwrap()
                        .contains(TUN_INTERFACE_NAME)
                    {
                        return Ok(TunInterfaceInfo {
                            ip: current_ip,
                            interface_index: current_index.unwrap_or(index),
                        });
                    }
                }
                current_adapter = Some(line.trim_end_matches(':').to_string());
                current_ip = None;
                current_index = None;
                index += 1;
            } else if line.starts_with("IPv4 Address") {
                if let Some(ip_str) = line.split(':').nth(1) {
                    if let Ok(ip) = ip_str.trim().parse::<Ipv4Addr>() {
                        current_ip = Some(ip);
                        current_index = Some(index);
                    }
                }
            }
        }

        Err("Could not find TUN interface info".into())
    }
}

#[cfg(target_os = "android")]
pub struct AndroidVpnBridge {
    running: bool,
    config_json: Option<String>,
}

#[cfg(target_os = "android")]
impl AndroidVpnBridge {
    pub fn new() -> Self {
        Self {
            running: false,
            config_json: None,
        }
    }

    pub fn start(
        &mut self,
        server: &ServerConfig,
        routing_mode: &RoutingMode,
        bypass_domains: &[String],
        bypass_ips: &[String],
    ) -> Result<(), Box<dyn std::error::Error>> {
        if self.running {
            self.stop()?;
        }

        let config = crate::config::XrayConfig::build_for_android(
            server,
            routing_mode,
            bypass_domains,
            bypass_ips,
        );
        let config_json = serde_json::to_string(&config)?;

        self.config_json = Some(config_json);
        self.running = true;

        Ok(())
    }

    pub fn stop(&mut self) -> Result<(), Box<dyn std::error::Error>> {
        self.running = false;
        self.config_json = None;
        Ok(())
    }

    pub fn is_running(&self) -> bool {
        self.running
    }
}

#[cfg(target_os = "macos")]
struct MacosRouteState {
    server_ip: Ipv4Addr,
    original_gateway: String,
    original_interface: String,
    utun: String,
}

#[cfg(target_os = "macos")]
struct MacosDefaultRoute {
    gateway: String,
    interface: String,
}

#[cfg(target_os = "macos")]
fn pick_utun_name_macos() -> Result<String, Box<dyn std::error::Error>> {
    let output = std::process::Command::new("ifconfig").arg("-l").output()?;
    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr).trim().to_string();
        return Err(format!("ifconfig -l failed: {stderr}").into());
    }

    let text = String::from_utf8_lossy(&output.stdout);
    let mut max_seen: i32 = -1;
    for token in text.split_whitespace() {
        if let Some(num) = token.strip_prefix("utun") {
            if let Ok(n) = num.parse::<i32>() {
                if n > max_seen {
                    max_seen = n;
                }
            }
        }
    }
    let candidate = max_seen + 1;
    Ok(format!("utun{candidate}"))
}

#[cfg(target_os = "windows")]
trait CommandWindowsExt {
    fn pipe_windows_no_window(&mut self) -> &mut Self;
    fn creation_flags(&mut self, flags: u32) -> &mut Self;
}

#[cfg(target_os = "windows")]
impl CommandWindowsExt for std::process::Command {
    fn pipe_windows_no_window(&mut self) -> &mut Self {
        self.stdout(std::process::Stdio::piped())
            .stderr(std::process::Stdio::piped())
    }

    fn creation_flags(&mut self, flags: u32) -> &mut Self {
        use std::os::windows::process::CommandExt;
        self.creation_flags(flags)
    }
}
