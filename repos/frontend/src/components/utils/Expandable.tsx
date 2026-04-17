import { Icon, IconifyIcon, IconifyIconName } from "@iconify/react";
import { ReactNode, useState } from "react";
import { IconType } from "react-icons";
import { PiCaretRight } from "react-icons/pi";
import { LoadingSpinner } from "../base/LoadingSpinner";
import { ContextMenu, IContextMenuItem } from "../base/ContextMenu";

interface IExpandableHeaderButton {
  icon: IconType | IconifyIcon | string;
  onClick: () => void;
  className?: string;
}

interface IExpandableProps {
  defaultExpanded?: boolean;
  title: string;
  expandedIcon?: IconType | IconifyIcon | string;
  collapsedIcon?: IconType | IconifyIcon | string;
  isLoading?: boolean;
  onStateChange?: (isExpanded: boolean) => void;
  children: ReactNode;
  selected?: boolean;
  headerButtons?: IExpandableHeaderButton[];
  headerContextMenuItems?: IContextMenuItem[];
  onClick?: () => void;
}

interface IExpandableIconProps {
  icon: IconType | IconifyIcon | string;
  className?: string;
}

export function Expandable(props: IExpandableProps) {
  const [isExpanded, setIsExpanded] = useState(props.defaultExpanded ?? false);

  return (
    <div className="flex flex-col">
      <ContextMenu items={props.headerContextMenuItems ?? []}>
        <button
          onClick={() => {
            setIsExpanded(!isExpanded);
            props.onStateChange?.(!isExpanded);
            props.onClick?.();
          }}
          className={`w-full flex flex-row items-center gap-1.5 px-1.5 pr-4 py-1 hover:bg-ctp-surface0 cursor-pointer transition-colors text-ctp-text ${
            props.selected ? "bg-ctp-surface1/30" : ""
          }`}
        >
          <PiCaretRight
            className={`w-4 h-4 shrink-0 text-ctp-lavender transition-transform ${isExpanded ? "rotate-90" : ""}`}
          />
          {props.isLoading ? (
            <LoadingSpinner size="sm" />
          ) : (
            <>
              {isExpanded && props.expandedIcon && (
                <ExpandableIcon icon={props.expandedIcon} />
              )}
              {!isExpanded && props.collapsedIcon && (
                <ExpandableIcon icon={props.collapsedIcon} />
              )}
            </>
          )}
          <span className="text-ctp-text text-[15px] whitespace-nowrap grow text-left">
            {props.title}
          </span>
          <span className="flex flex-row items-center gap-2">
            {props.headerButtons?.map((button, index) => (
              <span
                key={index}
                onClick={(e) => {
                  e.stopPropagation();
                  button.onClick();
                }}
                className={`w-5 h-5 shrink-0 text-ctp-lavender transition-colors cursor-pointer ${button.className}`}
              >
                <ExpandableIcon icon={button.icon} className="w-5 h-5" />
              </span>
            ))}
          </span>
        </button>
      </ContextMenu>
      {isExpanded && !props.isLoading && (
        <div className="border-l border-ctp-surface0 ml-[11px]">
          {props.children}
        </div>
      )}
    </div>
  );
}

function isIconifyIconName(
  icon: IconType | IconifyIcon | string,
): icon is IconifyIcon {
  return typeof icon === "string";
}

function ExpandableIcon(props: IExpandableIconProps) {
  if (isIconifyIconName(props.icon))
    return (
      <div className="w-5 h-5">
        <Icon
          icon={props.icon}
          width={20}
          height={20}
          className={`shrink-0 text-ctp-lavender ${props.className}`}
        />
      </div>
    );

  return (
    <div className="w-5 h-5">
      <props.icon
        width={20}
        height={20}
        className={`shrink-0 text-ctp-lavender ${props.className}`}
      />
    </div>
  );
}
