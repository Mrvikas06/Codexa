import React, { useState } from "react";
import { BarChart3, Play, RefreshCw } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export const EvaluationPage: React.FC = () => {
  const [selectedModel, setSelectedModel] = useState("Code Encoder (v1.0.0)");
  const [isRunning, setIsRunning] = useState(false);

  const metrics = [
    { label: "Recall@5", value: "0.923", target: ">= 0.85" },
    { label: "Recall@10", value: "0.957", target: ">= 0.90" },
    { label: "MRR", value: "0.891", target: ">= 0.75" },
    { label: "NDCG@10", value: "0.939", target: ">= 0.80" },
  ];

  const queryPerformance = [
    { type: "Symbol Search", score: 0.96, label: "0.96" },
    { type: "Semantic Search", score: 0.92, label: "0.92" },
    { type: "Bug Investigation", score: 0.87, label: "0.87" },
    { type: "Architecture", score: 0.89, label: "0.89" },
  ];

  const handleRunEvaluation = () => {
    setIsRunning(true);
    setTimeout(() => {
      setIsRunning(false);
    }, 1500);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-3.25rem)] bg-[#F7F8FC] text-neutral-900 overflow-y-auto">
      {/* Top Header */}
      <div className="h-14 border-b border-neutral-200 bg-white px-6 flex items-center justify-between shrink-0 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            <span className="font-semibold text-sm text-neutral-900">Evaluation</span>
          </div>

          <span className="text-neutral-300">/</span>

          <span className="text-xs font-mono font-medium text-neutral-600">
            Retrieval & Ranking Benchmarks
          </span>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="bg-neutral-50 border border-neutral-200 text-xs text-neutral-800 rounded-lg px-3 py-1.5 font-mono focus:outline-none focus:border-primary cursor-pointer"
          >
            <option value="Code Encoder (v1.0.0)">Code Encoder (v1.0.0)</option>
            <option value="Neural Reranker (v1.0.0)">Neural Reranker (v1.0.0)</option>
            <option value="Mini-Decoder (v0.9.0)">Mini-Decoder (v0.9.0)</option>
          </select>

          <Button
            size="sm"
            variant="primary"
            leftIcon={
              isRunning ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Play className="w-3.5 h-3.5" />
              )
            }
            loading={isRunning}
            onClick={handleRunEvaluation}
          >
            {isRunning ? "Running Suite..." : "Run Evaluation"}
          </Button>
        </div>
      </div>

      <div className="p-8 max-w-7xl mx-auto w-full space-y-6">
        {/* Model Card Header with 4 top metrics matching Panel 11 */}
        <Card className="p-6 bg-white border-neutral-200 shadow-card space-y-6">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider font-mono">
                  Model
                </span>
                <span className="font-bold text-base text-neutral-900 font-mono">
                  {selectedModel}
                </span>
              </div>
              <p className="text-xs text-neutral-500 mt-1">
                Evaluated against 1,200 curated code retrieval query pairs across 18 public
                repositories.
              </p>
            </div>
            <Badge variant="success" size="sm" dot>
              PRODUCTION VERIFIED
            </Badge>
          </div>

          {/* 4 Score Cards in a row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {metrics.map((m, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-neutral-50/70 border border-neutral-200/80 font-mono"
              >
                <div className="text-[11px] text-neutral-500 font-sans">{m.label}</div>
                <div className="text-2xl font-bold text-neutral-900 mt-1">{m.value}</div>
                <div className="text-[10px] text-emerald-600 mt-1 font-sans">
                  Target: {m.target}
                </div>
              </div>
            ))}
          </div>

          {/* Performance by Query Type matching Panel 11 */}
          <div className="space-y-4 pt-2">
            <h4 className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
              Performance by Query Type
            </h4>

            <div className="space-y-3 font-mono text-xs">
              {queryPerformance.map((item, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-700 font-sans font-medium">{item.type}</span>
                    <span className="font-bold text-neutral-900">{item.label}</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-neutral-100 overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-500"
                      style={{ width: `${item.score * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
