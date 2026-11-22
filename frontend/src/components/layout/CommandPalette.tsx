import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  LayoutDashboard,
  FolderGit2,
  MessageSquareCode,
  Network,
  Cpu,
  Layers,
  Activity,
  Settings,
  ArrowRight,
  Database,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import { useRepositoryStore } from "@/stores/repository";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Repository {
  id: string;
  name: string;
  branch?: string;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();
  const { setSelectedRepo } = useRepositoryStore();

  const { data: repos = [] } = useQuery<Repository[]>({
    queryKey: ["repositories"],
    queryFn: () => apiGet<Repository[]>("/api/v1/repositories"),
    enabled: isOpen,
  });

  const navigationItems = useMemo(
    () => [
      {
        id: "nav-dash",
        title: "Overview Dashboard",
        category: "Navigation",
        icon: LayoutDashboard,
        path: "/",
      },
      {
        id: "nav-repos",
        title: "Repositories & Code Viewer",
        category: "Navigation",
        icon: FolderGit2,
        path: "/repositories",
      },
      {
        id: "nav-chat",
        title: "Ask CodeAtlas (Investigation)",
        category: "Navigation",
        icon: MessageSquareCode,
        path: "/chat",
      },
      {
        id: "nav-search",
        title: "Hybrid Code Search",
        category: "Navigation",
        icon: Search,
        path: "/search",
      },
      {
        id: "nav-graph",
        title: "Code Graph & Blast Radius",
        category: "Intelligence",
        icon: Network,
        path: "/graph",
      },
      {
        id: "nav-arch",
        title: "Architecture & Hotspots",
        category: "Intelligence",
        icon: Layers,
        path: "/architecture",
      },
      {
        id: "nav-models",
        title: "Neural Models & Metrics",
        category: "Machine Learning",
        icon: Cpu,
        path: "/models",
      },
      {
        id: "nav-activity",
        title: "System Activity & Health",
        category: "System",
        icon: Activity,
        path: "/activity",
      },
      {
        id: "nav-settings",
        title: "System Settings",
        category: "System",
        icon: Settings,
        path: "/settings",
      },
    ],
    []
  );

  const filteredItems = useMemo(() => {
    const q = query.toLowerCase().trim();
    const navFiltered = navigationItems.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.path.toLowerCase().includes(q)
    );

    const repoItems = repos
      .filter((r) => r.name.toLowerCase().includes(q))
      .map((r) => ({
        id: `repo-${r.id}`,
        title: `Switch to: ${r.name}`,
        category: "Repositories",
        icon: Database,
        action: () => {
          setSelectedRepo(r.id, r.name);
          navigate("/repositories");
        },
      }));

    return [...navFiltered, ...repoItems];
  }, [query, navigationItems, repos, setSelectedRepo, navigate]);

  const handleSelect = useCallback(
    (index: number) => {
      const item = filteredItems[index];
      if (!item) return;

      onClose();
      if ("action" in item && typeof item.action === "function") {
        item.action();
      } else if ("path" in item && typeof item.path === "string") {
        navigate(item.path);
      }
    },
    [filteredItems, navigate, onClose]
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    if (!isOpen) {
      setQuery("");
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < filteredItems.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredItems.length - 1
        );
      } else if (e.key === "Enter") {
        e.preventDefault();
        handleSelect(selectedIndex);
      } else if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, filteredItems, selectedIndex, handleSelect, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4"
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/70 backdrop-blur-[2px] animate-fade-in"
      />

      {/* Palette Surface */}
      <div className="relative w-full max-w-xl bg-atlas-surface border border-atlas-border-strong rounded-xl shadow-modal overflow-hidden animate-scale-in z-10">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3 border-b border-atlas-border bg-atlas-surface">
          <Search className="w-4 h-4 text-atlas-text-muted shrink-0 mr-3" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or jump to page..."
            className="w-full bg-transparent text-sm text-atlas-text placeholder:text-atlas-text-muted focus:outline-none"
          />
          <kbd className="text-[10px] font-mono text-atlas-text-muted bg-atlas-surface-secondary px-1.5 py-0.5 rounded border border-atlas-border shrink-0 ml-2">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filteredItems.length === 0 ? (
            <div className="py-8 text-center text-xs text-atlas-text-muted">
              No matching commands or repositories found.
            </div>
          ) : (
            filteredItems.map((item, index) => {
              const Icon = item.icon;
              const isSelected = index === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => handleSelect(index)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs cursor-pointer transition-colors ${
                    isSelected
                      ? "bg-atlas-accent text-white"
                      : "text-atlas-text hover:bg-atlas-hover"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        isSelected ? "text-white" : "text-atlas-text-muted"
                      }`}
                    />
                    <span className="font-medium truncate">{item.title}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`text-[10px] uppercase font-mono px-1.5 py-0.5 rounded border ${
                        isSelected
                          ? "border-white/30 text-white/90"
                          : "border-atlas-border text-atlas-text-muted bg-atlas-surface-secondary"
                      }`}
                    >
                      {item.category}
                    </span>
                    {isSelected && <ArrowRight className="w-3.5 h-3.5 text-white" />}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-atlas-border bg-atlas-surface-secondary text-[11px] text-atlas-text-muted">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="font-mono bg-atlas-surface px-1 rounded border border-atlas-border">↑</kbd>{" "}
              <kbd className="font-mono bg-atlas-surface px-1 rounded border border-atlas-border">↓</kbd> navigate
            </span>
            <span>
              <kbd className="font-mono bg-atlas-surface px-1 rounded border border-atlas-border">↵</kbd> select
            </span>
          </div>
          <span className="font-mono text-[10px]">CodeAtlas v0.1.0</span>
        </div>
      </div>
    </div>
  );
};
