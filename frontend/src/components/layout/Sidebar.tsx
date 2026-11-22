import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  FolderGit2,
  Search,
  MessageSquare,
  GitBranch,
  Boxes,
  Network,
  AlertTriangle,
  Cpu,
  Activity,
  BarChart3,
  Database,
  Settings,
  ChevronsLeft,
  Briefcase,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSidebarStore } from "@/stores/sidebar";

interface NavItem {
  label: string;
  icon: LucideIcon;
  path: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    title: "Workspace",
    items: [
      { label: "Overview", icon: LayoutDashboard, path: "/dashboard" },
      { label: "Repositories", icon: FolderGit2, path: "/repositories" },
      { label: "Ask Codexa", icon: MessageSquare, path: "/chat" },
      { label: "Search Code", icon: Search, path: "/search" },
    ],
  },
  {
    title: "Intelligence",
    items: [
      { label: "Code Graph", icon: GitBranch, path: "/graph" },
      { label: "Architecture", icon: Boxes, path: "/architecture" },
      { label: "Dependencies", icon: Network, path: "/dependencies" },
      { label: "Issues & Risks", icon: AlertTriangle, path: "/issues" },
    ],
  },
  {
    title: "Models",
    items: [
      { label: "Models", icon: Cpu, path: "/models" },
      { label: "Training Runs", icon: Activity, path: "/training" },
      { label: "Evaluation", icon: BarChart3, path: "/evaluation" },
      { label: "Datasets", icon: Database, path: "/datasets" },
    ],
  },
  {
    title: "System",
    items: [
      { label: "Settings", icon: Settings, path: "/settings" },
    ],
  },
];

export function Sidebar() {
  const location = useLocation();
  const { isCollapsed, toggle, setActiveSection } = useSidebarStore();

  useEffect(() => {
    setActiveSection(location.pathname);
  }, [location.pathname, setActiveSection]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.ctrlKey && e.key === "b") {
        e.preventDefault();
        toggle();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggle]);

  return (
    <aside
      className={cn(
        "flex flex-col h-screen bg-codexa-surface border-r border-codexa-border",
        "transition-[width] duration-200 ease-in-out shrink-0 select-none",
        isCollapsed ? "w-[72px]" : "w-[248px]"
      )}
    >
      {/* Brand Header */}
      <header className="flex items-center justify-between h-16 px-4 border-b border-codexa-border">
        {!isCollapsed ? (
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-codexa-primary flex items-center justify-center text-white shadow-subtle">
              <span className="font-mono text-xs font-bold">&lt;/&gt;</span>
            </div>
            <span className="text-base font-bold tracking-tight text-codexa-text">
              Codexa
            </span>
          </Link>
        ) : (
          <div className="w-7 h-7 rounded-lg bg-codexa-primary flex items-center justify-center text-white shadow-subtle mx-auto">
            <span className="font-mono text-xs font-bold">&lt;/&gt;</span>
          </div>
        )}
        <button
          onClick={toggle}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={cn(
            "p-1.5 rounded-lg text-codexa-text-muted hover:text-codexa-text hover:bg-codexa-bg-secondary",
            "transition-colors duration-150 focus:outline-none focus:ring-1 focus:ring-codexa-primary",
            isCollapsed && "hidden"
          )}
          title={isCollapsed ? "Expand sidebar (Ctrl+B)" : "Collapse sidebar (Ctrl+B)"}
        >
          <ChevronsLeft size={16} />
        </button>
      </header>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-4">
        {navSections.map((section) => (
          <div key={section.title} className="space-y-1">
            {!isCollapsed && (
              <span className="block px-2.5 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-codexa-text-muted">
                {section.title}
              </span>
            )}
            {isCollapsed && <div className="h-px bg-codexa-border mx-2 my-2" />}
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const isActive =
                  location.pathname === item.path ||
                  (item.path === "/dashboard" && location.pathname === "/");
                const Icon = item.icon;
                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      title={isCollapsed ? item.label : undefined}
                      className={cn(
                        "flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-all duration-150",
                        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-codexa-primary",
                        isActive
                          ? "bg-codexa-violet-surface text-codexa-indigo font-semibold shadow-subtle"
                          : "text-codexa-text-secondary hover:text-codexa-text hover:bg-codexa-surface-hover",
                        isCollapsed && "justify-center px-0 py-2.5"
                      )}
                    >
                      <Icon
                        size={17}
                        className={isActive ? "text-codexa-primary" : "text-codexa-text-muted"}
                      />
                      {!isCollapsed && <span className="truncate">{item.label}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer: User profile & workspace */}
      <footer className="border-t border-codexa-border p-3 space-y-2 bg-codexa-surface">
        {!isCollapsed && (
          <div className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-codexa-bg text-xs">
            <div className="flex items-center gap-2 truncate">
              <Briefcase size={14} className="text-codexa-text-muted shrink-0" />
              <span className="font-semibold text-codexa-text truncate">Personal</span>
            </div>
            <span className="text-[10px] font-mono text-codexa-text-muted">FREE</span>
          </div>
        )}

        <div
          className={cn(
            "flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-codexa-surface-hover cursor-pointer transition-colors",
            isCollapsed && "justify-center px-0"
          )}
        >
          <div className="relative shrink-0">
            <div className="w-8 h-8 rounded-full bg-codexa-violet-light flex items-center justify-center text-codexa-indigo font-bold text-xs">
              V
            </div>
            <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 border border-white" />
          </div>
          {!isCollapsed && (
            <div className="min-w-0">
              <p className="text-xs font-semibold text-codexa-text truncate">
                Vikas
              </p>
              <p className="text-[11px] text-codexa-text-muted truncate">Lead Architect</p>
            </div>
          )}
        </div>
      </footer>
    </aside>
  );
}
