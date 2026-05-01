interface IInstalledPackageInfo {
  id: string;
  name: string;
  shortDescription: string;
  installedVersion: string;
}

interface IPackageInfo {
  id: string;
  name: string;
  shortDescription: string;
  versions: string[];
}

interface IDetailedPackageInfo {
  id: string;
  name: string;
  shortDescription: string;
  description: string;
  versions: string[];
  isInstalled: boolean;
}
