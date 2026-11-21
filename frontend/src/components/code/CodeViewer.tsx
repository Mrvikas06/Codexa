import React, { useMemo } from "react";
import { Copy, Check, FileCode } from "lucide-react";

interface CodeViewerProps {
  content: string;
  language?: string;
  filePath?: string;
  highlightRange?: [number, number]; // [startLine, endLine] (1-indexed)
}

export const CodeViewer: React.FC<CodeViewerProps> = ({
  content,
  language = "python",
  filePath,
  highlightRange,
}) => {
  const [copied, setCopied] = React.useState(false);

  const lines = useMemo(() => {
    return content ? content.split("\n") : [];
  }, [content]);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-[#0B0D10] border border-[#262B33] rounded-lg overflow-hidden font-mono text-xs">
      {/* Viewer Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#14171C] border-b border-[#262B33]">
        <div className="flex items-center space-x-2 text-[#A0A7B2]">
          <FileCode className="w-4 h-4 text-[#6C8CFF]" />
          <span className="font-medium text-[#F1F3F5]">{filePath || "Untitled"}</span>
          <span className="px-1.5 py-0.5 text-[10px] bg-[#191D23] border border-[#262B33] rounded text-[#69717D]">
            {language}
          </span>
          <span className="text-[#69717D]">{lines.length} lines</span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center space-x-1 px-2 py-1 rounded bg-[#191D23] hover:bg-[#1D2229] border border-[#262B33] text-[#A0A7B2] hover:text-[#F1F3F5] transition"
          title="Copy code"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? "Copied" : "Copy"}</span>
        </button>
      </div>

      {/* Code Area */}
      <div className="flex-1 overflow-auto p-2 leading-5 text-[#F1F3F5] selection:bg-[#6C8CFF]/30">
        {lines.length === 0 ? (
          <div className="p-8 text-center text-[#69717D]">No content available</div>
        ) : (
          <table className="w-full border-collapse">
            <tbody>
              {lines.map((line, idx) => {
                const lineNum = idx + 1;
                const isHighlighted =
                  highlightRange &&
                  lineNum >= highlightRange[0] &&
                  lineNum <= highlightRange[1];

                return (
                  <tr
                    key={lineNum}
                    className={`transition-colors ${
                      isHighlighted ? "bg-[#6C8CFF]/15 border-l-2 border-[#6C8CFF]" : "hover:bg-[#14171C]/50"
                    }`}
                  >
                    <td className="w-12 pr-4 text-right select-none text-[#69717D] font-mono text-[11px]">
                      {lineNum}
                    </td>
                    <td className="whitespace-pre font-mono pr-4 text-[#F1F3F5]">
                      {line || " "}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
