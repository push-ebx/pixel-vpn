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

  const connectionLabel = isConnecting
    ? "Подключение..."
    : status === "disconnecting"
      ? "Отключение..."
      : isConnected
        ? "Подключено"
        : "Подключить";

  return (
    <div className="h-[calc(100vh-7.5rem)] overflow-y-auto flex flex-col px-6 py-4">
      <h1 className="text-3xl font-semibold text-text-primary">Главная</h1>

      <div className="flex-1 flex flex-col items-center justify-center gap-7 pb-4">
        <button
          onClick={handleToggle}
          disabled={isBusy || (!isConnected && !canConnect)}
          className={`
            w-56 h-56 border-[3px] rounded-full bg-bg-card
            shadow-[0_12px_28px_rgba(34,62,145,0.15)]
            transition-transform duration-200 ease-out cursor-pointer
            disabled:cursor-not-allowed disabled:opacity-50
            ${isConnected
              ? "border-accent animate-pulse-glow hover:scale-[1.03]"
              : "border-accent/80 hover:scale-[1.03]"
            }
          `}
        >
          <div className="flex h-full w-full items-center justify-center">
            <LogoLoader
              isLoading={isConnecting}
              className="w-[8.4rem] h-[8.4rem] text-accent"
            />
          </div>
        </button>

        <div className="flex flex-col items-center gap-2 text-text-secondary">
          <span className="text-xl font-semibold text-accent leading-none">
            {connectionLabel}
          </span>
          {!(activeServer && !isConnected && subscriptionActive) && (
            <span className="text-sm leading-none">
              {isConnected
                ? `Подключено к ${activeServer?.name ?? "серверу"}`
                : !subscriptionActive
                  ? "Требуется активная подписка"
                  : "Сервер не выбран"}
            </span>
          )}
          {connectedFor && (
            <span className="text-sm font-medium text-accent">
              Время сессии: {connectedFor}
            </span>
          )}
        </div>

        <div className="w-full max-w-md">
          <div className="pixel-card bg-bg-card px-4 py-3 text-sm">
            {subscriptionLoading ? (
              <span className="text-text-secondary">Проверяем подписку...</span>
            ) : subscriptionActive && subscription ? (
              <span className="text-text-primary">
                Тариф <span className="font-semibold text-accent">{subscription.plan.name}</span> активен до{" "}
                {new Date(subscription.endsAt).toLocaleDateString("ru-RU")}
              </span>
            ) : (
              <div className="flex items-center justify-between gap-3">
                <span className="text-text-secondary">Подписка не активна</span>
                <button
                  type="button"
                  onClick={onOpenBilling}
                  className="h-8 px-3 rounded-lg bg-accent text-white text-xs font-semibold hover:bg-accent-hover transition-colors"
                >
                  Оформить
                </button>
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-danger/10 border border-danger/40 rounded-xl px-4 py-3 text-sm text-danger max-w-md w-full">
            <div className="whitespace-pre-wrap break-all max-h-48 overflow-auto text-left">
              {error}
            </div>
            <div className="mt-2 flex items-center justify-end gap-2">
              {copiedError && (
                <span className="text-xs text-text-secondary">
                  Скопировано
                </span>
              )}
              <button
                type="button"
                onClick={copyError}
                className="px-3 py-1.5 border border-danger/40 bg-bg-card hover:bg-danger/15 transition-colors text-xs font-medium rounded-lg cursor-pointer"
              >
                Скопировать ошибку
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
