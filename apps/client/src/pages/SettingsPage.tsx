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
    <div className="h-[calc(100vh-7.5rem)] flex flex-col gap-4 px-4 py-4 overflow-y-auto">
      <h1 className="text-4xl font-semibold text-text-primary">Настройки</h1>

      <div className="pixel-card bg-bg-card p-4">
        <button
          type="button"
          onClick={() => setTheme(isDark ? "light" : "dark")}
          className="w-full flex items-center justify-start gap-3"
        >
          <span
            className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
              isDark ? "bg-accent" : "bg-bg-secondary"
            }`}
          >
            <span
              className={`inline-block h-6 w-6 transform rounded-full bg-white shadow transition-transform ${
                isDark ? "translate-x-7" : "translate-x-1"
              }`}
            />
          </span>
          <span className="text-base font-medium text-text-primary">
            Темная тема
          </span>
        </button>
      </div>

      {helperStatus && !helperStatus.running && (
        <div className="pixel-card bg-bg-card p-4">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              <span className="text-text-primary font-medium">
                Системный компонент не установлен
              </span>
            </div>
            <p className="text-sm text-text-secondary">
              Для работы VPN без запроса пароля требуется установить системный компонент.
              Это необходимо сделать один раз.
            </p>
            {installError && (
              <div className="mt-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                <p className="text-sm text-red-500 font-medium">Ошибка установки:</p>
                <p className="text-xs text-red-400 mt-1">{installError}</p>
              </div>
            )}
            <button
              type="button"
              onClick={installHelper}
              disabled={isInstalling}
              className="mt-2 px-4 py-2 bg-accent text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {isInstalling ? "Установка..." : "Установить системный компонент"}
            </button>
          </div>
        </div>
      )}

      {helperStatus && helperStatus.running && (
        <div className="pixel-card bg-bg-card p-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-text-primary font-medium">
              Системный компонент активен
            </span>
          </div>
          <p className="text-sm text-text-secondary mt-1">
            VPN работает без запроса пароля
          </p>
        </div>
      )}
    </div>
  );
}
