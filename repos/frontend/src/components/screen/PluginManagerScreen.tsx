import { API } from "@/api";
import { useAwait } from "@/hooks/useAwait";
import { LoadingScreen } from "../base/LoadingScreen";
import { Button } from "../base/Button";
import { useCallback, useState } from "react";

interface IPluginManagerPluginCard {
  id: string;
  name: string;
  isInstalled: boolean;
  onInstall: () => void;
  onUninstall: () => void;
}

export function PluginManagerScreen() {
  const { isLoading: isLoadingList, data: availablePlugins } = useAwait(() => API.plugin.list(), []);
  const { isLoading: isLoadingInstalled, data: installedPlugins, reload: reloadInstalled } = useAwait(() => API.plugin.installed(), []);

  if (isLoadingList || isLoadingInstalled) return <LoadingScreen />;

  const installedPluginIds = new Set(installedPlugins?.map(p => p.id) || []);

  const handlePluginStateChanged = () => {
    reloadInstalled();
  }

  return (
    <div className="h-full flex flex-col grow bg-ctp-base text-ctp-text p-16 overflow-y-auto">
      <p className="text-2xl font-semibold mb-6">Plugin Manager</p>

      <div className="mb-8">
        <h2 className="text-xl font-medium mb-4 text-ctp-lavender">Installed Plugins</h2>
        {installedPlugins?.length === 0 ? (
          <p className="text-ctp-subtext0">No plugins installed.</p>
        ) : (
          <div className="flex flex-col gap-4 w-full max-w-2xl">
            {installedPlugins?.map((plugin) => (
              <PluginManagerPluginCard 
                key={plugin.id} 
                id={plugin.id}
                name={plugin.name}
                isInstalled={true}
                onInstall={handlePluginStateChanged}
                onUninstall={handlePluginStateChanged}
              />
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="text-xl font-medium mb-4 text-ctp-lavender">Available Plugins</h2>
        {availablePlugins?.length === 0 ? (
          <p className="text-ctp-subtext0">No available plugins found.</p>
        ) : (
          <div className="flex flex-col gap-4 w-full max-w-2xl">
            {availablePlugins?.filter(p => !installedPluginIds.has(p.id)).map((plugin) => (
              <PluginManagerPluginCard 
                key={plugin.id} 
                id={plugin.id}
                name={plugin.name}
                isInstalled={false}
                onInstall={handlePluginStateChanged}
                onUninstall={handlePluginStateChanged}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PluginManagerPluginCard(props: IPluginManagerPluginCard) {
  const [isLoading, setIsLoading] = useState(false);

  const handleInstall = useCallback(async () => {
    if (isLoading || props.isInstalled) return;
    setIsLoading(true);

    try {
      await API.plugin.install(props.id);
      props.onInstall();
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, props.id, props.isInstalled, props.onInstall]);

  const handleUninstall = useCallback(async () => {
    if (isLoading || !props.isInstalled) return;
    setIsLoading(true);

    try {
      await API.plugin.uninstall(props.id);
      props.onUninstall();
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, props.id, props.isInstalled, props.onUninstall]);

  return (
    <div className="flex items-center justify-between p-4 bg-ctp-surface0 rounded-lg border border-ctp-surface1">
      <div>
        <p className="font-medium">{props.name}</p>
        <p className="text-sm text-ctp-subtext0">{props.id}</p>
      </div>
      {props.isInstalled ? (
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 bg-ctp-surface1 text-ctp-text rounded-md text-sm font-medium">Installed</span>
          <Button variant="danger" onClick={handleUninstall} isLoading={isLoading}>
            Uninstall
          </Button>
        </div>
      ) : (
        <Button variant="primary" onClick={handleInstall} isLoading={isLoading}>
          Install
        </Button>
      )}
    </div>
  );
}
