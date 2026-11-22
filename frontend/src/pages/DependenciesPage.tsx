import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Network, Search, PackageCheck, AlertCircle } from "lucide-react";
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

  const activeRepoId = selectedRepoId || (repos.length > 0 ? repos[0]?.id : undefined);

  // Fetch real dependencies from backend API
  const { data: dependencies = [], isLoading } = useQuery<DependencyItem[]>({
    queryKey: ["repoDependencies", activeRepoId],
    queryFn: () => apiGet<DependencyItem[]>(`/api/v1/repositories/${activeRepoId}/dependencies`),
    enabled: !!activeRepoId,
  });

  const filteredDeps = dependencies.filter((dep) => {
    const matchesSearch =
      dep.package.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dep.usage.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === "all" || dep.type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="flex flex-col h-[calc(100vh-3.25rem)] bg-[#F7F8FC] text-neutral-900 overflow-y-auto">
      {/* Top Header */}
      <div className="h-14 border-b border-neutral-200 bg-white px-6 flex items-center justify-between shrink-0 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Network className="w-5 h-5 text-primary" />
            <span className="font-semibold text-sm text-neutral-900">Dependencies</span>
          </div>

          <span className="text-neutral-300">/</span>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-medium text-neutral-700">
              {selectedRepoName || (repos.length > 0 ? repos[0]?.name : "Active Repo")}
            </span>
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1 h-1 rounded-full bg-emerald-500" />
              {dependencies.length} Detected
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
        {/* Search & Filter Toolbar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-neutral-200 shadow-card">
          <div className="w-full sm:w-80">
            <Input
              placeholder="Search package or usage..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="w-4 h-4 text-neutral-400" />}
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="flex items-center bg-neutral-100 p-0.5 rounded-lg border border-neutral-200 text-xs font-medium">
              <button
                onClick={() => setTypeFilter("all")}
                className={`px-3 py-1 rounded-md transition-all ${
                  typeFilter === "all"
                    ? "bg-white text-primary shadow-xs font-semibold"
                    : "text-neutral-600 hover:text-neutral-900"
                }`}
              >
                All ({dependencies.length})
              </button>
              <button
                onClick={() => setTypeFilter("runtime")}
                className={`px-3 py-1 rounded-md transition-all ${
                  typeFilter === "runtime"
                    ? "bg-white text-primary shadow-xs font-semibold"
                    : "text-neutral-600 hover:text-neutral-900"
                }`}
              >
                Runtime
              </button>
              <button
                onClick={() => setTypeFilter("dev")}
                className={`px-3 py-1 rounded-md transition-all ${
                  typeFilter === "dev"
                    ? "bg-white text-primary shadow-xs font-semibold"
                    : "text-neutral-600 hover:text-neutral-900"
                }`}
              >
                Dev
              </button>
            </div>
          </div>
        </div>

        {/* Real Dependencies Table */}
        <Card className="bg-white border-neutral-200 shadow-card overflow-hidden">
          <div className="p-5 border-b border-neutral-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PackageCheck className="w-4 h-4 text-primary" />
              <h3 className="font-bold text-sm text-neutral-900 font-mono">
                Verified Dependency Manifest
              </h3>
            </div>
            <Badge variant="accent" size="sm">
              PARSED FROM REPOSITORY
            </Badge>
          </div>

          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="py-12 text-center text-xs text-neutral-500 font-mono">
                Scanning repository dependencies...
              </div>
            ) : filteredDeps.length === 0 ? (
              <div className="py-12 text-center text-xs text-neutral-500 space-y-2">
                <AlertCircle className="w-5 h-5 mx-auto text-neutral-400" />
                <p>No matching packages found.</p>
              </div>
            ) : (
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-neutral-50/80 border-b border-neutral-200 text-neutral-500 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-6 font-semibold">Package</th>
                    <th className="py-3 px-6 font-semibold">Version</th>
                    <th className="py-3 px-6 font-semibold">Type</th>
                    <th className="py-3 px-6 font-semibold">Usage & Role</th>
                    <th className="py-3 px-6 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {filteredDeps.map((dep) => (
                    <tr
                      key={dep.id}
                      className="hover:bg-neutral-50/70 transition-colors"
                    >
                      <td className="py-3.5 px-6 font-bold text-neutral-900">{dep.package}</td>
                      <td className="py-3.5 px-6 text-neutral-600">{dep.version}</td>
                      <td className="py-3.5 px-6">
                        <span className="px-2 py-0.5 rounded bg-neutral-100 text-neutral-700 text-[10px] uppercase font-semibold">
                          {dep.type}
                        </span>
                      </td>
                      <td className="py-3.5 px-6 text-neutral-600 font-sans">{dep.usage}</td>
                      <td className="py-3.5 px-6">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          {dep.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};
