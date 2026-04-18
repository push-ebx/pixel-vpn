import { type ReactNode, useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { LogoLoader } from "./components/LogoLoader";
import { useAccountStore } from "./stores/account-store";
import { useVpnStore } from "./stores/vpn-store";
import AuthPage from "./pages/AuthPage";
import BillingPage from "./pages/BillingPage";
import HomePage from "./pages/HomePage";
import SettingsPage from "./pages/SettingsPage";

type Tab = "home" | "billing" | "settings";

interface HelperStatus {
  installed: boolean;
  running: boolean;
}

function isHelperStatus(value: unknown): value is HelperStatus {
  return (
    typeof value === "object" &&
    value !== null &&
    "installed" in value &&
    "running" in value &&
    typeof (value as { installed: unknown }).installed === "boolean" &&
    typeof (value as { running: unknown }).running === "boolean"
  );
}

function App() {
  const [tab, setTab] = useState<Tab>("home");
  const { loadSettings, theme } = useVpnStore();
  const { authReady, user, hydrateAuth, loadPlans, loadSubscription } = useAccountStore();
  const isMobileUi = /android|iphone|ipad|ipod/i.test(navigator.userAgent);
  const isMacOs = /Mac/i.test(navigator.platform);
  const [showHelperBanner, setShowHelperBanner] = useState(false);
  const [isInstallingHelper, setIsInstallingHelper] = useState(false);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      await loadPlans();
      const isAuthenticated = await hydrateAuth();
      if (isAuthenticated && !cancelled) {
        await loadSubscription();
      }
    };

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, [hydrateAuth, loadPlans, loadSubscription]);

  useEffect(() => {
    const checkHelper = async () => {
      try {
        const status = await invoke<unknown>("get_helper_status");
        if (!isHelperStatus(status)) {
          console.warn("Неожиданный формат ответа helper", status);
          return;
        }
        if (!status.running) {
          setShowHelperBanner(true);
        }
      } catch (e) {
        console.error("Не удалось проверить helper:", e);
      }
    };
    if (user && isMacOs) {
      void checkHelper();
    }
  }, [isMacOs, user]);

  const handleInstallHelper = async () => {
    setIsInstallingHelper(true);
    try {
      await invoke("install_helper");
      setShowHelperBanner(false);
    } catch (e) {
      console.error("Не удалось установить helper:", e);
    } finally {
      setIsInstallingHelper(false);
    }
  };

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const tabLabel = tab === "home" ? "главная" : tab === "billing" ? "подписка" : "настройки";

  return (
    <div className="h-screen overflow-hidden bg-bg-primary text-text-primary">
      {!isMobileUi && (
        <header className="fixed top-0 left-0 right-0 z-50 h-9 border-b border-border bg-bg-card/95 backdrop-blur">
          <div className="h-full flex items-center justify-between px-3">
            <div
              className="flex-1 h-full flex items-center text-[11px] font-pixel-title text-text-secondary"
              onMouseDown={() => void invoke("window_start_dragging")}
            >
              pixel-vpn <span className="text-text-secondary/40 mx-2">::</span> {tabLabel}
            </div>
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => void invoke("window_minimize")}
                className="w-6 h-6 flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-bg-card-hover transition-colors"
                title="свернуть"
              >
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M5 12h14" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => void invoke("window_close")}
                className="w-6 h-6 flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-red-500/20 transition-colors"
                title="закрыть"
              >
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>
          </div>
        </header>
      )}

      <main className={`h-full pb-16 overflow-hidden ${isMobileUi ? "pt-0" : "pt-9"}`}>
        {!authReady ? (
          <div className="h-full flex items-center justify-center">
            <LogoLoader isLoading className="w-12 h-12 text-text-secondary" />
          </div>
        ) : !user ? (
          <AuthPage />
        ) : (
          <>
            {tab === "home" && <HomePage onOpenBilling={() => setTab("billing")} />}
            {tab === "billing" && <BillingPage />}
            {tab === "settings" && <SettingsPage />}
          </>
        )}
      </main>

      {showHelperBanner && user && isMacOs && (
        <div className="fixed bottom-16 left-3 right-3 z-50 pixel-card p-3 flex items-center justify-between">
          <div className="flex-1">
            <p className="text-xs text-text-primary">Установить helper?</p>
            <p className="text-[10px] text-text-secondary terminal-text">Понадобится пароль администратора один раз</p>
          </div>
          <button
            onClick={handleInstallHelper}
            disabled={isInstallingHelper}
            className="pixel-button text-[10px]"
          >
            {isInstallingHelper ? "..." : "установить"}
          </button>
        </div>
      )}

      {user && (
        <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-bg-card/95 pb-[env(safe-area-inset-bottom)]">
          <div className="grid grid-cols-3 w-full">
            <TabButton
              active={tab === "home"}
              onClick={() => setTab("home")}
              label="главная"
              icon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <circle cx="12" cy="12" r="2.4" />
                  <circle cx="6" cy="7" r="1.2" />
                  <circle cx="18" cy="7" r="1.2" />
                  <circle cx="6" cy="17" r="1.2" />
                  <circle cx="18" cy="17" r="1.2" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.3 10.8L7.2 8.6m6.5 2.2 3.1-2.2m-6.5 4.4-3.1 2.2m6.5-2.2 3.1 2.2" />
                </svg>
              }
            />
            <TabButton
              active={tab === "billing"}
              onClick={() => setTab("billing")}
              label="оплата"
              icon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <rect x="3.5" y="6" width="17" height="12" rx="2.5" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.5 10h17M7 14h3.5M13 14h4" />
                </svg>
              }
            />
            <TabButton
              active={tab === "settings"}
              onClick={() => setTab("settings")}
              label="настройки"
              icon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M4 17h16M4 12h16" />
                  <circle cx="9" cy="7" r="1.8" />
                  <circle cx="15" cy="12" r="1.8" />
                  <circle cx="11.5" cy="17" r="1.8" />
                </svg>
              }
            />
          </div>
        </nav>
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  label,
  icon,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  icon: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        flex flex-col items-center justify-center gap-1 py-2.5 transition-colors
        ${active
          ? "text-accent"
          : "text-text-secondary hover:text-accent"}
      `}
    >
      {icon}
      <span className="text-[9px] font-pixel-title leading-none">{label}</span>
    </button>
  );
}

export default App;
