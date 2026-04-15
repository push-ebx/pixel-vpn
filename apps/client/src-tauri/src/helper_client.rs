use std::path::Path;
use std::process::Command;

const HELPER_SOCKET_PATH: &str = "/var/run/com.pixelvpn.helper.sock";

pub struct HelperInstaller;

impl HelperInstaller {
    pub fn is_installed() -> bool {
        true
    }

    pub fn is_running() -> bool {
        true
    }

    pub fn install() -> Result<(), String> {
        log::info!("Using osascript for privileged operations");
        Ok(())
    }

    pub fn uninstall() -> Result<(), String> {
        Ok(())
    }
}

pub struct PrivilegedHelperClient {
    connected: bool,
}

impl PrivilegedHelperClient {
    pub fn new() -> Self {
        Self { connected: false }
    }

    pub fn is_helper_running(&mut self) -> bool {
        true
    }

    pub fn start_xray(&mut self, config_path: &str, xray_path: &str) -> Result<u32, String> {
        let escaped_xray = xray_path.replace("'", "'\\''");
        let escaped_config = config_path.replace("'", "'\\''");

        let script = format!(
            "do shell script \"'{xray}' run -config '{config}' >/tmp/pixel-vpn-xray.log 2>&1 & sleep 3 && networksetup -setwebproxy Wi-Fi 127.0.0.1 10809 && networksetup -setwebproxystate Wi-Fi on && networksetup -setsocksfirewallproxy Wi-Fi 127.0.0.1 10808 && networksetup -setsocksfirewallproxystate Wi-Fi on\" with administrator privileges",
            xray = escaped_xray,
            config = escaped_config
        );

        let output = Command::new("osascript")
            .args(["-e", &script])
            .output()
            .map_err(|e| format!("Failed to run command: {}", e))?;

        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            return Err(format!("Failed: {}", stderr));
        }

        let check = Command::new("pgrep").args(["-x", "xray"]).output();

        let pid = match check {
            Ok(out) if out.status.success() => String::from_utf8_lossy(&out.stdout)
                .trim()
                .split_whitespace()
                .next()
                .and_then(|s| s.parse().ok())
                .unwrap_or(1),
            _ => 1,
        };

        self.connected = true;
        Ok(pid)
    }

    pub fn stop_xray(&mut self) -> Result<(), String> {
        let _ = Command::new("pkill").args(["-9", "xray"]).output();
        self.connected = false;
        Ok(())
    }

    pub fn add_route(
        &mut self,
        _server_ip: &str,
        _gateway: &str,
        _interface: &str,
    ) -> Result<(), String> {
        Ok(())
    }

    pub fn remove_route(&mut self, _server_ip: &str, _gateway: &str) -> Result<(), String> {
        Ok(())
    }

    pub fn enable_proxy(&mut self) -> Result<(), String> {
        Ok(())
    }

    pub fn disable_proxy(&mut self) -> Result<(), String> {
        Ok(())
    }
}
