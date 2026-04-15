"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "./Toast";

interface CopyButtonProps {
  text: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function CopyButton({ text, className, size = "md" }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast("Скопировано!", "success");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast("Не удалось скопировать", "error");
    }
  };

  const sizes = {
    sm: "p-1.5",
    md: "p-2",
    lg: "p-3",
  };

  const iconSizes = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  return (
    <button
      onClick={handleCopy}
      className={cn(
        "rounded-md bg-accent/10 hover:bg-accent/20 text-accent transition-all duration-200",
        sizes[size],
        className
      )}
      title="Копировать"
    >
      {copied ? (
        <Check className={cn(iconSizes[size], "text-success")} />
      ) : (
        <Copy className={iconSizes[size]} />
      )}
    </button>
  );
}
