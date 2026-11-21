import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, className = "", ...props }) => {
  return (
    <div className="space-y-1.5 w-full">
      {label && <label className="block text-xs font-medium text-[#A0A7B2]">{label}</label>}
      <input
        className={`w-full px-3 py-2 bg-[#0B0D10] border border-[#262B33] rounded-lg text-xs text-[#F1F3F5] placeholder-[#69717D] focus:outline-none focus:border-[#6C8CFF] transition ${
          error ? "border-rose-500" : ""
        } ${className}`}
        {...props}
      />
      {error && <p className="text-[10px] text-rose-400">{error}</p>}
    </div>
  );
};
