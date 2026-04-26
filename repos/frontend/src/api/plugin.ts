import { apiAdapter } from ".";

export interface IPluginRepoIndexEntry {
  id: string;
  name: string;
  ref: string;
}

export interface IPluginRepoIndex {
  plugins: IPluginRepoIndexEntry[];
}

export interface IPluginIndex {
  "@type": "cadaide:plugin";
  id: string;
  name: string;
  package: string;
  entrypoint: string;
}

export const PluginAPI = {
  list: async (): Promise<IPluginRepoIndexEntry[]> => {
    const response =
      await apiAdapter.get<IPluginRepoIndexEntry[]>(`/plugin/list`);

    return response.data ?? [];
  },
  installed: async (): Promise<IPluginIndex[]> => {
    const response = await apiAdapter.get<IPluginIndex[]>(
      "/plugin/list/installed",
    );

    return response.data ?? [];
  },
  install: async (id: string) => {
    await apiAdapter.post<void>(`/plugin/${id}/install`);
  },
};
