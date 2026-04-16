import axios from "axios";
import { apiAdapter } from ".";

export type FsEntry = {
  name: string;
  path: string;
  type: string;
};

export const FsAPI = {
  listDir: async (path: string) => {
    const response = await apiAdapter.get(`/filesystem/listDir?path=${path}`);

    return (response.data?.entries ?? []) as FsEntry[];
  },
  readFile: async (path: string) => {
    const response = await apiAdapter.get(`/filesystem/readFile?path=${path}`);

    return (response.data?.content as string) ?? "";
  },
  treeDir: async (path: string, depth: number) => {
    const response = await apiAdapter.get(
      `/filesystem/treeDir?path=${path}&depth=${depth}`,
    );

    return (response.data?.entries ?? []) as FsEntry[];
  },
  writeFile: async (path: string, content: string) => {
    const response = await apiAdapter.post(`/filesystem/writeFile`, {
      path,
      content,
    });

    return response.data;
  },
  stat: async (path: string) => {
    const response = await apiAdapter.get(`/filesystem/stat?path=${path}`);

    return response.data.entry as FsEntry;
  },
  mkdir: async (path: string) => {
    const response = await apiAdapter.post(`/filesystem/mkdir`, { path });

    return response.data;
  },
};
