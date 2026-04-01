import { API } from "@/api";
import { getLanguage } from "@/editor/languages";
import { pathToName } from "@/utils/files/file";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useProjectStore = create<{
  path: string | null;
  loadedFiles: {
    name: string;
    path: string;
    language: string;
    content: string;
  }[];
  activeFile: string | null;
  tabs: string[];
  unsavedFiles: Set<string>;

  openProject: (path: string) => Promise<void>;
  loadFile: (path: string, content: string) => void;
  loadAllFiles: (path: string) => Promise<void>;
  setActiveFile: (path: string) => void;
  openTab: (path: string) => void;
  closeTab: (path: string) => void;
  markUnsaved: (path: string) => void;
  markSaved: (path: string) => void;
}>()(
  persist(
    (set, get) => ({
      path: null,
      loadedFiles: [],
      activeFile: null,
      tabs: [],
      unsavedFiles: new Set<string>(),

      openProject: async (path: string) => {
        set({
          path: null,
          loadedFiles: [],
          activeFile: null,
          tabs: [],
        });

        set({ path, loadedFiles: [] });

        await get().loadAllFiles(path);
      },
      loadFile: (path: string, content: string) => {
        const existing = get().loadedFiles;
        const idx = existing.findIndex((f) => f.path === path);

        if (idx !== -1) {
          // Update content of already-loaded file (only if changed)
          if (existing[idx].content === content) return;
          const updated = [...existing];
          updated[idx] = { ...updated[idx], content };
          set({ loadedFiles: updated });
        } else {
          // Append new file
          set({
            loadedFiles: [
              ...existing,
              {
                path,
                content,
                name: pathToName(path),
                language: getLanguage(pathToName(path)),
              },
            ],
          });
        }
      },
      loadAllFiles: async (path: string) => {
        const tree = await API.fs.treeDir(path, 10);

        await Promise.all(
          tree.map(async (file) => {
            if (file.type !== "file") return;

            const content = await API.fs.readFile(file.path);

            get().loadFile(file.path, content);
          }),
        );
      },
      setActiveFile: async (path) => {
        const content = await API.fs.readFile(path);

        get().loadFile(path, content);
        get().openTab(path);

        set({ activeFile: path });

        window.api.setActivity(pathToName(path));
      },
      openTab: (path: string) => {
        if (get().tabs.includes(path)) return;

        set({ tabs: [...get().tabs, path] });
      },
      closeTab: (path: string) => {
        set({ tabs: get().tabs.filter((tab) => tab !== path) });
      },
      markUnsaved: (path: string) => {
        const next = new Set(get().unsavedFiles);

        next.add(path);
        set({ unsavedFiles: next });
      },
      markSaved: (path: string) => {
        const next = new Set(get().unsavedFiles);

        next.delete(path);
        set({ unsavedFiles: next });
      },
    }),
    {
      name: "project",
      partialize: (state) => ({
        path: state.path,
        activeFile: state.activeFile,
        tabs: state.tabs,
      }),
    },
  ),
);
