import { create } from "zustand";

export type TScreen = "editor" | "plugin-manager";

interface IScreenState {
  screen: TScreen;
  setScreen: (screen: TScreen) => void;
}

export const useScreenState = create<IScreenState>((set) => ({
  screen: "editor",
  setScreen: (screen) => set({ screen }),
}));
