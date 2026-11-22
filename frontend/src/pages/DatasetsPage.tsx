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
      purpose: "Trains Model A Code Encoder embeddings with InfoNCE contrastive loss",
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
    <div className="flex flex-col h-[calc(100vh-3.25rem)] bg-atlas-bg text-atlas-text overflow-y-auto p-8 space-y-6 max-w-7xl mx-auto">
      <div className="border-b border-atlas-border pb-5">
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-2xl font-bold tracking-tight text-atlas-text flex items-center gap-2">
            <Database className="w-6 h-6 text-atlas-accent" />
            <span>Training & Benchmark Datasets</span>
          </h1>
          <Badge variant="accent" size="sm">VERSIONED REPOSITORIES</Badge>
        </div>
        <p className="text-xs text-atlas-text-secondary">
          Versioned code corpora used for pre-training, fine-tuning, and offline evaluation.
        </p>
      </div>

      <div className="space-y-4">
        {datasets.map((d, idx) => (
          <Card key={idx} className="p-5 flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="p-2 rounded bg-atlas-surface-secondary border border-atlas-border text-atlas-accent">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-semibold text-atlas-text font-mono">{d.name}</div>
                <div className="text-xs text-atlas-text-secondary mt-0.5">{d.purpose}</div>
              </div>
            </div>

            <div className="flex items-center gap-4 font-mono text-xs text-atlas-text-muted">
              <span>{d.size}</span>
              <Badge variant="accent" size="sm">{d.type}</Badge>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
