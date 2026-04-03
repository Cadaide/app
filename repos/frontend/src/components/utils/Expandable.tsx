import { Icon, IconifyIcon, IconifyIconName } from "@iconify/react";
import { ReactNode, useState } from "react";
import { IconType } from "react-icons";
import { PiCaretRight } from "react-icons/pi";
import { LoadingSpinner } from "../base/LoadingSpinner";

interface IExpandableProps {
  defaultExpanded?: boolean;
  title: string;
  expandedIcon?: IconType | IconifyIcon | string;
  collapsedIcon?: IconType | IconifyIcon | string;
  isLoading?: boolean;
  onStateChange?: (isExpanded: boolean) => void;
  children: ReactNode;
}

interface IExpandableIconProps {
  icon: IconType | IconifyIcon | string;
}

export function Expandable(props: IExpandableProps) {
  const [isExpanded, setIsExpanded] = useState(props.defaultExpanded ?? false);

  return (
    <div className="flex flex-col">
      <button
        onClick={() => {
          setIsExpanded(!isExpanded);
          props.onStateChange?.(!isExpanded);
        }}
        className="w-full flex flex-row items-center gap-1.5 px-1.5 py-1 hover:bg-ctp-surface0 cursor-pointer transition-colors text-ctp-text"
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
        <span className="text-ctp-text text-[15px] whitespace-nowrap">
          {props.title}
        </span>
      </button>
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
          className="shrink-0 text-ctp-lavender"
        />
      </div>
    );

  return (
    <div className="w-5 h-5">
      <props.icon
        width={20}
        height={20}
        className="shrink-0 text-ctp-lavender"
      />
    </div>
  );
}
