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
        "bg-codexa-primary text-white hover:bg-codexa-primary-hover shadow-subtle border border-transparent focus-visible:ring-codexa-primary active:bg-codexa-indigo",
      secondary:
        "bg-codexa-surface text-codexa-text hover:bg-codexa-surface-hover border border-codexa-border shadow-subtle focus-visible:ring-codexa-primary",
      tertiary:
        "bg-transparent text-codexa-text-secondary hover:text-codexa-text hover:bg-codexa-bg-secondary border border-codexa-border/60",
      outline:
        "bg-transparent text-codexa-text hover:bg-codexa-surface-hover border border-codexa-border hover:border-codexa-border-strong",
      ghost:
        "bg-transparent text-codexa-text-secondary hover:text-codexa-text hover:bg-codexa-bg-secondary",
      destructive:
        "bg-codexa-error text-white hover:bg-red-600 shadow-subtle focus-visible:ring-codexa-error",
    };

    const sizeStyles: Record<string, string> = {
      xs: "h-6 px-2 text-[11px] gap-1 rounded-md",
      sm: "h-8 px-3 text-xs gap-1.5 rounded-lg font-medium",
      md: "h-9 px-4 text-xs font-medium gap-2 rounded-lg",
      lg: "h-11 px-5 text-sm font-semibold gap-2.5 rounded-xl",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center font-sans tracking-tight select-none",
          "transition-all duration-150 ease-out",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-codexa-bg",
          "active:scale-[0.98]",
          "disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed",
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
