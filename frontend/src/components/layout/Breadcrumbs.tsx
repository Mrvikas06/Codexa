import { Link, useLocation } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

const routeLabels: Record<string, string> = {
  "": "Overview",
  repositories: "Repositories",
  search: "Search",
  chat: "Ask CodeAtlas",
  graph: "Code Graph",
  architecture: "Architecture",
  dependencies: "Dependencies",
  issues: "Issues",
  models: "Models",
  training: "Training Runs",
  evaluation: "Evaluation",
  datasets: "Dataset Explorer",
  activity: "Activity",
  settings: "Settings",
};

export function Breadcrumbs() {
  const location = useLocation();
  const segments = location.pathname.split("/").filter(Boolean);

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm">
      <Link
        to="/"
        className={cn(
          "flex items-center gap-1 text-atlas-text-muted hover:text-atlas-text transition-colors",
          "focus:outline-none focus:ring-1 focus:ring-atlas-accent rounded px-1"
        )}
      >
        <Home size={14} />
        {segments.length === 0 && (
          <span className="text-atlas-text-secondary">Overview</span>
        )}
      </Link>
      {segments.map((segment, index) => {
        const path = "/" + segments.slice(0, index + 1).join("/");
        const label = routeLabels[segment] ?? segment;
        const isLast = index === segments.length - 1;

        return (
          <span key={path} className="flex items-center gap-1">
            <ChevronRight size={14} className="text-atlas-text-muted" />
            {isLast ? (
              <span className="text-atlas-text-secondary">{label}</span>
            ) : (
              <Link
                to={path}
                className="text-atlas-text-muted hover:text-atlas-text transition-colors focus:outline-none focus:ring-1 focus:ring-atlas-accent rounded px-1"
              >
                {label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
