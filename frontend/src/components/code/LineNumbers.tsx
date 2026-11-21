import React from "react";

interface LineNumbersProps {
  totalLines: number;
  highlightedRange?: [number, number];
}

export const LineNumbers: React.FC<LineNumbersProps> = ({ totalLines, highlightedRange }) => {
  return (
    <div className="flex flex-col select-none text-right font-mono text-[11px] text-[#69717D] pr-4">
      {Array.from({ length: totalLines }, (_, i) => i + 1).map((num) => {
        const isHighlighted =
          highlightedRange &&
          num >= highlightedRange[0] &&
          num <= highlightedRange[1];

        return (
          <span
            key={num}
            className={isHighlighted ? "text-[#6C8CFF] font-bold" : ""}
          >
            {num}
          </span>
        );
      })}
    </div>
  );
};
