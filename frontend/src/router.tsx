import { createBrowserRouter } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { Dashboard } from "@/pages/Dashboard";
import { RepositoriesPage } from "@/pages/RepositoriesPage";
import { SearchPage } from "@/pages/SearchPage";
import { ChatPage } from "@/pages/ChatPage";
import { GraphPage } from "@/pages/GraphPage";
import { ArchitecturePage } from "@/pages/ArchitecturePage";
import { ModelsPage } from "@/pages/ModelsPage";
import { TrainingPage } from "@/pages/TrainingPage";
import { EvaluationPage } from "@/pages/EvaluationPage";
import { DatasetsPage } from "@/pages/DatasetsPage";
import { ActivityPage } from "@/pages/ActivityPage";
import { SettingsPage } from "@/pages/SettingsPage";
import { DependenciesPage, IssuesPage } from "@/pages/Placeholder";

export const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [
      { path: "/", element: <Dashboard /> },
      { path: "/repositories", element: <RepositoriesPage /> },
      { path: "/search", element: <SearchPage /> },
      { path: "/chat", element: <ChatPage /> },
      { path: "/graph", element: <GraphPage /> },
      { path: "/architecture", element: <ArchitecturePage /> },
      { path: "/dependencies", element: <DependenciesPage /> },
      { path: "/issues", element: <IssuesPage /> },
      { path: "/models", element: <ModelsPage /> },
      { path: "/training", element: <TrainingPage /> },
      { path: "/evaluation", element: <EvaluationPage /> },
      { path: "/datasets", element: <DatasetsPage /> },
      { path: "/activity", element: <ActivityPage /> },
      { path: "/settings", element: <SettingsPage /> },
    ],
  },
]);
