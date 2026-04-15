export type ConnectionStatus = "disconnected" | "connecting" | "connected" | "disconnecting";
export type ThemeMode = "light" | "dark";

export type RoutingMode = "Global" | "BypassRussia" | "BypassCN" | "BypassCustom";

export interface ServerConfig {
  id: string;
  name: string;
  address: string;
  port: number;
  uuid: string;
  security: string | null;
  network: string | null;
  flow: string | null;
  sni: string | null;
  fingerprint: string | null;
  public_key: string | null;
  short_id: string | null;
  path: string | null;
  host: string | null;
  latency_ms: number | null;
}

export interface AppSettings {
  routing_mode: RoutingMode;
  bypass_domains: string[];
  bypass_ips: string[];
  servers: ServerConfig[];
  active_server_id: string | null;
}
