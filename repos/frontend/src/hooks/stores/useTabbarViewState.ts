import { Editor } from "@/classes/Editor";
import { IconifyIcon } from "@iconify/react";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useTabbarViewState = create<{
  tabs: {
    path: string;
    icon: string | IconifyIcon;
    name: string;
    dirty: boolean;
  }[];
  activeTabPath: string | null;

  addTab: (path: string, icon: string | IconifyIcon, name: string) => void;
  removeTab: (path: string) => void;
  setActiveTab: (path: string) => void;
  setDirty: (path: string, dirty: boolean) => void;
  closeTabs: () => void;
  renamePath: (oldPrefix: string, newPrefix: string) => void;
}>()(
  persist(
    (set, get) => ({
      tabs: [],
      activeTabPath: null,

      addTab: (path, icon, name) => {
        const { tabs } = get();

        if (tabs.some((tab) => tab.path === path)) {
          set({
            activeTabPath: path,
          });

          return;
        }

        set((state) => ({
          tabs: [...state.tabs, { path, icon, name, dirty: false }],
          activeTabPath: path,
        }));
      },
      removeTab: (path) => {
        const { tabs, activeTabPath } = get();

        const isActive = activeTabPath === path;
        const index = tabs.findIndex((tab) => tab.path === path);

        if (index === -1) return;

        set((state) => ({
          tabs: state.tabs.filter((tab) => tab.path !== path),
          activeTabPath: isActive
            ? (state.tabs[index - 1]?.path ??
              state.tabs[index + 1]?.path ??
              null)
            : state.activeTabPath,
        }));
      },
      setActiveTab: (id) =>
        set({
          activeTabPath: id,
        }),
      setDirty: (path, dirty) =>
        set((state) => ({
          tabs: state.tabs.map((tab) =>
            tab.path === path ? { ...tab, dirty } : tab,
          ),
        })),
      closeTabs: () => set({ tabs: [], activeTabPath: null }),
      renamePath: (oldPath, newPath) =>
        set((state) => {
          const renameNode = (p: string) => {
            if (p === oldPath || p.startsWith(oldPath + "/"))
              return newPath + p.substring(oldPath.length);

            return p;
          };

          return {
            tabs: state.tabs.map((tab) => ({
              ...tab,
              path: renameNode(tab.path),
            })),
            activeTabPath: state.activeTabPath
              ? renameNode(state.activeTabPath)
              : null,
          };
        }),
    }),
    {
      name: "tabbar-view-state",
      partialize: (state) => ({
        tabs: state.tabs.map((tab) => ({
          ...tab,
          dirty: false,
        })),
        activeTabPath: state.activeTabPath,
      }),
    },
  ),
);
