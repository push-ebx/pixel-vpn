"use client";

import { useEffect } from "react";
import { useToastStore } from "./Toast";
import { cn } from "@/lib/utils";
import { CheckCircle, XCircle, Info } from "lucide-react";

export function Toaster() {
  const { toasts, removeToast } = useToastStore();

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
}

function ToastItem({
  toast,
  onClose,
}: {
  toast: { id: string; message: string; type: "success" | "error" | "info" };
  onClose: () => void;
}) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-success" />,
    error: <XCircle className="w-5 h-5 text-error" />,
    info: <Info className="w-5 h-5 text-accent" />,
  };

  const backgrounds = {
    success: "border-success/30 bg-success/10",
    error: "border-error/30 bg-error/10",
    info: "border-accent/30 bg-accent/10",
  };

  return (
    <div
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-lg border backdrop-blur-xl",
        "animate-slide-up min-w-[300px] max-w-md",
        backgrounds[toast.type]
      )}
    >
      {icons[toast.type]}
      <p className="flex-1 text-sm text-text-primary">{toast.message}</p>
      <button
        onClick={onClose}
        className="text-text-secondary hover:text-text-primary transition-colors"
      >
        <XCircle className="w-4 h-4" />
      </button>
    </div>
  );
}
