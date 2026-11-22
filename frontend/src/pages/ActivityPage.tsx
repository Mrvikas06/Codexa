import React from "react";
import { Activity, Clock } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export const ActivityPage: React.FC = () => {
  const events = [
    {
      time: "Just now",
      action: "Hybrid Search Executed",
      user: "system",
      detail: "Query: 'validate_token' across 5 retrieval engines",
      type: "search",
    },
    {
      time: "2m ago",
      action: "Grounded Answer Generated",
      user: "system",
      detail: "100% verified citations for authentication flow",
      type: "gen",
    },
    {
      time: "15m ago",
      action: "Repository Ingested",
      user: "system",
      detail: "Indexed 18 Python source files and 42 symbols",
      type: "ingest",
    },
    {
      time: "1h ago",
      action: "Neural Reranker Evaluated",
      user: "system",
      detail: "MRR: 0.556, NDCG@5: 0.667 exceeding threshold",
      type: "eval",
    },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-3.25rem)] bg-atlas-bg text-atlas-text overflow-y-auto p-8 space-y-6 max-w-7xl mx-auto">
      <div className="border-b border-atlas-border pb-5">
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-2xl font-bold tracking-tight text-atlas-text flex items-center gap-2">
            <Activity className="w-6 h-6 text-atlas-accent" />
            <span>System Activity & Audit Stream</span>
          </h1>
          <Badge variant="accent" size="sm">LIVE FEED</Badge>
        </div>
        <p className="text-xs text-atlas-text-secondary">
          Real-time activity log of indexing tasks, model queries, and audit events.
        </p>
      </div>

      <div className="space-y-3 font-mono text-xs">
        {events.map((ev, idx) => (
          <Card key={idx} className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="p-2 rounded bg-atlas-surface-secondary border border-atlas-border text-atlas-accent shrink-0">
                <Clock className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <span className="font-semibold text-atlas-text font-sans text-xs">{ev.action}</span>
                <p className="text-[11px] text-atlas-text-muted font-mono">{ev.detail}</p>
              </div>
            </div>
            <span className="text-[10px] text-atlas-text-muted font-mono">{ev.time}</span>
          </Card>
        ))}
      </div>
    </div>
  );
};
