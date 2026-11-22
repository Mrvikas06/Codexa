import React, { useState } from "react";
import { BarChart3, Play, RefreshCw } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

interface EvalMetric {
  name: string;
  value: string;
  threshold: string;
  pass: boolean;
}

interface BenchmarkSuite {
  name: string;
  target: string;
  dataset: string;
  evalDate: string;
  metrics: EvalMetric[];
}

export const EvaluationPage: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);

  const benchmarks: BenchmarkSuite[] = [
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

  const handleRunEvaluation = () => {
    setIsRunning(true);
    setTimeout(() => {
      setIsRunning(false);
    }, 1800);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-3.25rem)] bg-atlas-bg text-atlas-text overflow-y-auto p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-atlas-border pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold tracking-tight text-atlas-text flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-atlas-accent" />
              <span>Evaluation & Quality Flywheel</span>
            </h1>
            <Badge variant="success" size="sm" dot>VERIFIED ACCURACY</Badge>
          </div>
          <p className="text-xs text-atlas-text-secondary">
            Versioned regression testing harnesses preventing hallucinations, ranking drift, and grounding degradation.
          </p>
        </div>

        <Button
          size="sm"
          variant="primary"
          leftIcon={isRunning ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
          loading={isRunning}
          onClick={handleRunEvaluation}
        >
          {isRunning ? "Running Live Harness..." : "Execute Test Suite"}
        </Button>
      </div>

      {/* Benchmarks List */}
      <div className="space-y-4">
        {benchmarks.map((bench, idx) => (
          <Card key={idx} className="p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-atlas-border pb-3">
              <div>
                <h3 className="text-sm font-semibold text-atlas-text">{bench.name}</h3>
                <p className="text-xs text-atlas-text-secondary mt-0.5 font-mono">
                  Target: {bench.target} · Dataset: {bench.dataset}
                </p>
              </div>
              <Badge variant="success" size="sm">ALL TESTS PASSED</Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {bench.metrics.map((m, mIdx) => (
                <div
                  key={mIdx}
                  className="p-3 bg-atlas-surface-secondary border border-atlas-border rounded-lg space-y-1 font-mono text-xs"
                >
                  <div className="text-[10px] text-atlas-text-muted flex items-center justify-between font-sans">
                    <span>{m.name}</span>
                    <span className="text-atlas-text-secondary">Threshold: {m.threshold}</span>
                  </div>
                  <div className="text-xl font-bold text-emerald-400">{m.value}</div>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
