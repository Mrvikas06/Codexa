import React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "accent" | "success" | "warning" | "danger" | "outline" | "info";
  size?: "sm" | "md";
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = "default",
  size = "md",
  dot = false,
  className,
  ...props
}) => {
  const variantStyles: Record<string, string> = {
    default: "bg-codexa-bg-secondary text-codexa-text-secondary border-codexa-border",
    accent: "bg-codexa-violet-light text-codexa-indigo border-codexa-violet-soft/30",
    success: "bg-codexa-success-bg text-codexa-success border-emerald-200",
    warning: "bg-codexa-warning-bg text-codexa-warning border-amber-200",
    danger: "bg-codexa-error-bg text-codexa-error border-red-200",
    info: "bg-codexa-info-bg text-codexa-info border-sky-200",
    outline: "bg-transparent text-codexa-text-secondary border-codexa-border",
  };

  const dotColors: Record<string, string> = {
    default: "bg-codexa-text-muted",
    accent: "bg-codexa-primary",
    success: "bg-codexa-success",
    warning: "bg-codexa-warning",
    danger: "bg-codexa-error",
    info: "bg-codexa-info",
    outline: "bg-codexa-text-secondary",
  };

  const sizeStyles: Record<string, string> = {
    sm: "px-2 py-0.5 text-[10px] gap-1 rounded-md",
    md: "px-2.5 py-0.5 text-[11px] gap-1.5 rounded-md",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center font-mono font-medium border tracking-tight leading-none select-none",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn("w-1.5 h-1.5 rounded-full shrink-0", dotColors[variant])}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
};
