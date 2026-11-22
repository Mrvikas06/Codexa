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
            className="block text-xs font-medium text-codexa-text-secondary select-none"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3 flex items-center pointer-events-none text-codexa-text-muted">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              "w-full h-9 px-3.5 bg-codexa-surface text-codexa-text placeholder:text-codexa-text-muted",
              "text-xs font-sans rounded-lg border border-codexa-border shadow-subtle",
              "transition-all duration-150 ease-out",
              "hover:border-codexa-border-strong",
              "focus:outline-none focus:border-codexa-primary focus:ring-2 focus:ring-codexa-primary/20",
              "disabled:opacity-50 disabled:bg-codexa-bg-secondary disabled:cursor-not-allowed",
              leftIcon && "pl-9",
              rightIcon && "pr-9",
              error && "border-codexa-error focus:border-codexa-error focus:ring-codexa-error/20",
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 flex items-center text-codexa-text-muted">
              {rightIcon}
            </div>
          )}
        </div>
        {error ? (
          <p className="text-[11px] text-codexa-error font-sans tracking-tight">{error}</p>
        ) : helperText ? (
          <p className="text-[11px] text-codexa-text-muted font-sans tracking-tight">
            {helperText}
          </p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = "Input";
