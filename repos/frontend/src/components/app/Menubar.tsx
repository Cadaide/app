import { PiCards, PiMinus, PiX } from "react-icons/pi";
import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { useWorkspaceState } from "@/hooks/stores/useWorkspaceState";
import { Workspace } from "@/classes/Workspace";
import { useTabbarViewState } from "@/hooks/stores/useTabbarViewState";
import { API } from "@/api";
import { Editor } from "@/classes/Editor";
import { Application } from "@/classes/Application";

type MenuEntry =
  | {
      type: "item";
      label: string;
      shortcut?: string;
      disabled?: boolean;
      onClick?: () => void;
    }
  | { type: "divider" };

type MenuDefinition = {
  label: string;
  entries: MenuEntry[];
};

export function Menubar() {
  const [openMenu, setOpenMenu] = useState<number | null>(null);
  const menubarRef = useRef<HTMLDivElement>(null);

  const setWorkspace = useWorkspaceState((state) => state.setWorkspace);
  const unsetWorkspace = useWorkspaceState((state) => state.unsetWorkspace);
  const closeTabs = useTabbarViewState((state) => state.closeTabs);
  const addTab = useTabbarViewState((state) => state.addTab);

  const handleOpenProject = useCallback(async () => {
    const path = await window.api.openSelectDirectoryDialog();
    if (!path) return;

    setWorkspace(new Workspace(path));
    closeTabs();

    // TODO: Reload without reloading
    location.reload();
  }, [setWorkspace, closeTabs]);

  const handleOpenProjectPI = useCallback(async () => {
    const path = prompt("Enter path to project:");
    if (!path) return;

    setWorkspace(new Workspace(path));
    closeTabs();

    // TODO: Reload without reloading
    location.reload();
  }, [setWorkspace, closeTabs]);

  const handleCloseProject = useCallback(async () => {
    unsetWorkspace();
    closeTabs();
  }, [unsetWorkspace, closeTabs]);

  const handleOpenSettings = useCallback(async () => {
    const path = await API.config.getSettingsPath();

    Editor.instance.openFile(path.path);
    addTab(path.path, "catppuccin:config", "settings.json");
  }, [addTab]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button != 0) return;

    const target = e.target as HTMLElement;
    if (target.closest(".no-drag")) return;

    window.api.beginWindowDrag(e.clientX, e.clientY);
  }, []);

  const toggleMaximize = useCallback(async () => {
    if (await window.api.windowIsMaximized()) {
      await window.api.windowRestore();
      return;
    }

    await window.api.windowMaximize();
  }, []);

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest(".no-drag")) return;

      void toggleMaximize();
    },
    [toggleMaximize],
  );

  const MENUS: MenuDefinition[] = useMemo(
    () => [
      {
        label: "File",
        entries: [
          {
            type: "item",
            label: "Open folder...",
            onClick: Application.isNative
              ? handleOpenProject
              : handleOpenProjectPI,
          },
          {
            type: "item",
            label: "Close folder",
            onClick: handleCloseProject,
          },
          {
            type: "item",
            label: "Settings",
            onClick: handleOpenSettings,
          },
        ],
      },
      {
        label: "Window",
        entries: [
          {
            type: "item",
            label: "Reload window",
            onClick: () => window.location.reload(),
          },
        ],
      },
    ],
    [handleOpenProject],
  );

  const closeMenu = useCallback(() => setOpenMenu(null), []);

  useEffect(() => {
    if (openMenu === null) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menubarRef.current && !menubarRef.current.contains(e.target as Node))
        closeMenu();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMenu();
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [openMenu, closeMenu]);

  return (
    <div
      ref={menubarRef}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
      className="w-full h-10 bg-ctp-crust text-ctp-text text-sm border-b border-ctp-surface0 flex flex-row items-center gap-1.5 px-3.5 drag-handle"
    >
      <p className="mr-4 font-semibold select-none no-drag">Cadaide</p>
      <div className="flex flex-row gap-0.5 mr-auto no-drag">
        {MENUS.map((menu, i) => (
          <MenubarItem
            key={menu.label}
            menu={menu}
            isOpen={openMenu === i}
            onToggle={() => setOpenMenu(openMenu === i ? null : i)}
            onHover={() => {
              if (openMenu !== null) setOpenMenu(i);
            }}
            onClose={closeMenu}
          />
        ))}
      </div>
      <WindowButtons onToggleMaximize={toggleMaximize} />
    </div>
  );
}

function WindowButtons({
  onToggleMaximize,
}: {
  onToggleMaximize: () => Promise<void>;
}) {
  return (
    <div className="flex flex-row gap-1 no-drag">
      <div
        className="p-1.5 hover:bg-ctp-surface0 cursor-pointer transition-colors rounded-full duration-200"
        onClick={() => window.api.windowMinimize()}
      >
        <PiMinus className="text-lg" />
      </div>
      <div
        className="p-1.5 hover:bg-ctp-surface0 cursor-pointer transition-colors rounded-full duration-200"
        onClick={() => void onToggleMaximize()}
      >
        <PiCards className="text-lg" />
      </div>
      <div
        className="p-1.5 hover:bg-ctp-surface0 cursor-pointer transition-colors rounded-full duration-200"
        onClick={() => window.api.windowClose()}
      >
        <PiX className="text-lg" />
      </div>
    </div>
  );
}

function MenubarItem({
  menu,
  isOpen,
  onToggle,
  onHover,
  onClose,
}: {
  menu: MenuDefinition;
  isOpen: boolean;
  onToggle: () => void;
  onHover: () => void;
  onClose: () => void;
}) {
  return (
    <div className="relative" onMouseEnter={onHover}>
      <div
        onClick={onToggle}
        className={`px-2 py-1 cursor-pointer transition-colors rounded-md duration-150 select-none ${
          isOpen ? "bg-ctp-surface0" : "hover:bg-ctp-surface0"
        }`}
      >
        {menu.label}
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 mt-0.5 min-w-[220px] bg-ctp-mantle border border-ctp-surface0 rounded-lg shadow-xl shadow-black/30 py-1 z-50 animate-in fade-in slide-in-from-top-1 duration-100">
          {menu.entries.map((entry, i) =>
            entry.type === "divider" ? (
              <div key={i} className="my-1 mx-2 border-t border-ctp-surface0" />
            ) : (
              <div
                key={i}
                onClick={() => {
                  if (!entry.disabled) {
                    entry.onClick?.();
                    onClose();
                  }
                }}
                className={`flex flex-row items-center justify-between px-3 py-1.5 mx-1 rounded-md transition-colors duration-100 ${
                  entry.disabled
                    ? "text-ctp-overlay0 cursor-default"
                    : "hover:bg-ctp-surface0 cursor-pointer"
                }`}
              >
                <span className="text-[13px]">{entry.label}</span>
                {entry.shortcut && (
                  <span className="text-[11px] text-ctp-overlay0 ml-6 whitespace-nowrap">
                    {entry.shortcut}
                  </span>
                )}
              </div>
            ),
          )}
        </div>
      )}
    </div>
  );
}
