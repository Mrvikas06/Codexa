import { create } from "zustand";
import { persist } from "zustand/middleware";

interface RepositoryStore {
  selectedRepoId: string | null;
  selectedRepoName: string | null;
  setSelectedRepo: (id: string | null, name?: string | null) => void;
}

export const useRepositoryStore = create<RepositoryStore>()(
  persist(
    (set) => ({
      selectedRepoId: null,
      selectedRepoName: null,
      setSelectedRepo: (id, name = null) =>
        set({ selectedRepoId: id, selectedRepoName: name }),
    }),
    {
      name: "codeatlas-selected-repo",
    }
  )
);
