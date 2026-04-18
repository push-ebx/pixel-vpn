import crypto from "node:crypto";

import { config } from "../config";

export interface XuiClient {
  id: string;
  email: string;
  enable: boolean;
  flow: string;
  limitIp: number;
  totalGB: number;
  expiryTime: number;
  tgId?: string;
  subId?: string;
  comment?: string;
  reset?: number;
}

export interface XuiInbound {
  id: number;
  userLevel: number;
  enable: boolean;
  protocol: string;
  port: number;
  listen: string;
  close: string;
  dest: string;
  type: string;
  sniff: string;
  sniffOverride: boolean;
  sniffDestObject: Record<string, unknown>;
  headers: Record<string, unknown>;
  readonly tag: string;
  readonly symbol: string;
  clients: XuiClient[];
  stats: Record<string, unknown>;
  streamSettings: string;
  settings: string;
  tagObj: Record<string, unknown>;
  listenOpts: Record<string, unknown>;
  sniffingOpts: Record<string, unknown>;
}

type XuiApiEnvelope<T> = {
  success?: boolean;
  msg?: string;
  obj?: T;
};

export type XuiLoginResponse = XuiApiEnvelope<{
  token?: string;
} | null>;

export type XUIApiClientOptions = {
  baseUrl?: string;
  username?: string;
  password?: string;
  twoFactorCode?: string;
};

export class XuiClientError extends Error {
  constructor(message: string, public statusCode?: number) {
    super(message);
    this.name = "XuiClientError";
  }
}

type XuiClientLocation = {
  inbound: XuiInbound;
  client: XuiClient;
};

function toRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

function asString(value: unknown, fallback: string = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asNumber(value: unknown, fallback: number = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim() !== "" && !Number.isNaN(Number(value))) {
    return Number(value);
  }
  return fallback;
}

function asBoolean(value: unknown, fallback: boolean = false): boolean {
  if (typeof value === "boolean") {
    return value;
  }
  return fallback;
}

function normalizeClient(value: unknown): XuiClient {
  const raw = toRecord(value);
  return {
    id: asString(raw.id),
    email: asString(raw.email),
    enable: asBoolean(raw.enable, true),
    flow: asString(raw.flow, config.XUI_FLOW),
    limitIp: asNumber(raw.limitIp, 0),
    totalGB: asNumber(raw.totalGB, 0),
    expiryTime: asNumber(raw.expiryTime, 0),
    tgId: asString(raw.tgId, ""),
    subId: asString(raw.subId, ""),
    comment: asString(raw.comment, ""),
    reset: asNumber(raw.reset, 0)
  };
}

function parseClients(rawInbound: Record<string, unknown>): XuiClient[] {
  const rawClients = rawInbound.clients;
  if (Array.isArray(rawClients)) {
    return rawClients.map(normalizeClient);
  }

  const settings = asString(rawInbound.settings);
  if (!settings) {
    return [];
  }

  try {
    const parsed = JSON.parse(settings) as Record<string, unknown>;
    if (!Array.isArray(parsed.clients)) {
      return [];
    }
    return parsed.clients.map(normalizeClient);
  } catch {
    return [];
  }
}

function normalizeInbound(value: unknown): XuiInbound {
  const raw = toRecord(value);

  return {
    id: asNumber(raw.id),
    userLevel: asNumber(raw.userLevel),
    enable: asBoolean(raw.enable, true),
    protocol: asString(raw.protocol),
    port: asNumber(raw.port),
    listen: asString(raw.listen),
    close: asString(raw.close),
    dest: asString(raw.dest),
    type: asString(raw.type),
    sniff: asString(raw.sniff),
    sniffOverride: asBoolean(raw.sniffOverride, false),
    sniffDestObject: toRecord(raw.sniffDestObject),
    headers: toRecord(raw.headers),
    tag: asString(raw.tag),
    symbol: asString(raw.symbol),
    clients: parseClients(raw),
    stats: toRecord(raw.stats),
    streamSettings: asString(raw.streamSettings),
    settings: asString(raw.settings),
    tagObj: toRecord(raw.tagObj),
    listenOpts: toRecord(raw.listenOpts),
    sniffingOpts: toRecord(raw.sniffingOpts)
  };
}

