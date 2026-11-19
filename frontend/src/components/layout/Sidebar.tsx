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
  Brain,
  Activity,
  BarChart3,
  Database,
  Clock,
  Settings,
  ChevronsLeft,
  ChevronsRight,
  User,
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
      { label: "Overview", icon: LayoutDashboard, path: "/" },
      { label: "Repositories", icon: FolderGit2, path: "/repositories" },
      { label: "Search", icon: Search, path: "/search" },
      { label: "Ask CodeAtlas", icon: MessageSquare, path: "/chat" },
    ],
  },
  {
    title: "Intelligence",
    items: [
      { label: "Code Graph", icon: GitBranch, path: "/graph" },
      { label: "Architecture", icon: Boxes, path: "/architecture" },
      { label: "Dependencies", icon: Network, path: "/dependencies" },
      { label: "Issues", icon: AlertTriangle, path: "/issues" },
    ],
  },
  {
    title: "Machine Learning",
    items: [
      { label: "Models", icon: Brain, path: "/models" },
      { label: "Training Runs", icon: Activity, path: "/training" },
      { label: "Evaluation", icon: BarChart3, path: "/evaluation" },
      { label: "Dataset Explorer", icon: Database, path: "/datasets" },
    ],
  },
  {
    title: "System",
    items: [
      { label: "Activity", icon: Clock, path: "/activity" },
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
        "flex flex-col h-screen bg-atlas-sidebar border-r border-atlas-border",
        "transition-[width] duration-200 ease-in-out shrink-0",
        isCollapsed ? "w-[68px]" : "w-[240px]"
      )}
    >
      {/* Header */}
      <header className="flex items-center justify-between h-14 px-4 border-b border-atlas-border">
        {!isCollapsed && (
          <span className="text-sm font-semibold text-atlas-text truncate">
            CodeAtlas
          </span>
        )}
        <button
          onClick={toggle}
          className={cn(
            "p-1.5 rounded text-atlas-text-muted hover:text-atlas-text hover:bg-atlas-hover",
            "transition-colors duration-150 focus:outline-none focus:ring-1 focus:ring-atlas-accent",
            isCollapsed && "mx-auto"
          )}
          title={isCollapsed ? "Expand sidebar (Ctrl+B)" : "Collapse sidebar (Ctrl+B)"}
        >
          {isCollapsed ? <ChevronsRight size={18} /> : <ChevronsLeft size={18} />}
        </button>
      </header>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2 px-2">
        {navSections.map((section) => (
          <div key={section.title} className="mb-4">
            {!isCollapsed && (
              <span className="block px-2 py-1 text-[11px] font-medium uppercase tracking-wider text-atlas-text-muted">
                {section.title}
              </span>
            )}
            {isCollapsed && <div className="h-px bg-atlas-border mx-2 my-2" />}
            <ul>
              {section.items.map((item) => {
                const isActive = location.pathname === item.path;
                const Icon = item.icon;
                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      title={isCollapsed ? item.label : undefined}
                      className={cn(
                        "flex items-center gap-3 px-2 py-1.5 rounded text-sm transition-colors duration-150",
                        "focus:outline-none focus:ring-1 focus:ring-atlas-accent",
                        isActive
                          ? "bg-atlas-accent/10 text-atlas-accent border-l-2 border-atlas-accent -ml-px pl-[7px]"
                          : "text-atlas-text-secondary hover:text-atlas-text hover:bg-atlas-hover",
                        isCollapsed && "justify-center px-0"
                      )}
                    >
                      <Icon size={18} />
                      {!isCollapsed && (
                        <span className="truncate">{item.label}</span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <footer className="border-t border-atlas-border px-3 py-3">
        <div
          className={cn(
            "flex items-center gap-3",
            isCollapsed && "justify-center"
          )}
        >
          <div className="relative shrink-0">
            <div className="w-8 h-8 rounded-full bg-atlas-surface-secondary flex items-center justify-center">
              <User size={16} className="text-atlas-text-muted" />
            </div>
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-atlas-sidebar" />
          </div>
          {!isCollapsed && (
            <div className="min-w-0">
              <p className="text-sm font-medium text-atlas-text truncate">
                Workspace
              </p>
              <p className="text-xs text-atlas-text-muted truncate">Active</p>
            </div>
          )}
        </div>
      </footer>
    </aside>
  );
}
