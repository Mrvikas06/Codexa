import React from "react";
import { Cpu, CheckCircle2, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export const ModelsPage: React.FC = () => {
  const navigate = useNavigate();

  const models = [
    {
      id: "code-encoder",
      name: "Code Encoder",
      version: "v1.0.0",
      status: "Active",
      statusVariant: "success" as const,
      description: "Transformer encoder for code understanding",
      params: "12.4M",
      context: "512",
      arch: "6 layers · 4 heads · 256 dim · RoPE",
      metrics: [
        { label: "Recall@5", value: "0.923" },
        { label: "Recall@10", value: "0.957" },
        { label: "MRR", value: "0.891" },
      ],
      features: [
        "Rotary Position Embeddings (RoPE)",
        "Byte-Level BPE Tokenizer (16k vocab)",
        "Mean Pooling & Dense Projection Head",
      ],
    },
    {
      id: "reranker",
      name: "Reranker",
      version: "v1.0.0",
      status: "Ready",
      statusVariant: "accent" as const,
      description: "Trained cross-encoder for result reranking",
      params: "6.2M",
      context: "512",
      arch: "6 layers · 4 heads · 256 dim · Margin Loss",
      metrics: [
        { label: "NDCG@5", value: "0.912" },
        { label: "Precision@5", value: "0.940" },
        { label: "MRR", value: "0.875" },
      ],
      features: [
        "Pairwise Margin Loss (m=0.2)",
        "Hard-negative mined candidates",
        "Joint <query><SEP><code> cross-attention",
      ],
    },
    {
      id: "mini-decoder",
      name: "Mini-Decoder",
      version: "v0.9.0",
      status: "Evaluation",
      statusVariant: "warning" as const,
      description: "Domain-specific code generation model",
      params: "18.7M",
      context: "512",
      arch: "6 layers · 4 heads · 256 dim · SwiGLU",
      metrics: [
        { label: "Citation Prec.", value: "1.000" },
        { label: "Citation Rec.", value: "0.965" },
        { label: "Grounding F1", value: "0.985" },
      ],
      features: [
        "RMSNorm & SwiGLU Activation",
        "Weight Tying (Head & Embeddings)",
        "Strict Citation Verification Pipeline",
      ],
    },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-3.25rem)] bg-[#F7F8FC] text-neutral-900 overflow-y-auto">
      {/* Top Header */}
      <div className="h-14 border-b border-neutral-200 bg-white px-6 flex items-center justify-between shrink-0 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-primary" />
            <span className="font-semibold text-sm text-neutral-900">Models</span>
          </div>

          <span className="text-neutral-300">/</span>

          <span className="text-xs font-mono font-medium text-neutral-600">
            Custom-Trained Neural Checkpoints
          </span>
        </div>

        <Button
          size="sm"
          variant="primary"
          leftIcon={<Zap className="w-3.5 h-3.5" />}
          onClick={() => navigate("/evaluation")}
        >
          View Evaluations
        </Button>
      </div>

      <div className="p-8 max-w-7xl mx-auto w-full space-y-6">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-neutral-900">
            Trained From Scratch Architecture
          </h2>
          <p className="text-xs text-neutral-500 mt-1">
            Codexa trains three specialized models directly on code tokenizers and AST evidence
            without third-party proprietary weights.
          </p>
        </div>

        {/* 3 Model Cards matching Panel 09 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {models.map((m) => (
            <Card
              key={m.id}
              className="p-6 bg-white border-neutral-200 shadow-card flex flex-col justify-between hover:border-violet-200 hover:shadow-card-hover transition-all"
            >
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-base text-neutral-900 font-mono">{m.name}</h3>
                      <span className="text-xs font-mono text-neutral-400">{m.version}</span>
                    </div>
                    <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
                      {m.description}
                    </p>
                  </div>
                  <Badge variant={m.statusVariant} size="sm" dot>
                    {m.status}
                  </Badge>
                </div>

                {/* Specs Box */}
                <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-100 font-mono text-xs space-y-1.5">
                  <div className="flex items-center justify-between text-neutral-600">
                    <span className="text-[11px] text-neutral-400 font-sans">Parameters:</span>
                    <span className="font-bold text-neutral-900">{m.params}</span>
                  </div>
                  <div className="flex items-center justify-between text-neutral-600">
                    <span className="text-[11px] text-neutral-400 font-sans">Context Window:</span>
                    <span className="font-bold text-neutral-900">{m.context} tokens</span>
                  </div>
                  <div className="flex items-center justify-between text-neutral-600">
                    <span className="text-[11px] text-neutral-400 font-sans">Architecture:</span>
                    <span className="text-[11px] text-primary">{m.arch}</span>
                  </div>
                </div>

                {/* Architecture Highlights */}
                <div className="space-y-1.5">
                  <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider font-mono">
                    Technical Specifications
                  </div>
                  {m.features.map((feat, fIdx) => (
                    <div
                      key={fIdx}
                      className="flex items-center gap-2 text-xs text-neutral-600"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Benchmark Metrics Footer */}
              <div className="pt-4 border-t border-neutral-100 mt-5 space-y-2">
                <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider font-mono">
                  Benchmark Metrics
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  {m.metrics.map((met, idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded-lg bg-neutral-50 border border-neutral-100"
                    >
                      <div className="text-[10px] text-neutral-400 font-mono">{met.label}</div>
                      <div className="text-xs font-bold font-mono text-primary mt-0.5">
                        {met.value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};
