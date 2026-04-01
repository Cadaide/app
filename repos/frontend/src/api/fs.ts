export type FsEntry = {
  name: string;
  path: string;
  type: string;
};

export const FsAPI = {
  listDir: async (path: string) => {
    const response = await window.api.fetch(
      `/filesystem/listDir?path=${path}`,
      {
        method: "GET",
      },
    );

    return response.data.entries as FsEntry[];
  },
  readFile: async (path: string) => {
    const response = await window.api.fetch(
      `/filesystem/readFile?path=${path}`,
      {
        method: "GET",
      },
    );

    return response.data.content as string;
  },
  treeDir: async (path: string, depth: number) => {
    const response = await window.api.fetch(
      `/filesystem/treeDir?path=${path}&depth=${depth}`,
      {
        method: "GET",
      },
    );

    return response.data.entries as FsEntry[];
  },
  writeFile: async (path: string, content: string) => {
    const response = await window.api.fetch(`/filesystem/writeFile`, {
      method: "POST",
      data: { path, content },
    });

    return response.data;
  },
};
