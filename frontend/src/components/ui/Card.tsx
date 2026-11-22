import React from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "information" | "metric" | "interactive" | "feature" | "content" | "elevated" | "default";
  interactive?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ children, variant = "default", interactive, className, onClick, ...props }, ref) => {
    const isClickable = interactive || !!onClick || variant === "interactive";

    const variantStyles: Record<string, string> = {
      default: "bg-atlas-surface border-atlas-border",
      information: "bg-atlas-surface border-atlas-border/80",
      metric: "bg-atlas-surface border-atlas-border p-5",
      interactive:
        "bg-atlas-surface border-atlas-border hover:border-atlas-border-strong hover:bg-atlas-surface-secondary cursor-pointer transition-all duration-150 active:scale-[0.99]",
      feature:
        "bg-atlas-surface border-atlas-border hover:border-atlas-accent/40 transition-colors duration-150",
      content: "bg-atlas-surface border-atlas-border",
      elevated: "bg-atlas-elevated border-atlas-border-strong shadow-elevated",
    };

    return (
      <div
        ref={ref}
        onClick={onClick}
        className={cn(
          "rounded-lg border text-atlas-text transition-colors duration-150",
          variantStyles[variant],
          isClickable &&
            variant !== "interactive" &&
            "cursor-pointer hover:border-atlas-border-strong hover:bg-atlas-surface-secondary active:scale-[0.99]",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";

export function CardHeader({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex items-center justify-between p-4 border-b border-atlas-border/60", className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardTitle({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn("text-xs font-semibold uppercase tracking-wider text-atlas-text-secondary", className)}
      {...props}
    >
      {children}
    </h3>
  );
}

export function CardContent({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("p-4", className)} {...props}>
      {children}
    </div>
  );
}
