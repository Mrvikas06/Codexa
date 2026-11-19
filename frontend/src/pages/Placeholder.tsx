import type { LucideIcon } from "lucide-react";
import {
  FolderGit2,
  Search,
  MessageSquare,
  GitBranch,
  Brain,
  Settings,
  Boxes,
  Network,
  AlertTriangle,
  Activity,
  BarChart3,
  Database,
  Clock,
} from "lucide-react";

interface PlaceholderPageProps {
  icon: LucideIcon;
  title: string;
  phase: number;
}

function PlaceholderPage({ icon: Icon, title, phase }: PlaceholderPageProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[60vh] text-center px-6">
      <div className="p-4 rounded-xl bg-atlas-surface border border-atlas-border mb-4">
        <Icon size={32} className="text-atlas-text-muted" />
      </div>
      <h1 className="text-xl font-semibold text-atlas-text mb-2">{title}</h1>
      <p className="text-sm text-atlas-text-muted max-w-md">
        This feature is under development and will be available in Phase {phase}.
      </p>
    </div>
  );
}

export function RepositoriesPage() {
  return <PlaceholderPage icon={FolderGit2} title="Repositories" phase={3} />;
}

export function SearchPage() {
  return <PlaceholderPage icon={Search} title="Search" phase={5} />;
}

export function ChatPage() {
  return <PlaceholderPage icon={MessageSquare} title="Ask CodeAtlas" phase={5} />;
}

export function GraphPage() {
  return <PlaceholderPage icon={GitBranch} title="Code Graph" phase={7} />;
}

export function ArchitecturePage() {
  return <PlaceholderPage icon={Boxes} title="Architecture" phase={7} />;
}

export function DependenciesPage() {
  return <PlaceholderPage icon={Network} title="Dependencies" phase={7} />;
}

export function IssuesPage() {
  return <PlaceholderPage icon={AlertTriangle} title="Issues" phase={7} />;
}

export function ModelsPage() {
  return <PlaceholderPage icon={Brain} title="Models" phase={4} />;
}

export function TrainingPage() {
  return <PlaceholderPage icon={Activity} title="Training Runs" phase={4} />;
}

export function EvaluationPage() {
  return <PlaceholderPage icon={BarChart3} title="Evaluation" phase={4} />;
}

export function DatasetsPage() {
  return <PlaceholderPage icon={Database} title="Dataset Explorer" phase={4} />;
}

export function ActivityPage() {
  return <PlaceholderPage icon={Clock} title="Activity" phase={7} />;
}

export function SettingsPage() {
  return <PlaceholderPage icon={Settings} title="Settings" phase={7} />;
}
