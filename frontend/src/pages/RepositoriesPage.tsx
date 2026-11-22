import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  FileCode,
  Folder,
  FolderOpen,
  Search,
  Upload,
  Copy,
  Check,
  GitBranch,
  ChevronRight,
} from "lucide-react";
import { apiGet, apiPost } from "@/lib/api";
import { useRepositoryStore } from "@/stores/repository";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
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
  const { selectedRepoId, selectedRepoName, setSelectedRepo } = useRepositoryStore();
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [searchFilter, setSearchFilter] = useState("");
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importUrl, setImportUrl] = useState("");
  const [highlightedRange, setHighlightedRange] = useState<[number, number] | undefined>(undefined);
  const [copied, setCopied] = useState(false);
  const [activeIntelTab, setActiveIntelTab] = useState<"summary" | "functions" | "classes" | "deps">("summary");

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

  // Default sample code if no file loaded
  const sampleCode = `import torch
from torch.utils.data import DataLoader
from model import CodeEncoder

def train_model(config):
    """Train the code encoder model."""
    model = CodeEncoder(config)
    
    train_loader = DataLoader(
        dataset=config.dataset,
        batch_size=config.batch_size,
        shuffle=True
    )
    
    optimizer = torch.optim.AdamW(model.parameters(), lr=config.lr)
    
    for epoch in range(config.epochs):
        for batch in train_loader:
            optimizer.zero_grad()
            loss = model(batch)
            loss.backward()
            optimizer.step()
            
    return model`;

  const activeContent = fileDetail?.content || sampleCode;
  const activePath = fileDetail?.path || "ml/training.py";
  const functions = fileDetail?.symbols?.filter((s) => s.symbol_type === "function") || [
    { id: "s1", name: "train_model(config)", symbol_type: "function", start_line: 5, end_line: 23 },
    { id: "s2", name: "eval_step(batch)", symbol_type: "function", start_line: 25, end_line: 35 },
    { id: "s3", name: "save_checkpoint(path)", symbol_type: "function", start_line: 37, end_line: 45 },
  ];
  const classes = fileDetail?.symbols?.filter((s) => s.symbol_type === "class") || [
    { id: "c1", name: "CodeTrainer", symbol_type: "class", start_line: 1, end_line: 50 },
  ];

  const filteredFiles = files.filter((f) =>
    f.path.toLowerCase().includes(searchFilter.toLowerCase())
  );

  const handleCopyContent = () => {
    navigator.clipboard.writeText(activeContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-codexa-bg text-codexa-text overflow-hidden">
      {/* 3-Column Professional IDE Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Column: Repository File Tree */}
        <div className="w-68 border-r border-codexa-border bg-codexa-surface flex flex-col shrink-0">
          <div className="p-3 border-b border-codexa-border flex items-center justify-between">
            <div className="flex items-center gap-2 truncate">
              <GitBranch className="w-4 h-4 text-codexa-primary shrink-0" />
              <span className="font-mono text-xs font-bold text-codexa-text truncate">
                {selectedRepoName || "MLens-AI"}
              </span>
            </div>
            <Button
              size="xs"
              variant="ghost"
              leftIcon={<Upload className="w-3 h-3" />}
              onClick={() => setIsImportOpen(true)}
            >
              Import
            </Button>
          </div>

          <div className="p-2.5 border-b border-codexa-border">
            <Input
              placeholder="Search files..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              leftIcon={<Search className="w-3.5 h-3.5" />}
            />
          </div>

          {/* File Tree List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-0.5 font-mono text-xs">
            {filesLoading ? (
              <div className="p-6 text-xs text-codexa-text-muted text-center font-sans">
                Scanning repository files...
              </div>
            ) : filteredFiles.length === 0 ? (
              // Default sample tree if no files in DB
              <div className="space-y-1">
                <div className="px-2 py-1 text-codexa-text-muted text-[11px] flex items-center gap-1.5">
                  <FolderOpen className="w-3.5 h-3.5 text-codexa-primary" />
                  <span>app/</span>
                </div>
                <div className="pl-4 space-y-1">
                  <div className="px-2 py-1 text-codexa-text-muted text-[11px] flex items-center gap-1.5">
                    <FolderOpen className="w-3.5 h-3.5 text-codexa-primary" />
                    <span>ml/</span>
                  </div>
                  <div className="pl-4 space-y-0.5">
                    <div className="px-2 py-1 text-codexa-text-secondary text-[11px] flex items-center gap-1.5 hover:bg-codexa-bg rounded cursor-pointer">
                      <FileCode className="w-3 h-3" />
                      <span>models.py</span>
                    </div>
                    <div className="px-2 py-1 bg-codexa-violet-surface text-codexa-indigo font-bold text-[11px] flex items-center gap-1.5 rounded cursor-pointer">
                      <FileCode className="w-3 h-3 text-codexa-primary" />
                      <span>training.py</span>
                    </div>
                    <div className="px-2 py-1 text-codexa-text-secondary text-[11px] flex items-center gap-1.5 hover:bg-codexa-bg rounded cursor-pointer">
                      <FileCode className="w-3 h-3" />
                      <span>inference.py</span>
                    </div>
                  </div>
                </div>
                <div className="px-2 py-1 text-codexa-text-muted text-[11px] flex items-center gap-1.5">
                  <Folder className="w-3.5 h-3.5 text-codexa-text-muted" />
                  <span>api/</span>
                </div>
                <div className="px-2 py-1 text-codexa-text-muted text-[11px] flex items-center gap-1.5">
                  <Folder className="w-3.5 h-3.5 text-codexa-text-muted" />
                  <span>web/</span>
                </div>
                <div className="px-2 py-1 text-codexa-text-muted text-[11px] flex items-center gap-1.5">
                  <Folder className="w-3.5 h-3.5 text-codexa-text-muted" />
                  <span>tests/</span>
                </div>
                <div className="px-2 py-1 text-codexa-text-secondary text-[11px] flex items-center gap-1.5">
                  <FileCode className="w-3 h-3 text-codexa-text-muted" />
                  <span>README.md</span>
                </div>
                <div className="px-2 py-1 text-codexa-text-secondary text-[11px] flex items-center gap-1.5">
                  <FileCode className="w-3 h-3 text-codexa-text-muted" />
                  <span>requirements.txt</span>
                </div>
                <div className="px-2 py-1 text-codexa-text-secondary text-[11px] flex items-center gap-1.5">
                  <FileCode className="w-3 h-3 text-codexa-text-muted" />
                  <span>docker-compose.yml</span>
                </div>
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
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-colors duration-100 ${
                      isSelected
                        ? "bg-codexa-violet-surface text-codexa-indigo font-bold border border-codexa-violet-light"
                        : "text-codexa-text-secondary hover:bg-codexa-surface-hover hover:text-codexa-text"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FileCode className="w-3.5 h-3.5 shrink-0 text-codexa-text-muted" />
                      <span className="truncate">{f.path}</span>
                    </div>
                    <span className="text-[10px] text-codexa-text-muted font-mono shrink-0 ml-2">
                      {f.line_count}L
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Center Column: Code Editor & Viewer */}
        <div className="flex-1 flex flex-col bg-codexa-surface overflow-hidden min-w-0 border-r border-codexa-border">
          {/* File Breadcrumb Header */}
          <div className="flex items-center justify-between px-5 py-2.5 border-b border-codexa-border bg-codexa-bg/50 shrink-0">
            <div className="flex items-center gap-2 font-mono text-xs text-codexa-text truncate">
              <span className="text-codexa-text-muted">Repositories</span>
              <ChevronRight className="w-3 h-3 text-codexa-text-muted" />
              <span className="font-semibold text-codexa-indigo">{activePath}</span>
            </div>

            <Button
              size="xs"
              variant="secondary"
              leftIcon={copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
              onClick={handleCopyContent}
            >
              {copied ? "Copied" : "Copy Code"}
            </Button>
          </div>

          {/* Code Viewer */}
          <div className="flex-1 overflow-auto p-4 bg-codexa-surface font-mono text-xs">
            <pre className="text-codexa-text leading-relaxed select-text">
              {activeContent.split("\n").map((line, idx) => {
                const lineNum = idx + 1;
                const isHighlighted =
                  highlightedRange &&
                  lineNum >= highlightedRange[0] &&
                  lineNum <= highlightedRange[1];
                return (
                  <div
                    key={idx}
                    className={`flex py-0.5 px-2 rounded ${
                      isHighlighted
                        ? "bg-violet-100/70 border-l-2 border-primary text-primary font-medium"
                        : "hover:bg-codexa-bg/60"
                    }`}
                  >
                    <span className="w-8 text-right pr-4 text-codexa-text-muted select-none text-[11px]">
                      {lineNum}
                    </span>
                    <span className="flex-1 whitespace-pre">{line}</span>
                  </div>
                );
              })}
            </pre>
          </div>
        </div>

        {/* Right Column: Code Intelligence Panel */}
        <div className="w-80 border-l border-codexa-border bg-codexa-surface flex flex-col shrink-0 overflow-hidden">
          {/* Intelligence Tabs */}
          <div className="flex items-center border-b border-codexa-border bg-codexa-bg/50 px-2 pt-2">
            {[
              { id: "summary", label: "Summary" },
              { id: "functions", label: `Functions (${functions.length})` },
              { id: "classes", label: `Classes (${classes.length})` },
              { id: "deps", label: "Dependencies" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveIntelTab(tab.id as any)}
                className={`px-3 py-2 text-xs font-semibold border-b-2 transition-colors ${
                  activeIntelTab === tab.id
                    ? "border-codexa-primary text-codexa-primary"
                    : "border-transparent text-codexa-text-secondary hover:text-codexa-text"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Intelligence Tab Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {activeIntelTab === "summary" && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-codexa-bg border border-codexa-border space-y-2 text-xs">
                  <div className="text-[10px] font-mono font-bold uppercase text-codexa-primary">
                    File Overview
                  </div>
                  <p className="text-codexa-text-secondary leading-relaxed">
                    {activePath} ({activeContent.split("\n").length} lines, {fileDetail?.language || "python"}). Contains {functions.length} function definitions and {classes.length} class declarations.
                  </p>
                </div>

                <div className="space-y-2 text-xs font-mono">
                  <div className="text-[10px] uppercase font-bold text-codexa-text-muted">
                    Key Symbols
                  </div>
                  {functions.slice(0, 3).map((f) => (
                    <div
                      key={f.id}
                      onClick={() => setHighlightedRange([f.start_line, f.end_line])}
                      className="p-2.5 rounded-lg bg-codexa-surface border border-codexa-border font-semibold text-codexa-indigo cursor-pointer hover:bg-violet-50 transition-colors truncate"
                    >
                      {f.name} (L{f.start_line}-L{f.end_line})
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeIntelTab === "functions" && (
              <div className="space-y-2">
                {functions.length === 0 ? (
                  <div className="text-xs text-codexa-text-muted italic py-6 text-center">
                    No top-level functions defined in this file.
                  </div>
                ) : (
                  functions.map((fn) => (
                    <div
                      key={fn.id}
                      onClick={() => setHighlightedRange([fn.start_line, fn.end_line])}
                      className="p-3 rounded-lg bg-codexa-bg border border-codexa-border space-y-1 font-mono text-xs hover:border-codexa-primary hover:bg-violet-50/50 cursor-pointer transition-colors"
                    >
                      <div className="font-bold text-codexa-primary truncate">{fn.name}</div>
                      <div className="text-[10px] text-codexa-text-muted">
                        Lines L{fn.start_line} – L{fn.end_line}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeIntelTab === "classes" && (
              <div className="space-y-2">
                {classes.length === 0 ? (
                  <div className="text-xs text-codexa-text-muted italic py-6 text-center">
                    No class definitions in this file.
                  </div>
                ) : (
                  classes.map((cls) => (
                    <div
                      key={cls.id}
                      onClick={() => setHighlightedRange([cls.start_line, cls.end_line])}
                      className="p-3 rounded-lg bg-codexa-bg border border-codexa-border space-y-1 font-mono text-xs hover:border-emerald-500 hover:bg-emerald-50/50 cursor-pointer transition-colors"
                    >
                      <div className="font-bold text-emerald-600 truncate">{cls.name}</div>
                      <div className="text-[10px] text-codexa-text-muted">
                        Lines L{cls.start_line} – L{cls.end_line}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeIntelTab === "deps" && (
              <div className="space-y-2 font-mono text-xs">
                <div className="p-3 rounded-lg bg-codexa-bg border border-codexa-border flex items-center justify-between">
                  <span className="font-bold text-codexa-text">torch</span>
                  <Badge variant="accent" size="sm">2.2.0</Badge>
                </div>
                <div className="p-3 rounded-lg bg-codexa-bg border border-codexa-border flex items-center justify-between">
                  <span className="font-bold text-codexa-text">torch.utils.data</span>
                  <Badge variant="accent" size="sm">DataLoader</Badge>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Import Modal */}
      <Modal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        title="Connect Codebase Repository"
        description="Clone a remote repository or upload an archive to index AST symbols and dependencies."
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
              Start Analysis
            </Button>
          </>
        }
      >
        <Input
          label="GitHub Repository URL"
          placeholder="https://github.com/owner/repository"
          value={importUrl}
          onChange={(e) => setImportUrl(e.target.value)}
          leftIcon={<GitBranch className="w-3.5 h-3.5" />}
          helperText="AST parsing and symbol indexing run automatically on import."
        />
      </Modal>
    </div>
  );
};
