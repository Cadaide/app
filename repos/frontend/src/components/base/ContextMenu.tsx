import { ReactNode, useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";

export interface IContextMenuItem {
  label: string;
  onClick: () => void;
  icon?: ReactNode;
}

interface IContextMenuProps {
  items: IContextMenuItem[];
  children: ReactNode | ReactNode[];
}

export function ContextMenu(props: IContextMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const menuRef = useRef<HTMLDivElement>(null);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    let x = e.clientX;
    let y = e.clientY;

    const expectedWidth = 180;
    const expectedHeight = props.items.length * 36 + 12;

    if (x + expectedWidth > window.innerWidth)
      x = window.innerWidth - expectedWidth - 8;
    if (y + expectedHeight > window.innerHeight)
      y = window.innerHeight - expectedHeight - 8;

    setPosition({ x, y });
    setIsOpen(true);
  };

  const closeMenu = useCallback(() => {
    setIsOpen(false);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const handleGlobalClick = () => closeMenu();

    window.addEventListener("click", handleGlobalClick);
    window.addEventListener("contextmenu", handleGlobalClick);
    window.addEventListener("scroll", handleGlobalClick, true);

    return () => {
      window.removeEventListener("click", handleGlobalClick);
      window.removeEventListener("contextmenu", handleGlobalClick);
      window.removeEventListener("scroll", handleGlobalClick, true);
    };
  }, [isOpen, closeMenu]);

  return (
    <>
      <div onContextMenu={handleContextMenu} className="contents">
        {props.children}
      </div>

      {isOpen &&
        createPortal(
          <div
            ref={menuRef}
            style={{
              position: "fixed",
              top: position.y,
              left: position.x,
              zIndex: 9999,
            }}
            className="min-w-[180px] bg-ctp-surface0 border border-white/10 p-1.5 rounded-xl shadow-2xl"
          >
            <div className="flex flex-col gap-0.5">
              {props.items.map((item, idx) => (
                <button
                  key={idx}
                  onClick={(e) => {
                    e.stopPropagation();
                    item.onClick();
                    closeMenu();
                  }}
                  className="flex items-center gap-3 px-3 py-2 text-[14px] text-ctp-text hover:bg-white/10 hover:text-ctp-lavender rounded-lg transition-colors cursor-pointer text-left w-full"
                >
                  {item.icon && (
                    <span className="text-[18px] flex items-center justify-center">
                      {item.icon}
                    </span>
                  )}
                  <span className="font-medium">{item.label}</span>
                </button>
              ))}
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
