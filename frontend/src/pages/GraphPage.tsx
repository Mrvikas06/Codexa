import React, { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  GitFork,
  Search,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Folder,
  FileCode,
  ArrowRight,
  Layers,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { apiGet } from "@/lib/api";
import { useRepositoryStore } from "@/stores/repository";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

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

interface DisplayNode {
  id: string;
  name: string;
  type: string;
  filesCount: number;
  dependenciesCount: number;
  dependentsCount: number;
  files: string[];
  angle: number;
}

export const GraphPage: React.FC = () => {
  const navigate = useNavigate();
  const { selectedRepoId, selectedRepoName } = useRepositoryStore();

  const [selectedNode, setSelectedNode] = useState<DisplayNode | null>(null);
  const [searchFilter, setSearchFilter] = useState("");
  const [zoom, setZoom] = useState(1);
  const [activeTab, setActiveTab] = useState<"topology" | "cycles" | "blast">("topology");

  // 1. Repositories query
  const { data: repos = [] } = useQuery<Repository[]>({
    queryKey: ["repositories"],
    queryFn: () => apiGet<Repository[]>("/api/v1/repositories"),
  });

  const activeRepoId = selectedRepoId || (repos.length > 0 ? repos[0]?.id : undefined);

  // 2. Fetch real graph data from backend
  const { data: graphData, isLoading: graphLoading } = useQuery<GraphData>({
    queryKey: ["graphData", activeRepoId],
    queryFn: () => apiGet<GraphData>(`/api/v1/graph/${activeRepoId}?include_symbols=true`),
    enabled: !!activeRepoId,
  });

  // Dynamically cluster nodes by module/directory
  const displayModules = useMemo<DisplayNode[]>(() => {
    if (!graphData || !graphData.nodes || graphData.nodes.length === 0) {
      return [];
    }

    const clusters: Record<string, { files: Set<string>; nodeIds: Set<string> }> = {};

    graphData.nodes.forEach((n) => {
      const parts = n.file_path.split("/");
      const moduleName = parts.length > 1 ? parts[0]! : "core";
      if (!clusters[moduleName]) {
        clusters[moduleName] = { files: new Set(), nodeIds: new Set() };
      }
      clusters[moduleName]!.files.add(n.file_path);
      clusters[moduleName]!.nodeIds.add(n.id);
    });

    const moduleKeys = Object.keys(clusters);
    const angleStep = 360 / Math.max(moduleKeys.length, 1);

    return moduleKeys.map((modName, idx) => {
      const cluster = clusters[modName]!;
      let deps = 0;
      let dependents = 0;

      graphData.edges.forEach((e) => {
        if (cluster.nodeIds.has(e.source)) deps++;
        if (cluster.nodeIds.has(e.target)) dependents++;
      });

      return {
        id: modName,
        name: modName,
        type: "Module",
        filesCount: cluster.files.size,
        dependenciesCount: deps,
        dependentsCount: dependents,
        files: Array.from(cluster.files).slice(0, 8),
        angle: idx * angleStep,
      };
    });
  }, [graphData]);

  // Set default selected node
  useEffect(() => {
    if (displayModules.length > 0 && !selectedNode) {
      setSelectedNode(displayModules[0]!);
    }
  }, [displayModules, selectedNode]);

  // Coordinates
  const centerX = 340;
  const centerY = 240;
  const radius = 175;

  const filteredModules = useMemo(() => {
    if (!searchFilter.trim()) return displayModules;
    return displayModules.filter(
      (m) =>
        m.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
        m.files.some((f) => f.toLowerCase().includes(searchFilter.toLowerCase()))
    );
  }, [displayModules, searchFilter]);

  return (
    <div className="flex flex-col h-[calc(100vh-3.25rem)] bg-[#F7F8FC] text-neutral-900 overflow-hidden">
      {/* Top Controls Bar */}
      <div className="h-14 border-b border-neutral-200 bg-white px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-primary" />
            <span className="font-semibold text-sm text-neutral-900">Code Graph</span>
          </div>

          <span className="text-neutral-300">/</span>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-medium text-neutral-700">
              {selectedRepoName || (repos.length > 0 ? repos[0]?.name : "Active Repo")}
            </span>
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1 h-1 rounded-full bg-emerald-500" />
              {graphData?.total_nodes || 0} AST Nodes · {graphData?.total_edges || 0} Edges
            </span>
          </div>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center bg-neutral-100 p-0.5 rounded-lg border border-neutral-200 text-xs font-medium">
          <button
            onClick={() => setActiveTab("topology")}
            className={`px-3 py-1 rounded-md transition-all ${
              activeTab === "topology"
                ? "bg-white text-primary shadow-xs font-semibold"
                : "text-neutral-600 hover:text-neutral-900"
            }`}
          >
            Topology
          </button>
          <button
            onClick={() => setActiveTab("cycles")}
            className={`px-3 py-1 rounded-md transition-all ${
              activeTab === "cycles"
                ? "bg-white text-primary shadow-xs font-semibold"
                : "text-neutral-600 hover:text-neutral-900"
            }`}
          >
            Cycles (0)
          </button>
          <button
            onClick={() => setActiveTab("blast")}
            className={`px-3 py-1 rounded-md transition-all ${
              activeTab === "blast"
                ? "bg-white text-primary shadow-xs font-semibold"
                : "text-neutral-600 hover:text-neutral-900"
            }`}
          >
            Blast Radius
          </button>
        </div>

        {/* Search & zoom controls */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter node or file..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-800 placeholder-neutral-400 focus:outline-none focus:border-primary focus:bg-white w-40"
            />
          </div>

          <div className="flex items-center border border-neutral-200 rounded-lg overflow-hidden bg-white">
            <button
              onClick={() => setZoom((z) => Math.min(z + 0.1, 1.6))}
              className="p-1.5 hover:bg-neutral-50 text-neutral-600 border-r border-neutral-200"
              title="Zoom in"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoom((z) => Math.max(z - 0.1, 0.6))}
              className="p-1.5 hover:bg-neutral-50 text-neutral-600 border-r border-neutral-200"
              title="Zoom out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoom(1)}
              className="p-1.5 hover:bg-neutral-50 text-neutral-600"
              title="Reset zoom"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Split: Graph Canvas (Left) + Node Details (Right) */}
      <div className="flex-1 flex overflow-hidden">
        {/* Graph Canvas */}
        <div className="flex-1 relative bg-[#F7F8FC] overflow-hidden flex items-center justify-center">
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.35]"
            style={{
              backgroundImage: `radial-gradient(#D0D5DD 1px, transparent 1px)`,
              backgroundSize: "20px 20px",
            }}
          />

          {graphLoading ? (
            <div className="text-xs text-neutral-500 font-mono">
              Computing AST topological layout...
            </div>
          ) : (
            <div
              className="relative transition-transform duration-200 ease-out"
              style={{
                transform: `scale(${zoom})`,
                width: "680px",
                height: "480px",
              }}
            >
              <svg className="w-full h-full overflow-visible">
                <circle
                  cx={centerX}
                  cy={centerY}
                  r={radius}
                  fill="none"
                  stroke="#E5E7EB"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />

                {filteredModules.map((m) => {
                  const rad = (m.angle * Math.PI) / 180;
                  const nodeX = centerX + radius * Math.cos(rad);
                  const nodeY = centerY + radius * Math.sin(rad);
                  const isSelected = selectedNode?.id === m.id;

                  return (
                    <g key={`link-${m.id}`}>
                      <path
                        d={`M ${centerX} ${centerY} L ${nodeX} ${nodeY}`}
                        stroke={isSelected ? "#6C5CE7" : "#D0D5DD"}
                        strokeWidth={isSelected ? 2.5 : 1.5}
                        fill="none"
                        className="transition-all duration-300"
                      />
                      {isSelected && (
                        <circle
                          cx={(centerX + nodeX) / 2}
                          cy={(centerY + nodeY) / 2}
                          r="3.5"
                          fill="#6C5CE7"
                        />
                      )}
                    </g>
                  );
                })}
              </svg>

              {/* Central Root Repository Node */}
              <div
                style={{
                  position: "absolute",
                  left: `${centerX}px`,
                  top: `${centerY}px`,
                  transform: "translate(-50%, -50%)",
                }}
                className="z-20 cursor-default select-none"
              >
                <div className="px-5 py-2.5 rounded-xl bg-primary text-white shadow-lg shadow-primary/25 border border-primary-dark/20 flex items-center gap-2 hover:brightness-105 transition-transform hover:scale-105">
                  <GitFork className="w-4 h-4" />
                  <span className="font-semibold text-xs tracking-wide">
                    {selectedRepoName || (repos.length > 0 ? repos[0]?.name : "Repository")}
                  </span>
                </div>
              </div>

              {/* Satellite Module Nodes */}
              {filteredModules.map((m) => {
                const rad = (m.angle * Math.PI) / 180;
                const nodeX = centerX + radius * Math.cos(rad);
                const nodeY = centerY + radius * Math.sin(rad);
                const isSelected = selectedNode?.id === m.id;

                return (
                  <div
                    key={m.id}
                    onClick={() => setSelectedNode(m)}
                    style={{
                      position: "absolute",
                      left: `${nodeX}px`,
                      top: `${nodeY}px`,
                      transform: "translate(-50%, -50%)",
                    }}
                    className={`z-10 cursor-pointer select-none px-3.5 py-1.5 rounded-lg border transition-all duration-200 flex items-center gap-2 bg-white ${
                      isSelected
                        ? "border-primary ring-2 ring-primary/20 shadow-md text-primary font-semibold scale-110"
                        : "border-neutral-200 text-neutral-700 hover:border-neutral-400 hover:shadow-xs shadow-xs"
                    }`}
                  >
                    <Folder className={`w-3.5 h-3.5 ${isSelected ? "text-primary" : "text-neutral-400"}`} />
                    <span className="text-xs font-mono font-medium">{m.name}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                        isSelected
                          ? "bg-violet-100 text-primary"
                          : "bg-neutral-100 text-neutral-500"
                      }`}
                    >
                      {m.filesCount}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          <div className="absolute bottom-4 left-6 text-xs text-neutral-500 flex items-center gap-2 bg-white/80 backdrop-blur-xs px-3 py-1.5 rounded-lg border border-neutral-200">
            <span className="w-2 h-2 rounded-full bg-primary" />
            <span>Click any node to inspect real dependencies and related files</span>
          </div>
        </div>

        {/* Right Panel: Node Details */}
        <div className="w-80 border-l border-neutral-200 bg-white flex flex-col shrink-0 p-6 space-y-6 overflow-y-auto">
          {selectedNode ? (
            <>
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                    Node Details
                  </h3>
                  <Badge variant="accent" size="sm">
                    SELECTED
                  </Badge>
                </div>

                <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-xl border border-neutral-200">
                  <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center text-primary shrink-0">
                    <Folder className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-base text-neutral-900 font-mono truncate">
                      {selectedNode.name}
                    </div>
                    <div className="text-xs text-neutral-500">Repository Module</div>
                  </div>
                </div>
              </div>

              <div className="space-y-2.5 font-mono text-xs">
                <div className="flex items-center justify-between py-2 border-b border-neutral-100">
                  <span className="text-neutral-500 font-sans">Type</span>
                  <span className="font-semibold text-neutral-800">{selectedNode.type}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-neutral-100">
                  <span className="text-neutral-500 font-sans">Contained Files</span>
                  <span className="font-semibold text-neutral-800">{selectedNode.filesCount}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-neutral-100">
                  <span className="text-neutral-500 font-sans">Dependency Edges</span>
                  <span className="font-semibold text-primary">{selectedNode.dependenciesCount}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-neutral-100">
                  <span className="text-neutral-500 font-sans">Dependents Count</span>
                  <span className="font-semibold text-emerald-600">{selectedNode.dependentsCount}</span>
                </div>
              </div>

              <div className="space-y-2.5">
                <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                  Associated Files ({selectedNode.files.length})
                </h4>

                <div className="space-y-1.5 font-mono text-xs">
                  {selectedNode.files.map((file, i) => (
                    <div
                      key={i}
                      onClick={() => navigate("/repositories")}
                      className="flex items-center gap-2 p-2 rounded-lg bg-neutral-50 hover:bg-violet-50 hover:text-primary border border-neutral-200/60 hover:border-violet-200 cursor-pointer transition-colors group"
                    >
                      <FileCode className="w-3.5 h-3.5 text-neutral-400 group-hover:text-primary shrink-0" />
                      <span className="truncate flex-1 text-neutral-700 group-hover:text-primary">
                        {file}
                      </span>
                      <ArrowRight className="w-3 h-3 text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-neutral-200">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs"
                  onClick={() => navigate("/repositories")}
                >
                  View in Repository Explorer
                </Button>
              </div>
            </>
          ) : (
            <div className="text-xs text-neutral-500 text-center py-12">
              Select any node in the topology canvas to inspect details.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
