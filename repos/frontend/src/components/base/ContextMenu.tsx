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

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      window.dispatchEvent(new Event("close-context-menus"));

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
    },
    [props.items.length],
  );

  const closeMenu = useCallback(() => {
    setIsOpen(false);
  }, []);

  useEffect(() => {
    const handleCloseEvent = () => closeMenu();

    window.addEventListener("close-context-menus", handleCloseEvent);

    return () => {
      window.removeEventListener("close-context-menus", handleCloseEvent);
    };
  }, [closeMenu]);

  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideInteraction = (e: Event) => {
      if (menuRef.current && menuRef.current.contains(e.target as Node)) return;

      e.stopPropagation();
      e.preventDefault();

      closeMenu();

      if (e.type === "mousedown") {
        const blockClick = (clickEvent: Event) => {
          clickEvent.stopPropagation();
          clickEvent.preventDefault();

          window.removeEventListener("click", blockClick, { capture: true });
        };

        window.addEventListener("click", blockClick, { capture: true });

        setTimeout(
          () =>
            window.removeEventListener("click", blockClick, {
              capture: true,
            }),
          400,
        );
      }
    };

    const handleWindowContextMenu = (e: Event) => {
      if (menuRef.current && menuRef.current.contains(e.target as Node)) return;

      closeMenu();
    };

    const handleScroll = () => closeMenu();

    window.addEventListener("mousedown", handleOutsideInteraction, {
      capture: true,
    });
    window.addEventListener("click", handleOutsideInteraction, {
      capture: true,
    });
    window.addEventListener("contextmenu", handleWindowContextMenu);
    window.addEventListener("scroll", handleScroll, { capture: true });

    return () => {
      window.removeEventListener("mousedown", handleOutsideInteraction, {
        capture: true,
      });
      window.removeEventListener("click", handleOutsideInteraction, {
        capture: true,
      });
      window.removeEventListener("contextmenu", handleWindowContextMenu);
      window.removeEventListener("scroll", handleScroll, { capture: true });
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
