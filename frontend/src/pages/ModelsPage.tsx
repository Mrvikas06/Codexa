import React from "react";
import { Cpu, CheckCircle2, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export const ModelsPage: React.FC = () => {
  const models = [
    {
      name: "Model A: Code Encoder",
      type: "Transformer Encoder",
      purpose: "Code & Text Embeddings via Contrastive Learning (InfoNCE + MLM)",
      layers: 6,
      heads: 4,
      hidden: 256,
      intermediate: 1024,
      params: "12.4M",
      status: "READY",
      features: [
        "Rotary Position Embeddings (RoPE)",
        "Byte-Level BPE Tokenizer (16k vocab)",
        "Mean Pooling & Dense Projection Head",
      ],
      metrics: [
        { label: "Recall@5", value: "1.000" },
        { label: "Recall@10", value: "1.000" },
        { label: "MRR", value: "0.640" },
      ],
    },
    {
      name: "Model B: Neural Reranker",
      type: "Cross-Encoder",
      purpose: "Neural candidate reranking with hard-negative mining",
      layers: 6,
      heads: 4,
      hidden: 256,
      intermediate: 1024,
      params: "12.4M",
      status: "READY",
      features: [
        "Pairwise Margin Loss (m=0.2)",
        "Pointwise Binary Cross-Entropy",
        "Joint <query><SEP><code> Cross-Attention",
      ],
      metrics: [
        { label: "MRR", value: "0.556" },
        { label: "NDCG@5", value: "0.667" },
        { label: "Precision@5", value: "1.000" },
      ],
    },
    {
      name: "Model C: Causal Decoder LM",
      type: "Causal Transformer",
      purpose: "Evidence-grounded code intelligence answer generation",
      layers: 6,
      heads: 4,
      hidden: 256,
      intermediate: 1024,
      params: "12.4M",
      status: "READY",
      features: [
        "RMSNorm & SwiGLU Activation",
        "Weight Tying (Head & Embeddings)",
        "Strict Citation Verification Pipeline",
      ],
      metrics: [
        { label: "Citation Prec.", value: "1.000" },
        { label: "Citation Rec.", value: "1.000" },
        { label: "Grounding F1", value: "1.000" },
      ],
    },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-3.25rem)] bg-atlas-bg text-atlas-text overflow-y-auto p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-atlas-border pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold tracking-tight text-atlas-text flex items-center gap-2">
              <Cpu className="w-6 h-6 text-atlas-accent" />
              <span>Neural Models & Benchmarks</span>
            </h1>
            <Badge variant="accent" size="sm">TRAINED FROM SCRATCH</Badge>
          </div>
          <p className="text-xs text-atlas-text-secondary">
            Custom-trained neural models initialized with random weights and trained directly on repository code.
          </p>
        </div>

        <Link to="/evaluation">
          <Button size="sm" variant="secondary" leftIcon={<Zap className="w-3.5 h-3.5 text-atlas-accent" />}>
            Run Full Evaluation Suite
          </Button>
        </Link>
      </div>

      {/* Model Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {models.map((m, idx) => (
          <Card
            key={idx}
            className="p-5 space-y-4 font-mono text-xs flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-atlas-text font-sans">{m.name}</span>
                <Badge variant="success" size="sm" dot>
                  {m.status}
                </Badge>
              </div>

              <p className="text-xs text-atlas-text-secondary font-sans leading-relaxed">
                {m.purpose}
              </p>

              <div className="grid grid-cols-2 gap-2 text-[11px] p-3 bg-atlas-surface-secondary rounded-lg border border-atlas-border text-atlas-text-muted">
                <div>Layers: <span className="text-atlas-text font-semibold">{m.layers}</span></div>
                <div>Heads: <span className="text-atlas-text font-semibold">{m.heads}</span></div>
                <div>Hidden: <span className="text-atlas-text font-semibold">{m.hidden}</span></div>
                <div>Interm.: <span className="text-atlas-text font-semibold">{m.intermediate}</span></div>
              </div>

              {/* Architecture Features */}
              <div className="space-y-1.5 font-sans">
                <div className="text-[10px] font-semibold text-atlas-text-muted uppercase tracking-wider font-mono">
                  Architecture Specifications
                </div>
                {m.features.map((feat, fIdx) => (
                  <div key={fIdx} className="flex items-center gap-2 text-xs text-atlas-text-secondary">
                    <CheckCircle2 className="w-3.5 h-3.5 text-atlas-accent shrink-0" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Benchmark Scores */}
            <div className="pt-3 border-t border-atlas-border space-y-2 mt-2">
              <div className="text-[10px] font-semibold text-atlas-text-muted uppercase tracking-wider font-mono">
                Evaluation Benchmarks
              </div>
              <div className="grid grid-cols-3 gap-2">
                {m.metrics.map((met, metIdx) => (
                  <div
                    key={metIdx}
                    className="p-2 bg-atlas-surface-secondary border border-atlas-border rounded text-center space-y-0.5"
                  >
                    <div className="text-[9px] text-atlas-text-muted">{met.label}</div>
                    <div className="text-xs font-bold text-emerald-400 font-mono">{met.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
