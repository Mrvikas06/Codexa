import React from "react";
import { Activity, Clock } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export const ActivityPage: React.FC = () => {
  const events = [
    {
      time: "Just now",
      action: "Hybrid Search Executed",
      detail: "Query: 'validate_token' across 5 retrieval engines",
      type: "search",
    },
    {
      time: "2m ago",
      action: "Grounded Answer Generated",
      detail: "100% verified citations for authentication flow",
      type: "gen",
    },
    {
      time: "15m ago",
      action: "Repository Ingested",
      detail: "Indexed 18 Python source files and 42 symbols",
      type: "ingest",
    },
    {
      time: "1h ago",
      action: "Neural Reranker Evaluated",
      detail: "MRR: 0.891, NDCG@10: 0.939 exceeding benchmark threshold",
      type: "eval",
    },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-3.25rem)] bg-[#F7F8FC] text-neutral-900 overflow-y-auto">
      {/* Top Header */}
      <div className="h-14 border-b border-neutral-200 bg-white px-6 flex items-center justify-between shrink-0 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            <span className="font-semibold text-sm text-neutral-900">Activity</span>
          </div>

          <span className="text-neutral-300">/</span>

          <span className="text-xs font-mono font-medium text-neutral-600">
            Real-Time Audit Stream
          </span>
        </div>

        <Badge variant="success" size="sm" dot>
          LIVE FEED
        </Badge>
      </div>

      <div className="p-8 max-w-7xl mx-auto w-full space-y-6">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-neutral-900">
            System Activity Log
          </h2>
          <p className="text-xs text-neutral-500 mt-1">
            Real-time events from the ingestion pipeline, ML inference, and user inquiries.
          </p>
        </div>

        <div className="space-y-3 font-mono text-xs">
          {events.map((ev, idx) => (
            <Card
              key={idx}
              className="p-4 bg-white border-neutral-200 shadow-card flex items-center justify-between hover:border-neutral-300 transition-colors"
            >
              <div className="flex items-center gap-3.5">
                <div className="p-2 rounded-lg bg-neutral-100 text-neutral-600 shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div className="space-y-0.5">
                  <span className="font-semibold text-neutral-900 font-sans text-xs">
                    {ev.action}
                  </span>
                  <p className="text-[11px] text-neutral-500 font-mono">{ev.detail}</p>
                </div>
              </div>
              <span className="text-[10px] text-neutral-400 font-mono">{ev.time}</span>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};
