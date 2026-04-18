"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import * as api from "@/lib/api";

interface User {
  id: string;
  email: string;
}

interface AuthStore {
  user: User | null;
  isLoading: boolean;
  isInitialized: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      isLoading: false,
      isInitialized: false,

      login: async (email, password) => {
        set({ isLoading: true });
        const { data, error } = await api.login(email, password);
        set({ isLoading: false });

        if (error || !data) {
          return { success: false, error: error || "Ошибка входа" };
        }

        set({ user: data.user });
        return { success: true };
      },

      register: async (email, password) => {
        set({ isLoading: true });
        const { data, error } = await api.register(email, password);
        set({ isLoading: false });

        if (error || !data) {
          return { success: false, error: error || "Ошибка регистрации" };
        }

        set({ user: data.user });
        return { success: true };
      },

      logout: async () => {
        await api.logout();
        set({ user: null });
      },

      checkAuth: async () => {
        set({ isLoading: true });
        const { data, error } = await api.getMe();

        if (error) {
          set({
            isLoading: false,
            isInitialized: true,
          });
          return;
        }

        set({
          user: data?.user || null,
          isLoading: false,
          isInitialized: true,
        });
      },
    }),
    {
      name: "pixel-vpn-auth",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ user: state.user }),
    }
  )
);
