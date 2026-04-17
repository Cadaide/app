import { create } from "zustand";

interface IExplorerStateStore {
  selectedEntryPath: string | null;
  expandedFolders: string[];

  setSelectedEntryPath: (path: string | null) => void;
  toggleFolderExpansion: (path: string) => void;
}

export const useExplorerState = create<IExplorerStateStore>((set, get) => ({
  selectedEntryPath: null,
  expandedFolders: [],

  setSelectedEntryPath: (path: string | null) =>
    set({ selectedEntryPath: path }),
  toggleFolderExpansion: (path: string) => {
    // Toggle folder and all children
    set((state) => {
      const isExpanded = state.expandedFolders.includes(path);
      const newExpandedFolders = isExpanded
        ? state.expandedFolders.filter((p) => !p.startsWith(path))
        : [...state.expandedFolders, path];

      return {
        expandedFolders: newExpandedFolders,
      };
    });
  },
}));
