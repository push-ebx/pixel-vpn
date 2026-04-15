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

  const submitLabel = mode === "login" ? "Войти" : "Создать";

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
    <div className="h-full flex items-center justify-center p-6">
      <div className="w-full max-w-xs">
        <div className="flex flex-col items-center gap-4 mb-8">
          <div className="w-12 h-12 flex items-center justify-center">
            <Logo width="2rem" height="2rem" />
          </div>
          <div className="text-center">
            <h1 className="font-pixel-title text-lg text-text-primary">Pixel VPN</h1>
            <p className="text-xs text-text-secondary mt-1 terminal-text">
              {mode === "login" ? "auth > login" : "auth > register"}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="email"
            autoComplete="email"
            className="pixel-input w-full"
          />
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="password"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            className="pixel-input w-full"
          />

          {mode === "register" && (
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="confirm"
              autoComplete="new-password"
              className="pixel-input w-full"
            />
          )}

          {(formError || authError) && (
            <div className="text-xs terminal-text error bg-bg-card border border-border p-2 rounded">
              {formError || authError}
            </div>
          )}

          <button
            type="submit"
            disabled={!canSubmit || authLoading}
            className="pixel-button w-full"
          >
            {authLoading ? "..." : submitLabel}
          </button>
        </form>

        <button
          type="button"
          onClick={toggleMode}
          className="mt-4 text-xs text-text-secondary hover:text-text-primary transition-colors w-full text-center terminal-text"
        >
          {mode === "login" ? "no account? create" : "has account? login"}
        </button>
      </div>
    </div>
  );
}