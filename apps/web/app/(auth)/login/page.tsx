"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useAuthStore } from "@/lib/auth";

interface FormData {
  email: string;
  password: string;
}

function LoginPageInner() {
  const [serverError, setServerError] = useState<string | null>(null);
  const { login, isLoading } = useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const ref = searchParams.get("ref");
  const registerHref = ref ? `/register?ref=${encodeURIComponent(ref)}` : "/register";
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>();

  const onSubmit = async (data: FormData) => {
    setServerError(null);
    const result = await login(data.email, data.password);
    if (result.success) {
      router.replace("/dashboard");
    } else {
      setServerError(result.error || "Ошибка входа");
    }
  };

  return (
    <div className="bg-card rounded-xl border border-border p-8">
      <h1 className="text-2xl font-bold text-text-primary mb-2">Вход в аккаунт</h1>
      <p className="text-text-secondary mb-6">
        Нет аккаунта?{" "}
        <Link href={registerHref} className="text-accent hover:text-accent-hover">
          Зарегистрируйтесь
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
          placeholder="Введите пароль"
          error={errors.password?.message}
          {...register("password", {
            required: "Пароль обязателен",
            minLength: {
              value: 6,
              message: "Минимум 6 символов",
            },
          })}
        />

        {serverError && (
          <p className="text-sm text-error">{serverError}</p>
        )}

        <Button type="submit" className="w-full" isLoading={isLoading}>
          Войти
        </Button>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginPageInner />
    </Suspense>
  );
}
