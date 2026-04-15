const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.pixel-vpn.ru";

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        credentials: "include",
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return { error: data.error || "Произошла ошибка" };
    }

    return { data };
  } catch (error) {
    return { error: "Ошибка соединения с сервером" };
  }
}

// Auth types
interface User {
  id: string;
  email: string;
}

interface AuthResponse {
  user: User;
}

// Subscription types
interface Subscription {
  id: string;
  status: "ACTIVE" | "EXPIRED" | "CANCELED";
  startsAt: string;
  endsAt: string;
  remainingDays: number;
  plan: {
    id: string;
    code: string;
    name: string;
    priceRub: number;
    durationDays: number;
  };
}

interface VlessResponse {
  uuid: string;
  link: string;
}

// Plan types
interface Plan {
  id: string;
  code: string;
  name: string;
  description: string | null;
  priceRub: number;
  durationDays: number;
}

// Payment types
interface PaymentIntent {
  id: string;
  status: "pending" | "paid" | "failed" | "expired" | "canceled";
  amountRub: number;
  plan: {
    id: string;
    code: string;
    name: string;
    durationDays: number;
  };
  yookassa?: {
    checkoutUrl: string | null;
  };
}

// Auth API
export async function register(email: string, password: string): Promise<ApiResponse<AuthResponse>> {
  return fetchApi<AuthResponse>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function login(email: string, password: string): Promise<ApiResponse<AuthResponse>> {
  return fetchApi<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function logout(): Promise<ApiResponse<void>> {
  return fetchApi<void>("/api/auth/logout", { method: "POST" });
}

export async function getMe(): Promise<ApiResponse<{ user: User }>> {
  return fetchApi<{ user: User }>("/api/auth/me");
}

// Subscription API
export async function getSubscription(): Promise<ApiResponse<{ active: boolean; subscription: Subscription | null }>> {
  return fetchApi<{ active: boolean; subscription: Subscription | null }>("/api/subscription/current");
}

export async function getVless(): Promise<ApiResponse<{ vless: VlessResponse }>> {
  return fetchApi<{ vless: VlessResponse }>("/api/subscription/vless");
}

// Plans API
export async function getPlans(): Promise<ApiResponse<{ plans: Plan[] }>> {
  return fetchApi<{ plans: Plan[] }>("/api/plans");
}

// Payments API
export async function createPaymentIntent(planId: string): Promise<ApiResponse<{ paymentIntent: PaymentIntent }>> {
  return fetchApi<{ paymentIntent: PaymentIntent }>("/api/payments/intents", {
    method: "POST",
    body: JSON.stringify({ planId }),
  });
}

export async function getPaymentIntent(intentId: string): Promise<ApiResponse<{ paymentIntent: PaymentIntent }>> {
  return fetchApi<{ paymentIntent: PaymentIntent }>(`/api/payments/intents/${intentId}`);
}

// Mock payment for testing
export async function mockPaymentSuccess(intentId: string): Promise<ApiResponse<{ ok: boolean }>> {
  return fetchApi<{ ok: boolean }>(`/api/payments/intents/${intentId}/mock-success`, {
    method: "POST",
  });
}
