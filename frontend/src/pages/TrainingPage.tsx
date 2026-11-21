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
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-[#0B0D10] text-[#F1F3F5] overflow-auto p-6 space-y-6">
      <div className="border-b border-[#262B33] pb-4 space-y-1">
        <h1 className="text-lg font-semibold tracking-tight flex items-center space-x-2">
          <Terminal className="w-5 h-5 text-[#6C8CFF]" />
          <span>Neural Training Runs & Checkpoints</span>
        </h1>
        <p className="text-xs text-[#A0A7B2]">
          Monitor PyTorch training loops, loss convergence, AdamW parameters, and hardware telemetry.
        </p>
      </div>

      <div className="space-y-4">
        {trainingRuns.map((run) => (
          <Card key={run.id} className="space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-sm text-[#F1F3F5] font-sans">{run.model}</span>
                <span className="text-[10px] text-[#69717D]">[{run.id}]</span>
              </div>
              <Badge variant="success">{run.status}</Badge>
            </div>

            <div className="grid grid-cols-4 gap-3 p-3 bg-[#0E1014] rounded-lg border border-[#262B33] text-[11px] text-[#A0A7B2]">
              <div>Final Loss: <span className="text-emerald-400 font-bold">{run.loss}</span></div>
              <div>Epochs: <span className="text-[#F1F3F5]">{run.epochs}</span></div>
              <div>Device: <span className="text-[#6C8CFF]">{run.device}</span></div>
              <div>Duration: <span className="text-[#F1F3F5]">{run.duration}</span></div>
            </div>

            <div className="text-[10px] text-[#69717D] flex items-center justify-between font-sans">
              <span>{run.optimizer} · {run.schedule}</span>
              <span>Dataset: {run.dataset}</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
