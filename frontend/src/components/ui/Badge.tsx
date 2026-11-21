import React from "react";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "accent";
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = "default",
  className = "",
}) => {
  const variantStyles = {
    default: "bg-[#191D23] text-[#A0A7B2] border-[#262B33]",
    success: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    warning: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    danger: "bg-rose-500/15 text-rose-400 border-rose-500/30",
    accent: "bg-[#6C8CFF]/15 text-[#6C8CFF] border-[#6C8CFF]/30",
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-medium border ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
};
