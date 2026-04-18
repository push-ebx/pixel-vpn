"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth";

interface PromoCode {
  id: string;
  code: string;
  discountPercent: number;
  maxUses: number | null;
  usedCount: number;
  type: "ONETIME" | "PERMANENT";
  isActive: boolean;
  expiresAt: string | null;
  createdAt: string;
  plan: {
    id: string;
    code: string;
    name: string;
    priceRub: number;
    durationDays: number;
  };
}

export default function AdminPage() {
  const router = useRouter();
  const { user, checkAuth, isInitialized } = useAuthStore();
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    code: "",
    discountPercent: 50,
    maxUses: "",
    type: "ONETIME" as "ONETIME" | "PERMANENT",
    planId: "",
  });
  const [plans, setPlans] = useState<{ id: string; code: string; name: string; priceRub: number; durationDays: number }[]>([]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (isInitialized && !user) {
      router.replace("/login");
    } else if (isInitialized && user && !(user as any).isAdmin) {
      router.replace("/dashboard");
    }
  }, [user, isInitialized, router]);

  useEffect(() => {
    if (isInitialized && user) {
      fetchData();
    }
  }, [isInitialized, user]);

  const fetchData = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "https://api.pixel-vpn.ru"}/api/admin/promocodes`, {
        credentials: "include",
      });
      const data = await res.json();
      if (data.promoCodes) {
        setPromoCodes(data.promoCodes);
      }
      if (data.plans) {
        setPlans(data.plans);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPlans = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "https://api.pixel-vpn.ru"}/api/plans`, {
        credentials: "include",
      });
      const data = await res.json();
      if (data.plans) {
        setPlans(data.plans);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "https://api.pixel-vpn.ru"}/api/admin/promocodes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...formData,
          maxUses: formData.maxUses ? parseInt(formData.maxUses) : null,
        }),
      });
      const data = await res.json();
      if (data.promoCode) {
        setPromoCodes([data.promoCode, ...promoCodes]);
        setShowForm(false);
        setFormData({ code: "", discountPercent: 50, maxUses: "", type: "ONETIME", planId: "" });
      } else {
        alert(data.error || "Ошибка");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const toggleActive = async (id: string, current: boolean) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "https://api.pixel-vpn.ru"}/api/admin/promocodes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ isActive: !current }),
      });
      const data = await res.json();
      if (data.promoCode) {
        setPromoCodes(promoCodes.map((pc) => (pc.id === id ? data.promoCode : pc)));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Удалить промокод?")) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "https://api.pixel-vpn.ru"}/api/admin/promocodes/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        setPromoCodes(promoCodes.filter((pc) => pc.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (!isInitialized || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-text-secondary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-text-primary">
      <header className="border-b border-border bg-card/50 px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Админ-панель</h1>
          <button onClick={() => router.push("/dashboard")} className="text-sm text-text-secondary hover:text-accent">
            Назад
          </button>
        </div>
      </header>

      <main className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-medium">Промокоды</h2>
          <button
            onClick={() => {
              if (!plans.length) fetchPlans();
              setShowForm(true);
            }}
            className="px-4 py-2 bg-accent text-white rounded hover:bg-accent-hover transition-colors"
          >
            + Добавить промокод
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="bg-card border border-border rounded-lg p-4 mb-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-text-secondary mb-1">Код</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 bg-background border border-border rounded text-text-primary"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-text-secondary mb-1">Скидка %</label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={formData.discountPercent}
                  onChange={(e) => setFormData({ ...formData, discountPercent: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 bg-background border border-border rounded text-text-primary"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-text-secondary mb-1">Тип</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as "ONETIME" | "PERMANENT" })}
                  className="w-full px-3 py-2 bg-background border border-border rounded text-text-primary"
                >
                  <option value="ONETIME">Разовый</option>
                  <option value="PERMANENT">Постоянный</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-text-secondary mb-1">Лимит использований</label>
                <input
                  type="number"
                  min={1}
                  value={formData.maxUses}
                  onChange={(e) => setFormData({ ...formData, maxUses: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded text-text-primary"
                  placeholder="Без лимита"
                />
              </div>
              <div>
                <label className="block text-sm text-text-secondary mb-1">Тариф</label>
                <select
                  value={formData.planId}
                  onChange={(e) => setFormData({ ...formData, planId: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded text-text-primary"
                  required
                >
                  <option value="">Выберите тариф</option>
                  {plans.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name} ({plan.priceRub}₽ / {plan.durationDays || 30}д)
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <button type="submit" className="px-4 py-2 bg-accent text-white rounded hover:bg-accent-hover">
                Создать
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 bg-card border border-border rounded hover:bg-card/80"
              >
                Отмена
              </button>
            </div>
          </form>
        )}

        {loading ? (
          <div className="animate-pulse text-text-secondary">Загрузка...</div>
        ) : (
          <div className="space-y-2">
            {promoCodes.map((pc) => (
              <div
                key={pc.id}
                className={`flex items-center justify-between p-4 bg-card border rounded-lg ${
                  pc.isActive ? "border-border" : "border-error/50"
                }`}
              >
                <div className="flex items-center gap-4">
                  <span className="font-mono font-medium">{pc.code}</span>
                  <span className="text-sm text-text-secondary">
                    {pc.discountPercent}% на {pc.plan.name}
                  </span>
                  <span className="text-xs text-text-secondary">
                    {pc.usedCount}/{pc.maxUses || "∞"}
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded ${
                      pc.type === "ONETIME" ? "bg-accent/20 text-accent" : "bg-accent-hover/20 text-accent-hover"
                    }`}
                  >
                    {pc.type === "ONETIME" ? "Разовый" : "Постоянный"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={pc.isActive}
                      onChange={() => toggleActive(pc.id, pc.isActive)}
                      className="w-4 h-4"
                    />
                    Активен
                  </label>
                  <button
                    onClick={() => handleDelete(pc.id)}
                    className="px-2 py-1 text-sm text-error hover:bg-error/10 rounded"
                  >
                    Удалить
                  </button>
                </div>
              </div>
            ))}
            {promoCodes.length === 0 && <p className="text-text-secondary">Нет промокодов</p>}
          </div>
        )}
      </main>
    </div>
  );
}