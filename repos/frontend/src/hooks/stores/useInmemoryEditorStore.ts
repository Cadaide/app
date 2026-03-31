import { create } from "zustand";

export const useInmemoryEditorStore = create<{
  cursor: { line: number; column: number };
  setCursor: (line: number, column: number) => void;
}>((set) => ({
  cursor: { line: 0, column: 0 },
  setCursor: (line, column) => set({ cursor: { line, column } }),
}));
