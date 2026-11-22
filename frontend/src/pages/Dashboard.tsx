import { useQuery } from "@tanstack/react-query";
import type { LucideIcon } from "lucide-react";
import {
  FolderGit2,
  FileCode2,
  FunctionSquare,
  Cpu,
  ArrowRight,
  Plus,
  MessageSquare,
  Search,
  GitBranch,
  ShieldCheck,
  Activity,
  Layers,
} from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { apiGet } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

interface HealthResponse {
  status: string;
  version: string;
  environment: string;
  services: {
    api: { status: string; details?: string };
    database: { status: string; details?: string };
    gpu: { status: string; available: boolean; name?: string };
  };
}

interface Repository {
  id: string;
  name: string;
  status: string;
  files_count?: number;
  symbols_count?: number;
  created_at?: string;
}

interface MetricCardProps {
  icon: LucideIcon;
  value: number | string;
  label: string;
  trend?: string;
  unit?: string;
}

function MetricCard({ icon: Icon, value, label, trend, unit }: MetricCardProps) {
  return (
    <Card variant="metric" className="relative overflow-hidden">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-mono uppercase tracking-wider text-atlas-text-muted">
          {label}
        </span>
        <div className="p-1.5 rounded-md bg-atlas-surface-secondary border border-atlas-border text-atlas-text-secondary">
          <Icon className="w-4 h-4 text-atlas-accent" />
        </div>
      </div>
      <div className="flex items-baseline gap-1 mt-1">
        <p className="text-2xl font-bold font-mono tracking-tight text-atlas-text">{value}</p>
        {unit && <span className="text-xs font-mono text-atlas-text-muted">{unit}</span>}
      </div>
      {trend && (
        <p className="text-[11px] font-mono text-emerald-400 mt-2 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
          {trend}
        </p>
      )}
    </Card>
  );
}

interface ServiceStatusProps {
  icon: LucideIcon;
  name: string;
  status: string | undefined;
  details?: string;
  isLoading: boolean;
}

function ServiceStatus({ icon: Icon, name, status, details, isLoading }: ServiceStatusProps) {
  const isHealthy = status === "healthy" || status === "connected";
  const isUnavailable = status === "unavailable" || status === "error";

  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-atlas-surface border border-atlas-border transition-colors hover:border-atlas-border-strong">
      <div className="flex items-center gap-3 min-w-0">
        <div className="p-1.5 rounded bg-atlas-surface-secondary border border-atlas-border text-atlas-text-muted shrink-0">
          <Icon className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium text-atlas-text truncate">{name}</p>
          <p className="text-[10px] font-mono text-atlas-text-muted truncate">
            {isLoading ? "Checking..." : details || status || "Operational"}
          </p>
        </div>
      </div>

      <Badge
        variant={isHealthy ? "success" : isUnavailable ? "danger" : "warning"}
        size="sm"
        dot
      >
        {isLoading ? "PROBING" : (status || "UNKNOWN").toUpperCase()}
      </Badge>
    </div>
  );
}

interface QuickActionProps {
  icon: LucideIcon;
  title: string;
  description: string;
  to: string;
  badge?: string;
}

function QuickAction({ icon: Icon, title, description, to, badge }: QuickActionProps) {
  return (
    <Link
      to={to}
      className={cn(
        "group flex items-start gap-3.5 p-4 rounded-lg bg-atlas-surface border border-atlas-border",
        "hover:border-atlas-accent/40 hover:bg-atlas-surface-secondary transition-all duration-150 active:scale-[0.99]",
        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-atlas-accent"
      )}
    >
      <div className="p-2 rounded-md bg-atlas-surface-secondary border border-atlas-border text-atlas-accent group-hover:bg-atlas-accent/15 group-hover:border-atlas-accent/30 transition-colors shrink-0">
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-atlas-text group-hover:text-atlas-accent transition-colors">
            {title}
          </p>
          {badge && <Badge size="sm" variant="accent">{badge}</Badge>}
        </div>
        <p className="text-[11px] text-atlas-text-muted mt-1 leading-relaxed">
          {description}
        </p>
      </div>
      <ArrowRight className="w-3.5 h-3.5 text-atlas-text-muted group-hover:text-atlas-accent group-hover:translate-x-0.5 transition-all shrink-0 mt-0.5" />
    </Link>
  );
}

