import React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "accent" | "success" | "warning" | "danger" | "outline";
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
    default: "bg-atlas-surface-secondary text-atlas-text-secondary border-atlas-border",
    accent: "bg-atlas-accent/15 text-atlas-accent border-atlas-accent/30",
    success: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    warning: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    danger: "bg-rose-500/15 text-rose-400 border-rose-500/30",
    outline: "bg-transparent text-atlas-text-secondary border-atlas-border",
  };

  const dotColors: Record<string, string> = {
    default: "bg-atlas-text-muted",
    accent: "bg-atlas-accent",
    success: "bg-emerald-400",
    warning: "bg-amber-400",
    danger: "bg-rose-400",
    outline: "bg-atlas-text-secondary",
  };

  const sizeStyles: Record<string, string> = {
    sm: "px-1.5 py-0.5 text-[10px] gap-1",
    md: "px-2 py-0.5 text-[11px] gap-1.5",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center font-mono font-medium rounded border tracking-tight leading-none select-none",
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
