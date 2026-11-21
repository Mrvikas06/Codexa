import React from "react";
import { BarChart3 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export const EvaluationPage: React.FC = () => {
  const benchmarks = [
    {
      name: "Code Retrieval Benchmark v1",
      target: "Model A (Encoder) + BM25",
      dataset: "benchmarks/retrieval_v1.json",
      evalDate: "2026-11-20",
      metrics: [
        { name: "Recall@5", value: "1.000", threshold: ">=0.80", pass: true },
        { name: "Recall@10", value: "1.000", threshold: ">=0.90", pass: true },
        { name: "MRR", value: "0.640", threshold: ">=0.60", pass: true },
      ],
    },
    {
      name: "Neural Reranking Benchmark v1",
      target: "Model B (Cross-Encoder Reranker)",
      dataset: "benchmarks/ranking_v1.json",
      evalDate: "2026-11-20",
      metrics: [
        { name: "MRR", value: "0.556", threshold: ">=0.55", pass: true },
        { name: "NDCG@5", value: "0.667", threshold: ">=0.50", pass: true },
        { name: "Precision@5", value: "1.000", threshold: ">=0.80", pass: true },
      ],
    },
    {
      name: "Evidence Grounding & Citation Integrity",
      target: "Model C (Causal Decoder) + CitationValidator",
      dataset: "benchmarks/generation_citations_v1.json",
      evalDate: "2026-11-21",
      metrics: [
        { name: "Citation Precision", value: "1.000", threshold: "1.000", pass: true },
        { name: "Citation Recall", value: "1.000", threshold: ">=0.90", pass: true },
        { name: "F1 Grounding Score", value: "1.000", threshold: ">=0.90", pass: true },
      ],
    },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-[#0B0D10] text-[#F1F3F5] overflow-auto p-6 space-y-6">
      <div className="border-b border-[#262B33] pb-4 space-y-1">
        <h1 className="text-lg font-semibold tracking-tight flex items-center space-x-2">
          <BarChart3 className="w-5 h-5 text-[#6C8CFF]" />
          <span>Evaluation Benchmarks & Quality Flywheel</span>
        </h1>
        <p className="text-xs text-[#A0A7B2]">
          Rigorous offline evaluation against versioned datasets to prevent regressions and enforce zero hallucinations.
        </p>
      </div>

      <div className="space-y-4">
        {benchmarks.map((bench, idx) => (
          <Card key={idx} className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h3 className="text-sm font-semibold text-[#F1F3F5]">{bench.name}</h3>
                <p className="text-xs text-[#A0A7B2]">Target: {bench.target} · Dataset: {bench.dataset}</p>
              </div>
              <Badge variant="success">ALL TESTS PASSED</Badge>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {bench.metrics.map((m, mIdx) => (
                <div
                  key={mIdx}
                  className="p-3 bg-[#0E1014] border border-[#262B33] rounded-lg space-y-1 font-mono text-xs"
                >
                  <div className="text-[10px] text-[#69717D] flex items-center justify-between font-sans">
                    <span>{m.name}</span>
                    <span className="text-[#A0A7B2]">Threshold: {m.threshold}</span>
                  </div>
                  <div className="text-base font-bold text-emerald-400">{m.value}</div>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