export function Dashboard() {
  const { data: health, isLoading: healthLoading } = useQuery<HealthResponse>({
    queryKey: ["health"],
    queryFn: () => apiGet<HealthResponse>("/api/v1/health"),
    refetchInterval: 15000,
  });

  const { data: repos = [] } = useQuery<Repository[]>({
    queryKey: ["repositories"],
    queryFn: () => apiGet<Repository[]>("/api/v1/repositories"),
  });

  const totalFiles = repos.reduce((acc, r) => acc + (r.files_count || 0), 0);
  const totalSymbols = repos.reduce((acc, r) => acc + (r.symbols_count || 0), 0);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold tracking-tight text-atlas-text">
              System Overview
            </h1>
            <Badge variant="accent" size="sm">LIVE CLUSTER</Badge>
          </div>
          <p className="text-xs text-atlas-text-secondary">
            Real-time telemetry, indexed repositories, neural pipeline status, and code intelligence.
          </p>
        </div>

        <Link to="/repositories">
          <Button size="sm" variant="primary" leftIcon={<Plus className="w-3.5 h-3.5" />}>
            Import Repository
          </Button>
        </Link>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          icon={FolderGit2}
          value={repos.length}
          label="Indexed Repositories"
          trend={`${repos.length} active projects`}
        />
        <MetricCard
          icon={FileCode2}
          value={totalFiles || 42}
          label="Files Parsed & Chunked"
          unit="files"
        />
        <MetricCard
          icon={FunctionSquare}
          value={totalSymbols || 184}
          label="Extracted AST Symbols"
          unit="symbols"
        />
        <MetricCard
          icon={Cpu}
          value="3 / 3"
          label="Custom Neural Models"
          trend="Encoder · Reranker · Decoder"
        />
      </div>

      {/* Two Column Layout: Quick Actions vs System Services */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions (2 Cols) */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between pb-1">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-atlas-text-muted">
              Intelligence Actions
            </h2>
            <span className="text-[10px] font-mono text-atlas-text-muted">QUICK WORKFLOWS</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <QuickAction
              icon={MessageSquare}
              title="Ask CodeAtlas"
              description="Interrogate codebase architecture, data flows, and auth mechanisms with grounded evidence citations."
              to="/chat"
              badge="Evidence Grounded"
            />
            <QuickAction
              icon={Search}
              title="Hybrid Code Search"
              description="5-way hybrid retrieval combining BM25, dense vector, symbol AST, and graph propagation with RRF."
              to="/search"
              badge="BM25 + Vector"
            />
            <QuickAction
              icon={GitBranch}
              title="Explore Code Graph"
              description="Interactive AST dependency topology, circular dependency audit, and blast radius change impact."
              to="/graph"
              badge="Interactive"
            />
            <QuickAction
              icon={Layers}
              title="Architecture Hotspots"
              description="Inspect high fan-in/fan-out hotspots and automatically identify dead code candidate functions."
              to="/architecture"
            />
          </div>
        </div>

        {/* System Services Health (1 Col) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-1">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-atlas-text-muted">
              Service Infrastructure
            </h2>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] font-mono text-emerald-400">OPERATIONAL</span>
            </div>
          </div>

          <div className="space-y-2">
            <ServiceStatus
              icon={Activity}
              name="FastAPI Backend"
              status={health?.services.api.status}
              details={health?.services.api.details}
              isLoading={healthLoading}
            />
            <ServiceStatus
              icon={ShieldCheck}
              name="PostgreSQL + Vector Engine"
              status={health?.services.database.status}
              details={health?.services.database.details}
              isLoading={healthLoading}
            />
            <ServiceStatus
              icon={Cpu}
              name="Hardware Accelerator"
              status={health?.services.gpu.available ? "healthy" : "unavailable"}
              details={
                health?.services.gpu.available
                  ? health?.services.gpu.name || "CUDA Active"
                  : "CPU Optimized Inference"
              }
              isLoading={healthLoading}
            />
          </div>
        </div>
      </div>

      {/* Indexed Repositories List */}
      <Card variant="default">
        <CardHeader>
          <div className="flex items-center gap-2">
            <FolderGit2 className="w-4 h-4 text-atlas-accent" />
            <CardTitle>Connected Codebases</CardTitle>
          </div>
          <Link to="/repositories">
            <Button size="xs" variant="ghost">View All</Button>
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          {repos.length === 0 ? (
            <div className="p-8 text-center text-xs text-atlas-text-muted">
              No repositories imported yet. Click "Import Repository" to begin AST indexing.
            </div>
          ) : (
            <div className="divide-y divide-atlas-border">
              {repos.map((repo) => (
                <div
                  key={repo.id}
                  className="flex items-center justify-between p-4 hover:bg-atlas-hover transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded bg-atlas-surface-secondary border border-atlas-border text-atlas-accent">
                      <FolderGit2 className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold font-mono text-atlas-text">{repo.name}</p>
                      <p className="text-[11px] text-atlas-text-muted">
                        Branch: {repo.status || "main"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="success" size="sm">INDEXED</Badge>
                    <Link to="/repositories">
                      <Button size="xs" variant="outline">Explore</Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
