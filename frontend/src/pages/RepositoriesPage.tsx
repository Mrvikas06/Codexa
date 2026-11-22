import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FileCode, Search, Upload, Layers, Code2, Copy, Check, GitBranch } from "lucide-react";
import { apiGet, apiPost } from "@/lib/api";
import { useRepositoryStore } from "@/stores/repository";
import { CodeViewer } from "@/components/code/CodeViewer";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";

interface Repository {
  id: string;
  name: string;
  url?: string;
  status: string;
  default_branch: string;
}

interface RepoFile {
  id: string;
  path: string;
  filename: string;
  extension: string;
  language: string;
  line_count: number;
  size_bytes: number;
}

interface SymbolItem {
  id: string;
  name: string;
  symbol_type: string;
  start_line: number;
  end_line: number;
  signature?: string;
  docstring?: string;
}

interface FileDetail extends RepoFile {
  content?: string;
  symbols: SymbolItem[];
  chunk_count: number;
}

export const RepositoriesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { selectedRepoId, setSelectedRepo } = useRepositoryStore();
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [searchFilter, setSearchFilter] = useState("");
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importUrl, setImportUrl] = useState("");
  const [highlightedRange, setHighlightedRange] = useState<[number, number] | undefined>(undefined);
  const [copied, setCopied] = useState(false);

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

  // 2. Fetch files for selected repo
  const { data: files = [], isLoading: filesLoading } = useQuery<RepoFile[]>({
    queryKey: ["repoFiles", selectedRepoId],
    queryFn: () => apiGet<RepoFile[]>(`/api/v1/repositories/${selectedRepoId}/files`),
    enabled: !!selectedRepoId,
  });

  useEffect(() => {
    if (files.length > 0 && !selectedFileId && files[0]) {
      setSelectedFileId(files[0].id);
    }
  }, [files, selectedFileId]);

  // 3. Fetch selected file detail & content
  const { data: fileDetail } = useQuery<FileDetail>({
    queryKey: ["fileDetail", selectedRepoId, selectedFileId],
    queryFn: () => apiGet<FileDetail>(`/api/v1/repositories/${selectedRepoId}/files/${selectedFileId}`),
    enabled: !!selectedRepoId && !!selectedFileId,
  });

  // 4. Import mutation
  const importMutation = useMutation({
    mutationFn: (url: string) =>
      apiPost("/api/v1/repositories/import", {
        workspace_id: "00000000-0000-0000-0000-000000000000",
        url,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["repositories"] });
      setIsImportOpen(false);
      setImportUrl("");
    },
  });

  const filteredFiles = files.filter((f) =>
    f.path.toLowerCase().includes(searchFilter.toLowerCase())
  );

  const handleCopyContent = () => {
    if (fileDetail?.content) {
      navigator.clipboard.writeText(fileDetail.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-3.25rem)] bg-atlas-bg text-atlas-text overflow-hidden">
      {/* Top Header Toolbar */}
      <div className="flex items-center justify-between px-6 py-2.5 border-b border-atlas-border bg-atlas-surface/90 backdrop-blur-sm z-10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-atlas-accent" />
            <span className="text-sm font-semibold tracking-tight">Repository Explorer</span>
          </div>

          <div className="h-4 w-px bg-atlas-border" />

          {/* Repository Selector */}
          <select
            value={selectedRepoId || ""}
            onChange={(e) => {
              const r = repos.find((repo) => repo.id === e.target.value);
              setSelectedRepo(e.target.value, r?.name);
              setSelectedFileId(null);
            }}
            className="bg-atlas-bg border border-atlas-border text-xs text-atlas-text rounded-md px-2.5 py-1 font-mono focus:outline-none focus:border-atlas-accent cursor-pointer"
          >
            {repos.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name} ({r.status})
              </option>
            ))}
          </select>
        </div>

        <Button
          size="sm"
          variant="primary"
          leftIcon={<Upload className="w-3.5 h-3.5" />}
          onClick={() => setIsImportOpen(true)}
        >
          Import Repository
        </Button>
      </div>

      {/* 3-Column Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Column: File Tree */}
        <div className="w-72 border-r border-atlas-border bg-atlas-sidebar flex flex-col shrink-0">
          <div className="p-3 border-b border-atlas-border">
            <Input
              placeholder="Filter repository files..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              leftIcon={<Search className="w-3.5 h-3.5" />}
            />
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-0.5 font-mono text-xs">
            {filesLoading ? (
              <div className="p-6 text-xs text-atlas-text-muted text-center font-sans">
                Scanning repository files...
              </div>
            ) : filteredFiles.length === 0 ? (
              <div className="p-6 text-xs text-atlas-text-muted text-center font-sans">
                No matching files found.
              </div>
            ) : (
              filteredFiles.map((f) => {
                const isSelected = f.id === selectedFileId;
                return (
                  <button
                    key={f.id}
                    onClick={() => {
                      setSelectedFileId(f.id);
                      setHighlightedRange(undefined);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-left transition-colors duration-100 ${
                      isSelected
                        ? "bg-atlas-accent/15 text-atlas-accent font-semibold border border-atlas-accent/30"
                        : "text-atlas-text-secondary hover:bg-atlas-hover hover:text-atlas-text"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FileCode className="w-3.5 h-3.5 shrink-0 text-atlas-text-muted" />
                      <span className="truncate">{f.path}</span>
                    </div>
                    <span className="text-[10px] text-atlas-text-muted font-mono shrink-0 ml-2">
                      {f.line_count}L
                    </span>
                  </button>
                );
              })
            )}
          </div>

          <div className="p-2.5 border-t border-atlas-border text-[11px] font-mono text-atlas-text-muted flex justify-between">
            <span>FILES: {filteredFiles.length}</span>
            <span>INDEXED</span>
          </div>
        </div>

        {/* Center Column: Code Viewer */}
        <div className="flex-1 flex flex-col bg-atlas-bg overflow-hidden min-w-0">
          {fileDetail ? (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* File Path Header Bar */}
              <div className="flex items-center justify-between px-4 py-2 border-b border-atlas-border bg-atlas-surface/60 shrink-0">
                <div className="flex items-center gap-2 font-mono text-xs text-atlas-text truncate">
                  <FileCode className="w-3.5 h-3.5 text-atlas-accent shrink-0" />
                  <span className="truncate">{fileDetail.path}</span>
                  <Badge variant="outline" size="sm">{fileDetail.language}</Badge>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="xs"
                    variant="ghost"
                    leftIcon={copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    onClick={handleCopyContent}
                  >
                    {copied ? "Copied" : "Copy Code"}
                  </Button>
                </div>
              </div>

              {/* Code Viewer Display */}
              <div className="flex-1 overflow-hidden p-2">
                <CodeViewer
                  content={fileDetail.content || "// Empty or binary file"}
                  filePath={fileDetail.path}
                  language={fileDetail.language}
                  highlightRange={highlightedRange}
                />
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-xs text-atlas-text-muted">
              Select a file from the repository tree to inspect its AST and source code.
            </div>
          )}
        </div>

        {/* Right Column: Intelligence Panel */}
        <div className="w-80 border-l border-atlas-border bg-atlas-sidebar flex flex-col shrink-0 overflow-hidden">
          <div className="px-4 py-3 border-b border-atlas-border flex items-center gap-2">
            <Code2 className="w-4 h-4 text-atlas-accent" />
            <span className="text-xs font-semibold uppercase tracking-wider text-atlas-text-secondary">
              Symbol Intelligence
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {fileDetail ? (
              <>
                {/* File Metadata Card */}
                <Card variant="information" className="p-3.5 space-y-2">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-atlas-text-muted">
                    File Structure
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                    <div className="text-atlas-text-muted">
                      Language: <span className="text-atlas-text">{fileDetail.language}</span>
                    </div>
                    <div className="text-atlas-text-muted">
                      Lines: <span className="text-atlas-text">{fileDetail.line_count}</span>
                    </div>
                    <div className="text-atlas-text-muted">
                      Chunks: <span className="text-atlas-text">{fileDetail.chunk_count}</span>
                    </div>
                    <div className="text-atlas-text-muted">
                      Size: <span className="text-atlas-text">{(fileDetail.size_bytes / 1024).toFixed(1)} KB</span>
                    </div>
                  </div>
                </Card>

                {/* Symbols Section */}
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-atlas-text-secondary uppercase tracking-wider flex items-center justify-between">
                    <span>Extracted AST Symbols</span>
                    <Badge variant="default" size="sm">{fileDetail.symbols.length}</Badge>
                  </div>

                  {fileDetail.symbols.length === 0 ? (
                    <div className="text-xs text-atlas-text-muted italic py-3 text-center">
                      No function or class symbols extracted.
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {fileDetail.symbols.map((sym) => (
                        <div
                          key={sym.id}
                          onClick={() => setHighlightedRange([sym.start_line, sym.end_line])}
                          className="p-2.5 bg-atlas-surface hover:bg-atlas-surface-secondary border border-atlas-border hover:border-atlas-accent/40 rounded-lg cursor-pointer transition-all duration-100 space-y-1 font-mono text-xs"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-atlas-accent truncate">{sym.name}</span>
                            <Badge variant="outline" size="sm">
                              {sym.symbol_type}
                            </Badge>
                          </div>
                          <div className="text-[10px] text-atlas-text-muted">
                            Lines L{sym.start_line} – L{sym.end_line}
                          </div>
                          {sym.signature && (
                            <div className="text-[10px] text-atlas-text-secondary truncate bg-atlas-bg p-1 rounded border border-atlas-border/50">
                              {sym.signature}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center py-10 text-xs text-atlas-text-muted">
                No file selected.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Import Repository Modal */}
      <Modal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        title="Import Codebase Repository"
        description="Clone a remote GitHub repository or submit a repository URL for AST indexing and neural embedding."
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setIsImportOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              loading={importMutation.isPending}
              onClick={() => {
                if (importUrl.trim()) {
                  importMutation.mutate(importUrl.trim());
                }
              }}
            >
              Start Ingestion
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="GitHub Repository URL"
            placeholder="https://github.com/owner/repository"
            value={importUrl}
            onChange={(e) => setImportUrl(e.target.value)}
            leftIcon={<GitBranch className="w-3.5 h-3.5" />}
            helperText="The repository will be cloned into the sandboxed storage path and parsed by the AST ingestion engine."
          />
        </div>
      </Modal>
    </div>
  );
};
