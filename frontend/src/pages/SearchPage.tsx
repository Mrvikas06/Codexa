import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Search, Sparkles, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { apiGet, apiPost } from "@/lib/api";
import { useRepositoryStore } from "@/stores/repository";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";

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
  total_results: number;
  results: SearchHit[];
}

export const SearchPage: React.FC = () => {
  const navigate = useNavigate();
  const { selectedRepoId, setSelectedRepo } = useRepositoryStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [languageFilter, setLanguageFilter] = useState<string>("");
  const [enableReranker] = useState(true);
  const topK = 10;

  // Repositories query
  const { data: repos = [] } = useQuery<Repository[]>({
    queryKey: ["repositories"],
    queryFn: () => apiGet<Repository[]>("/api/v1/repositories"),
  });

  useEffect(() => {
    if (repos.length > 0 && !selectedRepoId && repos[0]) {
      setSelectedRepo(repos[0].id, repos[0].name);
    }
  }, [repos, selectedRepoId, setSelectedRepo]);

  // Search mutation
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

  const results = searchMutation.data?.results || [];

  return (
    <div className="flex flex-col h-[calc(100vh-3.25rem)] bg-[#F7F8FC] text-neutral-900 overflow-hidden">
      {/* Search Header Bar */}
      <div className="p-6 border-b border-neutral-200 bg-white space-y-4 shrink-0 shadow-xs">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold tracking-tight text-neutral-900 flex items-center gap-2">
              <Search className="w-5 h-5 text-primary" />
              <span>5-Way Hybrid Code Retrieval</span>
            </h1>
            <p className="text-xs text-neutral-500 mt-0.5">
              BM25 lexical + dense vector + AST symbol + dependency graph + cross-encoder reranker.
            </p>
          </div>

          <div className="flex items-center gap-3">
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
          </div>
        </div>

        {/* Search input form */}
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search functions, classes, token signatures, or natural language questions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-800 placeholder-neutral-400 focus:outline-none focus:border-primary focus:bg-white font-mono shadow-xs"
            />
          </div>

          <select
            value={languageFilter}
            onChange={(e) => setLanguageFilter(e.target.value)}
            className="bg-neutral-50 border border-neutral-200 text-xs text-neutral-700 rounded-lg px-3 py-2 font-mono focus:outline-none focus:border-primary cursor-pointer"
          >
            <option value="">All Languages</option>
            <option value="python">Python</option>
            <option value="typescript">TypeScript</option>
            <option value="javascript">JavaScript</option>
            <option value="go">Go</option>
            <option value="rust">Rust</option>
          </select>

          <Button
            type="submit"
            variant="primary"
            size="md"
            loading={searchMutation.isPending}
            leftIcon={<Sparkles className="w-4 h-4" />}
          >
            Search
          </Button>
        </form>
      </div>

      {/* Results Content Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 max-w-7xl mx-auto w-full">
        {results.length > 0 ? (
          results.map((hit) => (
            <Card
              key={hit.chunk_id}
              className="p-5 bg-white border-neutral-200 shadow-card space-y-3 font-mono text-xs hover:border-violet-200 hover:shadow-card-hover transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-neutral-900">{hit.file_path}</span>
                  <span className="text-[11px] text-neutral-400">
                    L{hit.start_line}-L{hit.end_line}
                  </span>
                  {hit.symbol_name && (
                    <Badge variant="accent" size="sm">
                      {hit.symbol_name}
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-neutral-400">
                    RRF: {hit.rrf_score.toFixed(4)}
                  </span>
                  <Badge variant="success" size="sm">
                    Score: {hit.reranker_score.toFixed(3)}
                  </Badge>
                </div>
              </div>

              {/* Code Snippet Box */}
              <div className="p-3.5 bg-neutral-900 text-neutral-100 rounded-lg overflow-x-auto text-xs leading-relaxed">
                <pre>{hit.content}</pre>
              </div>

              <div className="flex items-center justify-between text-[11px] text-neutral-400 font-sans pt-1">
                <div className="flex items-center gap-1.5 font-mono">
                  <span>Sources:</span>
                  {hit.retrieval_sources.map((src, i) => (
                    <span
                      key={i}
                      className="px-1.5 py-0.2 rounded bg-neutral-100 text-neutral-600 text-[10px]"
                    >
                      {src}
                    </span>
                  ))}
                </div>

                <button
                  onClick={() => navigate("/repositories")}
                  className="text-primary hover:underline flex items-center gap-1"
                >
                  <span>Open in Explorer</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </Card>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-12 h-12 rounded-xl bg-violet-50 text-primary flex items-center justify-center mb-3">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-sm text-neutral-800">No search results yet</h3>
            <p className="text-xs text-neutral-500 mt-1 max-w-sm">
              Type a function name, semantic query, or question above to test Codexa's 5-way hybrid
              retrieval engine.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
