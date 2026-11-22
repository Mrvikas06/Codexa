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
    <div className="flex flex-col h-[calc(100vh-3.25rem)] bg-[#F7F8FC] text-neutral-900 overflow-y-auto">
      {/* Top Header */}
      <div className="h-14 border-b border-neutral-200 bg-white px-6 flex items-center justify-between shrink-0 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-primary" />
            <span className="font-semibold text-sm text-neutral-900">Datasets</span>
          </div>

          <span className="text-neutral-300">/</span>

          <span className="text-xs font-mono font-medium text-neutral-600">
            Training & Benchmark Corpora
          </span>
        </div>

        <Badge variant="accent" size="sm">
          VERSIONED DATASETS
        </Badge>
      </div>

      <div className="p-8 max-w-7xl mx-auto w-full space-y-6">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-neutral-900">
            Machine Learning Corpora
          </h2>
          <p className="text-xs text-neutral-500 mt-1">
            Pre-tokenized training datasets and evaluation benchmarks with exact line boundaries.
          </p>
        </div>

        <div className="space-y-4">
          {datasets.map((d, idx) => (
            <Card
              key={idx}
              className="p-5 bg-white border-neutral-200 shadow-card flex items-center justify-between hover:border-violet-200 hover:shadow-card-hover transition-all"
            >
              <div className="flex items-center gap-3.5">
                <div className="p-2.5 rounded-xl bg-violet-50 text-primary border border-violet-100">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-neutral-900 font-mono">{d.name}</div>
                  <div className="text-xs text-neutral-500 mt-0.5">{d.purpose}</div>
                </div>
              </div>

              <div className="flex items-center gap-4 font-mono text-xs">
                <span className="text-neutral-600 font-semibold">{d.size}</span>
                <Badge variant="accent" size="sm">
                  {d.type}
                </Badge>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};
