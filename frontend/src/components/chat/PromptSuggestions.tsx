import React from "react";

interface PromptSuggestionsProps {
  prompts: string[];
  onSelect: (prompt: string) => void;
}

export const PromptSuggestions: React.FC<PromptSuggestionsProps> = ({ prompts, onSelect }) => {
  return (
    <div className="grid grid-cols-2 gap-2 max-w-xl mx-auto pt-2">
      {prompts.map((p, idx) => (
        <button
          key={idx}
          onClick={() => onSelect(p)}
          className="p-3 text-left bg-[#14171C] hover:bg-[#191D23] border border-[#262B33] rounded-lg text-xs text-[#A0A7B2] hover:text-[#F1F3F5] transition"
        >
          "{p}"
        </button>
      ))}
    </div>
  );
};