function normalizeWebBasePath(path: string): string {
  const trimmed = path.trim();
  if (!trimmed) {
    return "";
  }

  const withoutEdgeSlashes = trimmed.replace(/^\/+|\/+$/g, "");
  return withoutEdgeSlashes ? `/${withoutEdgeSlashes}` : "";
}

function resolveBaseUrl(override?: string): string {
  if (override) {
    return override.replace(/\/+$/, "");
  }

  if (config.XUI_BASE_URL) {
    return config.XUI_BASE_URL.replace(/\/+$/, "");
  }

  const webBasePath = normalizeWebBasePath(config.WEBBASEPATH);
  return `${config.XUI_SCHEME}://${config.HOST_X_UI}:${config.PORT_X_UI}${webBasePath}`.replace(/\/+$/, "");
}

function generateVlessUuid(): string {
  return crypto.randomUUID();
}

function buildXuiRequestErrorMessage(payload: unknown, statusCode: number): string {
  if (typeof payload === "object" && payload !== null) {
    const record = payload as Record<string, unknown>;
    if (typeof record.msg === "string" && record.msg.trim()) {
      return record.msg;
    }
    if (typeof record.error === "string" && record.error.trim()) {
      return record.error;
    }
  }

  if (typeof payload === "string" && payload.trim()) {
    return payload;
  }

  return `XUI API error: ${statusCode}`;
}

function extractSetCookieHeaders(headers: Headers): string[] {
  const anyHeaders = headers as unknown as { getSetCookie?: () => string[] };
  if (typeof anyHeaders.getSetCookie === "function") {
    return anyHeaders.getSetCookie();
  }

  const raw = headers.get("set-cookie");
  return raw ? [raw] : [];
}

function normalizeCookieHeader(setCookieHeaders: string[]): string | null {
  const cookiePairs = setCookieHeaders
    .map((value) => value.split(";")[0]?.trim())
    .filter((value): value is string => Boolean(value));

  if (!cookiePairs.length) {
    return null;
  }

  return cookiePairs.join("; ");
}

function formatFetchFailure(baseUrl: string, path: string, error: unknown): string {
  const fullUrl = `${baseUrl}${path}`;
  if (!(error instanceof Error)) {
    return `Failed to reach x-ui at ${fullUrl}`;
  }

  const cause = error.cause as
    | { code?: string; address?: string; port?: number; message?: string }
    | undefined;

  if (cause?.code && cause?.address && cause?.port) {
    return `Failed to reach x-ui at ${fullUrl}: ${cause.code} ${cause.address}:${cause.port}`;
  }

  if (cause?.message) {
    return `Failed to reach x-ui at ${fullUrl}: ${cause.message}`;
  }

  return `Failed to reach x-ui at ${fullUrl}: ${error.message}`;
}

export class XUIApiClient {
  private baseUrl: string;
  private username: string;
  private password: string;
  private twoFactorCode?: string;
  private cookieHeader: string | null = null;
  private token: string | null = null;

  constructor(options?: XUIApiClientOptions) {
    this.baseUrl = resolveBaseUrl(options?.baseUrl);
    this.username = options?.username || config.XUI_USERNAME;
    this.password = options?.password || config.XUI_PASSWORD;
    this.twoFactorCode = options?.twoFactorCode || config.XUI_TWO_FACTOR_CODE;
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }

