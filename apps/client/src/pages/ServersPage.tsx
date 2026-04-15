import { useState } from "react";
import { useVpnStore } from "../stores/vpn-store";

export default function ServersPage() {
  const {
    servers,
    activeServerId,
    selectServer,
    addServer,
    removeServer,
  } = useVpnStore();

  const [vlessInput, setVlessInput] = useState("");
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  async function handleImport() {
    if (!vlessInput.trim()) return;
    setImporting(true);
    setImportError(null);
    try {
      // Support multiple URIs (one per line)
      const uris = vlessInput
        .split("\n")
        .map((s) => s.trim())
        .filter((s) => s.startsWith("vless://"));

      for (const uri of uris) {
        await addServer(uri);
      }
      setVlessInput("");
    } catch (err) {
      setImportError(String(err));
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-7.5rem)] flex flex-col gap-4 px-4 py-4 overflow-y-auto">
      <h1 className="text-3xl font-semibold text-text-primary">Серверы</h1>

      {/* Import section */}
      <div className="pixel-card bg-bg-card p-4 flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-text-primary">
          Импорт сервера
        </h3>
        <textarea
          value={vlessInput}
          onChange={(e) => setVlessInput(e.target.value)}
          placeholder="vless://uuid@host:port?params#name"
          rows={3}
          className="bg-bg-secondary border border-accent/20 rounded-xl px-3 py-2 text-sm text-text-primary
            placeholder:text-text-secondary/50
            focus:border-accent/50 focus:outline-none resize-none
            [user-select:text] [-webkit-user-select:text]"
        />
        {importError && (
          <p className="text-xs text-danger">{importError}</p>
        )}
        <button
          onClick={handleImport}
          disabled={importing || !vlessInput.trim()}
          className="text-sm font-semibold bg-accent hover:bg-accent-hover text-white
            border border-accent/80 rounded-xl px-4 py-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {importing ? "Импорт..." : "Импортировать"}
        </button>
      </div>

      {/* Server list header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-primary">
          Серверы ({servers.length})
        </h3>
      </div>

      {/* Server list */}
      {servers.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-text-secondary">
            Серверов пока нет. Добавьте VLESS-ссылку выше.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {servers.map((server) => {
            const isActive = server.id === activeServerId;
            return (
              <div
                key={server.id}
                onClick={() => selectServer(server.id)}
                className={`
                  bg-bg-card p-3 flex items-center gap-3 cursor-pointer
                  transition-all duration-200 border-2 pixel-card
                  ${isActive
                    ? "border-accent/60 bg-accent/5"
                    : "border-transparent hover:bg-bg-card-hover"
                  }
                `}
              >
                {/* Active indicator */}
                <div
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    isActive ? "bg-accent" : "bg-text-secondary/30"
                  }`}
                />

                {/* Server info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">
                    {server.name}
                  </p>
                  <p className="text-xs text-text-secondary truncate">
                    {server.address}:{server.port}
                    {server.security && ` · ${server.security}`}
                    {server.network && server.network !== "tcp" && ` · ${server.network}`}
                  </p>
                </div>

                {/* Latency */}
                <div className="shrink-0 text-right">
                  {server.latency_ms != null ? (
                    <span
                      className={`text-xs font-semibold ${
                        server.latency_ms < 100
                          ? "text-accent"
                          : server.latency_ms < 300
                            ? "text-text-secondary"
                            : "text-danger"
                      }`}
                    >
                      {server.latency_ms}ms
                    </span>
                  ) : (
                    <span className="text-xs font-medium text-text-secondary">
                      --
                    </span>
                  )}
                </div>

                {/* Delete */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeServer(server.id);
                  }}
                  className="shrink-0 text-text-secondary/40 hover:text-danger transition-colors text-xl leading-none"
                  title="Удалить"
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
