export {};

declare global {
  interface Window {
    api: {
      //fetch: (endpoint: string, options: any) => Promise<any>;
      openSelectDirectoryDialog: () => Promise<string | null>;
      //setActivity: (file: string) => Promise<void>;
      beginWindowDrag: (x: number, y: number) => Promise<void>;
      windowClose: () => Promise<void>;
      windowMinimize: () => Promise<void>;
      windowMaximize: () => Promise<void>;
      windowRestore: () => Promise<void>;
      windowIsMaximized: () => Promise<boolean>;
    };
  }
}
