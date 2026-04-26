export interface IPluginRepoIndexEntry {
  id: string;
  name: string;
  ref: string;
}

export interface IPluginRepoIndex {
  plugins: IPluginRepoIndexEntry[];
}

export interface IPluginIndex {
  '@type': 'cadaide:plugin';
  id: string;
  name: string;
  package: string;
  entrypoint: string;
}

export interface IPluginRuntimeAPIProvider {
  [key: string]: {
    fn: Function;
  };
}
