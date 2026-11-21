import React from "react";
import { Database, FileText } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export const DatasetsPage: React.FC = () => {
  const datasets = [
    {
      name: "codexa-contrastive-corpus",
      type: "Contrastive Pairs",
      size: "16,420 pairs",
      purpose: "Trains Model A Code Encoder embeddings with InfoNCE loss",
      updated: "2026-11-20",
    },
    {
      name: "ranking-hard-negatives",
      type: "Pairwise Ranking",
      size: "8,950 triplets",
      purpose: "Trains Model B Cross-Encoder with BM25/Dense mined hard negatives",
      updated: "2026-11-20",
    },
    {
      name: "grounded-citations-eval",
      type: "Ground Truth Citations",
      size: "1,200 QA pairs",
      purpose: "Validates verifiable citation tags and prevents hallucinations",
      updated: "2026-11-21",
    },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-[#0B0D10] text-[#F1F3F5] overflow-auto p-6 space-y-6">
      <div className="border-b border-[#262B33] pb-4 space-y-1">
        <h1 className="text-lg font-semibold tracking-tight flex items-center space-x-2">
          <Database className="w-5 h-5 text-[#6C8CFF]" />
          <span>Training & Benchmark Datasets</span>
        </h1>
        <p className="text-xs text-[#A0A7B2]">
          Versioned code corpora used for pre-training, fine-tuning, and offline evaluation.
        </p>
      </div>

      <div className="space-y-4">
        {datasets.map((d, idx) => (
          <Card key={idx} className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FileText className="w-5 h-5 text-[#6C8CFF]" />
              <div className="space-y-0.5">
                <div className="text-sm font-semibold text-[#F1F3F5] font-mono">{d.name}</div>
                <div className="text-xs text-[#A0A7B2]">{d.purpose}</div>
              </div>
            </div>

            <div className="flex items-center space-x-4 font-mono text-xs text-[#A0A7B2]">
              <span>{d.size}</span>
              <Badge variant="accent">{d.type}</Badge>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
