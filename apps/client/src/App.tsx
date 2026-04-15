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
  const [tab, setTab] = useState<Tab>("home");
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

  const tabLabel = tab === "home" ? "home" : tab === "billing" ? "billing" : "settings";

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
                title="minimize"
              >
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M5 12h14" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => void invoke("window_close")}
                className="w-6 h-6 flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-red-500/20 transition-colors"
                title="close"
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

      {showHelperBanner && user && (
        <div className="fixed bottom-16 left-3 right-3 z-50 pixel-card p-3 flex items-center justify-between">
          <div className="flex-1">
            <p className="text-xs text-text-primary">install helper?</p>
            <p className="text-[10px] text-text-secondary terminal-text">one-time password required</p>
          </div>
          <button
            onClick={handleInstallHelper}
            disabled={isInstallingHelper}
            className="pixel-button text-[10px]"
          >
            {isInstallingHelper ? "..." : "install"}
          </button>
        </div>
      )}

      {user && (
        <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-bg-card/95 pb-[env(safe-area-inset-bottom)]">
          <div className="grid grid-cols-3 w-full">
            <TabButton
              active={tab === "home"}
              onClick={() => setTab("home")}
              label="home"
              icon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955a1.126 1.126 0 011.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75" />
                </svg>
              }
            />
            <TabButton
              active={tab === "billing"}
              onClick={() => setTab("billing")}
              label="billing"
              icon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6h16.5M6 12h12m-9.75 6h7.5" />
                </svg>
              }
            />
            <TabButton
              active={tab === "settings"}
              onClick={() => setTab("settings")}
              label="settings"
              icon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
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
        flex flex-col items-center justify-center gap-1 py-2.5 transition-colors
        ${active
          ? "text-text-primary"
          : "text-text-secondary hover:text-text-primary"}
      `}
    >
      {icon}
      <span className="text-[9px] font-pixel-title leading-none">{label}</span>
    </button>
  );
}

export default App;