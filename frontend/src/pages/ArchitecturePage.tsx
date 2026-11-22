import React, { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Layers, Flame, Ghost, ExternalLink, Box } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { apiGet } from "@/lib/api";
import { useRepositoryStore } from "@/stores/repository";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";

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
  const navigate = useNavigate();
  const { selectedRepoId, setSelectedRepo } = useRepositoryStore();

  const { data: repos = [] } = useQuery<Repository[]>({
    queryKey: ["repositories"],
    queryFn: () => apiGet<Repository[]>("/api/v1/repositories"),
  });

  useEffect(() => {
    if (repos.length > 0 && !selectedRepoId && repos[0]) {
      setSelectedRepo(repos[0].id, repos[0].name);
    }
  }, [repos, selectedRepoId, setSelectedRepo]);

  const { data: archData } = useQuery<ArchitectureData>({
    queryKey: ["archData", selectedRepoId],
    queryFn: () => apiGet<ArchitectureData>(`/api/v1/graph/${selectedRepoId}/architecture?top_n=8`),
    enabled: !!selectedRepoId,
  });

  return (
    <div className="flex flex-col h-[calc(100vh-3.25rem)] bg-atlas-bg text-atlas-text overflow-y-auto p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-atlas-border pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold tracking-tight text-atlas-text flex items-center gap-2">
              <Layers className="w-6 h-6 text-atlas-accent" />
              <span>Architecture & Coupling Analysis</span>
            </h1>
            <Badge variant="accent" size="sm">GRAPH INTELLIGENCE</Badge>
          </div>
          <p className="text-xs text-atlas-text-secondary">
            Topological structural bottlenecks, fan-in/fan-out coupling hotspots, and dead code candidates.
          </p>
        </div>

        <select
          value={selectedRepoId || ""}
          onChange={(e) => {
            const r = repos.find((repo) => repo.id === e.target.value);
            setSelectedRepo(e.target.value, r?.name);
          }}
          className="bg-atlas-surface border border-atlas-border text-xs text-atlas-text rounded-md px-3 py-1.5 font-mono focus:outline-none focus:border-atlas-accent cursor-pointer"
        >
          {repos.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card variant="metric">
          <div className="text-[11px] text-atlas-text-muted uppercase font-mono mb-1">Total AST Nodes</div>
          <div className="text-3xl font-bold font-mono text-atlas-text">{archData?.total_nodes || 0}</div>
          <div className="text-[11px] text-atlas-text-secondary font-mono mt-2">Classes, functions & modules</div>
        </Card>

        <Card variant="metric">
          <div className="text-[11px] text-atlas-text-muted uppercase font-mono mb-1">Dependency Edges</div>
          <div className="text-3xl font-bold font-mono text-atlas-accent">{archData?.total_edges || 0}</div>
          <div className="text-[11px] text-atlas-text-secondary font-mono mt-2">Explicit function calls & imports</div>
        </Card>

        <Card variant="metric">
          <div className="text-[11px] text-atlas-text-muted uppercase font-mono mb-1">Graph Density</div>
          <div className="text-3xl font-bold font-mono text-emerald-400">
            {((archData?.density || 0) * 100).toFixed(2)}%
          </div>
          <div className="text-[11px] text-atlas-text-secondary font-mono mt-2">Coupling ratio: E / (V * (V-1))</div>
        </Card>
      </div>

      {/* Hotspots Section (Fan-in vs Fan-out) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fan-in Hotspots */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-atlas-border pb-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-atlas-text">
              <Flame className="w-4 h-4 text-rose-400" />
              <span>High Fan-In Hotspots (Core Utilities)</span>
            </div>
            <Badge variant="danger" size="sm">High Ripple Risk</Badge>
          </div>
          <p className="text-xs text-atlas-text-secondary leading-relaxed">
            Symbols with the highest number of callers. Breaking changes here have the largest blast radius across the system.
          </p>

          <div className="space-y-2 pt-1 font-mono text-xs">
            {!archData || archData.hotspots_fan_in.length === 0 ? (
              <div className="text-xs text-atlas-text-muted italic py-6 text-center">
                No high fan-in hotspots identified.
              </div>
            ) : (
              archData.hotspots_fan_in.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-lg bg-atlas-surface-secondary border border-atlas-border hover:border-atlas-border-strong flex items-center justify-between transition-colors"
                >
                  <div className="min-w-0 flex-1 pr-3">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-rose-400 truncate">{item.label}</span>
                      <Badge variant="outline" size="sm">{item.type}</Badge>
                    </div>
                    <div className="text-[11px] text-atlas-text-muted truncate mt-0.5">{item.file}</div>
                  </div>
                  <Badge variant="danger" size="sm">{item.fan_in} Callers</Badge>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Fan-out Hotspots */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-atlas-border pb-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-atlas-text">
              <Box className="w-4 h-4 text-amber-400" />
              <span>High Fan-Out Hotspots (Orchestrators)</span>
            </div>
            <Badge variant="warning" size="sm">High Complexity</Badge>
          </div>
          <p className="text-xs text-atlas-text-secondary leading-relaxed">
            Symbols that orchestrate and call many distinct dependencies. High fan-out modules are often coordination bottlenecks.
          </p>

          <div className="space-y-2 pt-1 font-mono text-xs">
            {!archData || archData.hotspots_fan_out.length === 0 ? (
              <div className="text-xs text-atlas-text-muted italic py-6 text-center">
                No high fan-out hotspots identified.
              </div>
            ) : (
              archData.hotspots_fan_out.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-lg bg-atlas-surface-secondary border border-atlas-border hover:border-atlas-border-strong flex items-center justify-between transition-colors"
                >
                  <div className="min-w-0 flex-1 pr-3">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-amber-400 truncate">{item.label}</span>
                      <Badge variant="outline" size="sm">{item.type}</Badge>
                    </div>
                    <div className="text-[11px] text-atlas-text-muted truncate mt-0.5">{item.file}</div>
                  </div>
                  <Badge variant="warning" size="sm">{item.fan_out} Calls</Badge>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Dead Code Candidates */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-atlas-border pb-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-atlas-text">
            <Ghost className="w-4 h-4 text-atlas-accent" />
            <span>Dead Code Candidates (Unreferenced Symbols)</span>
          </div>
          <Badge variant="accent" size="sm">
            {archData?.dead_code_candidates.length || 0} Candidates
          </Badge>
        </div>
        <p className="text-xs text-atlas-text-secondary leading-relaxed">
          Functions or classes with zero incoming static references across the indexed repository AST.
          Verify before deprecating or pruning.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 font-mono text-xs pt-1">
          {!archData || archData.dead_code_candidates.length === 0 ? (
            <div className="col-span-3 text-xs text-emerald-400 italic py-6 text-center">
              ✓ No dead code candidates detected.
            </div>
          ) : (
            archData.dead_code_candidates.map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-lg bg-atlas-surface-secondary border border-atlas-border hover:border-atlas-border-strong space-y-1 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-atlas-text truncate">{item.label}</span>
                  <Badge variant="outline" size="sm">{item.type}</Badge>
                </div>
                <div className="text-[11px] text-atlas-text-muted truncate">{item.file}</div>
                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => navigate("/repositories")}
                    className="text-[10px] text-atlas-accent hover:underline flex items-center gap-1 font-sans"
                  >
                    Inspect in Repo
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
};
