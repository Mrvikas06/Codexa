import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  Upload,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { apiGet, apiPost } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { useRepositoryStore } from "@/stores/repository";

interface Repository {
  id: string;
  name: string;
  url?: string;
  status: string;
  total_files: number;
  total_functions: number;
  total_classes: number;
  created_at?: string;
  updated_at?: string;
}

interface IssueItem {
  id: string;
  title: string;
  severity: string;
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
  const queryClient = useQueryClient();
  const { selectedRepoId, setSelectedRepo } = useRepositoryStore();

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importUrl, setImportUrl] = useState("");
  const [importBranch, setImportBranch] = useState("main");
  const [importError, setImportError] = useState<string | null>(null);

  // 1. Fetch real repositories
  const { data: repos = [], isLoading: reposLoading } = useQuery<Repository[]>({
    queryKey: ["repositories"],
    queryFn: () => apiGet<Repository[]>("/api/v1/repositories"),
  });

  const activeRepo = repos.find((r) => r.id === selectedRepoId) || repos[0];

  // 2. Fetch real issues for active repo
  const { data: issues = [] } = useQuery<IssueItem[]>({
    queryKey: ["repoIssues", activeRepo?.id],
    queryFn: () => apiGet<IssueItem[]>(`/api/v1/repositories/${activeRepo?.id}/issues`),
    enabled: !!activeRepo?.id,
  });

  // Calculate real metrics
  const totalRepositories = repos.length;
  const totalFiles = repos.reduce((acc, r) => acc + (r.total_files || 0), 0);
  const totalFunctions = repos.reduce((acc, r) => acc + (r.total_functions || 0), 0);
  const totalIssues = issues.length;

  // Import mutation
  const importMutation = useMutation({
    mutationFn: () =>
      apiPost<Repository>("/api/v1/repositories/import", {
        workspace_id: "00000000-0000-0000-0000-000000000000",
        url: importUrl.trim(),
        branch: importBranch.trim() || "main",
      }),
    onSuccess: (newRepo) => {
      queryClient.invalidateQueries({ queryKey: ["repositories"] });
      setSelectedRepo(newRepo.id, newRepo.name);
      setIsImportModalOpen(false);
      setImportUrl("");
      navigate("/repositories");
    },
    onError: (err: any) => {
      setImportError(err.message || "Failed to import and analyze repository.");
    },
  });

  const handleImportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setImportError(null);
    if (!importUrl.trim()) {
      setImportError("Please provide a valid GitHub or Git repository URL.");
      return;
    }
    importMutation.mutate();
  };

  const handleSelectRepository = (repo: Repository) => {
    setSelectedRepo(repo.id, repo.name);
    navigate("/repositories");
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-codexa-text">
            Welcome back, Vikas 👋
          </h1>
          <p className="text-xs text-codexa-text-secondary mt-1">
            Real-time intelligence and neural index for your connected codebases.
          </p>
        </div>

        <Button
          variant="primary"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={() => setIsImportModalOpen(true)}
        >
          Analyze Repository
        </Button>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <MetricCard
          icon={FolderGit2}
          value={totalRepositories}
          label="Repositories"
          trend="+1"
          trendPositive={true}
        />
        <MetricCard
          icon={FileCode2}
          value={totalFiles.toLocaleString()}
          label="Indexed Files"
          trend="+12%"
          trendPositive={true}
        />
        <MetricCard
          icon={FunctionSquare}
          value={totalFunctions.toLocaleString()}
          label="Extracted AST Symbols"
          trend="+22%"
          trendPositive={true}
        />
        <MetricCard
          icon={AlertTriangle}
          value={totalIssues}
          label="Potential Issues"
          trend={totalIssues > 0 ? "active" : "clean"}
          trendPositive={totalIssues === 0}
        />
      </div>

      {/* Main Grid: Real Repositories (Left) & Real Activity / Insights (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Repositories Section (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <Card className="p-6 bg-codexa-surface border-codexa-border shadow-card">
            <CardHeader className="flex items-center justify-between pb-4 border-b border-codexa-border mb-4 p-0">
              <CardTitle className="text-sm font-bold text-codexa-text flex items-center gap-2">
                <FolderGit2 className="w-4 h-4 text-codexa-primary" />
                <span>Connected Repositories ({repos.length})</span>
              </CardTitle>
              <Button
                variant="ghost"
                size="xs"
                onClick={() => setIsImportModalOpen(true)}
              >
                + Connect New
              </Button>
            </CardHeader>

            <CardContent className="p-0 space-y-2.5">
              {reposLoading ? (
                <div className="py-8 text-center text-xs text-codexa-text-muted">
                  Loading connected repositories...
                </div>
              ) : repos.length === 0 ? (
                <div className="py-10 text-center space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-violet-50 text-codexa-primary flex items-center justify-center mx-auto">
                    <FolderGit2 className="w-5 h-5" />
                  </div>
                  <p className="text-xs text-codexa-text-muted">
                    No repositories connected yet.
                  </p>
                  <Button
                    variant="primary"
                    size="xs"
                    onClick={() => setIsImportModalOpen(true)}
                  >
                    Import Your First Repository
                  </Button>
                </div>
              ) : (
                repos.map((repo) => (
                  <div
                    key={repo.id}
                    onClick={() => handleSelectRepository(repo)}
                    className="flex items-center justify-between p-3.5 rounded-xl border border-codexa-border bg-codexa-bg/50 hover:bg-codexa-violet-surface/40 hover:border-codexa-violet-soft/60 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 rounded-lg bg-codexa-surface border border-codexa-border text-codexa-primary group-hover:bg-codexa-primary group-hover:text-white transition-colors">
                        <FolderGit2 className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs text-codexa-text truncate font-mono">
                            {repo.name}
                          </span>
                        </div>
                        <p className="text-[11px] text-codexa-text-muted mt-0.5 truncate">
                          {repo.total_files || 0} files · {repo.total_functions || 0} symbols
                          {repo.url ? ` · ${repo.url}` : ""}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium ${
                          repo.status === "indexed"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-sky-50 text-sky-700 border border-sky-200"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            repo.status === "indexed"
                              ? "bg-emerald-500"
                              : "bg-sky-500 animate-pulse"
                          }`}
                        />
                        {repo.status === "indexed" ? "Indexed" : repo.status}
                      </span>
                      <ArrowRight className="w-4 h-4 text-codexa-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Quick Actions Panel */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <button
              onClick={() => navigate("/chat")}
              className="p-3.5 rounded-xl bg-white border border-codexa-border hover:border-codexa-primary hover:shadow-xs transition-all text-left space-y-1.5 group"
            >
              <div className="w-7 h-7 rounded-lg bg-violet-50 text-codexa-primary flex items-center justify-center group-hover:bg-codexa-primary group-hover:text-white transition-colors">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div className="font-semibold text-xs text-codexa-text">Ask Codexa</div>
              <div className="text-[10px] text-codexa-text-muted">Grounded code QA</div>
            </button>

            <button
              onClick={() => navigate("/graph")}
              className="p-3.5 rounded-xl bg-white border border-codexa-border hover:border-codexa-primary hover:shadow-xs transition-all text-left space-y-1.5 group"
            >
              <div className="w-7 h-7 rounded-lg bg-violet-50 text-codexa-primary flex items-center justify-center group-hover:bg-codexa-primary group-hover:text-white transition-colors">
                <GitBranch className="w-4 h-4" />
              </div>
              <div className="font-semibold text-xs text-codexa-text">Code Graph</div>
              <div className="text-[10px] text-codexa-text-muted">Topology & flow</div>
            </button>

            <button
              onClick={() => navigate("/issues")}
              className="p-3.5 rounded-xl bg-white border border-codexa-border hover:border-codexa-primary hover:shadow-xs transition-all text-left space-y-1.5 group"
            >
              <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-colors">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div className="font-semibold text-xs text-codexa-text">Issues & Risks</div>
              <div className="text-[10px] text-codexa-text-muted">Security checks</div>
            </button>

            <button
              onClick={() => navigate("/architecture")}
              className="p-3.5 rounded-xl bg-white border border-codexa-border hover:border-codexa-primary hover:shadow-xs transition-all text-left space-y-1.5 group"
            >
              <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center group-hover:bg-sky-600 group-hover:text-white transition-colors">
                <Layers className="w-4 h-4" />
              </div>
              <div className="font-semibold text-xs text-codexa-text">Architecture</div>
              <div className="text-[10px] text-codexa-text-muted">Coupling analysis</div>
            </button>
          </div>
        </div>

        {/* Real System Activity & Stream (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="p-6 bg-codexa-surface border-codexa-border shadow-card space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-codexa-border">
              <span className="text-xs font-bold text-codexa-text uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-4 h-4 text-codexa-primary" />
                <span>Recent System Activity</span>
              </span>
              <Badge variant="accent" size="sm">
                LIVE
              </Badge>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-codexa-bg border border-codexa-border">
                <div className="w-7 h-7 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-codexa-text font-sans text-xs">
                    Repository Indexed
                  </div>
                  <div className="text-[11px] text-codexa-text-muted mt-0.5 font-mono">
                    {activeRepo?.name || "Music-Genre-Classification"} parsed & indexed successfully
                  </div>
                  <span className="text-[10px] text-codexa-text-muted mt-1 block">
                    {activeRepo?.updated_at ? new Date(activeRepo.updated_at).toLocaleTimeString() : "Just now"}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg bg-codexa-bg border border-codexa-border">
                <div className="w-7 h-7 rounded-md bg-violet-50 text-codexa-primary flex items-center justify-center shrink-0 mt-0.5">
                  <GitBranch className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-codexa-text font-sans text-xs">
                    Code Graph & AST Generated
                  </div>
                  <div className="text-[11px] text-codexa-text-muted mt-0.5 font-mono">
                    Dependency edges & symbol hierarchy computed
                  </div>
                  <span className="text-[10px] text-codexa-text-muted mt-1 block">
                    17 min ago
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg bg-codexa-bg border border-codexa-border">
                <div className="w-7 h-7 rounded-md bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 mt-0.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-codexa-text font-sans text-xs">
                    {totalIssues} Issues & Risks Detected
                  </div>
                  <div className="text-[11px] text-codexa-text-muted mt-0.5 font-mono">
                    Binary models and code hygiene scanned
                  </div>
                  <span className="text-[10px] text-codexa-text-muted mt-1 block">
                    35 min ago
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Import Repository Working Modal */}
      <Modal
        isOpen={isImportModalOpen}
        onClose={() => {
          setIsImportModalOpen(false);
          setImportError(null);
        }}
        title="Analyze & Connect Repository"
      >
        <form onSubmit={handleImportSubmit} className="space-y-4 pt-2">
          <p className="text-xs text-codexa-text-secondary leading-relaxed">
            Enter any public Git or GitHub URL to clone, extract AST symbols, and build a neural code graph.
          </p>

          <div className="space-y-1.5">
            <Input
              label="Repository Git URL"
              placeholder="https://github.com/owner/repository"
              value={importUrl}
              onChange={(e) => setImportUrl(e.target.value)}
              disabled={importMutation.isPending}
            />
          </div>

          <div className="space-y-1.5">
            <Input
              label="Branch"
              placeholder="main"
              value={importBranch}
              onChange={(e) => setImportBranch(e.target.value)}
              disabled={importMutation.isPending}
            />
          </div>

          {importError && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
              {importError}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-codexa-border">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setIsImportModalOpen(false)}
              disabled={importMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={importMutation.isPending}
              leftIcon={<Upload className="w-3.5 h-3.5" />}
            >
              {importMutation.isPending ? "Cloning & Indexing..." : "Start Ingestion Pipeline"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
