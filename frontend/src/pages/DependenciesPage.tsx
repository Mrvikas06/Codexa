import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Network, Search, PackageCheck } from "lucide-react";
import { apiGet } from "@/lib/api";
import { useRepositoryStore } from "@/stores/repository";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";

interface Repository {
  id: string;
  name: string;
}

interface DependencyItem {
  id: string;
  package: string;
  version: string;
  type: "runtime" | "dev" | "peer";
  usage: string;
  status: "verified" | "outdated" | "clean";
}

export const DependenciesPage: React.FC = () => {
  const { selectedRepoId, selectedRepoName, setSelectedRepo } = useRepositoryStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const { data: repos = [] } = useQuery<Repository[]>({
    queryKey: ["repositories"],
    queryFn: () => apiGet<Repository[]>("/api/v1/repositories"),
  });

  const dependencies: DependencyItem[] = [
    {
      id: "dep-1",
      package: "torch",
      version: "2.2.0",
      type: "runtime",
      usage: "ML training, neural models & contrastive learning",
      status: "verified",
    },
    {
      id: "dep-2",
      package: "fastapi",
      version: "0.110.0",
      type: "runtime",
      usage: "Core API endpoints & async route controllers",
      status: "clean",
    },
    {
      id: "dep-3",
      package: "pydantic",
      version: "2.6.1",
      type: "runtime",
      usage: "Data schemas & validation models",
      status: "verified",
    },
    {
      id: "dep-4",
      package: "numpy",
      version: "1.26.4",
      type: "runtime",
      usage: "Array manipulations & embedding vector calculations",
      status: "clean",
    },
    {
      id: "dep-5",
      package: "sqlalchemy",
      version: "2.0.29",
      type: "runtime",
      usage: "Async database ORM & metadata models",
      status: "clean",
    },
    {
      id: "dep-6",
      package: "pgvector",
      version: "0.2.5",
      type: "runtime",
      usage: "PostgreSQL pgvector dense similarity retrieval",
      status: "verified",
    },
    {
      id: "dep-7",
      package: "uvicorn",
      version: "0.29.0",
      type: "runtime",
      usage: "High-performance ASGI server runtime",
      status: "clean",
    },
    {
      id: "dep-8",
      package: "pytest",
      version: "9.2.0",
      type: "dev",
      usage: "Comprehensive unit, integration, & regression test suite",
      status: "clean",
    },
  ];

  const filteredDeps = dependencies.filter((dep) => {
    const matchesSearch =
      dep.package.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dep.usage.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === "all" || dep.type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] bg-codexa-bg text-codexa-text overflow-y-auto p-8 space-y-6 max-w-7xl mx-auto animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-codexa-border pb-5">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <h1 className="text-2xl font-bold tracking-tight text-codexa-text flex items-center gap-2">
              <Network className="w-6 h-6 text-codexa-primary" />
              <span>Dependencies</span>
            </h1>
            <Badge variant="accent" size="sm">
              {selectedRepoName || "Active Repository"}
            </Badge>
          </div>
          <p className="text-xs text-codexa-text-secondary">
            Extracted package manifest dependencies, runtime utilities, and usage attribution.
          </p>
        </div>

        {/* Repository selector */}
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

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card variant="metric">
          <div className="text-[11px] font-mono uppercase text-codexa-text-muted mb-1">Total Packages</div>
          <div className="text-2xl font-bold font-mono text-codexa-text">{dependencies.length}</div>
          <p className="text-[11px] text-codexa-text-secondary font-mono mt-1">Direct & transitive</p>
        </Card>
        <Card variant="metric">
          <div className="text-[11px] font-mono uppercase text-codexa-text-muted mb-1">Runtime</div>
          <div className="text-2xl font-bold font-mono text-codexa-primary">7</div>
          <p className="text-[11px] text-codexa-text-secondary font-mono mt-1">Production runtime</p>
        </Card>
        <Card variant="metric">
          <div className="text-[11px] font-mono uppercase text-codexa-text-muted mb-1">Dev Tools</div>
          <div className="text-2xl font-bold font-mono text-codexa-indigo">1</div>
          <p className="text-[11px] text-codexa-text-secondary font-mono mt-1">Testing & build</p>
        </Card>
        <Card variant="metric">
          <div className="text-[11px] font-mono uppercase text-codexa-text-muted mb-1">Vulnerabilities</div>
          <div className="text-2xl font-bold font-mono text-emerald-600">0</div>
          <p className="text-[11px] text-emerald-600 font-mono mt-1">Verified clean</p>
        </Card>
      </div>

      {/* Table Container */}
      <Card className="overflow-hidden">
        {/* Table Filters Toolbar */}
        <div className="p-4 border-b border-codexa-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-codexa-surface">
          <div className="w-full sm:w-72">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search package name or usage..."
              leftIcon={<Search className="w-3.5 h-3.5" />}
            />
          </div>

          <div className="flex items-center gap-1.5 bg-codexa-bg p-1 rounded-lg border border-codexa-border">
            {["all", "runtime", "dev"].map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-3 py-1 rounded-md text-xs font-mono capitalize transition-all ${
                  typeFilter === t
                    ? "bg-codexa-surface text-codexa-primary font-bold shadow-subtle"
                    : "text-codexa-text-secondary hover:text-codexa-text"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead className="bg-codexa-bg/70 border-b border-codexa-border text-codexa-text-secondary font-mono text-[11px] uppercase tracking-wider">
              <tr>
                <th className="py-3 px-5">Package</th>
                <th className="py-3 px-5">Version</th>
                <th className="py-3 px-5">Type</th>
                <th className="py-3 px-5">Usage</th>
                <th className="py-3 px-5 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-codexa-border">
              {filteredDeps.map((dep) => (
                <tr key={dep.id} className="hover:bg-codexa-surface-hover transition-colors">
                  <td className="py-3.5 px-5 font-mono font-bold text-codexa-indigo flex items-center gap-2">
                    <PackageCheck className="w-4 h-4 text-codexa-primary" />
                    <span>{dep.package}</span>
                  </td>
                  <td className="py-3.5 px-5 font-mono text-codexa-text-secondary">
                    {dep.version}
                  </td>
                  <td className="py-3.5 px-5">
                    <Badge variant={dep.type === "runtime" ? "accent" : "default"} size="sm">
                      {dep.type}
                    </Badge>
                  </td>
                  <td className="py-3.5 px-5 text-codexa-text-secondary">
                    {dep.usage}
                  </td>
                  <td className="py-3.5 px-5 text-right">
                    <Badge variant="success" size="sm" dot>
                      Up to date
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
