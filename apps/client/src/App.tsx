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

function App() {
  const [tab, setTab] = useState<Tab>("billing");
  const { loadSettings, theme } = useVpnStore();
  const { authReady, user, hydrateAuth, loadPlans, loadSubscription } = useAccountStore();
  const isMobileUi = /android|iphone|ipad|ipod/i.test(navigator.userAgent);
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
        const status = await invoke<HelperStatus>("get_helper_status");
        if (!status.running) {
          setShowHelperBanner(true);
        }
      } catch (e) {
        console.error("Failed to check helper:", e);
      }
    };
    if (user) {
      void checkHelper();
    }
  }, [user]);

  const handleInstallHelper = async () => {
    setIsInstallingHelper(true);
    try {
      await invoke("install_helper");
      setShowHelperBanner(false);
    } catch (e) {
      console.error("Failed to install helper:", e);
    } finally {
      setIsInstallingHelper(false);
    }
  };

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const title = !user
    ? "Авторизация"
    : tab === "home"
      ? "Главная"
      : tab === "billing"
        ? "Тарифы"
        : "Настройки";

  return (
    <div className="h-screen overflow-hidden bg-bg-primary text-text-primary">
      {!isMobileUi && (
        <header className="fixed top-0 left-0 right-0 z-50 h-10 border-b border-accent/20 bg-bg-card/95 backdrop-blur">
          <div className="h-full flex items-center justify-between px-3">
            <div
              className="flex-1 h-full flex items-center text-sm font-semibold text-text-primary"
              onMouseDown={() => void invoke("window_start_dragging")}
            >
              {title}
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => void invoke("window_minimize")}
                className="w-7 h-7 rounded-full text-text-secondary hover:text-text-primary hover:bg-accent/10 transition-colors"
                title="Свернуть"
              >
                <svg className="w-4 h-4 mx-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M5 12h14" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => void invoke("window_close")}
                className="w-7 h-7 rounded-full text-text-secondary hover:text-white hover:bg-danger transition-colors"
                title="Закрыть"
              >
                <svg className="w-4 h-4 mx-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>
          </div>
        </header>
      )}

      <main className={`h-full pb-20 overflow-hidden ${isMobileUi ? "pt-0" : "pt-10"}`}>
        {!authReady ? (
          <div className="min-h-[calc(100vh-7.5rem)] flex items-center justify-center">
            <LogoLoader isLoading className="w-16 h-16 text-accent" />
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

      {showHelperBanner && user && (
        <div className="fixed bottom-20 left-3 right-3 z-50 bg-accent text-white p-3 rounded-lg shadow-lg flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium">Установить системный компонент?</p>
            <p className="text-xs opacity-80">Пароль потребуется ввести один раз</p>
          </div>
          <button
            onClick={handleInstallHelper}
            disabled={isInstallingHelper}
            className="ml-3 px-3 py-1.5 bg-white text-accent rounded text-sm font-medium hover:bg-opacity-90 disabled:opacity-50"
          >
            {isInstallingHelper ? "..." : "Установить"}
          </button>
        </div>
      )}

      {user && (
        <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-accent/20 bg-bg-card/95 backdrop-blur pb-[env(safe-area-inset-bottom)]">
          <div className="grid grid-cols-3 w-full">
            <TabButton
              active={tab === "home"}
              onClick={() => setTab("home")}
              label="Главная"
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955a1.126 1.126 0 011.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75" />
                </svg>
              }
            />
            <TabButton
              active={tab === "billing"}
              onClick={() => setTab("billing")}
              label="Тарифы"
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6h16.5M6 12h12m-9.75 6h7.5" />
                </svg>
              }
            />
            <TabButton
              active={tab === "settings"}
              onClick={() => setTab("settings")}
              label="Настройки"
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <circle cx="12" cy="12" r="3" />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 2.75v1.5m0 15.5v1.5m9.25-9.25h-1.5m-15.5 0h-1.5m15.04-6.54l-1.06 1.06M6.27 17.73l-1.06 1.06m12.12 0l-1.06-1.06M6.27 6.27L5.21 5.21"
                  />
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
        flex flex-col items-center justify-center gap-1 py-3 transition-colors
        ${active
          ? "text-accent bg-accent/5"
          : "text-text-secondary hover:text-text-primary"}
      `}
    >
      {icon}
      <span className="text-[11px] font-semibold leading-none">{label}</span>
    </button>
  );
}

export default App;
