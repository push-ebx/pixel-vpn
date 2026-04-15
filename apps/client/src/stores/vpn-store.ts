import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";
import type { ConnectionStatus, ServerConfig, RoutingMode, AppSettings, ThemeMode } from "../types";

const THEME_STORAGE_KEY = "pixel-vpn-theme";
const FALLBACK_VLESS_URI =
  "vless://196c473b-d1f1-4a2b-b4a9-d6a7ceffb9e9@94.241.168.203:8443?type=tcp&encryption=none&security=reality&pbk=wrhEjfXA3XfYlzOoautPDXfzOl0geNE0oYKVkLHAPyk&fp=chrome&sni=ya.ru&sid=d394&spx=%2F&flow=xtls-rprx-vision#pvpn-NIKITA";
const DEFAULT_VLESS_URI = import.meta.env.VITE_DEFAULT_VLESS_URI?.trim() || FALLBACK_VLESS_URI;

function readTheme(): ThemeMode {
  if (typeof window === "undefined") {
    return "light";
  }
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  return stored === "dark" ? "dark" : "light";
}

interface VpnState {
  // Connection
  status: ConnectionStatus;
  error: string | null;
  connectedAt: number | null;
  theme: ThemeMode;

  // Settings (loaded from Rust backend)
  servers: ServerConfig[];
  activeServerId: string | null;
  routingMode: RoutingMode;
  bypassDomains: string[];
  bypassIps: string[];

  // Actions
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  loadSettings: () => Promise<void>;
  addServer: (vlessUri: string) => Promise<void>;
  removeServer: (id: string) => Promise<void>;
  selectServer: (id: string) => Promise<void>;
  pingServer: (id: string) => Promise<void>;
  setRoutingMode: (mode: RoutingMode) => Promise<void>;
  setBypassLists: (domains: string[], ips: string[]) => Promise<void>;
  setTheme: (theme: ThemeMode) => void;
}

export const useVpnStore = create<VpnState>((set, get) => ({
  status: "disconnected",
  error: null,
  connectedAt: null,
  theme: readTheme(),
  servers: [],
  activeServerId: null,
  routingMode: "Global",
  bypassDomains: [],
  bypassIps: [],

  connect: async () => {
    set({ error: null, status: "connecting" });
    try {
      await invoke("connect_vpn");
      set({ status: "connected", connectedAt: Date.now() });
    } catch (err) {
      set({ status: "disconnected", connectedAt: null, error: String(err) });
    }
  },

  disconnect: async () => {
    set({ status: "disconnecting", error: null });
    try {
      await invoke("disconnect_vpn");
      set({ status: "disconnected", connectedAt: null });
    } catch (err) {
      set({ status: "disconnected", connectedAt: null, error: String(err) });
    }
  },

  loadSettings: async () => {
    try {
      let settings = await invoke<AppSettings>("get_settings");

      if (settings.servers.length === 0 && DEFAULT_VLESS_URI.startsWith("vless://")) {
        await invoke<ServerConfig>("add_server", { vlessUri: DEFAULT_VLESS_URI });
        settings = await invoke<AppSettings>("get_settings");
      }

      set({
        servers: settings.servers,
        activeServerId: settings.active_server_id,
        routingMode: settings.routing_mode,
        bypassDomains: settings.bypass_domains,
        bypassIps: settings.bypass_ips,
      });
    } catch (err) {
      set({ error: String(err) });
    }
  },

  addServer: async (vlessUri: string) => {
    try {
      const server = await invoke<ServerConfig>("add_server", { vlessUri });
      const { servers } = get();
      const existing = servers.findIndex((s) => s.id === server.id);
      const updated = existing >= 0
        ? servers.map((s) => (s.id === server.id ? server : s))
        : [...servers, server];
      set({ servers: updated, error: null });
      // Auto-select if first
      if (updated.length === 1) {
        set({ activeServerId: server.id });
      }
    } catch (err) {
      set({ error: String(err) });
      throw err;
    }
  },

  removeServer: async (id: string) => {
    try {
      await invoke("remove_server", { id });
      const { servers, activeServerId } = get();
      const updated = servers.filter((s) => s.id !== id);
      set({
        servers: updated,
        activeServerId:
          activeServerId === id
            ? updated[0]?.id ?? null
            : activeServerId,
      });
    } catch (err) {
      set({ error: String(err) });
    }
  },

  selectServer: async (id: string) => {
    try {
      await invoke("select_server", { id });
      set({ activeServerId: id });
    } catch (err) {
      set({ error: String(err) });
    }
  },

  pingServer: async (id: string) => {
    try {
      const latency = await invoke<number | null>("ping_server", { id });
      const { servers } = get();
      set({
        servers: servers.map((s) =>
          s.id === id ? { ...s, latency_ms: latency } : s
        ),
      });
    } catch (err) {
      set({ error: String(err) });
    }
  },

  setRoutingMode: async (mode: RoutingMode) => {
    try {
      await invoke("set_routing_mode", { mode });
      set({ routingMode: mode });
    } catch (err) {
      set({ error: String(err) });
    }
  },

  setBypassLists: async (domains: string[], ips: string[]) => {
    try {
      await invoke("set_bypass_lists", { domains, ips });
      set({ bypassDomains: domains, bypassIps: ips });
    } catch (err) {
      set({ error: String(err) });
    }
  },

  setTheme: (theme: ThemeMode) => {
    set({ theme });
    if (typeof window !== "undefined") {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    }
  },
}));
