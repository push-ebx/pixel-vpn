import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useVpnStore } from "../stores/vpn-store";

interface HelperStatus {
  installed: boolean;
  running: boolean;
}

export default function SettingsPage() {
  const { theme, setTheme } = useVpnStore();
  const isDark = theme === "dark";
  const [helperStatus, setHelperStatus] = useState<HelperStatus | null>(null);
  const [isInstalling, setIsInstalling] = useState(false);
  const [installError, setInstallError] = useState<string | null>(null);

  useEffect(() => {
    checkHelperStatus();
  }, []);

  async function checkHelperStatus() {
    try {
      const status = await invoke<HelperStatus>("get_helper_status");
      setHelperStatus(status);
    } catch (e) {
      console.error("Failed to check helper status:", e);
    }
  }

  async function installHelper() {
    console.log("Starting helper installation...");
    setIsInstalling(true);
    setInstallError(null);
    try {
      console.log("Calling invoke...");
      const result = await invoke("install_helper");
      console.log("Installation result:", result);
      await checkHelperStatus();
    } catch (e) {
      console.error("Installation error:", e);
      setInstallError(String(e));
    } finally {
      setIsInstalling(false);
    }
  }

  return (
    <div className="h-full flex flex-col gap-4 p-6">
      <h1 className="font-pixel-title text-sm text-text-secondary">settings</h1>

      <div className="pixel-card p-4">
        <button
          type="button"
          onClick={() => setTheme(isDark ? "light" : "dark")}
          className="w-full flex items-center justify-between"
        >
          <span className="text-xs text-text-primary">theme</span>
          <span
            className={`text-[10px] font-pixel-title ${
              isDark ? "success" : "text-text-secondary"
            }`}
          >
            {isDark ? "dark" : "light"}
          </span>
        </button>
      </div>

      {helperStatus && !helperStatus.running && (
        <div className="pixel-card p-4">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full error" />
              <span className="text-xs text-text-primary font-pixel-title">
                helper not installed
              </span>
            </div>
            <p className="text-[10px] text-text-secondary terminal-text">
              system helper required for vpn routing. install once.
            </p>
            {installError && (
              <div className="terminal-text error text-[10px] p-2">
                error: {installError}
              </div>
            )}
            <button
              type="button"
              onClick={installHelper}
              disabled={isInstalling}
              className="pixel-button"
            >
              {isInstalling ? "installing..." : "install helper"}
            </button>
          </div>
        </div>
      )}

      {helperStatus && helperStatus.running && (
        <div className="pixel-card p-4">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full success" />
            <span className="text-xs text-text-primary font-pixel-title">
              helper active
            </span>
          </div>
          <p className="text-[10px] text-text-secondary mt-1 terminal-text">
            vpn routing enabled
          </p>
        </div>
      )}
    </div>
  );
}