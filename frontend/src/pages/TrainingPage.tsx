import React from "react";
import { Terminal } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export const TrainingPage: React.FC = () => {
  const trainingRuns = [
    {
      id: "run-enc-01",
      model: "Model A (Code Encoder)",
      dataset: "codexa-corpus-v1",
      epochs: 10,
      loss: "0.241",
      optimizer: "AdamW (lr=5e-4, wd=0.01)",
      schedule: "Cosine with Warmup (100 steps)",
      status: "COMPLETED",
      device: "cuda:0 (NVIDIA RTX 3050 Laptop)",
      duration: "4m 12s",
    },
    {
      id: "run-rerank-01",
      model: "Model B (Cross-Encoder Reranker)",
      dataset: "ranking-hard-negatives-v1",
      epochs: 8,
      loss: "0.188",
      optimizer: "AdamW (lr=3e-4, wd=0.01)",
      schedule: "Cosine with Warmup (50 steps)",
      status: "COMPLETED",
      device: "cuda:0 (NVIDIA RTX 3050 Laptop)",
      duration: "2m 45s",
    },
    {
      id: "run-dec-01",
      model: "Model C (Causal Decoder LM)",
      dataset: "grounded-citations-v1",
      epochs: 5,
      loss: "0.312",
      optimizer: "AdamW (lr=4e-4, wd=0.01)",
      schedule: "Cosine with Warmup (80 steps)",
      status: "COMPLETED",
      device: "cuda:0 (NVIDIA RTX 3050 Laptop)",
      duration: "5m 20s",
    },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-3.25rem)] bg-atlas-bg text-atlas-text overflow-y-auto p-8 space-y-6 max-w-7xl mx-auto">
      <div className="border-b border-atlas-border pb-5">
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-2xl font-bold tracking-tight text-atlas-text flex items-center gap-2">
            <Terminal className="w-6 h-6 text-atlas-accent" />
            <span>Neural Training Runs & Checkpoints</span>
          </h1>
          <Badge variant="accent" size="sm">CHECKPOINTS ACTIVE</Badge>
        </div>
        <p className="text-xs text-atlas-text-secondary">
          Monitor PyTorch training loops, loss convergence, AdamW parameters, and hardware telemetry.
        </p>
      </div>

      <div className="space-y-4">
        {trainingRuns.map((run) => (
          <Card key={run.id} className="p-5 space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-atlas-text font-sans">{run.model}</span>
                <span className="text-[10px] text-atlas-text-muted">[{run.id}]</span>
              </div>
              <Badge variant="success" size="sm" dot>{run.status}</Badge>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-atlas-surface-secondary rounded-lg border border-atlas-border text-[11px] text-atlas-text-muted">
              <div>Final Loss: <span className="text-emerald-400 font-bold">{run.loss}</span></div>
              <div>Epochs: <span className="text-atlas-text font-semibold">{run.epochs}</span></div>
              <div>Device: <span className="text-atlas-accent">{run.device}</span></div>
              <div>Duration: <span className="text-atlas-text font-semibold">{run.duration}</span></div>
            </div>

            <div className="text-[11px] text-atlas-text-muted flex items-center justify-between font-sans pt-1">
              <span>{run.optimizer} · {run.schedule}</span>
              <span className="font-mono text-[10px]">Dataset: {run.dataset}</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
