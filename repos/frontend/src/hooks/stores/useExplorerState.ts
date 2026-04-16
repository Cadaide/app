import { create } from "zustand";

interface IExplorerStateStore {
  selectedEntryPath: string | null;

  setSelectedEntryPath: (path: string | null) => void;
}

export const useExplorerState = create<IExplorerStateStore>((set) => ({
  selectedEntryPath: null,

  setSelectedEntryPath: (path: string | null) =>
    set({ selectedEntryPath: path }),
}));
