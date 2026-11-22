import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ShieldAlert, FileCode, ExternalLink, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { apiGet, apiPost } from "@/lib/api";
import { useRepositoryStore } from "@/stores/repository";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

interface Repository {
  id: string;
  name: string;
}

interface IssueItem {
  id: string;
  title: string;
  severity: "critical" | "high" | "medium" | "low";
  category: string;
  file: string;
  line: number;
  description: string;
  suggestedFix: string;
  confidence: "Confirmed" | "Potential" | "Needs Review";
  reviewed?: boolean;
}

export const IssuesPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { selectedRepoId, selectedRepoName, setSelectedRepo } = useRepositoryStore();
  const [severityFilter, setSeverityFilter] = useState<string>("all");

  const { data: repos = [] } = useQuery<Repository[]>({
    queryKey: ["repositories"],
    queryFn: () => apiGet<Repository[]>("/api/v1/repositories"),
  });

  const activeRepoId = selectedRepoId || (repos.length > 0 ? repos[0]?.id : undefined);

  // Fetch real issues from backend API
  const { data: issues = [], isLoading } = useQuery<IssueItem[]>({
    queryKey: ["repoIssues", activeRepoId],
    queryFn: () => apiGet<IssueItem[]>(`/api/v1/repositories/${activeRepoId}/issues`),
    enabled: !!activeRepoId,
  });

  // Review mutation
  const reviewMutation = useMutation({
    mutationFn: (issueId: string) =>
      apiPost(`/api/v1/repositories/${activeRepoId}/issues/${issueId}/review`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["repoIssues", activeRepoId] });
    },
  });

  const criticalCount = issues.filter((i) => i.severity === "critical").length;
  const highCount = issues.filter((i) => i.severity === "high").length;
  const mediumCount = issues.filter((i) => i.severity === "medium").length;
  const lowCount = issues.filter((i) => i.severity === "low").length;

  const filteredIssues = issues.filter((issue) => {
    if (severityFilter === "all") return true;
    return issue.severity === severityFilter;
  });

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "critical":
        return <Badge variant="danger" size="sm">Critical</Badge>;
      case "high":
        return <Badge variant="warning" size="sm">High</Badge>;
      case "medium":
        return <Badge variant="accent" size="sm">Medium</Badge>;
      default:
        return <Badge variant="default" size="sm">Low</Badge>;
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-3.25rem)] bg-[#F7F8FC] text-neutral-900 overflow-y-auto">
      {/* Top Header */}
      <div className="h-14 border-b border-neutral-200 bg-white px-6 flex items-center justify-between shrink-0 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-500" />
            <span className="font-semibold text-sm text-neutral-900">Issues & Code Hygiene</span>
          </div>

          <span className="text-neutral-300">/</span>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-medium text-neutral-700">
              {selectedRepoName || (repos.length > 0 ? repos[0]?.name : "Active Repo")}
            </span>
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
              {issues.length} Risks Scanned
            </span>
          </div>
        </div>

        {repos.length > 1 && (
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
        )}
      </div>

      <div className="p-8 max-w-7xl mx-auto w-full space-y-6">
        {/* Severity Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <Card
            onClick={() => setSeverityFilter("all")}
            className={`p-4 bg-white border cursor-pointer transition-all ${
              severityFilter === "all"
                ? "border-primary ring-2 ring-primary/20 shadow-sm"
                : "border-neutral-200 hover:border-neutral-300"
            }`}
          >
            <div className="text-[11px] text-neutral-500 font-sans">Total Risks</div>
            <div className="text-2xl font-bold font-mono text-neutral-900 mt-1">{issues.length}</div>
          </Card>

          <Card
            onClick={() => setSeverityFilter("critical")}
            className={`p-4 bg-white border cursor-pointer transition-all ${
              severityFilter === "critical"
                ? "border-rose-500 ring-2 ring-rose-500/20 shadow-sm"
                : "border-neutral-200 hover:border-neutral-300"
            }`}
          >
            <div className="text-[11px] text-rose-600 font-sans font-medium">Critical</div>
            <div className="text-2xl font-bold font-mono text-rose-600 mt-1">{criticalCount}</div>
          </Card>

          <Card
            onClick={() => setSeverityFilter("high")}
            className={`p-4 bg-white border cursor-pointer transition-all ${
              severityFilter === "high"
                ? "border-amber-500 ring-2 ring-amber-500/20 shadow-sm"
                : "border-neutral-200 hover:border-neutral-300"
            }`}
          >
            <div className="text-[11px] text-amber-600 font-sans font-medium">High</div>
            <div className="text-2xl font-bold font-mono text-amber-600 mt-1">{highCount}</div>
          </Card>

          <Card
            onClick={() => setSeverityFilter("medium")}
            className={`p-4 bg-white border cursor-pointer transition-all ${
              severityFilter === "medium"
                ? "border-primary ring-2 ring-primary/20 shadow-sm"
                : "border-neutral-200 hover:border-neutral-300"
            }`}
          >
            <div className="text-[11px] text-primary font-sans font-medium">Medium</div>
            <div className="text-2xl font-bold font-mono text-primary mt-1">{mediumCount}</div>
          </Card>

          <Card
            onClick={() => setSeverityFilter("low")}
            className={`p-4 bg-white border cursor-pointer transition-all ${
              severityFilter === "low"
                ? "border-neutral-500 ring-2 ring-neutral-500/20 shadow-sm"
                : "border-neutral-200 hover:border-neutral-300"
            }`}
          >
            <div className="text-[11px] text-neutral-600 font-sans font-medium">Low</div>
            <div className="text-2xl font-bold font-mono text-neutral-700 mt-1">{lowCount}</div>
          </Card>
        </div>

        {/* Issues List */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="py-16 text-center text-xs text-neutral-500 font-mono">
              Running deep AST security and code hygiene scan...
            </div>
          ) : filteredIssues.length === 0 ? (
            <Card className="p-12 text-center bg-white border-neutral-200 space-y-2">
              <Check className="w-8 h-8 text-emerald-500 mx-auto" />
              <h3 className="font-bold text-sm text-neutral-800">No issues found</h3>
              <p className="text-xs text-neutral-500">
                Your repository is clean of {severityFilter !== "all" ? severityFilter : ""} issues.
              </p>
            </Card>
          ) : (
            filteredIssues.map((issue) => (
              <Card
                key={issue.id}
                className={`p-5 bg-white border transition-all ${
                  issue.reviewed
                    ? "opacity-60 border-neutral-200"
                    : "border-neutral-200 shadow-card hover:border-neutral-300"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="mt-0.5">{getSeverityBadge(issue.severity)}</div>
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-neutral-900">{issue.title}</h4>
                        {issue.reviewed && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-700 font-mono">
                            Reviewed
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs font-mono text-neutral-500">
                        <FileCode className="w-3.5 h-3.5 text-neutral-400" />
                        <span className="text-neutral-700 font-semibold">{issue.file}</span>
                        <span>:L{issue.line}</span>
                        <span className="text-neutral-300">·</span>
                        <span className="text-neutral-500 font-sans">{issue.category}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {!issue.reviewed && (
                      <Button
                        size="xs"
                        variant="secondary"
                        onClick={() => reviewMutation.mutate(issue.id)}
                        loading={reviewMutation.isPending}
                        leftIcon={<Check className="w-3 h-3 text-emerald-600" />}
                      >
                        Acknowledge
                      </Button>
                    )}
                    <Button
                      size="xs"
                      variant="outline"
                      onClick={() => navigate("/repositories")}
                      leftIcon={<ExternalLink className="w-3 h-3" />}
                    >
                      View in Code
                    </Button>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-neutral-100 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="font-semibold text-neutral-700 text-[11px] block mb-1">
                      Finding Description:
                    </span>
                    <p className="text-neutral-600 leading-relaxed">{issue.description}</p>
                  </div>
                  <div className="bg-neutral-50 p-3 rounded-lg border border-neutral-100">
                    <span className="font-semibold text-primary text-[11px] block mb-1">
                      Remediation Guidance:
                    </span>
                    <p className="text-neutral-600 leading-relaxed font-sans">{issue.suggestedFix}</p>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
