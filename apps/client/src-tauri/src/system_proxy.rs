use std::process::Command;
#[cfg(target_os = "windows")]
use std::os::windows::process::CommandExt;

#[cfg(target_os = "windows")]
const INTERNET_SETTINGS_KEY: &str = r"HKCU\Software\Microsoft\Windows\CurrentVersion\Internet Settings";
#[cfg(target_os = "windows")]
const CREATE_NO_WINDOW: u32 = 0x08000000;

pub fn disable_system_proxy() -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
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
    }

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
