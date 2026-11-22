import { useState, useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { Search, ChevronDown, Check, GitBranch, FolderGit2, Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { Sidebar } from "./Sidebar";
import { CommandPalette } from "./CommandPalette";
import { useRepositoryStore } from "@/stores/repository";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";

interface Repository {
  id: string;
  name: string;
  status: string;
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
    "MLens-AI";

  return (
    <div className="flex h-screen overflow-hidden bg-codexa-bg text-codexa-text">
      <Sidebar />

      <div className="flex flex-col flex-1 min-w-0">
        {/* Top header navigation bar */}
        <header className="flex items-center justify-between h-16 px-6 border-b border-codexa-border bg-codexa-surface shrink-0 z-20">
          {/* Global Search Bar (Trigger for Command Palette) */}
          <button
            onClick={() => setCommandPaletteOpen(true)}
            aria-label="Open global search"
            className={cn(
              "flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-codexa-bg border border-codexa-border",
              "text-xs text-codexa-text-muted hover:text-codexa-text hover:border-codexa-border-strong",
              "transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-codexa-primary/20",
              "w-80 sm:w-96 justify-between cursor-pointer shadow-subtle"
            )}
          >
            <div className="flex items-center gap-2 truncate">
              <Search className="w-4 h-4 text-codexa-text-muted shrink-0" />
              <span className="truncate">Search repositories, code, or ask a question...</span>
            </div>
            <kbd className="text-[10px] font-mono text-codexa-text-muted bg-codexa-surface px-1.5 py-0.5 rounded border border-codexa-border shrink-0">
              Ctrl K
            </kbd>
          </button>

          {/* Right Controls: Active Repo, Notification & Profile */}
          <div className="flex items-center gap-3">
            {/* Active Repository Selector */}
            <div className="relative">
              <button
                onClick={() => setRepoDropdownOpen((prev) => !prev)}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border border-codexa-border",
                  "bg-codexa-surface hover:bg-codexa-surface-hover hover:border-codexa-border-strong shadow-subtle",
                  "text-codexa-text transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-codexa-primary/20"
                )}
              >
                <GitBranch className="w-3.5 h-3.5 text-codexa-primary shrink-0" />
                <span className="font-mono text-xs">{currentRepoName}</span>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-emerald-50 text-emerald-600 border border-emerald-200">
                  Indexed
                </span>
                <ChevronDown
                  className={cn(
                    "w-3.5 h-3.5 text-codexa-text-muted transition-transform duration-150",
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
                  <div className="absolute right-0 top-11 w-64 bg-codexa-surface border border-codexa-border-strong rounded-xl shadow-elevated p-1.5 z-40 animate-scale-in">
                    <div className="px-3 py-1.5 text-[10px] font-mono uppercase text-codexa-text-muted border-b border-codexa-border mb-1">
                      Indexed Repositories
                    </div>
                    <div className="max-h-52 overflow-y-auto space-y-0.5">
                      {repos.length === 0 ? (
                        <div className="px-3 py-4 text-xs text-codexa-text-muted text-center">
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
                                "flex items-center justify-between px-3 py-2 rounded-lg text-xs cursor-pointer transition-colors",
                                isSelected
                                  ? "bg-codexa-violet-surface text-codexa-indigo font-bold"
                                  : "text-codexa-text hover:bg-codexa-surface-hover"
                              )}
                            >
                              <span className="truncate font-mono text-[11px]">{r.name}</span>
                              {isSelected && <Check className="w-3.5 h-3.5 shrink-0 text-codexa-primary" />}
                            </div>
                          );
                        })
                      )}
                    </div>
                    <div className="border-t border-codexa-border mt-1 pt-1">
                      <button
                        onClick={() => {
                          setRepoDropdownOpen(false);
                          navigate("/repositories");
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-codexa-text-secondary hover:text-codexa-text hover:bg-codexa-bg transition-colors"
                      >
                        <FolderGit2 className="w-3.5 h-3.5 text-codexa-text-muted" />
                        <span>Manage & Connect Repositories</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Notification Bell */}
            <button
              aria-label="Notifications"
              className="p-2 rounded-lg border border-codexa-border bg-codexa-surface hover:bg-codexa-surface-hover text-codexa-text-secondary hover:text-codexa-text shadow-subtle transition-colors relative"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-codexa-primary" />
            </button>

            {/* User Profile Avatar */}
            <div className="w-8 h-8 rounded-full bg-codexa-violet-light border border-codexa-violet-soft/40 flex items-center justify-center text-codexa-indigo font-bold text-xs select-none">
              S
            </div>
          </div>
        </header>

        {/* Main content body */}
        <main className="flex-1 overflow-y-auto bg-codexa-bg">
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
