"use client";

import Link from "next/link";
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
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center">
              <span className="text-white font-bold">P</span>
            </div>
            <span className="text-2xl font-bold text-text-primary">Pixel VPN</span>
          </Link>
        </div>
        <div className="text-left">{children}</div>
      </div>
    </div>
  );
}
