import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useVpnStore } from "../stores/vpn-store";
import { useAccountStore } from "../stores/account-store";

interface HelperStatus {
  installed: boolean;
  running: boolean;
}

export default function SettingsPage() {
  const { theme, setTheme } = useVpnStore();
  const {
    subscriptionActive,
    vless,
    vlessLoading,
    vlessError,
    loadVless
  } = useAccountStore();
  const isDark = theme === "dark";
  const isMacOs = /Mac/i.test(navigator.platform);
  const [helperStatus, setHelperStatus] = useState<HelperStatus | null>(null);
  const [isInstalling, setIsInstalling] = useState(false);
  const [installError, setInstallError] = useState<string | null>(null);
  const [copiedVless, setCopiedVless] = useState(false);

  useEffect(() => {
    if (subscriptionActive) {
      void loadVless();
    }
  }, [subscriptionActive, loadVless]);

  useEffect(() => {
    if (isMacOs) {
      void checkHelperStatus();
    }
  }, [isMacOs]);

  async function checkHelperStatus() {
    try {
      const status = await invoke<HelperStatus>("get_helper_status");
      setHelperStatus(status);
    } catch (e) {
      console.error("Не удалось проверить статус helper:", e);
    }
  }

  async function installHelper() {
    setIsInstalling(true);
    setInstallError(null);
    try {
      await invoke("install_helper");
      await checkHelperStatus();
    } catch (e) {
      console.error("Ошибка установки helper:", e);
      setInstallError(String(e));
    } finally {
      setIsInstalling(false);
    }
  }

  async function copyVlessKey() {
    if (!vless?.link) return;
    try {
      await navigator.clipboard.writeText(vless.link);
      setCopiedVless(true);
      window.setTimeout(() => setCopiedVless(false), 1500);
    } catch (e) {
      console.error("Не удалось скопировать VLESS ключ:", e);
      setCopiedVless(false);
    }
  }

  return (
    <div className="h-full flex flex-col gap-4 p-6">
      <h1 className="font-pixel-title text-sm text-text-secondary">НАСТРОЙКИ</h1>

      <div className="pixel-card p-4">
        <button
          type="button"
          onClick={() => setTheme(isDark ? "light" : "dark")}
          className="w-full flex items-center justify-between"
        >
          <span className="text-xs text-text-primary">тема</span>
          <span
            className={`text-[10px] font-pixel-title ${
              isDark ? "text-accent" : "text-text-secondary"
            }`}
          >
            {isDark ? "тёмная" : "светлая"}
          </span>
        </button>
      </div>

      {subscriptionActive && (
        <div className="pixel-card p-4">
          <div className="flex flex-col gap-3">
            <span className="text-xs text-text-primary font-pixel-title">
              VLESS ключ
            </span>

            {vlessLoading ? (
              <p className="text-[10px] text-text-secondary terminal-text">загрузка ключа...</p>
            ) : vless?.link ? (
              <code className="text-[10px] text-text-secondary terminal-text break-all">
                {vless.link}
              </code>
            ) : (
              <p className="text-[10px] text-text-secondary terminal-text">
                {vlessError ? "ключ временно недоступен" : "ключ пока недоступен"}
              </p>
            )}

            {vless?.link && (
              <button
                type="button"
                onClick={copyVlessKey}
                className="pixel-button"
              >
                {copiedVless ? "скопировано" : "копировать ключ"}
              </button>
            )}
          </div>
        </div>
      )}

      {isMacOs && helperStatus && !helperStatus.running && (
        <div className="pixel-card p-4">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full error" />
              <span className="text-xs text-text-primary font-pixel-title">
                helper не установлен
              </span>
            </div>
            <p className="text-[10px] text-text-secondary terminal-text">
              Для маршрутизации VPN нужен системный helper. Устанавливается один раз.
            </p>
            {installError && (
              <div className="terminal-text error text-[10px] p-2">
                ошибка: {installError}
              </div>
            )}
            <button
              type="button"
              onClick={installHelper}
              disabled={isInstalling}
              className="pixel-button"
            >
              {isInstalling ? "установка..." : "установить helper"}
            </button>
          </div>
        </div>
      )}

      {isMacOs && helperStatus && helperStatus.running && (
        <div className="pixel-card p-4">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-accent" />
            <span className="text-xs text-text-primary font-pixel-title">
              helper активен
            </span>
          </div>
          <p className="text-[10px] text-text-secondary mt-1 terminal-text">
            маршрутизация VPN включена
          </p>
        </div>
      )}
    </div>
  );
}
