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
    <div className="h-full flex flex-col gap-4 p-6">
      <h1 className="font-pixel-title text-sm text-text-secondary">СЕРВЕРЫ</h1>

      <div className="pixel-card p-4 flex flex-col gap-3">
        <h3 className="text-xs font-pixel-title text-text-secondary">
          импорт VLESS
        </h3>
        <textarea
          value={vlessInput}
          onChange={(e) => setVlessInput(e.target.value)}
          placeholder="vless://..."
          rows={3}
          className="pixel-input resize-none text-xs"
        />
        {importError && (
          <p className="terminal-text error text-xs">{importError}</p>
        )}
        <button
          onClick={handleImport}
          disabled={importing || !vlessInput.trim()}
          className="pixel-button"
        >
          {importing ? "..." : "добавить"}
        </button>
      </div>

      <div className="flex items-center justify-between">
        <h3 className="text-xs font-pixel-title text-text-secondary">
          список [{servers.length}]
        </h3>
      </div>

      {servers.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-xs text-text-secondary terminal-text">
            серверы не добавлены
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-1">
          {servers.map((server) => {
            const isActive = server.id === activeServerId;
            return (
              <div
                key={server.id}
                onClick={() => selectServer(server.id)}
                className={`
                  pixel-card p-3 flex items-center gap-3 cursor-pointer
                  transition-all duration-100
                  ${isActive
                    ? "border-text-secondary"
                    : "border-transparent hover:border-text-secondary/50"
                  }
                `}
              >
                <div
                  className={`w-1.5 h-1.5 shrink-0 ${
                    isActive ? "bg-text-primary" : "bg-text-secondary/40"
                  }`}
                />

                <div className="flex-1 min-w-0">
                  <p className="text-xs text-text-primary truncate">
                    {server.name}
                  </p>
                  <p className="text-[10px] text-text-secondary terminal-text truncate">
                    {server.address}:{server.port}
                    {server.security && ` [${server.security}]`}
                    {server.network && server.network !== "tcp" && ` ${server.network}`}
                  </p>
                </div>

                <div className="shrink-0 text-right">
                  {server.latency_ms != null ? (
                    <span
                      className={`text-[10px] ${
                        server.latency_ms < 100
                          ? "text-text-primary"
                          : server.latency_ms < 300
                            ? "text-text-secondary"
                            : "error"
                      }`}
                    >
                      {server.latency_ms}мс
                    </span>
                  ) : (
                    <span className="text-[10px] text-text-secondary">
                      --
                    </span>
                  )}
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeServer(server.id);
                  }}
                  className="shrink-0 text-text-secondary hover:text-text-primary transition-colors text-sm leading-none"
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
