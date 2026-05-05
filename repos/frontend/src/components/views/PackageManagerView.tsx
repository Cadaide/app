import { Application } from "@/classes/Application";
import { Workspace } from "@/classes/Workspace";
import { useWorkspaceState } from "@/hooks/stores/useWorkspaceState";
import { useAwait } from "@/hooks/useAwait";
import { LoadingScreen } from "../base/LoadingScreen";
import { Form } from "../base/Form";
import { Input } from "../base/Input";
import { Button } from "../base/Button";
import { PiBooks, PiMagnifyingGlass } from "react-icons/pi";
import { useCallback, useState } from "react";
import { useTabbarViewState } from "@/hooks/stores/useTabbarViewState";
import Markdown from "react-markdown";
import remarkGFM from "remark-gfm";
import { Select } from "../base/Select";
import rehypeRaw from "rehype-raw";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import { GhostScrollbar } from "../utils/GhostScrollbar";
import { Settings } from "@/classes/Settings";

interface IPackageManagerViewInstalledPackageProps {
  installedPackage: IInstalledPackageInfo;
  providerId: string;
  reload: () => void;
}

interface IPackageManagerViewSearchedPackageProps {
  searchedPackage: IPackageInfo;
  providerId: string;
  reload: () => void;
}

interface IPackageManagerViewPackageDetailViewProps {
  package: IPackageInfo | IInstalledPackageInfo;
  providerId: string;
  reload: () => void;
}

export function PackageManagerView() {
  const workspace = useWorkspaceState((state) => state.workspace);
  const [search, setSearch] = useState("");

  const getProviderId = async () => {
    const language = await workspace!.getLanguage();
    await Settings.instance.load();
    const setting = await Settings.instance.get(
      "packageManager.provider." + language,
    );

    return setting as string;
  };

  const { data: providerId, isLoading: providerIdLoading } = useAwait(
    () => getProviderId(),
    [workspace],
    () => !!workspace,
  );

  const {
    data: installedPackages,
    isLoading: installedPackagesLoading,
    reload: reloadInstalledPackages,
  } = useAwait(
    () =>
      workspace!.pluginHostSession.callProcedure<IInstalledPackageInfo[]>(
        providerId!,
        "packageManager.listInstalled",
      ),
    [workspace, providerIdLoading],
    () => !!workspace && !!providerId && providerId.trim().length > 0,
  );

  const {
    data: searchedPackages,
    isLoading: searchedPackagesLoading,
    reload: reloadSearchedPackages,
  } = useAwait(
    () => {
      return workspace!.pluginHostSession.callProcedure<IPackageInfo[]>(
        providerId!,
        "packageManager.search",
        {
          query: search,
        },
      );
    },
    [workspace, providerId, search],
    () =>
      !!workspace &&
      !!providerId &&
      providerId.trim().length > 0 &&
      search.trim().length > 0,
  );

  if (installedPackagesLoading || searchedPackagesLoading || providerIdLoading)
    return <LoadingScreen />;

  if (!providerId || providerId.trim().length == 0)
    return (
      <div className="w-full h-full flex items-center justify-center p-4">
        <p className="text-gray-500 text-center">
          No package manager available for this project. Please install plugin
          that provides it.
        </p>
      </div>
    );

  return (
    <div className="flex h-full w-full flex-col p-1">
      <Form onSubmit={(data) => setSearch(data.get("query") as string)}>
        <div className="flex flex-row items-center w-full gap-2 px-2 py-1 mb-1">
          <Input
            name="query"
            placeholder="Search..."
            className="text-md"
            defaultValue={search || undefined}
          />
          <Button variant="primary" type="submit" className="w-10 h-10 p-0">
            <PiMagnifyingGlass className="min-w-4 min-h-4" />
          </Button>
        </div>
      </Form>

      <GhostScrollbar thumbSize={10}>
        {search.trim().length > 0 && searchedPackages
          ? searchedPackages?.result.map((pkg) => (
              <PackageManagerViewSearchedPackage
                key={pkg.id}
                searchedPackage={pkg}
                providerId={providerId!}
                reload={() => {
                  reloadInstalledPackages();
                  reloadSearchedPackages();
                }}
              />
            ))
          : installedPackages?.result?.map((pkg) => (
              <PackageManagerViewInstalledPackage
                key={pkg.id}
                installedPackage={pkg}
                providerId={providerId!}
                reload={() => {
                  reloadInstalledPackages();
                  reloadSearchedPackages();
                }}
              />
            ))}
      </GhostScrollbar>
    </div>
  );
}

export function PackageManagerViewInstalledPackage(
  props: IPackageManagerViewInstalledPackageProps,
) {
  const addViewTab = useTabbarViewState((state) => state.addViewTab);

  const handleClick = useCallback(() => {
    addViewTab(
      `packageManager_pkg_${props.installedPackage.id}`,
      <PackageManagerViewPackageDetailView
        package={props.installedPackage}
        providerId={props.providerId}
        reload={props.reload}
      />,
      "ph:books",
      `${props.installedPackage.name} (${props.installedPackage.installedVersion})`,
    );
  }, [addViewTab, props.installedPackage]);

  return (
    <div
      onClick={handleClick}
      tabIndex={0}
      className="w-full flex flex-row gap-2 items-center group hover:bg-ctp-surface0 p-2 rounded-xl transition-colors duration-200 cursor-pointer select-none"
    >
      <div className="min-w-12 h-12 bg-ctp-lavender-500/30 text-ctp-lavender-500 rounded-lg flex items-center justify-center">
        <PiBooks className="w-6 h-6" />
      </div>
      <div>
        <div className="flex flex-row items-center gap-2">
          <p className="group-hover:text-ctp-lavender-500 transition-colors duration-200">
            {props.installedPackage.name}
          </p>
          <p className="text-xs text-ctp-lavender-700">
            {props.installedPackage.installedVersion}
          </p>
        </div>
        <p className="text-sm text-ctp-lavender-700 wrap-break-word line-clamp-1">
          {props.installedPackage.shortDescription}
        </p>
      </div>
    </div>
  );
}

