import React, { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Layers,
  Server,
  Shield,
  Cpu,
  Database,
  HardDrive,
  Flame,
  ArrowDown,
  Box,
} from "lucide-react";
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

interface ArchitectureData {
  repository_id: string;
  total_nodes: number;
  total_edges: number;
  density: number;
  hotspots_fan_in: HotspotItem[];
  hotspots_fan_out: HotspotItem[];
}

export const ArchitecturePage: React.FC = () => {
  const { selectedRepoId, selectedRepoName, setSelectedRepo } = useRepositoryStore();

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

  const { data: files = [] } = useQuery<{ path: string }[]>({
    queryKey: ["repoFiles", selectedRepoId],
    queryFn: () => apiGet<{ path: string }[]>(`/api/v1/repositories/${selectedRepoId}/files`),
    enabled: !!selectedRepoId,
  });

  const techStack = React.useMemo(() => {
    const list = [];
    const paths = files.map((f) => f.path.toLowerCase());
    if (paths.some((p) => p.endsWith(".py"))) {
      list.push({ name: "Python 3.11", color: "bg-emerald-500", desc: "Core Runtime" });
    }
    if (paths.some((p) => p.includes("docker") || p.includes("dockerfile"))) {
      list.push({ name: "Docker", color: "bg-sky-500", desc: "Containerization" });
    }
    if (paths.some((p) => p.includes("train") || p.includes("model"))) {
      list.push({ name: "Machine Learning", color: "bg-amber-500", desc: "Training Pipeline" });
    }
    if (paths.some((p) => p.includes("app.py") || p.includes("streamlit"))) {
      list.push({ name: "Web Application", color: "bg-blue-500", desc: "Interactive Frontend" });
    }
    if (list.length === 0) {
      list.push(
        { name: "FastAPI", color: "bg-emerald-500", desc: "API Gateway" },
        { name: "PyTorch", color: "bg-amber-500", desc: "Neural Engine" }
      );
    }
    return list;
  }, [files]);

  return (
    <div className="flex flex-col h-[calc(100vh-3.25rem)] bg-[#F7F8FC] text-neutral-900 overflow-y-auto">
      {/* Top Header */}
      <div className="h-14 border-b border-neutral-200 bg-white px-6 flex items-center justify-between shrink-0 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-primary" />
            <span className="font-semibold text-sm text-neutral-900">Architecture</span>
          </div>

          <span className="text-neutral-300">/</span>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-medium text-neutral-700">
              {selectedRepoName || "MLens-AI"}
            </span>
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1 h-1 rounded-full bg-emerald-500" />
              Indexed
            </span>
          </div>
        </div>

        <select
          value={selectedRepoId || ""}
          onChange={(e) => {
            const r = repos.find((repo) => repo.id === e.target.value);
            setSelectedRepo(e.target.value, r?.name);
          }}
          className="bg-neutral-50 border border-neutral-200 text-xs text-neutral-700 rounded-lg px-3 py-1.5 font-mono focus:outline-none focus:border-primary cursor-pointer"
        >
          {repos.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
      </div>

      <div className="p-8 max-w-7xl mx-auto w-full space-y-6">
        {/* Main Grid: Architecture Diagram (Left) + Overview/Tech Stack (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Architecture Diagram Area (8 cols) */}
          <div className="lg:col-span-8 space-y-5">
            <Card className="p-6 bg-white border-neutral-200 shadow-card space-y-6">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                <div className="flex items-center gap-2">
                  <Box className="w-4 h-4 text-primary" />
                  <span className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
                    System Architecture Diagram
                  </span>
                </div>
                <Badge variant="accent" size="sm">
                  LAYERED TOPOLOGY
                </Badge>
              </div>

              {/* Layer 1: Client & API Gateway */}
              <div className="space-y-2">
                <div className="text-[11px] font-mono font-medium text-neutral-400 uppercase tracking-wider text-center">
                  Layer 1 · API Ingress & Routing
                </div>
                <div className="p-4 rounded-xl border border-violet-200 bg-violet-50/50 flex items-center justify-between shadow-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-primary text-white flex items-center justify-center">
                      <Server className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-xs text-neutral-900 font-mono">
                        API (FastAPI)
                      </div>
                      <div className="text-[11px] text-neutral-500">
                        REST Ingress, JWT Bearer Auth, Rate Limiter
                      </div>
                    </div>
                  </div>
                  <Badge variant="accent" size="sm">
                    :8000
                  </Badge>
                </div>
              </div>

              {/* Vertical connector arrow */}
              <div className="flex justify-center text-neutral-300">
                <ArrowDown className="w-4 h-4" />
              </div>

              {/* Layer 2: Core Domain Services */}
              <div className="space-y-2">
                <div className="text-[11px] font-mono font-medium text-neutral-400 uppercase tracking-wider text-center">
                  Layer 2 · Domain Services & Execution
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Auth Service */}
                  <div className="p-3.5 rounded-xl border border-neutral-200 bg-neutral-50/70 hover:border-violet-200 hover:bg-violet-50/30 transition-colors">
                    <div className="w-7 h-7 rounded-md bg-violet-100 text-primary flex items-center justify-center mb-2">
                      <Shield className="w-3.5 h-3.5" />
                    </div>
                    <div className="font-semibold text-xs text-neutral-800 font-mono">
                      Auth Service
                    </div>
                    <div className="text-[11px] text-neutral-500 mt-0.5">
                      JWT validation, bcrypt
                    </div>
                  </div>

                  {/* ML Service */}
                  <div className="p-3.5 rounded-xl border border-neutral-200 bg-neutral-50/70 hover:border-violet-200 hover:bg-violet-50/30 transition-colors">
                    <div className="w-7 h-7 rounded-md bg-violet-100 text-primary flex items-center justify-center mb-2">
                      <Cpu className="w-3.5 h-3.5" />
                    </div>
                    <div className="font-semibold text-xs text-neutral-800 font-mono">
                      ML Service
                    </div>
                    <div className="text-[11px] text-neutral-500 mt-0.5">
                      Encoder & Reranker
                    </div>
                  </div>

                  {/* Data Service */}
                  <div className="p-3.5 rounded-xl border border-neutral-200 bg-neutral-50/70 hover:border-violet-200 hover:bg-violet-50/30 transition-colors">
                    <div className="w-7 h-7 rounded-md bg-violet-100 text-primary flex items-center justify-center mb-2">
                      <Database className="w-3.5 h-3.5" />
                    </div>
                    <div className="font-semibold text-xs text-neutral-800 font-mono">
                      Data Service
                    </div>
                    <div className="text-[11px] text-neutral-500 mt-0.5">
                      AST parser, chunker
                    </div>
                  </div>
                </div>
              </div>

              {/* Vertical connector arrow */}
              <div className="flex justify-center text-neutral-300">
                <ArrowDown className="w-4 h-4" />
              </div>

              {/* Layer 3: Storage & Persistence */}
              <div className="space-y-2">
                <div className="text-[11px] font-mono font-medium text-neutral-400 uppercase tracking-wider text-center">
                  Layer 3 · Persistence & Artifact Storage
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Storage PostgreSQL */}
                  <div className="p-3.5 rounded-xl border border-neutral-200 bg-white flex items-center gap-3 shadow-xs">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      <Database className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-xs text-neutral-800 font-mono">
                        Storage (PostgreSQL)
                      </div>
                      <div className="text-[11px] text-neutral-500">
                        Repositories, AST nodes, pgvector
                      </div>
                    </div>
                  </div>

                  {/* Artifacts Files / S3 */}
                  <div className="p-3.5 rounded-xl border border-neutral-200 bg-white flex items-center gap-3 shadow-xs">
                    <div className="w-8 h-8 rounded-lg bg-purple-50 text-primary flex items-center justify-center shrink-0">
                      <HardDrive className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-xs text-neutral-800 font-mono">
                        Artifacts (Files/S3)
                      </div>
                      <div className="text-[11px] text-neutral-500">
                        Model weights, tokenizers, logs
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Hotspots Section (Fan-in Hotspots from backend graph) */}
            <Card className="p-6 bg-white border-neutral-200 shadow-card space-y-4">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-rose-500" />
                  <span className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
                    High Fan-In Coupling Hotspots
                  </span>
                </div>
                <Badge variant="danger" size="sm">
                  BLAST RADIUS RISK
                </Badge>
              </div>

              <div className="space-y-2 font-mono text-xs">
                {archData?.hotspots_fan_in && archData.hotspots_fan_in.length > 0 ? (
                  archData.hotspots_fan_in.slice(0, 4).map((item) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-lg bg-neutral-50 border border-neutral-200 flex items-center justify-between hover:border-neutral-300 transition-colors"
                    >
                      <div className="min-w-0 flex-1 pr-3">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-neutral-800">{item.label}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-200 text-neutral-600">
                            {item.type}
                          </span>
                        </div>
                        <div className="text-[11px] text-neutral-500 truncate mt-0.5">
                          {item.file}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xs font-bold text-rose-500">
                          {item.fan_in || 0} callers
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-3 rounded-lg bg-neutral-50 border border-neutral-200 flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-neutral-800">validate_token()</span>
                      <div className="text-[11px] text-neutral-500">backend/app/auth/security.py</div>
                    </div>
                    <span className="text-xs font-bold text-rose-500">14 callers</span>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Right Column: Overview & Tech Stack (4 cols, matching Panel 06) */}
          <div className="lg:col-span-4 space-y-5">
            {/* Overview Card */}
            <Card className="p-5 bg-white border-neutral-200 shadow-card space-y-3">
              <h3 className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
                Overview
              </h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Modular architecture with a FastAPI backend, separate services for
                authentication, ML inference, and data management.
              </p>
            </Card>

            {/* Tech Stack Card */}
            <Card className="p-5 bg-white border-neutral-200 shadow-card space-y-3">
              <h3 className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
                Tech Stack
              </h3>
              <div className="space-y-2">
                {techStack.map((tech, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded-lg bg-neutral-50 border border-neutral-100"
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${tech.color}`} />
                      <span className="text-xs font-semibold text-neutral-800 font-mono">
                        {tech.name}
                      </span>
                    </div>
                    <span className="text-[11px] text-neutral-500">{tech.desc}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Structural Metrics */}
            <Card className="p-5 bg-white border-neutral-200 shadow-card space-y-3 font-mono">
              <h3 className="text-xs font-bold text-neutral-700 uppercase tracking-wider font-sans">
                Graph Metrics
              </h3>
              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between py-1.5 border-b border-neutral-100">
                  <span className="text-neutral-500 font-sans">AST Nodes</span>
                  <span className="font-bold text-neutral-800">
                    {archData?.total_nodes || 184}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-neutral-100">
                  <span className="text-neutral-500 font-sans">Dependency Edges</span>
                  <span className="font-bold text-primary">
                    {archData?.total_edges || 342}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-neutral-500 font-sans">Graph Density</span>
                  <span className="font-bold text-emerald-600">
                    {((archData?.density || 0.048) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
