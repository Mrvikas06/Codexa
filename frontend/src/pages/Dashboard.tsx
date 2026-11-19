import { useQuery } from "@tanstack/react-query";
import type { LucideIcon } from "lucide-react";
import {
  FolderGit2,
  FileCode2,
  FunctionSquare,
  Brain,
  Server,
  Database,
  Cpu,
  ArrowRight,
  Plus,
  MessageSquare,
  Search,
  GitBranch,
  Inbox,
} from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { apiGet } from "@/lib/api";

interface HealthResponse {
  status: string;
  services: {
    api: { status: string };
    database: { status: string };
    gpu: { status: string; available: boolean };
  };
}

interface StatCardProps {
  icon: LucideIcon;
  value: number;
  label: string;
}

function StatCard({ icon: Icon, value, label }: StatCardProps) {
  return (
    <div className="bg-atlas-surface border border-atlas-border rounded p-5">
      <div className="flex items-center justify-between mb-3">
        <Icon size={20} className="text-atlas-text-muted" />
      </div>
      <p className="text-2xl font-semibold text-atlas-text">{value}</p>
      <p className="text-sm text-atlas-text-secondary mt-1">{label}</p>
    </div>
  );
}

interface ServiceStatusProps {
  icon: LucideIcon;
  name: string;
  status: string | undefined;
  isLoading: boolean;
}

function ServiceStatus({ icon: Icon, name, status, isLoading }: ServiceStatusProps) {
  const statusColor =
    status === "healthy" || status === "connected"
      ? "bg-green-500"
      : status === "unavailable" || status === "error"
        ? "bg-red-500"
        : "bg-yellow-500";

  return (
    <div className="flex items-center gap-3 bg-atlas-surface border border-atlas-border rounded p-4">
      <Icon size={18} className="text-atlas-text-muted shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-atlas-text">{name}</p>
        <p className="text-xs text-atlas-text-muted">
          {isLoading ? "Checking..." : status ?? "Unknown"}
        </p>
      </div>
      <span
        className={cn(
          "w-2 h-2 rounded-full shrink-0",
          isLoading ? "bg-yellow-500 animate-pulse" : statusColor
        )}
      />
    </div>
  );
}

interface QuickActionProps {
  icon: LucideIcon;
  title: string;
  description: string;
  to: string;
}

function QuickAction({ icon: Icon, title, description, to }: QuickActionProps) {
  return (
    <Link
      to={to}
      className={cn(
        "group flex items-start gap-4 bg-atlas-surface border border-atlas-border rounded p-5",
        "hover:border-atlas-border-strong hover:bg-atlas-hover transition-colors duration-150",
        "focus:outline-none focus:ring-1 focus:ring-atlas-accent"
      )}
    >
      <div className="p-2 rounded bg-atlas-surface-secondary shrink-0">
        <Icon size={20} className="text-atlas-text-muted group-hover:text-atlas-accent transition-colors" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-atlas-text">{title}</p>
        <p className="text-xs text-atlas-text-muted mt-1">{description}</p>
      </div>
      <ArrowRight
        size={16}
        className="text-atlas-text-muted opacity-0 group-hover:opacity-100 transition-opacity mt-1 shrink-0"
      />
    </Link>
  );
}

export function Dashboard() {
  const healthQuery = useQuery<HealthResponse>({
    queryKey: ["health"],
    queryFn: () => apiGet<HealthResponse>("/api/v1/health"),
    refetchInterval: 30000,
    retry: 1,
  });

  const services = healthQuery.data?.services;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <header>
        <h1 className="text-xl font-semibold text-atlas-text">Dashboard</h1>
      </header>

      {/* Stat cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={FolderGit2} value={0} label="Repositories" />
        <StatCard icon={FileCode2} value={0} label="Files Analyzed" />
        <StatCard icon={FunctionSquare} value={0} label="Functions Extracted" />
        <StatCard icon={Brain} value={0} label="Models Trained" />
      </section>

      {/* System Health */}
      <section>
        <h2 className="text-sm font-medium text-atlas-text-secondary mb-3">
          System Health
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <ServiceStatus
            icon={Server}
            name="API"
            status={services?.api?.status}
            isLoading={healthQuery.isLoading}
          />
          <ServiceStatus
            icon={Database}
            name="Database"
            status={services?.database?.status}
            isLoading={healthQuery.isLoading}
          />
          <ServiceStatus
            icon={Cpu}
            name="GPU"
            status={services?.gpu?.available ? services.gpu.status : "unavailable"}
            isLoading={healthQuery.isLoading}
          />
        </div>
      </section>

      {/* Recent Activity */}
      <section>
        <h2 className="text-sm font-medium text-atlas-text-secondary mb-3">
          Recent Activity
        </h2>
        <div className="bg-atlas-surface border border-atlas-border rounded p-8 flex flex-col items-center justify-center text-center">
          <Inbox size={32} className="text-atlas-text-muted mb-3" />
          <p className="text-sm text-atlas-text-secondary">No recent activity</p>
          <p className="text-xs text-atlas-text-muted mt-1">
            Import a repository to get started
          </p>
        </div>
      </section>

      {/* Quick Actions */}
      <section>
        <h2 className="text-sm font-medium text-atlas-text-secondary mb-3">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <QuickAction
            icon={Plus}
            title="Import Repository"
            description="Clone and analyze a Git repository"
            to="/repositories"
          />
          <QuickAction
            icon={MessageSquare}
            title="Ask a Question"
            description="Query your codebase with natural language"
            to="/chat"
          />
          <QuickAction
            icon={Search}
            title="Search Code"
            description="Semantic search across all indexed code"
            to="/search"
          />
          <QuickAction
            icon={GitBranch}
            title="View Graph"
            description="Explore code relationships and dependencies"
            to="/graph"
          />
        </div>
      </section>
    </div>
  );
}
