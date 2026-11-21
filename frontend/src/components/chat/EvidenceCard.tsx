import React from "react";
import { ShieldCheck, FileCode } from "lucide-react";

interface EvidenceCardProps {
  filePath: string;
  startLine: number;
  endLine: number;
  content: string;
  relevance: string;
  isVerified?: boolean;
}

export const EvidenceCard: React.FC<EvidenceCardProps> = ({
  filePath,
  startLine,
  endLine,
  content,
  relevance,
  isVerified = true,
}) => {
  return (
    <div className="p-3 bg-[#0B0D10] border border-[#262B33] rounded-lg space-y-1.5 font-mono text-[11px]">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-1.5 text-[#6C8CFF] font-medium">
          <FileCode className="w-3.5 h-3.5" />
          <span>{filePath}</span>
        </div>
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#191D23] border border-[#262B33] text-emerald-400">
          L{startLine}–L{endLine}
        </span>
      </div>

      <pre className="p-2 bg-[#14171C] rounded border border-[#262B33] text-[#F1F3F5] text-[10px] overflow-x-auto">
        {content}
      </pre>

      <div className="text-[10px] text-[#69717D] flex items-center justify-between pt-1 font-sans">
        <span>{relevance}</span>
        {isVerified && (
          <span className="flex items-center space-x-1 text-emerald-400">
            <ShieldCheck className="w-3 h-3" />
            <span>Verified Source</span>
          </span>
        )}
      </div>
    </div>
  );
};
