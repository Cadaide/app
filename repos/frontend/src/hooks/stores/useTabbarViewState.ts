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
      removeTab: (path) =>
        set((state) => ({
          tabs: state.tabs.filter((tab) => tab.path !== path),
          activeTabPath:
            state.activeTabPath === path ? null : state.activeTabPath,
        })),
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
