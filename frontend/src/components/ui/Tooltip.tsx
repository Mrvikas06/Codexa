import React, { useState } from "react";

interface TooltipProps {
  text: string;
  children: React.ReactNode;
}

export const Tooltip: React.FC<TooltipProps> = ({ text, children }) => {
  const [visible, setVisible] = useState(false);

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 bg-[#14171C] border border-[#262B33] text-[#F1F3F5] text-[10px] rounded shadow-lg whitespace-nowrap z-50">
          {text}
        </div>
      )}
    </div>
  );
};
