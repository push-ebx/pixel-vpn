"use client";

import { forwardRef, ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", isLoading, disabled, children, ...props }, ref) => {
    const variants = {
      primary: "bg-accent hover:bg-accent-hover border border-accent hover:border-accent-hover text-white",
      secondary: "bg-card hover:bg-card-hover border border-border text-text-primary",
      ghost: "bg-transparent border border-transparent hover:border-border text-text-secondary hover:text-accent",
      danger: "bg-error hover:bg-red-600 text-white",
    };

    const sizes = {
      sm: "px-3 py-1.5 text-[11px]",
      md: "px-4 py-2 text-[12px]",
      lg: "px-6 py-3 text-[13px]",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          "inline-flex items-center justify-center gap-2 font-medium rounded-[3px] transition-colors duration-150",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "focus:outline-none focus:ring-1 focus:ring-accent",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {isLoading && (
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button };
