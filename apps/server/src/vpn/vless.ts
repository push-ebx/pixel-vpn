import crypto from "node:crypto";

import { config } from "../config";

export function generateUserVlessUuid() {
  return crypto.randomUUID();
}

export function buildVlessLink(input: { uuid: string; label?: string }) {
  const host = config.XRAY_HOST;
  const port = config.XRAY_PORT;
  const pbk = config.XRAY_PUBLIC_KEY;
  const sni = config.XRAY_SNI;
  const fp = config.XRAY_FINGERPRINT;
  const sid = config.XRAY_SHORT_ID;
  const flow = config.XRAY_FLOW;

  const params = new URLSearchParams();
  params.set("type", "tcp");
  params.set("security", "reality");
  params.set("fp", fp);
  params.set("pbk", pbk);
  if (sni) params.set("sni", sni);
  if (flow) params.set("flow", flow);
  if (sid) params.set("sid", sid);

  const tag = input.label ? `#${encodeURIComponent(input.label)}` : "";
  return `vless://${encodeURIComponent(input.uuid)}@${host}:${port}?${params.toString()}${tag}`;
}

