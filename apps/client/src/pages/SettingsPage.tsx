import { useVpnStore } from "../stores/vpn-store";

export default function SettingsPage() {
  const { theme, setTheme } = useVpnStore();
  const isDark = theme === "dark";

  return (
    <div className="h-[calc(100vh-7.5rem)] flex flex-col gap-4 px-4 py-4 overflow-y-auto">
      <h1 className="text-4xl font-semibold text-text-primary">Настройки</h1>

      <div className="pixel-card bg-bg-card p-4">
        <button
          type="button"
          onClick={() => setTheme(isDark ? "light" : "dark")}
          className="w-full flex items-center justify-start gap-3"
        >
          <span
            className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
              isDark ? "bg-accent" : "bg-bg-secondary"
            }`}
          >
            <span
              className={`inline-block h-6 w-6 transform rounded-full bg-white shadow transition-transform ${
                isDark ? "translate-x-7" : "translate-x-1"
              }`}
            />
          </span>
          <span className="text-base font-medium text-text-primary">
            Темная тема
          </span>
        </button>
      </div>
    </div>
  );
}