export function PackageManagerViewSearchedPackage(
  props: IPackageManagerViewSearchedPackageProps,
) {
  const addViewTab = useTabbarViewState((state) => state.addViewTab);

  const handleClick = useCallback(() => {
    addViewTab(
      `packageManager_pkg_${props.searchedPackage.id}`,
      <PackageManagerViewPackageDetailView
        package={props.searchedPackage}
        providerId={props.providerId}
        reload={props.reload}
      />,
      "ph:books",
      `${props.searchedPackage.name}`,
    );
  }, [addViewTab, props.searchedPackage, props.providerId]);

  return (
    <div
      onClick={handleClick}
      tabIndex={0}
      className="w-full flex flex-row gap-2 items-center group hover:bg-ctp-surface0 p-2 rounded-xl transition-colors duration-200 cursor-pointer select-none"
    >
      <div className="min-w-12 h-12 bg-ctp-lavender-500/30 text-ctp-lavender-500 rounded-lg flex items-center justify-center">
        <PiBooks className="w-6 h-6" />
      </div>
      <div>
        <div className="flex flex-row items-center gap-2">
          <p className="group-hover:text-ctp-lavender-500 transition-colors duration-200">
            {props.searchedPackage.name}
          </p>
        </div>
        <p className="text-sm text-ctp-lavender-700 wrap-break-word line-clamp-1">
          {props.searchedPackage.shortDescription}
        </p>
      </div>
    </div>
  );
}

export function PackageManagerViewPackageDetailView(
  props: IPackageManagerViewPackageDetailViewProps,
) {
  const workspace = useWorkspaceState((state) => state.workspace);

  const [isProcessing, setProcesing] = useState(false);

  const { data, isLoading, reload } = useAwait(
    () =>
      workspace!.pluginHostSession.callProcedure<IDetailedPackageInfo>(
        props.providerId,
        "packageManager.detail",
        {
          id: props.package.id,
        },
      ),
    [props.package, props.providerId],
    () => !!workspace,
  );

  const handleInstall = useCallback(
    async (version: string) => {
      if (!workspace || isProcessing) return;
      setProcesing(true);

      await workspace.pluginHostSession.callProcedure(
        props.providerId,
        "packageManager.install",
        {
          id: props.package.id,
          version: version,
        },
      );

      setProcesing(false);

      await reload();
      props.reload();
    },
    [props, workspace, reload],
  );
  const handleUninstall = useCallback(async () => {
    if (!workspace || isProcessing) return;
    setProcesing(true);

    await workspace.pluginHostSession.callProcedure(
      props.providerId,
      "packageManager.uninstall",
      {
        id: props.package.id,
      },
    );

    setProcesing(false);

    await reload();
    props.reload();
  }, [props, workspace, reload]);

  if (isLoading || !data) return <LoadingScreen />;

  return (
    <div className="flex flex-col w-full h-full p-6 overflow-y-auto overflow-x-hidden bg-ctp-base min-w-0">
      <div className="flex flex-row gap-6 items-start pb-6 border-b border-ctp-surface0 shrink-0">
        <div className="min-w-32 h-32 bg-ctp-lavender-500/30 text-ctp-lavender-500 rounded-xl flex items-center justify-center">
          <PiBooks className="w-16 h-16" />
        </div>
        <div className="flex flex-col grow gap-2">
          <div className="flex flex-col">
            <h1 className="text-3xl font-bold text-ctp-text">
              {data.result.name}
            </h1>
            <p className="text-sm text-ctp-subtext0">{data.result.id}</p>
          </div>
          <p className="text-md text-ctp-subtext1">
            {data.result.shortDescription}
          </p>

          <div className="flex flex-row items-center gap-3">
            {data.result.isInstalled ? (
              <>
                <Button
                  variant="danger"
                  onClick={handleUninstall}
                  isLoading={isProcessing}
                >
                  Uninstall
                </Button>
                <span className="text-sm text-ctp-subtext0 ml-2">
                  {data.result.installedVersion}
                </span>
              </>
            ) : (
              <Form
                onSubmit={(data) =>
                  handleInstall(data.get("version") as string)
                }
              >
                <div className="flex flex-row items-center gap-3">
                  <Button
                    variant="primary"
                    type="submit"
                    isLoading={isProcessing}
                  >
                    Install
                  </Button>
                  <Select
                    defaultValue={data.result.versions[0]}
                    options={data.result.versions.map((version) => ({
                      label: version,
                      id: version,
                    }))}
                    name="version"
                    className="max-w-40"
                  />
                </div>
              </Form>
            )}
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-4 min-w-0 w-full">
        <div className="prose prose-invert prose-headings:text-ctp-text prose-p:text-ctp-subtext0 prose-a:text-ctp-lavender prose-strong:text-ctp-text prose-code:text-ctp-lavender prose-pre:bg-ctp-mantle prose-li:text-ctp-subtext0 max-w-none min-w-0 w-full wrap-break-word">
          <Markdown
            remarkPlugins={[remarkGFM]}
            rehypePlugins={[
              rehypeRaw,
              [
                rehypeSanitize,
                {
                  ...defaultSchema,
                  attributes: {
                    ...defaultSchema.attributes,
                    code: [["className", /^language-./]],
                  },
                },
              ],
            ]}
          >
            {data.result.description}
          </Markdown>
        </div>
      </div>
    </div>
  );
}
