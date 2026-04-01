import { getDisplayLanguage, getLanguageName } from "@/editor/languages";
import { useInmemoryEditorStore } from "@/hooks/stores/useInmemoryEditorStore";
import { useProjectStore } from "@/hooks/stores/useProjectStore";

export function Bottombar() {
  const cursorPosition = useInmemoryEditorStore((state) => state.cursor);
  const activeFile = useProjectStore((state) => state.activeFile);

  return (
    <div className="w-full h-8 bg-ctp-mantle border-t border-ctp-surface0 flex flex-row items-center px-3.5">
      <div className="mr-auto"></div>
      <div className="text-sm flex flex-row gap-4">
        <p>
          Ln {cursorPosition.line}, Col {cursorPosition.column}
        </p>
        <p>{getLanguageName(getDisplayLanguage(activeFile!))}</p>
      </div>
    </div>
  );
}
