import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  size = "md",
  className = "",
  disabled,
  ...props
}) => {
  const variantStyles = {
    primary: "bg-[#6C8CFF] hover:bg-[#5b7ce6] text-white",
    secondary: "bg-[#14171C] hover:bg-[#191D23] border border-[#262B33] text-[#F1F3F5]",
    danger: "bg-rose-600 hover:bg-rose-700 text-white",
    ghost: "hover:bg-[#14171C] text-[#A0A7B2] hover:text-[#F1F3F5]",
  };

  const sizeStyles = {
    sm: "px-2.5 py-1 text-xs",
    md: "px-3.5 py-1.5 text-xs font-medium",
    lg: "px-4 py-2 text-sm font-medium",
  };

  return (
    <button
      disabled={disabled}
      className={`inline-flex items-center justify-center rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
