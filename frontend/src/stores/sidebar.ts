import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SidebarState {
  isCollapsed: boolean;
  activeSection: string;
  toggle: () => void;
  setActiveSection: (section: string) => void;
}

export const useSidebarStore = create<SidebarState>()(
  persist(
    (set) => ({
      isCollapsed: false,
      activeSection: "/",
      toggle: () => set((state) => ({ isCollapsed: !state.isCollapsed })),
      setActiveSection: (section: string) =>
        set({ activeSection: section }),
    }),
    {
      name: "codeatlas-sidebar",
      partialize: (state) => ({ isCollapsed: state.isCollapsed }),
    }
  )
);
