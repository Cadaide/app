import { PiCards, PiMinus, PiX } from "react-icons/pi";
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useProjectStore } from "@/hooks/stores/useProjectStore";

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

  const openProject = useProjectStore((state) => state.openProject);

  const handleOpenProject = useCallback(async () => {
    const path = await window.api.openSelectDirectoryDialog();
    if (!path) return;

    openProject(path);
  }, [openProject]);

  const MENUS: MenuDefinition[] = useMemo(
    () => [
      {
        label: "File",
        entries: [
          {
            type: "item",
            label: "Open folder...",
            onClick: handleOpenProject,
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
      className="w-full h-10 bg-ctp-mantle text-ctp-text text-sm border-b border-ctp-surface0 flex flex-row items-center gap-1.5 px-3.5"
    >
      <p className="mr-4 font-semibold select-none">Cadaide</p>
      <div className="flex flex-row gap-0.5 mr-auto">
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
      <WindowButtons />
    </div>
  );
}

function WindowButtons() {
  return (
    <div className="flex flex-row gap-1">
      <div className="p-1.5 hover:bg-ctp-surface0 cursor-pointer transition-colors rounded-full duration-200">
        <PiMinus className="text-lg" />
      </div>
      <div className="p-1.5 hover:bg-ctp-surface0 cursor-pointer transition-colors rounded-full duration-200">
        <PiCards className="text-lg" />
      </div>
      <div className="p-1.5 hover:bg-ctp-surface0 cursor-pointer transition-colors rounded-full duration-200">
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
