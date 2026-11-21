import React from "react";
import { Activity, Clock } from "lucide-react";
import { Card } from "@/components/ui/Card";

export const ActivityPage: React.FC = () => {
  const events = [
    { time: "Just now", action: "Hybrid Search Executed", user: "system", detail: "Query: 'validate_token' across 5 retrieval engines" },
    { time: "2m ago", action: "Grounded Answer Generated", user: "system", detail: "100% verified citations for authentication flow" },
    { time: "15m ago", action: "Repository Ingested", user: "system", detail: "Indexed 18 Python source files and 42 symbols" },
    { time: "1h ago", action: "Neural Reranker Evaluated", user: "system", detail: "MRR: 0.556, NDCG@5: 0.667 exceeding threshold" },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-[#0B0D10] text-[#F1F3F5] overflow-auto p-6 space-y-6">
      <div className="border-b border-[#262B33] pb-4 space-y-1">
        <h1 className="text-lg font-semibold tracking-tight flex items-center space-x-2">
          <Activity className="w-5 h-5 text-[#6C8CFF]" />
          <span>System Activity & Audit Stream</span>
        </h1>
        <p className="text-xs text-[#A0A7B2]">
          Real-time activity log of indexing tasks, model queries, and audit events.
        </p>
      </div>

      <div className="space-y-3 font-mono text-xs">
        {events.map((ev, idx) => (
          <Card key={idx} className="flex items-center justify-between p-3.5">
            <div className="flex items-center space-x-3">
              <Clock className="w-4 h-4 text-[#69717D]" />
              <div className="space-y-0.5">
                <span className="font-semibold text-[#F1F3F5] font-sans">{ev.action}</span>
                <p className="text-[11px] text-[#A0A7B2] font-mono">{ev.detail}</p>
              </div>
            </div>
            <span className="text-[10px] text-[#69717D]">{ev.time}</span>
          </Card>
        ))}
      </div>
    </div>
  );
};
