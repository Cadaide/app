export interface IPackageManager {
  listInstalled(): Promise<IInstalledPackageInfo[]>;
  search(query: string): Promise<IPackageInfo[]>;
  detail(id: string): Promise<IDetailedPackageInfo>;
  install(id: string, version: string): Promise<void>;
  uninstall(id: string): Promise<void>;
}

export interface IInstalledPackageInfo {
  id: string;
  name: string;
  shortDescription: string;
  installedVersion: string;
}

export interface IPackageInfo {
  id: string;
  name: string;
  shortDescription: string;
  versions: string[];
}

export interface IDetailedPackageInfo {
  id: string;
  name: string;
  shortDescription: string;
  description: string;
  versions: string[];
  isInstalled: boolean;
  installedVersion: string | null;
}
