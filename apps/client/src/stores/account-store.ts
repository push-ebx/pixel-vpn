import { create } from "zustand";
import {
  ApiError,
  type ApiPaymentIntent,
  type ApiPlan,
  type ApiSubscription,
  type ApiVless,
  type ApiUser,
  createPaymentIntentApi,
  getCurrentSubscriptionApi,
  getMeApi,
  getPaymentIntentApi,
  getPlansApi,
  getSubscriptionVlessApi,
  loginApi,
  registerApi
} from "../lib/api";

const TOKEN_STORAGE_KEY = "pixel-vpn-auth-token";

function readStoredToken() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(TOKEN_STORAGE_KEY);
}

function writeStoredToken(token: string | null) {
  if (typeof window === "undefined") {
    return;
  }

  if (token) {
    window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
    return;
  }

  window.localStorage.removeItem(TOKEN_STORAGE_KEY);
}

function normalizeError(error: unknown) {
  if (error instanceof ApiError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }

  return "Неизвестная ошибка";
}

function isAuthError(error: unknown) {
  return error instanceof ApiError && error.status === 401;
}

interface AccountState {
  token: string | null;
  user: ApiUser | null;
  authReady: boolean;
  authLoading: boolean;
  authError: string | null;

  plans: ApiPlan[];
  plansLoading: boolean;
  plansError: string | null;

  subscriptionActive: boolean;
  subscription: ApiSubscription | null;
  subscriptionLoading: boolean;
  subscriptionError: string | null;
  vless: ApiVless | null;
  vlessLoading: boolean;
  vlessError: string | null;

  currentPayment: ApiPaymentIntent | null;
  paymentLoading: boolean;
  paymentError: string | null;

  hydrateAuth: () => Promise<boolean>;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loadPlans: () => Promise<void>;
  loadSubscription: () => Promise<void>;
  loadVless: () => Promise<void>;
  createPaymentIntent: (input: { planId?: string; planCode?: string }) => Promise<ApiPaymentIntent>;
  refreshPaymentIntent: (intentId: string) => Promise<void>;
  clearPayment: () => void;
  clearAuthError: () => void;
}

export const useAccountStore = create<AccountState>((set, get) => ({
  token: readStoredToken(),
  user: null,
  authReady: false,
  authLoading: false,
  authError: null,

  plans: [],
  plansLoading: false,
  plansError: null,

  subscriptionActive: false,
  subscription: null,
  subscriptionLoading: false,
  subscriptionError: null,
  vless: null,
  vlessLoading: false,
  vlessError: null,

  currentPayment: null,
  paymentLoading: false,
  paymentError: null,

  hydrateAuth: async () => {
    const token = get().token;
    if (!token) {
      set({ authReady: true, user: null });
      return false;
    }

    set({ authLoading: true, authError: null });
    try {
      const response = await getMeApi(token);
      set({
        user: response.user,
        authReady: true,
        authLoading: false
      });
      return true;
    } catch (error) {
      writeStoredToken(null);
      set({
        token: null,
        user: null,
        authReady: true,
        authLoading: false,
        authError: normalizeError(error)
      });
      return false;
    }
  },

  login: async (email: string, password: string) => {
    set({ authLoading: true, authError: null });
    try {
      const response = await loginApi(email.trim().toLowerCase(), password);
      writeStoredToken(response.accessToken);
      set({
        token: response.accessToken,
        user: response.user,
        authReady: true,
        authLoading: false
      });
      await get().loadSubscription();
    } catch (error) {
      set({
        authLoading: false,
        authError: normalizeError(error)
      });
      throw error;
    }
  },

  register: async (email: string, password: string) => {
    set({ authLoading: true, authError: null });
    try {
      const response = await registerApi(email.trim().toLowerCase(), password);
      writeStoredToken(response.accessToken);
      set({
        token: response.accessToken,
        user: response.user,
        authReady: true,
        authLoading: false
      });
      await get().loadSubscription();
    } catch (error) {
      set({
        authLoading: false,
        authError: normalizeError(error)
      });
      throw error;
    }
  },

  logout: () => {
    writeStoredToken(null);
    set({
      token: null,
      user: null,
      authError: null,
      subscription: null,
      subscriptionActive: false,
      vless: null,
      vlessError: null,
      currentPayment: null
    });
  },

  loadPlans: async () => {
    set({ plansLoading: true, plansError: null });
    try {
      const response = await getPlansApi();
      set({
        plans: response.plans,
        plansLoading: false
      });
    } catch (error) {
      set({
        plansLoading: false,
        plansError: normalizeError(error)
      });
    }
  },

  loadSubscription: async () => {
    const token = get().token;
    if (!token) {
      set({ subscription: null, subscriptionActive: false });
      return;
    }

    set({ subscriptionLoading: true, subscriptionError: null });
    try {
      const response = await getCurrentSubscriptionApi(token);
      set({
        subscriptionActive: response.active,
        subscription: response.subscription,
        subscriptionLoading: false,
        vless: response.active ? get().vless : null
      });
    } catch (error) {
      if (isAuthError(error)) {
        writeStoredToken(null);
        set({
          token: null,
          user: null,
          authReady: true,
          subscriptionActive: false,
          subscription: null,
          subscriptionLoading: false,
          subscriptionError: null,
          vless: null,
          vlessError: null
        });
        return;
      }

      set({
        subscriptionLoading: false,
        subscriptionError: normalizeError(error)
      });
    }
  },

  loadVless: async () => {
    const token = get().token;
    if (!token || !get().subscriptionActive) {
      set({ vless: null, vlessError: null, vlessLoading: false });
      return;
    }

    set({ vlessLoading: true, vlessError: null });
    try {
      const response = await getSubscriptionVlessApi(token);
      set({
        vless: response.vless,
        vlessLoading: false
      });
    } catch (error) {
      if (isAuthError(error)) {
        writeStoredToken(null);
        set({
          token: null,
          user: null,
          authReady: true,
          vless: null,
          vlessLoading: false,
          vlessError: null,
          subscription: null,
          subscriptionActive: false,
          subscriptionError: null
        });
        return;
      }

      set({
        vlessLoading: false,
        vlessError: normalizeError(error)
      });
    }
  },

  createPaymentIntent: async (input) => {
    const token = get().token;
    if (!token) {
      throw new Error("Пользователь не авторизован");
    }

    set({ paymentLoading: true, paymentError: null });
    try {
      const response = await createPaymentIntentApi(token, input);
      set({
        paymentLoading: false,
        currentPayment: response.paymentIntent
      });
      return response.paymentIntent;
    } catch (error) {
      set({
        paymentLoading: false,
        paymentError: normalizeError(error)
      });
      throw error;
    }
  },

  refreshPaymentIntent: async (intentId: string) => {
    const token = get().token;
    if (!token) {
      return;
    }

    set({ paymentLoading: true, paymentError: null });
    try {
      const response = await getPaymentIntentApi(token, intentId);
      const becamePaid =
        get().currentPayment?.status !== "paid" &&
        response.paymentIntent.status === "paid";

      set({
        paymentLoading: false,
        currentPayment: response.paymentIntent
      });

      if (becamePaid) {
        await get().loadSubscription();
      }
    } catch (error) {
      set({
        paymentLoading: false,
        paymentError: normalizeError(error)
      });
    }
  },

  clearPayment: () => {
    set({
      currentPayment: null,
      paymentError: null
    });
  },

  clearAuthError: () => {
    set({ authError: null });
  }
}));
