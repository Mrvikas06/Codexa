import React from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "metric" | "interactive" | "feature" | "content" | "elevated";
  interactive?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ children, variant = "default", interactive, className, onClick, ...props }, ref) => {
    const isClickable = interactive || !!onClick || variant === "interactive";

    const variantStyles: Record<string, string> = {
      default: "bg-codexa-surface border-codexa-border shadow-card",
      metric: "bg-codexa-surface border-codexa-border shadow-card p-5",
      interactive:
        "bg-codexa-surface border-codexa-border shadow-card hover:border-codexa-primary/40 hover:shadow-medium cursor-pointer transition-all duration-150 active:scale-[0.99]",
      feature:
        "bg-codexa-surface border-codexa-border shadow-card hover:border-codexa-primary/30 hover:shadow-medium transition-all duration-150",
      content: "bg-codexa-surface border-codexa-border shadow-card",
      elevated: "bg-codexa-surface border-codexa-border shadow-elevated",
    };

    return (
      <div
        ref={ref}
        onClick={onClick}
        className={cn(
          "rounded-xl border text-codexa-text transition-colors duration-150",
          variantStyles[variant],
          isClickable &&
            variant !== "interactive" &&
            "cursor-pointer hover:border-codexa-primary/40 hover:shadow-medium active:scale-[0.99]",
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
      className={cn("flex items-center justify-between p-5 border-b border-codexa-border/60", className)}
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
      className={cn("text-xs font-semibold uppercase tracking-wider text-codexa-text-secondary font-mono", className)}
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
    <div className={cn("p-5", className)} {...props}>
      {children}
    </div>
  );
}
