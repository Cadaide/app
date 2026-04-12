import { useEffect, useRef, useState } from "react";
import { useTabbarViewState } from "@/hooks/stores/useTabbarViewState";
import { Icon, IconifyIcon } from "@iconify/react";
import { PiCircle, PiCircleFill, PiX } from "react-icons/pi";
import { EditorHook, EditorHookId } from "@/classes/EditorHook";
import { Editor } from "@/classes/Editor";
import { GhostScrollbar } from "../utils/GhostScrollbar";

interface ITabbarViewItemProps {
  path: string;
  name: string;
  icon: IconifyIcon | string;
  isActive: boolean;
  isDirty: boolean;
}

interface ITabbarViewDirtyIndicatorCloseButtonProps {
  path: string;
  isDirty: boolean;
}

export function TabbarView() {
  const tabs = useTabbarViewState((state) => state.tabs);
  const activeTabPath = useTabbarViewState((state) => state.activeTabPath);
  const setDirty = useTabbarViewState((state) => state.setDirty);

  useEffect(() => {
    const modelChangeHook = new EditorHook(
      EditorHookId.ModelChange,
      ({ editor }) => setDirty(editor.getModel()?.uri.path ?? "", true),
    );
    const editorSaveHook = new EditorHook(
      EditorHookId.EditorSave,
      ({ path }) => {
        setDirty(path, false);
      },
    );

    Editor.instance.registerHooks([modelChangeHook, editorSaveHook]);

    return () => {
      Editor.instance.disposeHooks([modelChangeHook, editorSaveHook]);
    };
  }, [setDirty]);

  return (
    <GhostScrollbar
      direction="horizontal"
      thumbSize={4}
      className="w-full h-12 bg-ctp-crust"
      contentClassName="flex items-center"
    >
      {tabs.map((tab) => (
        <TabbarViewItem
          key={tab.path}
          path={tab.path}
          name={tab.name}
          icon={tab.icon}
          isActive={tab.path === activeTabPath}
          isDirty={tab.dirty}
        />
      ))}
    </GhostScrollbar>
  );
}

export function TabbarViewItem(props: ITabbarViewItemProps) {
  const ref = useRef<HTMLDivElement>(null);

  const setActiveTab = useTabbarViewState((state) => state.setActiveTab);

  useEffect(() => {
    // Scroll to the active tab
    if (props.isActive && ref.current)
      ref.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "nearest",
      });
  }, [props.isActive]);

  return (
    <div
      ref={ref}
      onClick={() => setActiveTab(props.path)}
      className={`w-fit shrink-0 h-full flex flex-row items-center gap-2 px-4 cursor-pointer transition-colors duration-150 ${props.isActive ? "bg-ctp-mantle border-t-2 border-ctp-lavender" : "bg-ctp-mantle/50 hover:bg-ctp-surface0 border-t-2 border-transparent"}`}
    >
      <Icon icon={props.icon} className="w-5 h-5 shrink-0" />
      <p className="whitespace-nowrap">{props.name}</p>
      <TabbarViewDirtyIndicatorCloseButton
        path={props.path}
        isDirty={props.isDirty}
      />
    </div>
  );
}

export function TabbarViewDirtyIndicatorCloseButton(
  props: ITabbarViewDirtyIndicatorCloseButtonProps,
) {
  const removeTab = useTabbarViewState((state) => state.removeTab);

  const [hovered, setHovered] = useState(false);

  return (
    <button
      className="w-5 h-5 ml-auto flex items-center justify-center hover:bg-ctp-surface2 rounded-sm cursor-pointer transition-colors duration-150"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        removeTab(props.path);
      }}
    >
      {props.isDirty && !hovered ? (
        <PiCircleFill
          className="w-3 h-3 flex text-ctp-lavender shrink-0"
          size={14}
        />
      ) : (
        <PiX className="w-4 h-4 shrink-0" />
      )}
    </button>
  );
}
