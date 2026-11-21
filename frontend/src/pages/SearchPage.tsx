import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Search, Sparkles } from "lucide-react";
import { apiGet, apiPost } from "@/lib/api";

interface Repository {
  id: string;
  name: string;
}

interface SearchHit {
  chunk_id: string;
  file_path: string;
  symbol_name?: string;
  chunk_type: string;
  start_line: number;
  end_line: number;
  language: string;
  content: string;
  rrf_score: number;
  reranker_score: number;
  rank: number;
  retrieval_sources: string[];
}

interface SearchResponse {
  query: string;
  total_hits: number;
  hits: SearchHit[];
}

export const SearchPage: React.FC = () => {
  const [selectedRepoId, setSelectedRepoId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [languageFilter, setLanguageFilter] = useState<string>("");
  const [enableReranker, setEnableReranker] = useState(true);
  const topK = 10;

  // 1. Fetch repositories
  const { data: repos = [] } = useQuery<Repository[]>({
    queryKey: ["repositories"],
    queryFn: () => apiGet<Repository[]>("/api/v1/repositories"),
  });

  useEffect(() => {
    if (repos.length > 0 && !selectedRepoId && repos[0]) {
      setSelectedRepoId(repos[0].id);
    }
  }, [repos, selectedRepoId]);

  // 2. Search mutation
  const searchMutation = useMutation({
    mutationFn: () =>
      apiPost<SearchResponse>("/api/v1/search/hybrid", {
        query: searchQuery,
        repository_id: selectedRepoId,
        language: languageFilter || undefined,
        top_k: topK,
        enable_reranker: enableReranker,
      }),
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() || !selectedRepoId) return;
    searchMutation.mutate();
  };

  const results = searchMutation.data?.hits || [];

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-[#0B0D10] text-[#F1F3F5] overflow-hidden">
      {/* Search Header Bar */}
      <div className="p-6 border-b border-[#262B33] bg-[#0E1014] space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-lg font-semibold tracking-tight flex items-center space-x-2">
              <Search className="w-5 h-5 text-[#6C8CFF]" />
              <span>Hybrid Code Retrieval Engine</span>
            </h1>
            <p className="text-xs text-[#A0A7B2]">
              Combines Okapi BM25 + Dense Vectors (Model A) + AST Hierarchy + Dependency Graph + Cross-Encoder Reranker (Model B).
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <select
              value={selectedRepoId || ""}
              onChange={(e) => setSelectedRepoId(e.target.value)}
              className="bg-[#14171C] border border-[#262B33] text-xs text-[#F1F3F5] rounded px-3 py-1.5 focus:outline-none focus:border-[#6C8CFF]"
            >
              {repos.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Search Input & Controls */}
        <form onSubmit={handleSearch} className="flex items-center space-x-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-[#69717D]" />
            <input
              type="text"
              placeholder="Search code symbols, identifiers, queries (e.g. 'validate_token', 'JWT auth')..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[#14171C] border border-[#262B33] rounded-lg text-xs text-[#F1F3F5] placeholder-[#69717D] focus:outline-none focus:border-[#6C8CFF]"
            />
          </div>

          <input
            type="text"
            placeholder="Lang filter"
            value={languageFilter}
            onChange={(e) => setLanguageFilter(e.target.value)}
            className="w-28 px-3 py-2 bg-[#14171C] border border-[#262B33] rounded-lg text-xs text-[#F1F3F5] placeholder-[#69717D] focus:outline-none focus:border-[#6C8CFF]"
          />

          <label className="flex items-center space-x-2 text-xs text-[#A0A7B2] bg-[#14171C] border border-[#262B33] px-3 py-2 rounded-lg cursor-pointer">
            <input
              type="checkbox"
              checked={enableReranker}
              onChange={(e) => setEnableReranker(e.target.checked)}
              className="rounded bg-[#0B0D10] border-[#262B33] text-[#6C8CFF] focus:ring-0"
            />
            <span>Neural Rerank</span>
          </label>

          <button
            type="submit"
            disabled={!searchQuery.trim() || searchMutation.isPending || !selectedRepoId}
            className="px-5 py-2 bg-[#6C8CFF] hover:bg-[#5b7ce6] text-white rounded-lg text-xs font-medium transition disabled:opacity-50"
          >
            {searchMutation.isPending ? "Searching..." : "Search"}
          </button>
        </form>
      </div>

      {/* Results View */}
      <div className="flex-1 overflow-auto p-6 max-w-5xl w-full mx-auto space-y-4">
        {searchMutation.isPending ? (
          <div className="p-12 text-center text-xs text-[#A0A7B2] space-y-2">
            <Sparkles className="w-6 h-6 text-[#6C8CFF] animate-spin mx-auto" />
            <div>Running 5-way hybrid retrieval & neural cross-encoder...</div>
          </div>
        ) : results.length === 0 ? (
          <div className="p-16 text-center text-xs text-[#69717D]">
            {searchMutation.data ? "No matching code chunks found for this query." : "Enter a search query above to inspect code intelligence results."}
          </div>
        ) : (
          results.map((hit) => (
            <div
              key={hit.chunk_id}
              className="p-4 bg-[#14171C] border border-[#262B33] rounded-xl space-y-3 font-mono text-xs hover:border-[#343B45] transition"
            >
              {/* Hit Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="w-5 h-5 rounded bg-[#191D23] border border-[#262B33] flex items-center justify-center text-[10px] text-[#A0A7B2]">
                    #{hit.rank}
                  </span>
                  <span className="font-semibold text-[#F1F3F5]">{hit.file_path}</span>
                  {hit.symbol_name && (
                    <span className="text-[#6C8CFF]">({hit.symbol_name})</span>
                  )}
                  <span className="text-[10px] text-[#69717D]">
                    Lines {hit.start_line}–{hit.end_line}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-1">
                    {hit.retrieval_sources.map((src, idx) => (
                      <span
                        key={idx}
                        className="text-[9px] px-1.5 py-0.5 rounded bg-[#191D23] border border-[#262B33] text-[#A0A7B2] uppercase"
                      >
                        {src}
                      </span>
                    ))}
                  </div>

                  <span className="text-[10px] text-[#69717D] pl-2 border-l border-[#262B33]">
                    RRF: {hit.rrf_score.toFixed(4)}
                  </span>
                  {hit.reranker_score !== 0 && (
                    <span className="text-[10px] text-emerald-400">
                      Score: {hit.reranker_score.toFixed(4)}
                    </span>
                  )}
                </div>
              </div>

              {/* Code Snippet */}
              <pre className="p-3 bg-[#0B0D10] border border-[#262B33] rounded-lg text-[#F1F3F5] text-[11px] overflow-x-auto leading-relaxed">
                {hit.content}
              </pre>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
