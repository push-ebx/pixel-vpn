#[cfg(target_os = "windows")]
use std::ffi::{c_void, OsStr};
#[cfg(target_os = "windows")]
use std::os::windows::ffi::OsStrExt;
#[cfg(target_os = "windows")]
use std::ptr::null_mut;

#[cfg(target_os = "windows")]
const SW_SHOWNORMAL: i32 = 1;

#[cfg(target_os = "windows")]
#[link(name = "shell32")]
unsafe extern "system" {
    fn IsUserAnAdmin() -> i32;
    fn ShellExecuteW(
        hwnd: *mut c_void,
        lp_operation: *const u16,
        lp_file: *const u16,
        lp_parameters: *const u16,
        lp_directory: *const u16,
        n_show_cmd: i32,
    ) -> isize;
}

#[cfg(target_os = "windows")]
pub fn ensure_admin_or_relaunch() -> Result<bool, String> {
    if is_running_as_admin() {
        return Ok(true);
    }

    let exe_path = std::env::current_exe()
        .map_err(|e| format!("Failed to get executable path: {e}"))?;
    let exe = to_wide(exe_path.to_string_lossy().as_ref());
    let op = to_wide("runas");

    let args = std::env::args()
        .skip(1)
        .map(|arg| quote_windows_arg(&arg))
        .collect::<Vec<_>>()
        .join(" ");
    let args_wide = if args.is_empty() { None } else { Some(to_wide(&args)) };

    let code = unsafe {
        ShellExecuteW(
            null_mut(),
            op.as_ptr(),
            exe.as_ptr(),
            args_wide.as_ref().map_or(std::ptr::null(), |a| a.as_ptr()),
            std::ptr::null(),
            SW_SHOWNORMAL,
        )
    };

    if code > 32 {
        Ok(false)
    } else {
        Err("Для запуска VPN в режиме TUN требуются права администратора".to_string())
    }
}

#[cfg(target_os = "windows")]
fn is_running_as_admin() -> bool {
    unsafe { IsUserAnAdmin() != 0 }
}

#[cfg(target_os = "windows")]
fn to_wide(value: &str) -> Vec<u16> {
    OsStr::new(value).encode_wide().chain(std::iter::once(0)).collect()
}

#[cfg(target_os = "windows")]
fn quote_windows_arg(value: &str) -> String {
    if value.is_empty() || value.chars().any(|c| c.is_whitespace() || c == '"') {
        format!("\"{}\"", value.replace('"', "\\\""))
    } else {
        value.to_string()
    }
}

#[cfg(not(target_os = "windows"))]
pub fn ensure_admin_or_relaunch() -> Result<bool, String> {
    Ok(true)
}
