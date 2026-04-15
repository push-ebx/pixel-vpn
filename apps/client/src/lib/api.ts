const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.trim() || "http://localhost:8787/api";

export class ApiError extends Error {
  status: number;
  details: unknown;

  constructor(message: string, status: number, details: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  token?: string | null;
};

async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers = new Headers();
  headers.set("Accept", "application/json");

  if (options.body !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  if (options.token) {
    headers.set("Authorization", `Bearer ${options.token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined
  });

  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message =
      typeof payload === "object" &&
      payload !== null &&
      "error" in payload &&
      typeof (payload as { error: unknown }).error === "string"
        ? (payload as { error: string }).error
        : `Ошибка запроса (код ${response.status})`;

    throw new ApiError(message, response.status, payload);
  }

  return payload as T;
}

export type ApiUser = {
  id: string;
  email: string;
  createdAt?: string;
};

export type ApiPlan = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  priceRub: number;
  durationDays: number;
};

export type ApiSubscription = {
  id: string;
  status: "ACTIVE" | "EXPIRED" | "CANCELED";
  startsAt: string;
  endsAt: string;
  remainingDays: number;
  plan: ApiPlan;
};

export type ApiPaymentIntent = {
  id: string;
  status: "pending" | "paid" | "failed" | "canceled" | "expired";
  amountRub: number;
  expiresAt: string;
  paidAt?: string | null;
  plan: {
    id: string;
    code: string;
    name: string;
    durationDays: number;
  };
  yookassa?: {
    checkoutUrl: string | null;
  };
};

export async function registerApi(email: string, password: string) {
  return apiRequest<{ accessToken: string; user: ApiUser }>("/auth/register", {
    method: "POST",
    body: { email, password }
  });
}

export async function loginApi(email: string, password: string) {
  return apiRequest<{ accessToken: string; user: ApiUser }>("/auth/login", {
    method: "POST",
    body: { email, password }
  });
}

export async function getMeApi(token: string) {
  return apiRequest<{ user: ApiUser }>("/auth/me", {
    token
  });
}

export async function getPlansApi() {
  return apiRequest<{ plans: ApiPlan[] }>("/plans");
}

export async function getCurrentSubscriptionApi(token: string) {
  return apiRequest<{ active: boolean; subscription: ApiSubscription | null }>("/subscription/current", {
    token
  });
}

export async function createPaymentIntentApi(
  token: string,
  input: { planId?: string; planCode?: string }
) {
  return apiRequest<{ paymentIntent: ApiPaymentIntent }>("/payments/intents", {
    method: "POST",
    token,
    body: input
  });
}

export async function getPaymentIntentApi(token: string, intentId: string) {
  return apiRequest<{ paymentIntent: ApiPaymentIntent }>(`/payments/intents/${intentId}`, {
    token
  });
}
