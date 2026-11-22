import { useQuery } from "@tanstack/react-query";
import type { LucideIcon } from "lucide-react";
import {
  FolderGit2,
  FileCode2,
  FunctionSquare,
  AlertTriangle,
  ArrowRight,
  Plus,
  GitBranch,
  ShieldAlert,
  Layers,
  MessageSquare,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { apiGet } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useRepositoryStore } from "@/stores/repository";

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
  trendPositive?: boolean;
}

function MetricCard({ icon: Icon, value, label, trend, trendPositive = true }: MetricCardProps) {
  return (
    <Card variant="metric" className="bg-codexa-surface border-codexa-border shadow-card p-5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-codexa-text-secondary">
          {label}
        </span>
        <div className="p-2 rounded-xl bg-codexa-violet-surface text-codexa-primary">
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="flex items-baseline justify-between mt-2">
        <p className="text-3xl font-extrabold font-mono tracking-tight text-codexa-text">{value}</p>
        {trend && (
          <span
            className={`px-2 py-0.5 rounded-md text-[11px] font-mono font-bold ${
              trendPositive
                ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                : "bg-red-50 text-red-600 border border-red-200"
            }`}
          >
            {trend}
          </span>
        )}
      </div>
    </Card>
  );
}

export function Dashboard() {
  const navigate = useNavigate();
  const { setSelectedRepo } = useRepositoryStore();

  const { data: repos = [] } = useQuery<Repository[]>({
    queryKey: ["repositories"],
    queryFn: () => apiGet<Repository[]>("/api/v1/repositories"),
  });

  const recentRepositories = [
    {
      id: "repo-1",
      name: "MLens-AI",
      updated: "Updated 15 min ago",
      status: "Indexed",
      statusVariant: "success" as const,
    },
    {
      id: "repo-2",
      name: "FastAPI-Boilerplate",
      updated: "Updated 2 hrs ago",
      status: "Indexed",
      statusVariant: "success" as const,
    },
    {
      id: "repo-3",
      name: "ecommerce-platform",
      updated: "Updated 5 hrs ago",
      status: "Processing",
      statusVariant: "info" as const,
    },
    {
      id: "repo-4",
      name: "nlp-tools",
      updated: "Updated 1 day ago",
      status: "3 Issues",
      statusVariant: "warning" as const,
    },
  ];

  const recentActivities = [
    {
      title: "Repository indexed",
      time: "12 min ago",
      icon: FolderGit2,
      color: "text-codexa-primary",
      bg: "bg-codexa-violet-surface",
    },
    {
      title: "Code graph generated",
      time: "17 min ago",
      icon: GitBranch,
      color: "text-codexa-indigo",
      bg: "bg-codexa-violet-surface",
    },
    {
      title: "3 potential issues detected",
      time: "35 min ago",
      icon: AlertTriangle,
      color: "text-codexa-warning",
      bg: "bg-amber-50",
    },
    {
      title: "Architecture analysis completed",
      time: "22 min ago",
      icon: Layers,
      color: "text-codexa-cyan",
      bg: "bg-sky-50",
    },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-codexa-text">
            Welcome back, Shaurya 👋
          </h1>
          <p className="text-xs text-codexa-text-secondary mt-1">
            Here's what's happening with your codebases.
          </p>
        </div>

        <Link to="/repositories">
          <Button size="md" variant="primary" leftIcon={<Plus className="w-4 h-4" />}>
            Analyze Repository
          </Button>
        </Link>
      </div>

      {/* Metric Cards (4 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          icon={FolderGit2}
          value={repos.length > 0 ? repos.length : 12}
          label="Repositories"
          trend="+2"
          trendPositive={true}
        />
        <MetricCard
          icon={FileCode2}
          value="24,860"
          label="Files"
          trend="+12%"
          trendPositive={true}
        />
        <MetricCard
          icon={FunctionSquare}
          value="8,421"
          label="Functions"
          trend="+22%"
          trendPositive={true}
        />
        <MetricCard
          icon={ShieldAlert}
          value="37"
          label="Issues"
          trend="-10%"
          trendPositive={false}
        />
      </div>

      {/* Main Two Columns: Recent Repositories vs Activity Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Repositories (7 cols) */}
        <div className="lg:col-span-7">
          <Card className="overflow-hidden">
            <CardHeader className="flex items-center justify-between">
              <CardTitle>Recent Repositories</CardTitle>
              <Link to="/repositories" className="text-xs font-semibold text-codexa-primary hover:underline">
                View all
              </Link>
            </CardHeader>
            <CardContent className="p-0 divide-y divide-codexa-border">
              {recentRepositories.map((repo) => (
                <div
                  key={repo.id}
                  onClick={() => {
                    setSelectedRepo(repo.id, repo.name);
                    navigate("/repositories");
                  }}
                  className="flex items-center justify-between p-4.5 hover:bg-codexa-surface-hover cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-codexa-bg-secondary border border-codexa-border flex items-center justify-center text-codexa-text-secondary shrink-0">
                      <FolderGit2 className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold font-mono text-codexa-text truncate">
                        {repo.name}
                      </p>
                      <p className="text-[11px] text-codexa-text-muted mt-0.5">
                        {repo.updated}
                      </p>
                    </div>
                  </div>

                  <Badge variant={repo.statusVariant} size="sm" dot>
                    {repo.status}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Activity Stream (5 cols) */}
        <div className="lg:col-span-5">
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle>Activity</CardTitle>
            </CardHeader>
            <CardContent className="p-0 divide-y divide-codexa-border">
              {recentActivities.map((act, index) => {
                const Icon = act.icon;
                return (
                  <div key={index} className="flex items-center justify-between p-4 hover:bg-codexa-surface-hover transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-8 h-8 rounded-lg ${act.bg} flex items-center justify-center ${act.color} shrink-0`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-codexa-text truncate">
                          {act.title}
                        </p>
                        <p className="text-[11px] text-codexa-text-muted">
                          {act.time}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Access Intelligence Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
        <Link to="/chat" className="block">
          <Card variant="interactive" className="p-5 flex items-center justify-between group">
            <div className="flex items-center gap-3.5">
              <div className="p-2.5 rounded-xl bg-codexa-violet-surface text-codexa-primary group-hover:scale-105 transition-transform">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-codexa-text">Ask Codexa</h3>
                <p className="text-[11px] text-codexa-text-muted mt-0.5">Grounded code Q&A</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-codexa-text-muted group-hover:text-codexa-primary group-hover:translate-x-1 transition-all" />
          </Card>
        </Link>

        <Link to="/graph" className="block">
          <Card variant="interactive" className="p-5 flex items-center justify-between group">
            <div className="flex items-center gap-3.5">
              <div className="p-2.5 rounded-xl bg-codexa-violet-surface text-codexa-indigo group-hover:scale-105 transition-transform">
                <GitBranch className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-codexa-text">Code Graph</h3>
                <p className="text-[11px] text-codexa-text-muted mt-0.5">Dependency topology</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-codexa-text-muted group-hover:text-codexa-primary group-hover:translate-x-1 transition-all" />
          </Card>
        </Link>

        <Link to="/issues" className="block">
          <Card variant="interactive" className="p-5 flex items-center justify-between group">
            <div className="flex items-center gap-3.5">
              <div className="p-2.5 rounded-xl bg-amber-50 text-codexa-warning group-hover:scale-105 transition-transform">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-codexa-text">Issues & Risks</h3>
                <p className="text-[11px] text-codexa-text-muted mt-0.5">Codebase security</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-codexa-text-muted group-hover:text-codexa-primary group-hover:translate-x-1 transition-all" />
          </Card>
        </Link>
      </div>
    </div>
  );
}
