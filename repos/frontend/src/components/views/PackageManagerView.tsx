import { Application } from "@/classes/Application";
import { Workspace } from "@/classes/Workspace";
import { useWorkspaceState } from "@/hooks/stores/useWorkspaceState";
import { useAwait } from "@/hooks/useAwait";
import { LoadingScreen } from "../base/LoadingScreen";

interface IPackageManagerViewInstalledPackageProps {
  installedPackage: IInstalledPackageInfo;
}

export function PackageManagerView() {
  const workspace = useWorkspaceState((state) => state.workspace);

  const { data: installedPackages, isLoading: installedPackagesLoading } =
    useAwait(
      () =>
        workspace!.plugins.awaitCall<IInstalledPackageInfo[]>(
          "api:packageManager.listInstalled",
        ),
      [],
      () => !!workspace,
    );

  if (installedPackagesLoading) return <LoadingScreen />;

  return (
    <div className="flex h-full w-full">
      {installedPackages?.map((pkg) => (
        <PackageManagerViewInstalledPackage
          key={pkg.id}
          installedPackage={pkg}
        />
      ))}
    </div>
  );
}

export function PackageManagerViewInstalledPackage(
  props: IPackageManagerViewInstalledPackageProps,
) {
  return (
    <div>
      <p>{props.installedPackage.name}</p>
    </div>
  );
}
