import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { GitFork, AlertTriangle, Activity } from "lucide-react";
import { apiGet } from "@/lib/api";

interface Repository {
  id: string;
  name: string;
}

interface GraphNode {
  id: string;
  label: string;
  type: string;
  file_path: string;
  start_line?: number;
  end_line?: number;
}

interface GraphEdge {
  source: string;
  target: string;
  type: string;
}

interface GraphData {
  repository_id: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
  total_nodes: number;
  total_edges: number;
}

interface CycleItem {
  cycle_nodes: string[];
  cycle_labels: string[];
  length: number;
}

interface CyclesData {
  repository_id: string;
  cycles_found: CycleItem[];
  count: number;
}

interface ImpactData {
  target_id: string;
  target_label: string;
  target_type: string;
  upstream_dependents: { id: string; label: string; type: string; file: string }[];
  downstream_dependencies: { id: string; label: string; type: string; file: string }[];
  total_affected_count: number;
  blast_radius_score: number;
  risk_level: string;
}

export const GraphPage: React.FC = () => {
  const [selectedRepoId, setSelectedRepoId] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"graph" | "cycles" | "impact">("graph");

  // 1. Fetch repositories
  const { data: repos = [] } = useQuery<Repository[]>({
    queryKey: ["repositories"],
    queryFn: () => apiGet<Repository[]>("/api/v1/repositories"),
  });

  useEffect(() => {
    if (repos.length > 0 && !selectedRepoId && repos[0]) {
      setSelectedRepoId(repos[0].id);
    }
  }, [repos, selectedRepoId]);

  // 2. Fetch Graph Data
  const { data: graphData } = useQuery<GraphData>({
    queryKey: ["graphData", selectedRepoId],
    queryFn: () => apiGet<GraphData>(`/api/v1/graph/${selectedRepoId}?include_symbols=true`),
    enabled: !!selectedRepoId,
  });

  // 3. Fetch Cycles Data
  const { data: cyclesData } = useQuery<CyclesData>({
    queryKey: ["cyclesData", selectedRepoId],
    queryFn: () => apiGet<CyclesData>(`/api/v1/graph/${selectedRepoId}/cycles`),
    enabled: !!selectedRepoId,
  });

  // 4. Fetch Impact Data for selected node
  const { data: impactData } = useQuery<ImpactData>({
    queryKey: ["impactData", selectedRepoId, selectedNodeId],
    queryFn: () => apiGet<ImpactData>(`/api/v1/graph/${selectedRepoId}/impact/${selectedNodeId}`),
    enabled: !!selectedRepoId && !!selectedNodeId,
  });

  const nodes = graphData?.nodes || [];
  const edges = graphData?.edges || [];

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-[#0B0D10] text-[#F1F3F5] overflow-hidden">
      {/* Top Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-[#262B33] bg-[#0E1014]">
        <div className="flex items-center space-x-3">
          <GitFork className="w-5 h-5 text-[#6C8CFF]" />
          <h1 className="text-lg font-semibold tracking-tight">Code Intelligence Graph</h1>
          <select
            value={selectedRepoId || ""}
            onChange={(e) => {
              setSelectedRepoId(e.target.value);
              setSelectedNodeId(null);
            }}
            className="bg-[#14171C] border border-[#262B33] text-xs text-[#F1F3F5] rounded px-3 py-1.5 focus:outline-none focus:border-[#6C8CFF]"
          >
            {repos.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>

        {/* View Mode Tabs */}
        <div className="flex items-center bg-[#14171C] border border-[#262B33] p-1 rounded-lg space-x-1">
          <button
            onClick={() => setViewMode("graph")}
            className={`px-3 py-1 rounded text-xs transition ${
              viewMode === "graph"
                ? "bg-[#6C8CFF] text-white font-medium"
                : "text-[#A0A7B2] hover:text-[#F1F3F5]"
            }`}
          >
            Topology ({nodes.length})
          </button>
          <button
            onClick={() => setViewMode("cycles")}
            className={`px-3 py-1 rounded text-xs transition flex items-center space-x-1 ${
              viewMode === "cycles"
                ? "bg-[#6C8CFF] text-white font-medium"
                : "text-[#A0A7B2] hover:text-[#F1F3F5]"
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span>Cycles ({cyclesData?.count || 0})</span>
          </button>
          <button
            onClick={() => setViewMode("impact")}
            className={`px-3 py-1 rounded text-xs transition ${
              viewMode === "impact"
                ? "bg-[#6C8CFF] text-white font-medium"
                : "text-[#A0A7B2] hover:text-[#F1F3F5]"
            }`}
          >
            Blast Radius
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Graph Display Area */}
        <div className="flex-1 p-6 overflow-auto bg-[#0B0D10] flex flex-col">
          {viewMode === "cycles" ? (
            <div className="max-w-4xl w-full mx-auto space-y-4">
              <div className="p-4 bg-[#14171C] border border-[#262B33] rounded-xl space-y-2">
                <h2 className="text-sm font-semibold flex items-center space-x-2 text-amber-400">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Circular Dependencies Detected ({cyclesData?.count || 0})</span>
                </h2>
                <p className="text-xs text-[#A0A7B2]">
                  Circular import dependencies create tight coupling, hinder tree-shaking, and introduce initialization bugs.
                </p>
              </div>

              {cyclesData?.cycles_found.length === 0 ? (
                <div className="p-12 text-center text-xs text-emerald-400 bg-[#14171C] border border-[#262B33] rounded-xl">
                  ✓ No circular dependencies detected in this codebase.
                </div>
              ) : (
                cyclesData?.cycles_found.map((cycle, idx) => (
                  <div
                    key={idx}
                    className="p-4 bg-[#14171C] border border-amber-500/30 rounded-xl space-y-2 font-mono text-xs"
                  >
                    <div className="text-[11px] font-semibold text-amber-400">
                      Cycle #{idx + 1} (Length: {cycle.length})
                    </div>
                    <div className="flex items-center space-x-2 flex-wrap text-[#F1F3F5]">
                      {cycle.cycle_labels.map((label, lIdx) => (
                        <React.Fragment key={lIdx}>
                          <span className="px-2 py-1 bg-[#191D23] border border-[#262B33] rounded">
                            {label}
                          </span>
                          {lIdx < cycle.cycle_labels.length - 1 && (
                            <span className="text-amber-400 font-bold">→</span>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col space-y-4">
              {/* Nodes Grid */}
              <div className="text-xs font-semibold text-[#A0A7B2] uppercase tracking-wider flex items-center justify-between">
                <span>Repository Nodes & Dependency Adjacency</span>
                <span className="font-mono text-[10px] text-[#69717D]">
                  {nodes.length} nodes · {edges.length} edges
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {nodes.map((node) => {
                  const isSelected = node.id === selectedNodeId;
                  return (
                    <div
                      key={node.id}
                      onClick={() => setSelectedNodeId(node.id)}
                      className={`p-3 rounded-lg border cursor-pointer transition text-xs space-y-1.5 font-mono ${
                        isSelected
                          ? "bg-[#14171C] border-[#6C8CFF] shadow-lg shadow-[#6C8CFF]/10"
                          : "bg-[#14171C] border-[#262B33] hover:border-[#343B45]"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-[#F1F3F5] truncate">{node.label}</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#191D23] border border-[#262B33] text-[#6C8CFF] uppercase">
                          {node.type}
                        </span>
                      </div>
                      <div className="text-[10px] text-[#69717D] truncate">{node.file_path}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Inspector Panel */}
        <div className="w-88 border-l border-[#262B33] bg-[#0E1014] flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-[#262B33] font-medium text-xs text-[#A0A7B2] uppercase tracking-wider flex items-center space-x-2">
            <Activity className="w-4 h-4 text-[#6C8CFF]" />
            <span>Node Impact & Blast Radius</span>
          </div>

          <div className="flex-1 overflow-auto p-4 space-y-4">
            {selectedNodeId && impactData ? (
              <>
                {/* Risk Badge Card */}
                <div className="p-3 bg-[#14171C] border border-[#262B33] rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#F1F3F5]">
                      {impactData.target_label}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        impactData.risk_level === "CRITICAL"
                          ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                          : impactData.risk_level === "HIGH"
                          ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                          : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      }`}
                    >
                      {impactData.risk_level} RISK
                    </span>
                  </div>

                  <div className="text-[11px] text-[#A0A7B2] font-mono">
                    Blast Radius: {(impactData.blast_radius_score * 100).toFixed(1)}% ({impactData.total_affected_count} affected entities)
                  </div>
                </div>

                {/* Upstream Dependents */}
                <div className="space-y-1.5">
                  <div className="text-xs font-semibold text-[#A0A7B2] uppercase tracking-wider">
                    Upstream Callers / Dependents ({impactData.upstream_dependents.length})
                  </div>
                  {impactData.upstream_dependents.length === 0 ? (
                    <div className="text-xs text-[#69717D] italic">No upstream dependents</div>
                  ) : (
                    impactData.upstream_dependents.map((dep) => (
                      <div
                        key={dep.id}
                        className="p-2 bg-[#14171C] border border-[#262B33] rounded text-xs space-y-0.5 font-mono"
                      >
                        <div className="text-[#6C8CFF] font-medium">{dep.label}</div>
                        <div className="text-[10px] text-[#69717D] truncate">{dep.file}</div>
                      </div>
                    ))
                  )}
                </div>

                {/* Downstream Dependencies */}
                <div className="space-y-1.5">
                  <div className="text-xs font-semibold text-[#A0A7B2] uppercase tracking-wider">
                    Downstream Dependencies ({impactData.downstream_dependencies.length})
                  </div>
                  {impactData.downstream_dependencies.length === 0 ? (
                    <div className="text-xs text-[#69717D] italic">No downstream dependencies</div>
                  ) : (
                    impactData.downstream_dependencies.map((dep) => (
                      <div
                        key={dep.id}
                        className="p-2 bg-[#14171C] border border-[#262B33] rounded text-xs space-y-0.5 font-mono"
                      >
                        <div className="text-emerald-400 font-medium">{dep.label}</div>
                        <div className="text-[10px] text-[#69717D] truncate">{dep.file}</div>
                      </div>
                    ))
                  )}
                </div>
              </>
            ) : (
              <div className="p-8 text-center text-xs text-[#69717D]">
                Select any node from the repository topology to analyze change impact and blast radius.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
