import { getLanguage, getLanguageName } from "@/editor/languages";
import { useTabbarViewState } from "@/hooks/stores/useTabbarViewState";
import { pathToName } from "@/utils/files/file";

export function Bottombar() {
  const activeTabPath = useTabbarViewState((state) => state.activeTabPath);

  return (
    <div className="w-full h-8 bg-ctp-mantle border-t border-ctp-surface0 flex flex-row items-center px-3.5">
      <div className="mr-auto"></div>
      <div className="text-sm flex flex-row gap-4">
        <p>
          {activeTabPath &&
            !activeTabPath.startsWith("view://") &&
            getLanguageName(getLanguage(pathToName(activeTabPath)))}
        </p>
      </div>
    </div>
  );
}
