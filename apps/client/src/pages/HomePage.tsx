import { useEffect, useMemo, useState } from "react";
import { LogoLoader } from "../components/LogoLoader";
import { useAccountStore } from "../stores/account-store";
import { useVpnStore } from "../stores/vpn-store";

function formatDuration(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

type HomePageProps = {
  onOpenBilling: () => void;
};

export default function HomePage({ onOpenBilling }: HomePageProps) {
  const {
    status,
    error,
    servers,
    activeServerId,
    connectedAt,
    connect,
    disconnect,
    loadSettings,
  } = useVpnStore();
  const { subscriptionActive, subscription, subscriptionLoading } = useAccountStore();
  const [copiedError, setCopiedError] = useState(false);
  const [now, setNow] = useState(Date.now());

  const isConnected = status === "connected";
  const isConnecting = status === "connecting";
  const isBusy = status === "connecting" || status === "disconnecting";
  const activeServer = servers.find((s) => s.id === activeServerId);
  const canConnect = Boolean(activeServer) && subscriptionActive;

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    if (!isConnected || !connectedAt) {
      return;
    }

    setNow(Date.now());
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, [isConnected, connectedAt]);

  const connectedFor = useMemo(() => {
    if (!isConnected || !connectedAt) {
      return null;
    }
    return formatDuration(now - connectedAt);
  }, [isConnected, connectedAt, now]);

  function handleToggle() {
    if (isConnected) {
      void disconnect();
    } else {
      if (!canConnect) {
        onOpenBilling();
        return;
      }
      void connect();
    }
  }

  async function copyError() {
    if (!error) return;

    try {
      await navigator.clipboard.writeText(error);
      setCopiedError(true);
      setTimeout(() => setCopiedError(false), 1500);
    } catch {
      setCopiedError(false);
    }
  }

  const statusText = isConnecting
    ? "подключение..."
    : status === "disconnecting"
      ? "отключение..."
      : isConnected
        ? "подключено"
        : "отключено";

  return (
    <div className="h-full flex flex-col p-6">
      <h1 className="font-pixel-title text-sm text-text-secondary mb-6">ГЛАВНАЯ</h1>

      <div className="flex-1 flex flex-col items-center justify-center gap-8">
        <button
          onClick={handleToggle}
          disabled={isBusy || (!isConnected && !canConnect)}
          className={`
            w-40 h-40 rounded border-2 flex items-center justify-center
            transition-all duration-150 cursor-pointer
            disabled:cursor-not-allowed disabled:opacity-30
            ${isConnected
              ? "border-accent bg-bg-card"
              : "border-border hover:border-text-secondary"
            }
          `}
        >
          <LogoLoader
            isLoading={isConnecting}
            className={`w-24 h-24 ${isConnected ? "text-accent" : "text-text-primary"}`}
          />
        </button>

        <div className="flex flex-col items-center gap-1 text-center">
          <span className={`font-pixel-title text-xs ${isConnected ? "text-accent" : "text-text-secondary"}`}>
            [{statusText}]
          </span>
          {connectedFor && (
            <span className="text-xs text-text-secondary terminal-text">
              в сети: {connectedFor}
            </span>
          )}
        </div>

        <div className="w-full max-w-xs">
          <div className="pixel-card p-3">
            {subscriptionLoading ? (
              <span className="text-xs text-text-secondary">проверка подписки...</span>
            ) : subscriptionActive && subscription ? (
              <div className="flex flex-col gap-1">
                <span className="text-xs text-text-secondary terminal-text">
                  тариф: <span className="text-text-primary">{subscription.plan.name}</span>
                </span>
                <span className="text-xs text-text-secondary terminal-text">
                  действует до: {new Date(subscription.endsAt).toLocaleDateString("ru-RU")}
                </span>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs text-text-secondary">нет активной подписки</span>
                <button
                  type="button"
                  onClick={onOpenBilling}
                  className="pixel-button text-[10px] py-1.5 px-3"
                >
                  оформить
                </button>
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="w-full max-w-xs">
            <div className="terminal-text error bg-bg-card border border-border p-3 rounded text-xs">
              <div className="whitespace-pre-wrap break-all max-h-32 overflow-auto">
                {error}
              </div>
              <div className="mt-2 flex items-center justify-end">
                <button
                  type="button"
                  onClick={copyError}
                  className="text-[10px] text-text-secondary hover:text-text-primary"
                >
                  {copiedError ? "[скопировано]" : "[копировать]"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
