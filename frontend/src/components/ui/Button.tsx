import React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "tertiary" | "ghost" | "destructive" | "outline";
  size?: "xs" | "sm" | "md" | "lg";
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = "primary",
      size = "md",
      loading = false,
      leftIcon,
      rightIcon,
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    const variantStyles: Record<string, string> = {
      primary:
        "bg-atlas-accent text-white hover:bg-atlas-accent-hover shadow-subtle focus-visible:ring-atlas-accent active:bg-blue-600",
      secondary:
        "bg-atlas-surface text-atlas-text hover:bg-atlas-surface-secondary border border-atlas-border hover:border-atlas-border-strong focus-visible:ring-atlas-border-strong",
      tertiary:
        "bg-transparent text-atlas-text-secondary hover:text-atlas-text hover:bg-atlas-hover border border-atlas-border/60 hover:border-atlas-border focus-visible:ring-atlas-border",
      outline:
        "bg-transparent text-atlas-text hover:bg-atlas-hover border border-atlas-border hover:border-atlas-border-strong",
      ghost:
        "bg-transparent text-atlas-text-secondary hover:text-atlas-text hover:bg-atlas-hover focus-visible:ring-atlas-hover",
      destructive:
        "bg-rose-600/90 text-white hover:bg-rose-600 border border-rose-500/30 focus-visible:ring-rose-500 active:bg-rose-700",
    };

    const sizeStyles: Record<string, string> = {
      xs: "h-6 px-2 text-[11px] gap-1 rounded",
      sm: "h-7 px-2.5 text-xs gap-1.5 rounded-md",
      md: "h-8 px-3.5 text-xs font-medium gap-2 rounded-md",
      lg: "h-10 px-4 text-sm font-medium gap-2.5 rounded-lg",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center font-sans tracking-tight select-none",
          "transition-all duration-150 ease-out",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-offset-atlas-bg",
          "active:scale-[0.98]",
          "disabled:opacity-45 disabled:pointer-events-none disabled:cursor-not-allowed",
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {loading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0 text-current" />
        ) : (
          leftIcon && <span className="shrink-0">{leftIcon}</span>
        )}
        {children}
        {!loading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = "Button";
