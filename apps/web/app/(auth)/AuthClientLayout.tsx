"use client";

import { useAuthStore } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AuthClientLayout({ children }: { children: React.ReactNode }) {
  const { user, isInitialized, checkAuth } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isInitialized) {
      checkAuth();
    }
  }, [isInitialized, checkAuth]);

  useEffect(() => {
    if (isInitialized && user) {
      router.replace("/dashboard");
    }
  }, [user, isInitialized, router]);

  if (isInitialized && user) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-text-primary">Авторизация</h1>
        </div>
        <div className="text-left">{children}</div>
      </div>
    </div>
  );
}
