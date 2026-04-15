import crypto from "node:crypto";

import { config } from "../config";

export interface XuiClient {
  id: number;
  email: string;
  enable: boolean;
  flow: string;
  limitIp: number;
  totalGB: number;
  expiryTime: number;
  listen: string;
  port: number;
  protocol: string;
  settings: string;
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
  tagObj: Record<string, unknown>;
  listenOpts: Record<string, unknown>;
  sniffingOpts: Record<string, unknown>;
}

export interface XuiLoginResponse {
  success: boolean;
  msg: string;
  obj: {
    token: string;
  } | null;
}

export class XuiClientError extends Error {
  constructor(message: string, public statusCode?: number) {
    super(message);
    this.name = "XuiClientError";
  }
}

function generatePassword(length: number = 16): string {
  return crypto.randomBytes(length).toString("base64url").slice(0, length);
}

function generateVlessUuid(): string {
  return crypto.randomUUID().replace(/-/g, "");
}

export class XUIApiClient {
  private baseUrl: string;
  private username: string;
  private password: string;
  private token: string | null = null;

  constructor() {
    this.baseUrl = config.XUI_BASE_URL;
    this.username = config.XUI_USERNAME;
    this.password = config.XUI_PASSWORD;
  }

  private async request<T>(
    path: string,
    options: RequestInit & { method: string }
  ): Promise<T> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string> || {})
    };

    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new XuiClientError(
        data.msg || `XUI API error: ${response.status}`,
        response.status
      );
    }

    return data;
  }

  async login(): Promise<void> {
    const data = await this.request<XuiLoginResponse>("/login", {
      method: "POST",
      body: JSON.stringify({
        username: this.username,
        password: this.password
      })
    });

    if (!data.obj?.token) {
      throw new XuiClientError("Failed to get authentication token");
    }

    this.token = data.obj.token;
  }

  private async ensureAuthenticated(): Promise<void> {
    if (!this.token) {
      await this.login();
    }
  }

  async getInbounds(): Promise<XuiInbound[]> {
    await this.ensureAuthenticated();
    const data = await this.request<{ success: boolean; obj: XuiInbound[] }>(
      "/xui/inbound/list",
      { method: "GET" }
    );
    return data.obj || [];
  }

  async getInboundByTag(tag: string): Promise<XuiInbound | null> {
    const inbounds = await this.getInbounds();
    return inbounds.find((i) => i.tag === tag) || null;
  }

  async getInboundById(id: number): Promise<XuiInbound | null> {
    const inbounds = await this.getInbounds();
    return inbounds.find((i) => i.id === id) || null;
  }

  async createClient(
    inboundId: number,
    email: string,
    expiryDays?: number
  ): Promise<{ uuid: string; vlessLink: string }> {
    await this.ensureAuthenticated();

    const uuid = generateVlessUuid();
    const settings: Record<string, unknown> = {
      clients: [
        {
          id: uuid,
          email,
          enable: true,
          flow: config.XUI_FLOW || "xtls-rprx-vision",
          limitIp: 0,
          totalGB: 0,
          expiryTime: expiryDays
            ? Date.now() + expiryDays * 24 * 60 * 60 * 1000
            : 0
        }
      ]
    };

    const data = await this.request<{ success: boolean; msg: string }>(
      `/xui/inbound/${inboundId}/addClient`,
      {
        method: "POST",
        body: JSON.stringify({
          ...settings,
          enable: true,
          flow: config.XUI_FLOW || "xtls-rprx-vision",
          email: undefined
        })
      }
    );

    if (!data.success) {
      throw new XuiClientError(data.msg || "Failed to create client");
    }

    const vlessLink = this.buildVlessLink(uuid, email);

    return { uuid, vlessLink };
  }

  async removeClient(inboundId: number, email: string): Promise<void> {
    await this.ensureAuthenticated();
    await this.request(`/xui/inbound/${inboundId}/delClient/${encodeURIComponent(email)}`, {
      method: "POST"
    });
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

    const client = inbound.clients.find((c) => c.email === email);
    if (!client) {
      throw new XuiClientError("Client not found");
    }

    const newExpiryTime =
      Date.now() + expiryDays * 24 * 60 * 60 * 1000;

    await this.request(`/xui/inbound/${inboundId}/updateClient/${encodeURIComponent(email)}`, {
      method: "POST",
      body: JSON.stringify({
        id: client.id,
        email: client.email,
        enable: true,
        flow: client.flow,
        limitIp: client.limitIp,
        totalGB: client.totalGB,
        expiryTime: newExpiryTime
      })
    });
  }

  async getClientByEmail(email: string): Promise<XuiClient | null> {
    const inbounds = await this.getInbounds();
    for (const inbound of inbounds) {
      const client = inbound.clients.find((c) => c.email === email);
      if (client) {
        return client;
      }
    }
    return null;
  }

  async addDaysToClient(
    inboundId: number,
    email: string,
    additionalDays: number
  ): Promise<void> {
    const client = await this.getClientByEmail(email);
    if (!client) {
      throw new XuiClientError("Client not found");
    }

    const currentExpiry = client.expiryTime || Date.now();
    const existingDays = Math.max(
      0,
      Math.ceil((currentExpiry - Date.now()) / (24 * 60 * 60 * 1000))
    );
    const newExpiryDays = existingDays + additionalDays;

    await this.updateClientExpiry(inboundId, email, newExpiryDays);
  }

  private buildVlessLink(uuid: string, label: string): string {
    const host = config.XRAY_HOST;
    const port = config.XUI_PORT || 443;
    const pbk = config.XRAY_PUBLIC_KEY;
    const sni = config.XRAY_SNI;
    const fp = config.XRAY_FINGERPRINT;
    const sid = config.XRAY_SHORT_ID;
    const flow = config.XUI_FLOW || "xtls-rprx-vision";

    const params = new URLSearchParams();
    params.set("type", "tcp");
    params.set("security", "reality");
    params.set("fp", fp);
    params.set("pbk", pbk);
    if (sni) params.set("sni", sni);
    if (flow) params.set("flow", flow);
    if (sid) params.set("sid", sid);

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
