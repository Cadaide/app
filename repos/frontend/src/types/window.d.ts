export {};

declare global {
  interface Window {
    api: {
      platform: "native" | "";
      openSelectDirectoryDialog: () => Promise<string | null>;
      beginWindowDrag: (x: number, y: number) => Promise<void>;
      windowClose: () => Promise<void>;
      windowMinimize: () => Promise<void>;
      windowMaximize: () => Promise<void>;
      windowRestore: () => Promise<void>;
      windowIsMaximized: () => Promise<boolean>;
    };
  }
}