  private async request<T>(
    path: string,
    options: RequestInit & { method: string },
    requireSuccess: boolean = true
  ): Promise<T> {
    const headers = new Headers(options.headers ?? {});
    headers.set("Accept", "application/json");

    if (this.cookieHeader) {
      headers.set("Cookie", this.cookieHeader);
    }

    if (this.token) {
      headers.set("Authorization", `Bearer ${this.token}`);
    }

    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}${path}`, {
        ...options,
        headers,
        signal: AbortSignal.timeout(config.XUI_REQUEST_TIMEOUT_MS)
      });
    } catch (error) {
      throw new XuiClientError(formatFetchFailure(this.baseUrl, path, error));
    }

    const setCookieHeaders = extractSetCookieHeaders(response.headers);
    const normalizedCookie = normalizeCookieHeader(setCookieHeaders);
    if (normalizedCookie) {
      this.cookieHeader = normalizedCookie;
    }

    const contentType = response.headers.get("content-type") ?? "";
    const payload: unknown = contentType.includes("application/json")
      ? await response.json()
      : await response.text();

    if (typeof payload === "object" && payload !== null) {
      const token = (payload as { obj?: { token?: unknown } }).obj?.token;
      if (typeof token === "string" && token.trim()) {
        this.token = token;
      }
    }

    if (!response.ok) {
      throw new XuiClientError(
        buildXuiRequestErrorMessage(payload, response.status),
        response.status
      );
    }

    if (
      requireSuccess &&
      typeof payload === "object" &&
      payload !== null &&
      "success" in payload &&
      (payload as { success?: boolean }).success === false
    ) {
      throw new XuiClientError(
        buildXuiRequestErrorMessage(payload, response.status),
        response.status
      );
    }

    return payload as T;
  }

  async login(): Promise<void> {
    const payload: Record<string, string> = {
      username: this.username,
      password: this.password
    };
    if (this.twoFactorCode) {
      payload.twoFactorCode = this.twoFactorCode;
    }

    const data = await this.request<XuiLoginResponse>("/login/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (data.success === false) {
      throw new XuiClientError(data.msg || "Failed to authenticate in x-ui");
    }

    if (!this.cookieHeader && !this.token) {
      throw new XuiClientError("x-ui auth succeeded but no session cookie/token returned");
    }
  }

  private async ensureAuthenticated(): Promise<void> {
    if (!this.cookieHeader && !this.token) {
      await this.login();
    }
  }

  async getInbounds(): Promise<XuiInbound[]> {
    await this.ensureAuthenticated();
    const data = await this.request<XuiApiEnvelope<unknown[]>>("/panel/api/inbounds/list", {
      method: "GET"
    });

    if (!Array.isArray(data.obj)) {
      return [];
    }

    return data.obj.map(normalizeInbound);
  }

  async getFirstInbound(): Promise<XuiInbound | null> {
    const inbounds = await this.getInbounds();
    if (!inbounds.length) {
      return null;
    }

    return inbounds.find((inbound) => inbound.enable) || inbounds[0];
  }

  async getInboundByTag(tag: string): Promise<XuiInbound | null> {
    const inbounds = await this.getInbounds();
    return inbounds.find((inbound) => inbound.tag === tag) || null;
  }

  async getInboundById(id: number): Promise<XuiInbound | null> {
    const inbounds = await this.getInbounds();
    return inbounds.find((inbound) => inbound.id === id) || null;
  }

  async findClientByEmail(email: string): Promise<XuiClientLocation | null> {
    const inbounds = await this.getInbounds();
    for (const inbound of inbounds) {
      const client = inbound.clients.find((item) => item.email === email);
      if (client) {
        return { inbound, client };
      }
    }
    return null;
  }

  async createClient(
    inboundId: number,
    email: string,
    expiryDays?: number
  ): Promise<{ uuid: string; vlessLink: string }> {
    await this.ensureAuthenticated();

    const inbound = await this.getInboundById(inboundId);
    if (!inbound) {
      throw new XuiClientError(`Inbound ${inboundId} not found`);
    }

    const uuid = generateVlessUuid();
    const expiryTime = expiryDays
      ? Date.now() + expiryDays * 24 * 60 * 60 * 1000
      : 0;

    const settings = JSON.stringify({
      clients: [
        {
          id: uuid,
          email,
          enable: true,
          flow: config.XUI_FLOW,
          limitIp: 0,
          totalGB: 0,
          expiryTime,
          tgId: "",
          subId: crypto.randomBytes(8).toString("hex"),
          comment: "",
          reset: 0
        }
      ]
    });

    const body = new FormData();
    body.set("id", String(inboundId));
    body.set("settings", settings);

    await this.request<XuiApiEnvelope<unknown>>("/panel/api/inbounds/addClient", {
      method: "POST",
      body
    });

    const vlessLink = this.buildVlessLink(uuid, email, inbound.port);
    return { uuid, vlessLink };
  }

  async updateClientExpiry(
    inboundId: number,
    email: string,
    expiryDays: number
  ): Promise<void> {
    await this.ensureAuthenticated();

    const inbound = await this.getInboundById(inboundId);
    if (!inbound) {
      throw new XuiClientError("Inbound not found");
    }

    const client = inbound.clients.find((item) => item.email === email);
    if (!client) {
      throw new XuiClientError("Client not found");
    }

    const newExpiryTime = Date.now() + expiryDays * 24 * 60 * 60 * 1000;
    const clientForUpdate = {
      ...client,
      expiryTime: newExpiryTime,
      enable: true,
      flow: client.flow || config.XUI_FLOW
    };

    await this.request<XuiApiEnvelope<unknown>>(
      `/panel/api/inbounds/updateClient/${encodeURIComponent(client.id)}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          id: inbound.id,
          settings: JSON.stringify({
            clients: [clientForUpdate]
          })
        })
      }
    );
  }

  async getClientByEmail(email: string): Promise<XuiClient | null> {
    const location = await this.findClientByEmail(email);
    return location?.client || null;
  }

  async addDaysToClient(
    inboundId: number,
    email: string,
    additionalDays: number
  ): Promise<void> {
    const inbounds = await this.getInbounds();
    const preferredInbound = inbounds.find((inbound) => inbound.id === inboundId);
    const fallbackInbound = inbounds.find((inbound) => inbound.clients.some((client) => client.email === email));
    const inbound = preferredInbound || fallbackInbound;

    if (!inbound) {
      throw new XuiClientError("Inbound not found");
    }

    const client = inbound.clients.find((item) => item.email === email);
    if (!client) {
      throw new XuiClientError("Client not found");
    }

    const currentExpiry = client.expiryTime || Date.now();
    const existingDays = Math.max(
      0,
      Math.ceil((currentExpiry - Date.now()) / (24 * 60 * 60 * 1000))
    );

    await this.updateClientExpiry(inbound.id, email, existingDays + additionalDays);
  }

  createVlessLink(uuid: string, label: string, inboundPort?: number): string {
    return this.buildVlessLink(uuid, label, inboundPort);
  }

  private buildVlessLink(uuid: string, label: string, inboundPort?: number): string {
    const host = config.XRAY_HOST;
    const port = inboundPort || config.XRAY_PORT;
    const pbk = config.XRAY_PUBLIC_KEY;
    const sni = config.XRAY_SNI;
    const fp = config.XRAY_FINGERPRINT;
    const sid = config.XRAY_SHORT_ID;
    const spx = config.XRAY_SPX;
    const flow = config.XUI_FLOW;

    const params = new URLSearchParams();
    params.set("type", "tcp");
    params.set("encryption", "none");
    params.set("security", "reality");
    params.set("pbk", pbk);
    params.set("fp", fp);
    if (sni) params.set("sni", sni);
    if (sid) params.set("sid", sid);
    if (spx) params.set("spx", spx);
    if (flow) params.set("flow", flow);

    const tag = label ? `#${encodeURIComponent(label)}` : "";
    return `vless://${encodeURIComponent(uuid)}@${host}:${port}?${params.toString()}${tag}`;
  }
}

let xuiClientInstance: XUIApiClient | null = null;

export function getXuiClient(): XUIApiClient {
  if (!xuiClientInstance) {
    xuiClientInstance = new XUIApiClient();
  }
  return xuiClientInstance;
}

export function createXuiClient(options?: XUIApiClientOptions): XUIApiClient {
  return new XUIApiClient(options);
}
