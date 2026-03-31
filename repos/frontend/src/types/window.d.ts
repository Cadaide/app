export {};

declare global {
  interface Window {
    api: {
      fetch: (endpoint: string, options: any) => Promise<any>;
    };
  }
}
