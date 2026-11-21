import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({ children, className = "", onClick }) => {
  return (
    <div
      onClick={onClick}
      className={`bg-[#14171C] border border-[#262B33] rounded-xl p-4 transition ${
        onClick ? "cursor-pointer hover:border-[#343B45]" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
};
