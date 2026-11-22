import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ShieldAlert, FileCode, ArrowRight, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { apiGet } from "@/lib/api";
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
  const { selectedRepoId, selectedRepoName, setSelectedRepo } = useRepositoryStore();
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [reviewedMap, setReviewedMap] = useState<Record<string, boolean>>({});

  const { data: repos = [] } = useQuery<Repository[]>({
    queryKey: ["repositories"],
    queryFn: () => apiGet<Repository[]>("/api/v1/repositories"),
  });

  const issues: IssueItem[] = [
    {
      id: "iss-1",
      title: "Hardcoded secret in config.py",
      severity: "critical",
      category: "Security",
      file: "backend/app/core/config.py",
      line: 21,
      description: "Default secret key string found in configuration defaults. In production this could compromise JWT signing.",
      suggestedFix: "Enforce reading SECRET_KEY strictly from environment variable with startup assertion.",
      confidence: "Confirmed",
    },
    {
      id: "iss-2",
      title: "Potential SQL injection in user.py",
      severity: "high",
      category: "Security",
      file: "backend/app/repositories/user.py",
      line: 45,
      description: "Dynamic string interpolation detected in query filter without parameterized bind values.",
      suggestedFix: "Use parameterized SQLAlchemy binary expressions: User.email == email.",
      confidence: "Potential",
    },
    {
      id: "iss-3",
      title: "Missing input validation in login()",
      severity: "high",
      category: "Validation",
      file: "backend/app/api/routes/auth.py",
      line: 32,
      description: "Raw credentials parsed directly from request without maximum string length constraints.",
      suggestedFix: "Validate payload with Pydantic Field(max_length=128) schema.",
      confidence: "Needs Review",
    },
    {
      id: "iss-4",
      title: "Large model file committed (120 MB)",
      severity: "medium",
      category: "Hygiene",
      file: "backend/checkpoints/encoder_v1.pt",
      line: 1,
      description: "Neural model checkpoint binary tracked directly in Git repository instead of Git LFS or object storage.",
      suggestedFix: "Add *.pt and *.safetensors to .gitignore and track large weights in cloud bucket.",
      confidence: "Confirmed",
    },
    {
      id: "iss-5",
      title: "Unused function: preprocess_data()",
      severity: "low",
      category: "Dead Code",
      file: "backend/app/services/ingestion/chunker.py",
      line: 88,
      description: "Function defined with 0 incoming callers across the indexed repository AST call graph.",
      suggestedFix: "Deprecate and prune unreferenced function to reduce codebase maintenance overhead.",
      confidence: "Confirmed",
    },
  ];

  const filteredIssues = issues.filter((iss) => {
    return severityFilter === "all" || iss.severity === severityFilter;
  });

  const counts = {
    total: issues.length,
    critical: issues.filter((i) => i.severity === "critical").length,
    high: issues.filter((i) => i.severity === "high").length,
    medium: issues.filter((i) => i.severity === "medium").length,
    low: issues.filter((i) => i.severity === "low").length,
  };

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] bg-codexa-bg text-codexa-text overflow-y-auto p-8 space-y-6 max-w-7xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-codexa-border pb-5">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <h1 className="text-2xl font-bold tracking-tight text-codexa-text flex items-center gap-2">
              <ShieldAlert className="w-6 h-6 text-codexa-primary" />
              <span>Issues & Risks</span>
            </h1>
            <Badge variant="accent" size="sm">
              {selectedRepoName || "Active Repository"}
            </Badge>
          </div>
          <p className="text-xs text-codexa-text-secondary">
            AST-detected structural risks, hardcoded credentials, security vulnerabilities, and dead code candidates.
          </p>
        </div>

        <select
          value={selectedRepoId || ""}
          onChange={(e) => {
            const r = repos.find((repo) => repo.id === e.target.value);
            setSelectedRepo(e.target.value, r?.name);
          }}
          className="bg-codexa-surface border border-codexa-border text-xs text-codexa-text rounded-lg px-3 py-1.5 font-mono focus:outline-none focus:border-codexa-primary cursor-pointer shadow-subtle"
        >
          {repos.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
      </div>

      {/* Severity Metric Badges Row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <Card
          onClick={() => setSeverityFilter("all")}
          className={`p-4 cursor-pointer transition-all ${
            severityFilter === "all" ? "border-codexa-primary shadow-medium bg-codexa-surface" : ""
          }`}
        >
          <div className="text-[10px] font-mono uppercase text-codexa-text-muted mb-1">Total Issues</div>
          <div className="text-2xl font-bold font-mono text-codexa-text">{counts.total}</div>
        </Card>

        <Card
          onClick={() => setSeverityFilter("critical")}
          className={`p-4 cursor-pointer transition-all border-l-4 border-l-red-500 ${
            severityFilter === "critical" ? "border-codexa-error shadow-medium" : ""
          }`}
        >
          <div className="text-[10px] font-mono uppercase text-red-600 mb-1">Critical</div>
          <div className="text-2xl font-bold font-mono text-codexa-error">{counts.critical}</div>
        </Card>

        <Card
          onClick={() => setSeverityFilter("high")}
          className={`p-4 cursor-pointer transition-all border-l-4 border-l-amber-500 ${
            severityFilter === "high" ? "border-codexa-warning shadow-medium" : ""
          }`}
        >
          <div className="text-[10px] font-mono uppercase text-amber-600 mb-1">High</div>
          <div className="text-2xl font-bold font-mono text-codexa-warning">{counts.high}</div>
        </Card>

        <Card
          onClick={() => setSeverityFilter("medium")}
          className={`p-4 cursor-pointer transition-all border-l-4 border-l-yellow-500 ${
            severityFilter === "medium" ? "border-yellow-500 shadow-medium" : ""
          }`}
        >
          <div className="text-[10px] font-mono uppercase text-yellow-600 mb-1">Medium</div>
          <div className="text-2xl font-bold font-mono text-yellow-600">{counts.medium}</div>
        </Card>

        <Card
          onClick={() => setSeverityFilter("low")}
          className={`p-4 cursor-pointer transition-all border-l-4 border-l-emerald-500 ${
            severityFilter === "low" ? "border-emerald-500 shadow-medium" : ""
          }`}
        >
          <div className="text-[10px] font-mono uppercase text-emerald-600 mb-1">Low</div>
          <div className="text-2xl font-bold font-mono text-emerald-600">{counts.low}</div>
        </Card>
      </div>

      {/* Issues List */}
      <div className="space-y-4">
        {filteredIssues.map((iss) => {
          const isReviewed = reviewedMap[iss.id];
          return (
            <Card key={iss.id} className="p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <Badge
                      variant={
                        iss.severity === "critical"
                          ? "danger"
                          : iss.severity === "high"
                          ? "warning"
                          : iss.severity === "medium"
                          ? "info"
                          : "success"
                      }
                      size="sm"
                    >
                      {iss.severity.toUpperCase()}
                    </Badge>
                    <h3 className="text-sm font-bold text-codexa-text">{iss.title}</h3>
                    <Badge variant="outline" size="sm">{iss.category}</Badge>
                  </div>
                  <div className="flex items-center gap-2 font-mono text-xs text-codexa-text-muted">
                    <FileCode className="w-3.5 h-3.5" />
                    <span>{iss.file}:{iss.line}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant="accent" size="sm">
                    {iss.confidence}
                  </Badge>
                  <Button
                    size="xs"
                    variant={isReviewed ? "outline" : "secondary"}
                    onClick={() =>
                      setReviewedMap((prev) => ({ ...prev, [iss.id]: !prev[iss.id] }))
                    }
                  >
                    {isReviewed ? "Mark Unreviewed" : "Mark Reviewed"}
                  </Button>
                </div>
              </div>

              <p className="text-xs text-codexa-text-secondary leading-relaxed font-sans">
                {iss.description}
              </p>

              {/* Suggested Fix */}
              <div className="p-3 bg-codexa-bg rounded-lg border border-codexa-border text-xs space-y-1">
                <div className="text-[10px] font-mono uppercase text-codexa-primary font-bold">
                  Suggested Remediation
                </div>
                <p className="text-codexa-text font-mono text-[11px]">{iss.suggestedFix}</p>
              </div>

              <div className="flex items-center justify-between pt-1 text-xs">
                <button
                  onClick={() => navigate("/repositories")}
                  className="text-codexa-primary hover:underline flex items-center gap-1 font-medium"
                >
                  View Code in Repo Explorer
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => navigate("/chat")}
                  className="text-codexa-text-secondary hover:text-codexa-text flex items-center gap-1 font-medium"
                >
                  Ask Codexa to Fix
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
