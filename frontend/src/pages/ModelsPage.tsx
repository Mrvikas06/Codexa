import React from "react";
import { Cpu, CheckCircle2 } from "lucide-react";

export const ModelsPage: React.FC = () => {
  const models = [
    {
      name: "Model A: Code Encoder",
      type: "Transformer Encoder",
      purpose: "Code & Text Embeddings via Contrastive Learning (InfoNCE)",
      layers: 6,
      heads: 4,
      hidden: 256,
      intermediate: 1024,
      params: "12.4M",
      status: "READY",
      features: ["RoPE Positional Embeddings", "Byte-Level BPE Tokenizer (16k)", "Mean Pooling Head"],
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
      features: ["Pairwise Margin Loss", "Pointwise BCE", "Joint <query><SEP><code> encoding"],
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
      features: ["RMSNorm", "SwiGLU Activation", "Weight Tying (Head & Embeddings)", "Strict Citation Verification"],
      metrics: [
        { label: "Citation Precision", value: "1.000" },
        { label: "Citation Recall", value: "1.000" },
        { label: "Grounding F1", value: "1.000" },
      ],
    },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-[#0B0D10] text-[#F1F3F5] overflow-auto p-6 space-y-6">
      {/* Header */}
      <div className="border-b border-[#262B33] pb-4 space-y-1">
        <h1 className="text-lg font-semibold tracking-tight flex items-center space-x-2">
          <Cpu className="w-5 h-5 text-[#6C8CFF]" />
          <span>Neural Models & Training Benchmarks</span>
        </h1>
        <p className="text-xs text-[#A0A7B2]">
          Real neural models trained from random initialization. No third-party LLM API wrappers.
        </p>
      </div>

      {/* Model Cards Grid */}
      <div className="grid grid-cols-3 gap-6">
        {models.map((m, idx) => (
          <div
            key={idx}
            className="p-5 bg-[#14171C] border border-[#262B33] rounded-xl space-y-4 font-mono text-xs"
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-sm text-[#F1F3F5] font-sans">{m.name}</span>
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                {m.status}
              </span>
            </div>

            <p className="text-xs text-[#A0A7B2] font-sans">{m.purpose}</p>

            <div className="grid grid-cols-2 gap-2 text-[11px] p-3 bg-[#0E1014] rounded-lg border border-[#262B33] text-[#A0A7B2]">
              <div>Layers: <span className="text-[#F1F3F5]">{m.layers}</span></div>
              <div>Heads: <span className="text-[#F1F3F5]">{m.heads}</span></div>
              <div>Hidden: <span className="text-[#F1F3F5]">{m.hidden}</span></div>
              <div>Intermediate: <span className="text-[#F1F3F5]">{m.intermediate}</span></div>
            </div>

            {/* Architecture Features */}
            <div className="space-y-1.5 font-sans">
              <div className="text-[10px] font-semibold text-[#69717D] uppercase tracking-wider">
                Architecture Specs
              </div>
              {m.features.map((feat, fIdx) => (
                <div key={fIdx} className="flex items-center space-x-1.5 text-xs text-[#A0A7B2]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#6C8CFF] shrink-0" />
                  <span>{feat}</span>
                </div>
              ))}
            </div>

            {/* Benchmark Scores */}
            <div className="pt-2 border-t border-[#262B33] space-y-2">
              <div className="text-[10px] font-semibold text-[#69717D] uppercase tracking-wider font-sans">
                Evaluation Benchmark Metrics
              </div>
              <div className="grid grid-cols-3 gap-2">
                {m.metrics.map((met, metIdx) => (
                  <div
                    key={metIdx}
                    className="p-2 bg-[#0E1014] border border-[#262B33] rounded text-center space-y-0.5"
                  >
                    <div className="text-[9px] text-[#69717D]">{met.label}</div>
                    <div className="text-xs font-bold text-emerald-400">{met.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
