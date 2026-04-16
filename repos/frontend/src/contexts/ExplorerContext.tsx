import { createContext, ReactNode, useContext } from "react";

interface IExplorerContext {
  reload: () => void;
}

export const ExplorerContext = createContext<IExplorerContext>({
  reload: () => {},
});

export function useExplorer() {
  return useContext(ExplorerContext);
}
