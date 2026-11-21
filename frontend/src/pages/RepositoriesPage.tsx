import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FileCode, Search, Upload, Layers, Code2 } from "lucide-react";
import { apiGet, apiPost } from "@/lib/api";
import { CodeViewer } from "@/components/code/CodeViewer";

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
  const [selectedRepoId, setSelectedRepoId] = useState<string | null>(null);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [searchFilter, setSearchFilter] = useState("");
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importUrl, setImportUrl] = useState("");
  const [highlightedRange, setHighlightedRange] = useState<[number, number] | undefined>(undefined);

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

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-[#0B0D10] text-[#F1F3F5]">
      {/* Top Header Toolbar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-[#262B33] bg-[#0E1014]">
        <div className="flex items-center space-x-3">
          <Layers className="w-5 h-5 text-[#6C8CFF]" />
          <h1 className="text-lg font-semibold tracking-tight">Repository Explorer</h1>
          <select
            value={selectedRepoId || ""}
            onChange={(e) => {
              setSelectedRepoId(e.target.value);
              setSelectedFileId(null);
            }}
            className="bg-[#14171C] border border-[#262B33] text-xs text-[#F1F3F5] rounded px-2.5 py-1.5 focus:outline-none focus:border-[#6C8CFF]"
          >
            {repos.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name} ({r.status})
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={() => setIsImportOpen(true)}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-md bg-[#6C8CFF] hover:bg-[#5b7ce6] text-white text-xs font-medium transition"
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Import Repository</span>
        </button>
      </div>

      {/* 3-Column Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Column: File Tree */}
        <div className="w-72 border-r border-[#262B33] bg-[#0E1014] flex flex-col">
          <div className="p-3 border-b border-[#262B33]">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-[#69717D]" />
              <input
                type="text"
                placeholder="Filter files..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-[#14171C] border border-[#262B33] rounded text-xs text-[#F1F3F5] placeholder-[#69717D] focus:outline-none focus:border-[#6C8CFF]"
              />
            </div>
          </div>

          <div className="flex-1 overflow-auto p-2 space-y-0.5">
            {filesLoading ? (
              <div className="p-4 text-xs text-[#69717D] text-center">Loading files...</div>
            ) : filteredFiles.length === 0 ? (
              <div className="p-4 text-xs text-[#69717D] text-center">No files found</div>
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
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-left text-xs transition ${
                      isSelected
                        ? "bg-[#14171C] text-[#6C8CFF] border border-[#6C8CFF]/30 font-medium"
                        : "text-[#A0A7B2] hover:bg-[#14171C] hover:text-[#F1F3F5]"
                    }`}
                  >
                    <div className="flex items-center space-x-2 truncate">
                      <FileCode className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{f.path}</span>
                    </div>
                    <span className="text-[10px] text-[#69717D] shrink-0 font-mono">
                      {f.line_count}L
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Center Column: Code Viewer */}
        <div className="flex-1 p-4 bg-[#0B0D10] overflow-hidden flex flex-col">
          {fileDetail ? (
            <CodeViewer
              content={fileDetail.content || "// No code content loaded"}
              filePath={fileDetail.path}
              language={fileDetail.language}
              highlightRange={highlightedRange}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center text-xs text-[#69717D]">
              Select a file from the repository tree to inspect its source code.
            </div>
          )}
        </div>

        {/* Right Column: Intelligence Panel */}
        <div className="w-80 border-l border-[#262B33] bg-[#0E1014] flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-[#262B33] font-medium text-xs text-[#A0A7B2] uppercase tracking-wider flex items-center space-x-2">
            <Code2 className="w-4 h-4 text-[#6C8CFF]" />
            <span>Code Intelligence</span>
          </div>

          <div className="flex-1 overflow-auto p-4 space-y-4">
            {fileDetail ? (
              <>
                {/* File Metadata Card */}
                <div className="p-3 bg-[#14171C] border border-[#262B33] rounded-lg space-y-2 text-xs">
                  <div className="text-[11px] font-semibold text-[#A0A7B2] uppercase tracking-wider">
                    File Metadata
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[#A0A7B2] font-mono text-[11px]">
                    <div>Language: <span className="text-[#F1F3F5]">{fileDetail.language}</span></div>
                    <div>Lines: <span className="text-[#F1F3F5]">{fileDetail.line_count}</span></div>
                    <div>Chunks: <span className="text-[#F1F3F5]">{fileDetail.chunk_count}</span></div>
                    <div>Size: <span className="text-[#F1F3F5]">{fileDetail.size_bytes}B</span></div>
                  </div>
                </div>

                {/* Symbols Section */}
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-[#A0A7B2] uppercase tracking-wider flex items-center justify-between">
                    <span>Extracted Symbols ({fileDetail.symbols.length})</span>
                  </div>

                  {fileDetail.symbols.length === 0 ? (
                    <div className="text-xs text-[#69717D] italic">No symbols extracted</div>
                  ) : (
                    <div className="space-y-1.5">
                      {fileDetail.symbols.map((sym) => (
                        <div
                          key={sym.id}
                          onClick={() => setHighlightedRange([sym.start_line, sym.end_line])}
                          className="p-2 bg-[#14171C] hover:bg-[#191D23] border border-[#262B33] rounded cursor-pointer transition text-xs space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-medium text-[#6C8CFF]">{sym.name}</span>
                            <span className="text-[10px] px-1 py-0.5 bg-[#191D23] border border-[#262B33] rounded text-[#A0A7B2]">
                              {sym.symbol_type}
                            </span>
                          </div>
                          <div className="text-[10px] font-mono text-[#69717D]">
                            Lines {sym.start_line}–{sym.end_line}
                          </div>
                          {sym.signature && (
                            <div className="text-[10px] font-mono text-[#A0A7B2] truncate">
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
              <div className="text-xs text-[#69717D] text-center pt-8">
                Select a file to inspect its extracted symbols and AST relationships.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Import Modal */}
      {isImportOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-md bg-[#14171C] border border-[#343B45] rounded-xl p-6 shadow-2xl space-y-4">
            <h2 className="text-base font-semibold text-[#F1F3F5]">Import GitHub Repository</h2>
            <p className="text-xs text-[#A0A7B2]">
              Paste a public or token-authorized GitHub repository URL to clone and index.
            </p>
            <input
              type="text"
              placeholder="https://github.com/owner/repository"
              value={importUrl}
              onChange={(e) => setImportUrl(e.target.value)}
              className="w-full px-3 py-2 bg-[#0B0D10] border border-[#262B33] rounded text-xs text-[#F1F3F5] focus:outline-none focus:border-[#6C8CFF]"
            />
            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setIsImportOpen(false)}
                className="px-3 py-1.5 text-xs text-[#A0A7B2] hover:text-[#F1F3F5] transition"
              >
                Cancel
              </button>
              <button
                disabled={!importUrl.trim() || importMutation.isPending}
                onClick={() => importMutation.mutate(importUrl)}
                className="px-4 py-1.5 text-xs font-medium bg-[#6C8CFF] hover:bg-[#5b7ce6] text-white rounded transition disabled:opacity-50"
              >
                {importMutation.isPending ? "Importing..." : "Start Import"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
