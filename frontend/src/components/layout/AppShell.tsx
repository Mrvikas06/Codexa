import { Outlet } from "react-router-dom";
import { Search, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Sidebar } from "./Sidebar";
import { Breadcrumbs } from "./Breadcrumbs";

export function AppShell() {
  return (
    <div className="flex h-screen overflow-hidden bg-atlas-bg">
      <Sidebar />

      <div className="flex flex-col flex-1 min-w-0">
        {/* Top bar */}
        <header className="flex items-center justify-between h-14 px-6 border-b border-atlas-border shrink-0">
          {/* Left: Breadcrumbs */}
          <div className="flex-1 min-w-0">
            <Breadcrumbs />
          </div>

          {/* Center: Search trigger */}
          <button
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded bg-atlas-surface border border-atlas-border",
              "text-sm text-atlas-text-muted hover:text-atlas-text-secondary hover:border-atlas-border-strong",
              "transition-colors duration-150 focus:outline-none focus:ring-1 focus:ring-atlas-accent",
              "min-w-[240px] justify-between"
            )}
          >
            <div className="flex items-center gap-2">
              <Search size={14} />
              <span>Search...</span>
            </div>
            <kbd className="text-xs text-atlas-text-muted bg-atlas-surface-secondary px-1.5 py-0.5 rounded border border-atlas-border">
              Ctrl+K
            </kbd>
          </button>

          {/* Right: Repository selector placeholder */}
          <div className="flex-1 flex justify-end min-w-0">
            <button
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded text-sm",
                "text-atlas-text-secondary hover:text-atlas-text hover:bg-atlas-hover",
                "transition-colors duration-150 focus:outline-none focus:ring-1 focus:ring-atlas-accent"
              )}
            >
              <span className="truncate max-w-[160px]">No repository</span>
              <ChevronDown size={14} />
            </button>
          </div>
        </header>

        {/* Main content area */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
