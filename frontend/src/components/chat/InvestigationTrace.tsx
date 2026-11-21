import React from "react";
import { CheckCircle2 } from "lucide-react";

interface InvestigationTraceProps {
  steps: string[];
}

export const InvestigationTrace: React.FC<InvestigationTraceProps> = ({ steps }) => {
  if (!steps || steps.length === 0) return null;

  return (
    <div className="p-3 bg-[#0E1014] border border-[#262B33] rounded-lg space-y-1.5 font-mono text-[11px]">
      <div className="font-semibold text-[#A0A7B2] uppercase tracking-wider text-[10px] pb-1 border-b border-[#262B33] font-sans">
        Investigation Trace
      </div>
      {steps.map((step, idx) => (
        <div key={idx} className="flex items-center space-x-2 text-[#A0A7B2]">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>{step}</span>
        </div>
      ))}
    </div>
  );
};
