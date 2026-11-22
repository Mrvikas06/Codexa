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

interface ModuleNode {
  id: string;
  name: string;
  type: string;
  filesCount: number;
  dependenciesCount: number;
  dependentsCount: number;
  files: string[];
  angle: number; // in degrees
}

const DEFAULT_MODULES: ModuleNode[] = [
  {
    id: "api",
    name: "api",
    type: "Module",
    filesCount: 4,
    dependenciesCount: 3,
    dependentsCount: 1,
    files: ["routes.py", "auth.py", "deps.py", "server.py"],
    angle: 270, // Top
  },
  {
    id: "models",
    name: "models",
    type: "Module",
    filesCount: 3,
    dependenciesCount: 5,
    dependentsCount: 2,
    files: ["models.py", "encoder.py", "layers.py"],
    angle: 320, // Top-Right
  },
  {
    id: "training",
    name: "training",
    type: "Module",
    filesCount: 2,
    dependenciesCount: 4,
    dependentsCount: 1,
    files: ["train.py", "dataset.py"],
    angle: 0, // Right
  },
  {
    id: "inference",
    name: "inference",
    type: "Module",
    filesCount: 2,
    dependenciesCount: 3,
    dependentsCount: 2,
    files: ["engine.py", "tokenizer.py"],
    angle: 45, // Bottom-Right
  },
  {
    id: "utils",
    name: "utils",
    type: "Module",
    filesCount: 5,
    dependenciesCount: 1,
    dependentsCount: 6,
    files: ["logger.py", "helpers.py", "config.py", "io.py", "timer.py"],
    angle: 90, // Bottom
  },
  {
    id: "tests",
    name: "tests",
    type: "Module",
    filesCount: 6,
    dependenciesCount: 7,
    dependentsCount: 0,
    files: ["test_api.py", "test_models.py", "test_encoder.py"],
    angle: 150, // Bottom-Left
  },
  {
    id: "web",
    name: "web",
    type: "Module",
    filesCount: 8,
    dependenciesCount: 2,
    dependentsCount: 1,
    files: ["App.tsx", "router.tsx", "Sidebar.tsx", "client.ts"],
    angle: 210, // Left
  },
];

export const GraphPage: React.FC = () => {
  const navigate = useNavigate();
  const { selectedRepoId, selectedRepoName, setSelectedRepo } = useRepositoryStore();

  const [selectedNode, setSelectedNode] = useState<ModuleNode>(DEFAULT_MODULES[1]!); // Default to 'models' as in design
  const [searchFilter, setSearchFilter] = useState("");
  const [zoom, setZoom] = useState(1);
  const [activeTab, setActiveTab] = useState<"topology" | "cycles" | "blast">("topology");

  // Repositories query
  const { data: repos = [] } = useQuery<Repository[]>({
    queryKey: ["repositories"],
    queryFn: () => apiGet<Repository[]>("/api/v1/repositories"),
  });

  useEffect(() => {
    if (repos.length > 0 && !selectedRepoId && repos[0]) {
      setSelectedRepo(repos[0].id, repos[0].name);
    }
  }, [repos, selectedRepoId, setSelectedRepo]);

  // Center coordinate of radial graph
  const centerX = 340;
  const centerY = 240;
  const radius = 175;

  // Filtered modules
  const filteredModules = useMemo(() => {
    if (!searchFilter.trim()) return DEFAULT_MODULES;
    return DEFAULT_MODULES.filter(
      (m) =>
        m.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
        m.files.some((f) => f.toLowerCase().includes(searchFilter.toLowerCase()))
    );
  }, [searchFilter]);

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
              {selectedRepoName || "MLens-AI"}
            </span>
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1 h-1 rounded-full bg-emerald-500" />
              Indexed
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
              placeholder="Filter node..."
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
          {/* Subtle grid pattern background */}
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.35]"
            style={{
              backgroundImage: `radial-gradient(#D0D5DD 1px, transparent 1px)`,
              backgroundSize: "20px 20px",
            }}
          />

          {/* SVG Canvas for links & nodes */}
          <div
            className="relative transition-transform duration-200 ease-out"
            style={{
              transform: `scale(${zoom})`,
              width: "680px",
              height: "480px",
            }}
          >
            <svg className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="linkGradientActive" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#6C5CE7" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#A78BFA" stopOpacity="0.8" />
                </linearGradient>
                <linearGradient id="linkGradientDefault" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#D0D5DD" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="#E5E7EB" stopOpacity="0.6" />
                </linearGradient>
              </defs>

              {/* Concentric subtle guide rings */}
              <circle
                cx={centerX}
                cy={centerY}
                r={radius}
                fill="none"
                stroke="#E5E7EB"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
              <circle
                cx={centerX}
                cy={centerY}
                r={radius * 0.55}
                fill="none"
                stroke="#F1F3F8"
                strokeWidth="1"
                strokeDasharray="3 3"
              />

              {/* Connection links */}
              {filteredModules.map((m) => {
                const rad = (m.angle * Math.PI) / 180;
                const nodeX = centerX + radius * Math.cos(rad);
                const nodeY = centerY + radius * Math.sin(rad);
                const isSelected = selectedNode?.id === m.id;

                // Bezier curve with slight pull towards center
                return (
                  <g key={`link-${m.id}`}>
                    <path
                      d={`M ${centerX} ${centerY} L ${nodeX} ${nodeY}`}
                      stroke={isSelected ? "#6C5CE7" : "#D0D5DD"}
                      strokeWidth={isSelected ? 2.5 : 1.5}
                      strokeDasharray={isSelected ? "none" : "none"}
                      fill="none"
                      className="transition-all duration-300"
                    />
                    {/* Small pulse dot on active connection */}
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
                  {selectedRepoName || "MLens-AI"}
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

          {/* Canvas bottom hint */}
          <div className="absolute bottom-4 left-6 text-xs text-neutral-500 flex items-center gap-2 bg-white/80 backdrop-blur-xs px-3 py-1.5 rounded-lg border border-neutral-200">
            <span className="w-2 h-2 rounded-full bg-primary" />
            <span>Click any module node to inspect dependencies & related files</span>
          </div>
        </div>

        {/* Right Panel: Node Details (Matching Panel 05 Inspector) */}
        <div className="w-80 border-l border-neutral-200 bg-white flex flex-col shrink-0 p-6 space-y-6 overflow-y-auto">
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
                <div className="text-xs text-neutral-500">Sub-package Module</div>
              </div>
            </div>
          </div>

          {/* Properties list */}
          <div className="space-y-2.5 font-mono text-xs">
            <div className="flex items-center justify-between py-2 border-b border-neutral-100">
              <span className="text-neutral-500 font-sans">Type</span>
              <span className="font-semibold text-neutral-800">{selectedNode.type}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-neutral-100">
              <span className="text-neutral-500 font-sans">Files</span>
              <span className="font-semibold text-neutral-800">{selectedNode.filesCount}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-neutral-100">
              <span className="text-neutral-500 font-sans">Dependencies</span>
              <span className="font-semibold text-primary">{selectedNode.dependenciesCount}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-neutral-100">
              <span className="text-neutral-500 font-sans">Dependents</span>
              <span className="font-semibold text-emerald-600">{selectedNode.dependentsCount}</span>
            </div>
          </div>

          {/* Related Files list matching design */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
              Related Files ({selectedNode.files.length})
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

          {/* Bottom Action */}
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
        </div>
      </div>
    </div>
  );
};
