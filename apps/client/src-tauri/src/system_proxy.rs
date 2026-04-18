#![allow(dead_code)]

#[cfg(target_os = "windows")]
use std::os::windows::process::CommandExt;
use std::process::Command;

#[cfg(target_os = "windows")]
const INTERNET_SETTINGS_KEY: &str =
    r"HKCU\Software\Microsoft\Windows\CurrentVersion\Internet Settings";
#[cfg(target_os = "windows")]
const CREATE_NO_WINDOW: u32 = 0x08000000;

#[cfg(target_os = "macos")]
use crate::config::{HTTP_INBOUND_PORT, SOCKS_INBOUND_PORT};

#[cfg(target_os = "windows")]
pub fn disable_system_proxy() -> Result<(), String> {
    run_command(
        "reg",
        &[
            "add",
            INTERNET_SETTINGS_KEY,
            "/v",
            "ProxyEnable",
            "/t",
            "REG_DWORD",
            "/d",
            "0",
            "/f",
        ],
    )?;

    refresh_internet_settings();
    Ok(())
}

#[cfg(target_os = "windows")]
pub fn enable_system_proxy() -> Result<(), String> {
    Ok(())
}

#[cfg(target_os = "macos")]
pub fn enable_system_proxy() -> Result<(), String> {
    let services = list_network_services()?;
    let socks_port = SOCKS_INBOUND_PORT.to_string();
    let http_port = HTTP_INBOUND_PORT.to_string();

    for service in services {
        let _ = Command::new("networksetup")
            .args(["-setsocksfirewallproxy", &service, "127.0.0.1", &socks_port])
            .output();
        let _ = Command::new("networksetup")
            .args(["-setsocksfirewallproxystate", &service, "on"])
            .output();
    }
    Ok(())
}

#[cfg(target_os = "macos")]
pub fn disable_system_proxy() -> Result<(), String> {
    let services = list_network_services()?;
    for service in services {
        let _ = Command::new("networksetup")
            .args(["-setsocksfirewallproxystate", &service, "off"])
            .output();
    }
    Ok(())
}

#[cfg(not(any(target_os = "windows", target_os = "macos")))]
pub fn enable_system_proxy() -> Result<(), String> {
    Ok(())
}

#[cfg(not(any(target_os = "windows", target_os = "macos")))]
pub fn disable_system_proxy() -> Result<(), String> {
    Ok(())
}

#[cfg(target_os = "windows")]
fn run_command(program: &str, args: &[&str]) -> Result<(), String> {
    let output = Command::new(program)
        .args(args)
        .creation_flags(CREATE_NO_WINDOW)
        .output()
        .map_err(|e| format!("Failed to run {program}: {e}"))?;

    if output.status.success() {
        return Ok(());
    }

    let stderr = String::from_utf8_lossy(&output.stderr).trim().to_string();
    let stdout = String::from_utf8_lossy(&output.stdout).trim().to_string();
    let details = if !stderr.is_empty() { stderr } else { stdout };

    Err(format!("{program} failed: {details}"))
}

#[cfg(target_os = "windows")]
fn refresh_internet_settings() {
    let _ = Command::new("RUNDLL32.EXE")
        .args(["USER32.DLL,UpdatePerUserSystemParameters", "1", "True"])
        .creation_flags(CREATE_NO_WINDOW)
        .status();
}

#[cfg(target_os = "macos")]
fn list_network_services() -> Result<Vec<String>, String> {
    let output = Command::new("networksetup")
        .arg("-listallnetworkservices")
        .output()
        .map_err(|e| format!("Failed to run networksetup: {e}"))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr).trim().to_string();
        let stdout = String::from_utf8_lossy(&output.stdout).trim().to_string();
        let details = if !stderr.is_empty() { stderr } else { stdout };
        return Err(format!("networksetup failed: {details}"));
    }

    let text = String::from_utf8_lossy(&output.stdout);
    Ok(text
        .lines()
        .skip(1)
        .map(|l| l.trim())
        .filter(|l| !l.is_empty())
        .filter(|l| !l.starts_with('*'))
        .map(|l| l.to_string())
        .collect())
}
