import { createBrowserRouter } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { Dashboard } from "@/pages/Dashboard";
import {
  RepositoriesPage,
  SearchPage,
  ChatPage,
  GraphPage,
  ArchitecturePage,
  DependenciesPage,
  IssuesPage,
  ModelsPage,
  TrainingPage,
  EvaluationPage,
  DatasetsPage,
  ActivityPage,
  SettingsPage,
} from "@/pages/Placeholder";

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
