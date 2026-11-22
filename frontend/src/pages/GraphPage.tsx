import React, { useState, useEffect, useMemo, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  GitFork,
  AlertTriangle,
  Activity,
  Search,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  ExternalLink,
  Code2,
  Box,
  Layers,
  ShieldAlert,
  ArrowRight,
  Filter,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { apiGet } from "@/lib/api";
import { useRepositoryStore } from "@/stores/repository";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

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
  const navigate = useNavigate();
  const { selectedRepoId, setSelectedRepo } = useRepositoryStore();
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"topology" | "cycles" | "impact">("topology");
  const [searchFilter, setSearchFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  // Canvas zoom and pan state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement | null>(null);

  // 1. Fetch repositories
  const { data: repos = [] } = useQuery<Repository[]>({
    queryKey: ["repositories"],
    queryFn: () => apiGet<Repository[]>("/api/v1/repositories"),
  });

  useEffect(() => {
    if (repos.length > 0 && !selectedRepoId && repos[0]) {
      setSelectedRepo(repos[0].id, repos[0].name);
    }
  }, [repos, selectedRepoId, setSelectedRepo]);

  // 2. Fetch Graph Data
  const { data: graphData, isLoading: graphLoading } = useQuery<GraphData>({
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

  const nodes = useMemo(() => graphData?.nodes || [], [graphData]);
  const edges = useMemo(() => graphData?.edges || [], [graphData]);

  // Auto-select first node if none selected
  useEffect(() => {
    if (nodes.length > 0 && !selectedNodeId && nodes[0]) {
      setSelectedNodeId(nodes[0].id);
    }
  }, [nodes, selectedNodeId]);

  // Filtered nodes
  const filteredNodes = useMemo(() => {
    return nodes.filter((node) => {
      const matchesSearch =
        node.label.toLowerCase().includes(searchFilter.toLowerCase()) ||
        node.file_path.toLowerCase().includes(searchFilter.toLowerCase());
      const matchesType = typeFilter === "all" || node.type.toLowerCase() === typeFilter.toLowerCase();
      return matchesSearch && matchesType;
    });
  }, [nodes, searchFilter, typeFilter]);

  // Layout positioning calculation for graph visualization
  const nodePositions = useMemo(() => {
    const positions: Record<string, { x: number; y: number }> = {};
    const cols = Math.max(3, Math.ceil(Math.sqrt(filteredNodes.length * 1.5)));
    const spacingX = 260;
    const spacingY = 140;

    filteredNodes.forEach((node, idx) => {
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      // Slight staggered wave offset for visual dynamics
      const offsetY = (col % 2) * 20;
      positions[node.id] = {
        x: 100 + col * spacingX,
        y: 80 + row * spacingY + offsetY,
      };
    });
    return positions;
  }, [filteredNodes]);

  // Selected node object
  const selectedNode = useMemo(() => {
    return nodes.find((n) => n.id === selectedNodeId) || null;
  }, [nodes, selectedNodeId]);

  // Connected edges for the selected node
  const selectedNodeConnected = useMemo(() => {
    if (!selectedNodeId) return { incoming: [], outgoing: [] };
    const incoming = edges.filter((e) => e.target === selectedNodeId);
    const outgoing = edges.filter((e) => e.source === selectedNodeId);
    return { incoming, outgoing };
  }, [edges, selectedNodeId]);

  // Pan and drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  const handleMouseUp = () => setIsDragging(false);

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const getNodeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case "function":
        return {
          bg: "#14171C",
          border: "#6C8CFF",
          badge: "accent",
          icon: Code2,
        };
      case "class":
        return {
          bg: "#14171C",
          border: "#10B981",
          badge: "success",
          icon: Box,
        };
      case "module":
      case "file":
        return {
          bg: "#14171C",
          border: "#3B82F6",
          badge: "default",
          icon: Layers,
        };
      default:
        return {
          bg: "#14171C",
          border: "#A0A7B2",
          badge: "default",
          icon: GitFork,
        };
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-3.25rem)] bg-atlas-bg text-atlas-text overflow-hidden">
      {/* Top Controls Toolbar */}
      <div className="flex items-center justify-between px-6 py-2.5 border-b border-atlas-border bg-atlas-surface/90 backdrop-blur-sm z-10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <GitFork className="w-4 h-4 text-atlas-accent" />
            <span className="text-sm font-semibold tracking-tight">Code Intelligence Graph</span>
          </div>

          <div className="h-4 w-px bg-atlas-border" />

          {/* Repository Selector */}
          <select
            value={selectedRepoId || ""}
            onChange={(e) => {
              const r = repos.find((repo) => repo.id === e.target.value);
              setSelectedRepo(e.target.value, r?.name);
              setSelectedNodeId(null);
            }}
            className="bg-atlas-bg border border-atlas-border text-xs text-atlas-text rounded-md px-2.5 py-1 font-mono focus:outline-none focus:border-atlas-accent cursor-pointer"
          >
            {repos.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center bg-atlas-bg border border-atlas-border p-0.5 rounded-lg">
          <button
            onClick={() => setViewMode("topology")}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
              viewMode === "topology"
                ? "bg-atlas-accent text-white shadow-subtle"
                : "text-atlas-text-secondary hover:text-atlas-text"
            }`}
          >
            Topology ({nodes.length})
          </button>
          <button
            onClick={() => setViewMode("cycles")}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
              viewMode === "cycles"
                ? "bg-atlas-accent text-white shadow-subtle"
                : "text-atlas-text-secondary hover:text-atlas-text"
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span>Cycles ({cyclesData?.count || 0})</span>
          </button>
          <button
            onClick={() => setViewMode("impact")}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
              viewMode === "impact"
                ? "bg-atlas-accent text-white shadow-subtle"
                : "text-atlas-text-secondary hover:text-atlas-text"
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Blast Radius</span>
          </button>
        </div>
      </div>

      {/* Main Workspace Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left / Center: Visualization Canvas */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#0B0D10] relative">
          {viewMode === "topology" && (
            <>
              {/* Canvas Filter & Zoom Overlay */}
              <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-atlas-text-muted absolute left-2.5 top-2.5 pointer-events-none" />
                  <input
                    type="text"
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    placeholder="Filter nodes..."
                    className="h-8 pl-8 pr-3 text-xs bg-atlas-surface/90 backdrop-blur-md border border-atlas-border rounded-md text-atlas-text placeholder:text-atlas-text-muted focus:outline-none focus:border-atlas-accent w-48 shadow-subtle"
                  />
                </div>

                <div className="flex items-center gap-1 bg-atlas-surface/90 backdrop-blur-md border border-atlas-border rounded-md p-1 shadow-subtle">
                  <Filter className="w-3 h-3 text-atlas-text-muted ml-1" />
                  {["all", "function", "class", "module"].map((t) => (
                    <button
                      key={t}
                      onClick={() => setTypeFilter(t)}
                      className={`px-2 py-0.5 text-[10px] font-mono rounded capitalize transition-colors ${
                        typeFilter === t
                          ? "bg-atlas-accent text-white font-medium"
                          : "text-atlas-text-secondary hover:text-atlas-text"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Canvas Zoom Controls */}
              <div className="absolute bottom-4 left-4 z-20 flex items-center gap-1 bg-atlas-surface/90 backdrop-blur-md border border-atlas-border rounded-md p-1 shadow-subtle">
                <button
                  onClick={() => setZoom((z) => Math.min(z + 0.15, 2.5))}
                  title="Zoom In"
                  className="p-1.5 text-atlas-text-secondary hover:text-atlas-text hover:bg-atlas-hover rounded"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setZoom((z) => Math.max(z - 0.15, 0.4))}
                  title="Zoom Out"
                  className="p-1.5 text-atlas-text-secondary hover:text-atlas-text hover:bg-atlas-hover rounded"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <div className="h-3 w-px bg-atlas-border mx-0.5" />
                <button
                  onClick={resetView}
                  title="Reset View"
                  className="p-1.5 text-atlas-text-secondary hover:text-atlas-text hover:bg-atlas-hover rounded"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
                <span className="text-[10px] font-mono text-atlas-text-muted px-1.5">
                  {Math.round(zoom * 100)}%
                </span>
              </div>

              {/* Interactive SVG Canvas */}
              <div
                className="w-full h-full cursor-grab active:cursor-grabbing select-none overflow-hidden"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
              >
                <svg
                  ref={svgRef}
                  className="w-full h-full"
                  style={{
                    transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                    transformOrigin: "center center",
                    transition: isDragging ? "none" : "transform 150ms ease-out",
                  }}
                >
                  <defs>
                    <marker
                      id="arrow"
                      viewBox="0 0 10 10"
                      refX="10"
                      refY="5"
                      markerWidth="6"
                      markerHeight="6"
                      orient="auto-start-reverse"
                    >
                      <path d="M 0 0 L 10 5 L 0 10 z" fill="#343B45" />
                    </marker>
                    <marker
                      id="arrow-active"
                      viewBox="0 0 10 10"
                      refX="10"
                      refY="5"
                      markerWidth="6"
                      markerHeight="6"
                      orient="auto-start-reverse"
                    >
                      <path d="M 0 0 L 10 5 L 0 10 z" fill="#6C8CFF" />
                    </marker>
                  </defs>

                  {/* Render Edges */}
                  <g className="edges">
                    {edges.map((edge, i) => {
                      const sourcePos = nodePositions[edge.source];
                      const targetPos = nodePositions[edge.target];
                      if (!sourcePos || !targetPos) return null;

                      const isEdgeActive =
                        edge.source === selectedNodeId || edge.target === selectedNodeId;

                      // Midpoint bezier curve
                      const midX = (sourcePos.x + targetPos.x) / 2;
                      const midY = (sourcePos.y + targetPos.y) / 2 - 15;

                      return (
                        <path
                          key={i}
                          d={`M ${sourcePos.x} ${sourcePos.y} Q ${midX} ${midY} ${targetPos.x} ${targetPos.y}`}
                          fill="none"
                          stroke={isEdgeActive ? "#6C8CFF" : "#262B33"}
                          strokeWidth={isEdgeActive ? 2 : 1}
                          strokeOpacity={isEdgeActive ? 0.9 : 0.4}
                          markerEnd={isEdgeActive ? "url(#arrow-active)" : "url(#arrow)"}
                        />
                      );
                    })}
                  </g>

                  {/* Render Nodes */}
                  <g className="nodes">
                    {filteredNodes.map((node) => {
                      const pos = nodePositions[node.id];
                      if (!pos) return null;

                      const isSelected = node.id === selectedNodeId;
                      const style = getNodeColor(node.type);
                      const Icon = style.icon;

                      return (
                        <g
                          key={node.id}
                          transform={`translate(${pos.x - 90}, ${pos.y - 25})`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedNodeId(node.id);
                          }}
                          className="cursor-pointer group"
                        >
                          {/* Node Box */}
                          <rect
                            width="180"
                            height="50"
                            rx="8"
                            fill={isSelected ? "#191D23" : "#14171C"}
                            stroke={isSelected ? "#6C8CFF" : "#262B33"}
                            strokeWidth={isSelected ? 2 : 1}
                            className="transition-all duration-150 group-hover:stroke-atlas-border-strong"
                          />

                          {/* Node Icon */}
                          <foreignObject x="8" y="10" width="30" height="30">
                            <div
                              className={`w-7 h-7 rounded flex items-center justify-center border ${
                                isSelected
                                  ? "bg-atlas-accent/20 border-atlas-accent text-atlas-accent"
                                  : "bg-atlas-surface-secondary border-atlas-border text-atlas-text-secondary"
                              }`}
                            >
                              <Icon className="w-3.5 h-3.5" />
                            </div>
                          </foreignObject>

                          {/* Node Label & Subtitle */}
                          <text
                            x="44"
                            y="22"
                            fill="#F1F3F5"
                            fontSize="11"
                            fontWeight={isSelected ? "600" : "500"}
                            fontFamily="JetBrains Mono, monospace"
                          >
                            {node.label.length > 14
                              ? node.label.slice(0, 13) + "…"
                              : node.label}
                          </text>

                          <text
                            x="44"
                            y="38"
                            fill="#69717D"
                            fontSize="9"
                            fontFamily="sans-serif"
                          >
                            {node.type.toUpperCase()} · L{node.start_line || 1}
                          </text>
                        </g>
                      );
                    })}
                  </g>
                </svg>
              </div>
            </>
          )}

          {/* Cycles View */}
          {viewMode === "cycles" && (
            <div className="flex-1 p-6 overflow-y-auto max-w-4xl w-full mx-auto space-y-4">
              <Card variant="feature" className="p-5 space-y-2">
                <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Circular Dependency Audit ({cyclesData?.count || 0} cycles)</span>
                </div>
                <p className="text-xs text-atlas-text-secondary leading-relaxed">
                  Cycles between modules impede modular refactoring, prevent clear ownership boundaries,
                  and cause order-of-initialization bugs in production runtimes.
                </p>
              </Card>

              {cyclesData?.cycles_found.length === 0 ? (
                <div className="p-12 text-center text-xs text-emerald-400 bg-atlas-surface border border-atlas-border rounded-xl">
                  ✓ Clean architecture: Zero circular dependencies detected in this codebase.
                </div>
              ) : (
                cyclesData?.cycles_found.map((cycle, idx) => (
                  <Card key={idx} className="p-4 border-amber-500/30 space-y-3 font-mono text-xs">
                    <div className="flex items-center justify-between text-[11px] text-amber-400 font-semibold">
                      <span>Cycle #{idx + 1}</span>
                      <Badge variant="warning">{cycle.length} nodes in loop</Badge>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap text-atlas-text">
                      {cycle.cycle_labels.map((lbl, lIdx) => (
                        <React.Fragment key={lIdx}>
                          <span className="px-2.5 py-1 bg-atlas-surface-secondary border border-atlas-border rounded text-xs font-mono text-atlas-text">
                            {lbl}
                          </span>
                          {lIdx < cycle.cycle_labels.length - 1 && (
                            <ArrowRight className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </Card>
                ))
              )}
            </div>
          )}

          {/* Blast Radius Impact View */}
          {viewMode === "impact" && (
            <div className="flex-1 p-6 overflow-y-auto max-w-4xl w-full mx-auto space-y-4">
              <Card variant="feature" className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-atlas-accent font-semibold text-sm">
                    <ShieldAlert className="w-4 h-4" />
                    <span>Blast Radius & Change Impact Analysis</span>
                  </div>
                  {impactData && (
                    <Badge
                      variant={
                        impactData.risk_level === "CRITICAL"
                          ? "danger"
                          : impactData.risk_level === "HIGH"
                          ? "warning"
                          : "accent"
                      }
                    >
                      {impactData.risk_level} RISK
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-atlas-text-secondary leading-relaxed">
                  Predicts cascading failures before modifying or refactoring a symbol by traversing
                  the repository AST call graph up to $N$-hops.
                </p>

                {impactData && (
                  <div className="pt-2">
                    <div className="flex items-center justify-between text-xs font-mono mb-1">
                      <span className="text-atlas-text-muted">Blast Radius Score</span>
                      <span className="font-semibold text-atlas-text">
                        {(impactData.blast_radius_score * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-atlas-surface-secondary rounded-full overflow-hidden border border-atlas-border">
                      <div
                        className={`h-full transition-all duration-300 ${
                          impactData.risk_level === "CRITICAL"
                            ? "bg-rose-500"
                            : impactData.risk_level === "HIGH"
                            ? "bg-amber-500"
                            : "bg-atlas-accent"
                        }`}
                        style={{ width: `${Math.min(100, impactData.blast_radius_score * 100)}%` }}
                      />
                    </div>
                  </div>
                )}
              </Card>

              {impactData && (
                <div className="grid grid-cols-2 gap-4">
                  {/* Upstream Callers */}
                  <Card className="p-4 space-y-3">
                    <div className="flex items-center justify-between border-b border-atlas-border pb-2">
                      <span className="text-xs font-semibold text-atlas-text">
                        Upstream Callers ({impactData.upstream_dependents.length})
                      </span>
                      <span className="text-[10px] text-atlas-text-muted">Affected on change</span>
                    </div>
                    <div className="space-y-2 max-h-64 overflow-y-auto font-mono text-xs">
                      {impactData.upstream_dependents.length === 0 ? (
                        <p className="text-atlas-text-muted text-[11px] py-4 text-center">
                          No upstream callers (Entrypoint / Leaf)
                        </p>
                      ) : (
                        impactData.upstream_dependents.map((dep, i) => (
                          <div
                            key={i}
                            className="p-2 rounded bg-atlas-surface-secondary border border-atlas-border space-y-0.5"
                          >
                            <div className="text-atlas-accent font-medium">{dep.label}</div>
                            <div className="text-[10px] text-atlas-text-muted truncate">{dep.file}</div>
                          </div>
                        ))
                      )}
                    </div>
                  </Card>

                  {/* Downstream Dependencies */}
                  <Card className="p-4 space-y-3">
                    <div className="flex items-center justify-between border-b border-atlas-border pb-2">
                      <span className="text-xs font-semibold text-atlas-text">
                        Downstream Dependencies ({impactData.downstream_dependencies.length})
                      </span>
                      <span className="text-[10px] text-atlas-text-muted">Directly referenced</span>
                    </div>
                    <div className="space-y-2 max-h-64 overflow-y-auto font-mono text-xs">
                      {impactData.downstream_dependencies.length === 0 ? (
                        <p className="text-atlas-text-muted text-[11px] py-4 text-center">
                          No downstream dependencies
                        </p>
                      ) : (
                        impactData.downstream_dependencies.map((dep, i) => (
                          <div
                            key={i}
                            className="p-2 rounded bg-atlas-surface-secondary border border-atlas-border space-y-0.5"
                          >
                            <div className="text-emerald-400 font-medium">{dep.label}</div>
                            <div className="text-[10px] text-atlas-text-muted truncate">{dep.file}</div>
                          </div>
                        ))
                      )}
                    </div>
                  </Card>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Selected Node Intelligence Panel */}
        <div className="w-80 border-l border-atlas-border bg-atlas-sidebar p-5 flex flex-col justify-between shrink-0 overflow-y-auto">
          {selectedNode ? (
            <div className="space-y-5">
              {/* Header Title */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <Badge variant={getNodeColor(selectedNode.type).badge as any}>
                    {selectedNode.type.toUpperCase()}
                  </Badge>
                  <span className="text-[10px] font-mono text-atlas-text-muted">
                    L{selectedNode.start_line || 1} - L{selectedNode.end_line || 1}
                  </span>
                </div>
                <h2 className="text-sm font-semibold font-mono text-atlas-text break-words">
                  {selectedNode.label}
                </h2>
                <p className="text-[11px] text-atlas-text-muted font-mono mt-1 break-all">
                  {selectedNode.file_path}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  leftIcon={<ExternalLink className="w-3.5 h-3.5" />}
                  onClick={() => navigate("/repositories")}
                >
                  View Code in Repo Explorer
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  leftIcon={<Activity className="w-3.5 h-3.5" />}
                  onClick={() => setViewMode("impact")}
                >
                  Analyze Blast Radius
                </Button>
              </div>

              {/* Edge Connections */}
              <div className="space-y-4 pt-2 border-t border-atlas-border">
                {/* Outgoing Calls */}
                <div>
                  <div className="text-[11px] font-mono uppercase tracking-wider text-atlas-text-muted mb-2">
                    Outgoing Calls ({selectedNodeConnected.outgoing.length})
                  </div>
                  <div className="space-y-1 max-h-36 overflow-y-auto">
                    {selectedNodeConnected.outgoing.length === 0 ? (
                      <p className="text-[11px] text-atlas-text-muted">None detected</p>
                    ) : (
                      selectedNodeConnected.outgoing.map((e, idx) => {
                        const target = nodes.find((n) => n.id === e.target);
                        return (
                          <div
                            key={idx}
                            onClick={() => setSelectedNodeId(e.target)}
                            className="p-1.5 rounded bg-atlas-surface border border-atlas-border hover:border-atlas-accent/40 text-xs font-mono cursor-pointer transition-colors"
                          >
                            <span className="text-atlas-text truncate block">
                              {target ? target.label : e.target}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Incoming Callers */}
                <div>
                  <div className="text-[11px] font-mono uppercase tracking-wider text-atlas-text-muted mb-2">
                    Incoming Callers ({selectedNodeConnected.incoming.length})
                  </div>
                  <div className="space-y-1 max-h-36 overflow-y-auto">
                    {selectedNodeConnected.incoming.length === 0 ? (
                      <p className="text-[11px] text-atlas-text-muted">None detected</p>
                    ) : (
                      selectedNodeConnected.incoming.map((e, idx) => {
                        const source = nodes.find((n) => n.id === e.source);
                        return (
                          <div
                            key={idx}
                            onClick={() => setSelectedNodeId(e.source)}
                            className="p-1.5 rounded bg-atlas-surface border border-atlas-border hover:border-atlas-accent/40 text-xs font-mono cursor-pointer transition-colors"
                          >
                            <span className="text-atlas-text truncate block">
                              {source ? source.label : e.source}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-xs text-atlas-text-muted">
              {graphLoading ? "Loading graph data..." : "Select a node to inspect relationships."}
            </div>
          )}

          {/* Quick Metrics Footer */}
          <div className="border-t border-atlas-border pt-3 mt-4 text-[10px] font-mono text-atlas-text-muted flex justify-between">
            <span>TOTAL NODES: {nodes.length}</span>
            <span>EDGES: {edges.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
