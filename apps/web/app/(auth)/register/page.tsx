"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useAuthStore } from "@/lib/auth";
import { getReferralCode, clearReferralCode } from "@/lib/referral";

interface FormData {
  email: string;
  password: string;
  confirmPassword: string;
}

function RegisterPageInner() {
  const [serverError, setServerError] = useState<string | null>(null);
  const { register: registerUser, isLoading } = useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const ref = searchParams.get("ref") ?? getReferralCode() ?? undefined;
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>();

  const onSubmit = async (data: FormData) => {
    setServerError(null);
    const result = await registerUser(data.email, data.password, ref);
    if (result.success) {
      clearReferralCode();
      router.replace("/dashboard");
    } else {
      setServerError(result.error || "Ошибка регистрации");
    }
  };

  return (
    <div className="bg-card rounded-xl border border-border p-8">
      <h1 className="text-2xl font-bold text-text-primary mb-2">Создание аккаунта</h1>
      <p className="text-text-secondary mb-6">
        Уже есть аккаунт?{" "}
        <Link href="/login" className="text-accent hover:text-accent-hover">
          Войдите
        </Link>
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          error={errors.email?.message}
          {...register("email", {
            required: "Email обязателен",
            pattern: {
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              message: "Неверный формат email",
            },
          })}
        />

        <Input
          label="Пароль"
          type="password"
          placeholder="Минимум 6 символов"
          error={errors.password?.message}
          {...register("password", {
            required: "Пароль обязателен",
            minLength: {
              value: 6,
              message: "Минимум 6 символов",
            },
          })}
        />

        <Input
          label="Подтверждение пароля"
          type="password"
          placeholder="Повторите пароль"
          error={errors.confirmPassword?.message}
          {...register("confirmPassword", {
            required: "Подтверждение обязательно",
            validate: (value) =>
              value === watch("password") || "Пароли не совпадают",
          })}
        />

        {serverError && (
          <p className="text-sm text-error">{serverError}</p>
        )}

        <Button type="submit" className="w-full" isLoading={isLoading}>
          Создать аккаунт
        </Button>
      </form>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterPageInner />
    </Suspense>
  );
}
