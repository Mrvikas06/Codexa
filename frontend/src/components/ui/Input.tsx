import React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, leftIcon, rightIcon, className, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="space-y-1.5 w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-medium text-atlas-text-secondary select-none"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-2.5 flex items-center pointer-events-none text-atlas-text-muted">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              "w-full h-8 px-3 bg-atlas-bg text-atlas-text placeholder:text-atlas-text-muted",
              "text-xs font-sans rounded-md border border-atlas-border",
              "transition-all duration-150 ease-out",
              "hover:border-atlas-border-strong",
              "focus:outline-none focus:border-atlas-accent focus:ring-1 focus:ring-atlas-accent",
              "disabled:opacity-50 disabled:bg-atlas-surface disabled:cursor-not-allowed",
              leftIcon && "pl-8",
              rightIcon && "pr-8",
              error && "border-rose-500 focus:border-rose-500 focus:ring-rose-500",
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-2.5 flex items-center text-atlas-text-muted">
              {rightIcon}
            </div>
          )}
        </div>
        {error ? (
          <p className="text-[11px] text-rose-400 font-sans tracking-tight">{error}</p>
        ) : helperText ? (
          <p className="text-[11px] text-atlas-text-muted font-sans tracking-tight">
            {helperText}
          </p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = "Input";
