import { useState, useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { Search, ChevronDown, Check, GitBranch, FolderGit2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Sidebar } from "./Sidebar";
import { Breadcrumbs } from "./Breadcrumbs";
import { CommandPalette } from "./CommandPalette";
import { useRepositoryStore } from "@/stores/repository";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";

interface Repository {
  id: string;
  name: string;
  default_branch?: string;
  files_count?: number;
}

export function AppShell() {
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [repoDropdownOpen, setRepoDropdownOpen] = useState(false);
  const navigate = useNavigate();

  const { selectedRepoId, selectedRepoName, setSelectedRepo } = useRepositoryStore();

  const { data: repos = [] } = useQuery<Repository[]>({
    queryKey: ["repositories"],
    queryFn: () => apiGet<Repository[]>("/api/v1/repositories"),
  });

  // Auto-select first repo if none selected
  useEffect(() => {
    if (repos.length > 0 && !selectedRepoId && repos[0]) {
      setSelectedRepo(repos[0].id, repos[0].name);
    }
  }, [repos, selectedRepoId, setSelectedRepo]);

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const currentRepoName =
    selectedRepoName ||
    repos.find((r) => r.id === selectedRepoId)?.name ||
    "Select repository";

  return (
    <div className="flex h-screen overflow-hidden bg-atlas-bg text-atlas-text">
      <Sidebar />

      <div className="flex flex-col flex-1 min-w-0">
        {/* Top header navigation bar */}
        <header className="flex items-center justify-between h-13 px-5 border-b border-atlas-border bg-atlas-surface/80 backdrop-blur-sm shrink-0 z-20">
          {/* Left: Breadcrumbs navigation */}
          <div className="flex-1 min-w-0">
            <Breadcrumbs />
          </div>

          {/* Center: Command Palette Trigger */}
          <button
            onClick={() => setCommandPaletteOpen(true)}
            aria-label="Open command palette"
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-md bg-atlas-bg border border-atlas-border",
              "text-xs text-atlas-text-muted hover:text-atlas-text-secondary hover:border-atlas-border-strong",
              "transition-all duration-150 focus:outline-none focus:ring-1 focus:ring-atlas-accent",
              "min-w-[260px] justify-between cursor-pointer"
            )}
          >
            <div className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-atlas-text-muted" />
              <span>Search commands, symbols, files...</span>
            </div>
            <kbd className="text-[10px] font-mono text-atlas-text-muted bg-atlas-surface px-1.5 py-0.5 rounded border border-atlas-border">
              Ctrl+K
            </kbd>
          </button>

          {/* Right: Active Repository Selector */}
          <div className="flex-1 flex justify-end min-w-0 relative">
            <button
              onClick={() => setRepoDropdownOpen((prev) => !prev)}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium border border-atlas-border",
                "bg-atlas-surface hover:bg-atlas-hover hover:border-atlas-border-strong",
                "text-atlas-text transition-all duration-150 focus:outline-none focus:ring-1 focus:ring-atlas-accent"
              )}
            >
              <GitBranch className="w-3.5 h-3.5 text-atlas-accent shrink-0" />
              <span className="truncate max-w-[140px] font-mono text-[11px]">
                {currentRepoName}
              </span>
              <ChevronDown
                className={cn(
                  "w-3.5 h-3.5 text-atlas-text-muted transition-transform duration-150",
                  repoDropdownOpen && "rotate-180"
                )}
              />
            </button>

            {/* Dropdown Menu */}
            {repoDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setRepoDropdownOpen(false)}
                />
                <div className="absolute right-0 top-10 w-64 bg-atlas-surface border border-atlas-border-strong rounded-lg shadow-elevated p-1.5 z-40 animate-scale-in">
                  <div className="px-2.5 py-1.5 text-[10px] font-mono uppercase text-atlas-text-muted border-b border-atlas-border mb-1">
                    Indexed Repositories
                  </div>
                  <div className="max-h-52 overflow-y-auto space-y-0.5">
                    {repos.length === 0 ? (
                      <div className="px-2.5 py-3 text-xs text-atlas-text-muted text-center">
                        No repositories indexed yet
                      </div>
                    ) : (
                      repos.map((r) => {
                        const isSelected = r.id === selectedRepoId;
                        return (
                          <div
                            key={r.id}
                            onClick={() => {
                              setSelectedRepo(r.id, r.name);
                              setRepoDropdownOpen(false);
                            }}
                            className={cn(
                              "flex items-center justify-between px-2.5 py-1.5 rounded text-xs cursor-pointer transition-colors",
                              isSelected
                                ? "bg-atlas-accent/15 text-atlas-accent font-medium"
                                : "text-atlas-text hover:bg-atlas-hover"
                            )}
                          >
                            <span className="truncate font-mono text-[11px]">{r.name}</span>
                            {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                          </div>
                        );
                      })
                    )}
                  </div>
                  <div className="border-t border-atlas-border mt-1 pt-1">
                    <button
                      onClick={() => {
                        setRepoDropdownOpen(false);
                        navigate("/repositories");
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-xs text-atlas-text-secondary hover:text-atlas-text hover:bg-atlas-hover transition-colors"
                    >
                      <FolderGit2 className="w-3.5 h-3.5 text-atlas-text-muted" />
                      <span>Manage & Import Repositories</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </header>

        {/* Main content body */}
        <main className="flex-1 overflow-y-auto bg-atlas-bg">
          <Outlet />
        </main>
      </div>

      {/* Global Command Palette */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
      />
    </div>
  );
}
