import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Layers, Flame, AlertOctagon, Ghost } from "lucide-react";
import { apiGet } from "@/lib/api";

interface Repository {
  id: string;
  name: string;
}

interface HotspotItem {
  id: string;
  label: string;
  type: string;
  file: string;
  fan_in?: number;
  fan_out?: number;
}

interface DeadCodeItem {
  id: string;
  label: string;
  type: string;
  file: string;
}

interface ArchitectureData {
  repository_id: string;
  total_nodes: number;
  total_edges: number;
  density: number;
  hotspots_fan_in: HotspotItem[];
  hotspots_fan_out: HotspotItem[];
  dead_code_candidates: DeadCodeItem[];
}

export const ArchitecturePage: React.FC = () => {
  const [selectedRepoId, setSelectedRepoId] = useState<string | null>(null);

  const { data: repos = [] } = useQuery<Repository[]>({
    queryKey: ["repositories"],
    queryFn: () => apiGet<Repository[]>("/api/v1/repositories"),
  });

  useEffect(() => {
    if (repos.length > 0 && !selectedRepoId && repos[0]) {
      setSelectedRepoId(repos[0].id);
    }
  }, [repos, selectedRepoId]);

  const { data: archData } = useQuery<ArchitectureData>({
    queryKey: ["archData", selectedRepoId],
    queryFn: () => apiGet<ArchitectureData>(`/api/v1/graph/${selectedRepoId}/architecture?top_n=8`),
    enabled: !!selectedRepoId,
  });

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-[#0B0D10] text-[#F1F3F5] overflow-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#262B33] pb-4">
        <div className="space-y-1">
          <h1 className="text-lg font-semibold tracking-tight flex items-center space-x-2">
            <Layers className="w-5 h-5 text-[#6C8CFF]" />
            <span>Architecture & Coupling Analysis</span>
          </h1>
          <p className="text-xs text-[#A0A7B2]">
            Topological analysis of structural bottlenecks, high-fan-in hotspots, and dead code candidates.
          </p>
        </div>

        <select
          value={selectedRepoId || ""}
          onChange={(e) => setSelectedRepoId(e.target.value)}
          className="bg-[#14171C] border border-[#262B33] text-xs text-[#F1F3F5] rounded px-3 py-1.5 focus:outline-none focus:border-[#6C8CFF]"
        >
          {repos.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 bg-[#14171C] border border-[#262B33] rounded-xl space-y-1">
          <div className="text-xs text-[#69717D] uppercase font-mono">Total Nodes</div>
          <div className="text-2xl font-bold font-mono text-[#F1F3F5]">{archData?.total_nodes || 0}</div>
        </div>
        <div className="p-4 bg-[#14171C] border border-[#262B33] rounded-xl space-y-1">
          <div className="text-xs text-[#69717D] uppercase font-mono">Total Edges</div>
          <div className="text-2xl font-bold font-mono text-[#6C8CFF]">{archData?.total_edges || 0}</div>
        </div>
        <div className="p-4 bg-[#14171C] border border-[#262B33] rounded-xl space-y-1">
          <div className="text-xs text-[#69717D] uppercase font-mono">Graph Density</div>
          <div className="text-2xl font-bold font-mono text-emerald-400">
            {((archData?.density || 0) * 100).toFixed(2)}%
          </div>
        </div>
      </div>

      {/* Hotspots Section */}
      <div className="grid grid-cols-2 gap-6">
        {/* Fan-in Hotspots */}
        <div className="p-5 bg-[#14171C] border border-[#262B33] rounded-xl space-y-3">
          <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-[#F1F3F5]">
            <Flame className="w-4 h-4 text-rose-400" />
            <span>High Fan-In Hotspots (Core Utilities)</span>
          </div>
          <p className="text-xs text-[#A0A7B2]">
            Symbols and modules with the highest number of incoming dependents. Breaking changes here have the highest ripple effect.
          </p>

          <div className="space-y-2 pt-2">
            {!archData || archData.hotspots_fan_in.length === 0 ? (
              <div className="text-xs text-[#69717D] italic">No high fan-in hotspots identified</div>
            ) : (
              archData.hotspots_fan_in.map((item) => (
                <div
                  key={item.id}
                  className="p-3 bg-[#0E1014] border border-[#262B33] rounded-lg flex items-center justify-between text-xs font-mono"
                >
                  <div className="space-y-0.5 truncate">
                    <div className="font-semibold text-[#6C8CFF]">{item.label}</div>
                    <div className="text-[10px] text-[#69717D] truncate">{item.file}</div>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-[#191D23] border border-[#262B33] text-rose-400 font-bold shrink-0">
                    Fan-in: {item.fan_in}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Fan-out Hotspots */}
        <div className="p-5 bg-[#14171C] border border-[#262B33] rounded-xl space-y-3">
          <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-[#F1F3F5]">
            <AlertOctagon className="w-4 h-4 text-amber-400" />
            <span>High Fan-Out Hotspots (Coordinators)</span>
          </div>
          <p className="text-xs text-[#A0A7B2]">
            Symbols with the highest outgoing dependencies. Often indicate coordinator modules, orchestrators, or God objects.
          </p>

          <div className="space-y-2 pt-2">
            {!archData || archData.hotspots_fan_out.length === 0 ? (
              <div className="text-xs text-[#69717D] italic">No high fan-out hotspots identified</div>
            ) : (
              archData.hotspots_fan_out.map((item) => (
                <div
                  key={item.id}
                  className="p-3 bg-[#0E1014] border border-[#262B33] rounded-lg flex items-center justify-between text-xs font-mono"
                >
                  <div className="space-y-0.5 truncate">
                    <div className="font-semibold text-amber-400">{item.label}</div>
                    <div className="text-[10px] text-[#69717D] truncate">{item.file}</div>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-[#191D23] border border-[#262B33] text-amber-400 font-bold shrink-0">
                    Fan-out: {item.fan_out}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Dead Code Candidates */}
      <div className="p-5 bg-[#14171C] border border-[#262B33] rounded-xl space-y-3">
        <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-[#F1F3F5]">
          <Ghost className="w-4 h-4 text-[#A0A7B2]" />
          <span>Unreferenced Symbol Candidates (Zero Fan-In)</span>
        </div>
        <p className="text-xs text-[#A0A7B2]">
          Functions and classes with zero internal callers across the indexed repository. Potential candidates for dead code elimination or public API entrypoints.
        </p>

        <div className="grid grid-cols-2 gap-3 pt-2 font-mono text-xs">
          {!archData || archData.dead_code_candidates.length === 0 ? (
            <div className="text-xs text-[#69717D] italic col-span-2">No unreferenced symbols detected</div>
          ) : (
            archData.dead_code_candidates.map((item) => (
              <div
                key={item.id}
                className="p-3 bg-[#0E1014] border border-[#262B33] rounded-lg space-y-0.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#F1F3F5]">{item.label}</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#191D23] border border-[#262B33] text-[#A0A7B2] uppercase">
                    {item.type}
                  </span>
                </div>
                <div className="text-[10px] text-[#69717D] truncate">{item.file}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
