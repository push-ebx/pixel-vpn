import { useMemo, useState } from "react";
import { Logo } from "../components/Logo";
import { useAccountStore } from "../stores/account-store";

type AuthMode = "login" | "register";

export default function AuthPage() {
  const { login, register, authLoading, authError, clearAuthError } = useAccountStore();
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const title = mode === "login" ? "Вход" : "Регистрация";
  const submitLabel = mode === "login" ? "Войти" : "Создать аккаунт";
  const switchLabel = mode === "login" ? "Нет аккаунта? Зарегистрироваться" : "Уже есть аккаунт? Войти";

  const canSubmit = useMemo(() => {
    if (!email.trim() || !password) {
      return false;
    }
    if (mode === "register" && confirmPassword !== password) {
      return false;
    }
    return true;
  }, [confirmPassword, email, mode, password]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    clearAuthError();

    if (mode === "register" && password !== confirmPassword) {
      setFormError("Пароли не совпадают");
      return;
    }

    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await register(email, password);
      }
      setPassword("");
      setConfirmPassword("");
    } catch {
      // Store already contains normalized error
    }
  }

  function toggleMode() {
    clearAuthError();
    setFormError(null);
    setMode((prev) => (prev === "login" ? "register" : "login"));
  }

  return (
    <div className="h-full overflow-y-auto px-6 py-8 flex items-center justify-center">
      <div className="w-full max-w-sm bg-bg-card border border-accent/20 rounded-3xl shadow-[0_20px_40px_rgba(34,62,145,0.12)] p-6">
        <div className="flex flex-col items-center gap-3 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-accent/10 text-accent flex items-center justify-center">
            <Logo width="2rem" height="2rem" />
          </div>
          <div className="text-center">
            <h1 className="text-3xl font-semibold text-text-primary">{title}</h1>
            <p className="text-sm text-text-secondary mt-1">
              Синхронизация подписки между устройствами
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Эл. почта"
            autoComplete="email"
            className="h-11 rounded-xl border border-accent/20 bg-bg-primary px-3 text-sm text-text-primary focus:outline-none focus:border-accent/60"
          />
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Пароль (минимум 8 символов)"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            className="h-11 rounded-xl border border-accent/20 bg-bg-primary px-3 text-sm text-text-primary focus:outline-none focus:border-accent/60"
          />

          {mode === "register" && (
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Подтвердите пароль"
              autoComplete="new-password"
              className="h-11 rounded-xl border border-accent/20 bg-bg-primary px-3 text-sm text-text-primary focus:outline-none focus:border-accent/60"
            />
          )}

          {(formError || authError) && (
            <div className="text-sm text-danger bg-danger/10 border border-danger/30 rounded-xl px-3 py-2">
              {formError || authError}
            </div>
          )}

          <button
            type="submit"
            disabled={!canSubmit || authLoading}
            className="h-11 rounded-xl bg-accent text-white font-semibold hover:bg-accent-hover transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {authLoading ? "Подождите..." : submitLabel}
          </button>
        </form>

        <button
          type="button"
          onClick={toggleMode}
          className="mt-4 text-sm text-accent hover:text-accent-hover transition-colors"
        >
          {switchLabel}
        </button>
      </div>
    </div>
  );
}
