import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Search, Sparkles, ExternalLink, Code2, Database } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { apiGet, apiPost } from "@/lib/api";
import { useRepositoryStore } from "@/stores/repository";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
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
  const [enableReranker, setEnableReranker] = useState(true);
  const topK = 10;

  // 1. Fetch repositories
  const { data: repos = [] } = useQuery<Repository[]>({
    queryKey: ["repositories"],
    queryFn: () => apiGet<Repository[]>("/api/v1/repositories"),
  });

  useEffect(() => {
    if (repos.length > 0 && !selectedRepoId && repos[0]) {
      setSelectedRepo(repos[0].id, repos[0].name);
    }
  }, [repos, selectedRepoId, setSelectedRepo]);

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

  const results = searchMutation.data?.results || [];

  return (
    <div className="flex flex-col h-[calc(100vh-3.25rem)] bg-atlas-bg text-atlas-text overflow-hidden">
      {/* Top Search Controls Bar */}
      <div className="p-6 border-b border-atlas-border bg-atlas-surface space-y-4 shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold tracking-tight text-atlas-text flex items-center gap-2">
              <Search className="w-5 h-5 text-atlas-accent" />
              <span>5-Way Hybrid Code Retrieval</span>
            </h1>
            <p className="text-xs text-atlas-text-secondary mt-0.5">
              Combines BM25, dense embeddings (Model A), AST symbols, dependency graph, and cross-encoder reranking (Model B).
            </p>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={selectedRepoId || ""}
              onChange={(e) => {
                const r = repos.find((repo) => repo.id === e.target.value);
                setSelectedRepo(e.target.value, r?.name);
              }}
              className="bg-atlas-bg border border-atlas-border text-xs text-atlas-text rounded-md px-3 py-1.5 font-mono focus:outline-none focus:border-atlas-accent cursor-pointer"
            >
              {repos.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Search Input Bar */}
        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <div className="relative flex-1">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search code symbols, functions, architectural components (e.g. 'validate_token', 'JWT auth')..."
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>

          <div className="w-32">
            <Input
              value={languageFilter}
              onChange={(e) => setLanguageFilter(e.target.value)}
              placeholder="Language (py)"
            />
          </div>

          <button
            type="button"
            onClick={() => setEnableReranker(!enableReranker)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono border transition-colors ${
              enableReranker
                ? "bg-atlas-accent/15 border-atlas-accent/40 text-atlas-accent"
                : "bg-atlas-surface border-atlas-border text-atlas-text-muted"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Neural Rerank</span>
          </button>

          <Button
            type="submit"
            variant="primary"
            size="md"
            loading={searchMutation.isPending}
            disabled={!searchQuery.trim() || !selectedRepoId}
          >
            Search
          </Button>
        </form>
      </div>

      {/* Search Results Area */}
      <div className="flex-1 overflow-y-auto p-6 max-w-5xl w-full mx-auto space-y-4">
        {searchMutation.isPending ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-6 h-6 border-2 border-atlas-accent border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-atlas-text-secondary font-mono">
              Executing BM25 lexical match, vector cosine similarity & cross-encoder reranking...
            </p>
          </div>
        ) : searchMutation.isSuccess && results.length === 0 ? (
          <div className="py-20 text-center text-xs text-atlas-text-muted">
            No code chunks matched query "{searchQuery}".
          </div>
        ) : !searchMutation.data ? (
          <div className="py-20 text-center space-y-2">
            <Database className="w-8 h-8 text-atlas-text-muted mx-auto" />
            <p className="text-xs text-atlas-text-secondary">
              Enter a code query above to run reciprocal rank fusion across the indexed repository.
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between text-xs font-mono text-atlas-text-muted pb-1">
              <span>FOUND {results.length} EVIDENCE CANDIDATES</span>
              <span>RRF COMBINED (k=60)</span>
            </div>

            <div className="space-y-3">
              {results.map((hit) => (
                <Card
                  key={hit.chunk_id}
                  variant="interactive"
                  className="p-4 space-y-3 font-mono text-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-semibold text-atlas-accent">
                      <Code2 className="w-4 h-4" />
                      <span>{hit.file_path}</span>
                      {hit.symbol_name && (
                        <span className="text-atlas-text">::{hit.symbol_name}</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge variant="outline" size="sm">
                        L{hit.start_line} – L{hit.end_line}
                      </Badge>
                      <Badge variant="accent" size="sm">
                        RRF: {hit.rrf_score.toFixed(4)}
                      </Badge>
                      {enableReranker && (
                        <Badge variant="success" size="sm">
                          Rerank: {hit.reranker_score.toFixed(2)}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Code preview block */}
                  <pre className="p-3 bg-atlas-bg rounded border border-atlas-border text-atlas-text text-[11px] overflow-x-auto leading-relaxed">
                    {hit.content}
                  </pre>

                  <div className="flex items-center justify-between text-[10px] text-atlas-text-muted pt-1">
                    <div className="flex items-center gap-1.5">
                      <span>Channels:</span>
                      {hit.retrieval_sources.map((src, idx) => (
                        <span
                          key={idx}
                          className="px-1.5 py-0.5 rounded bg-atlas-surface-secondary border border-atlas-border text-atlas-text-secondary uppercase"
                        >
                          {src}
                        </span>
                      ))}
                    </div>

                    <button
                      onClick={() => navigate("/repositories")}
                      className="text-atlas-accent hover:underline flex items-center gap-1"
                    >
                      Open in Explorer
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
