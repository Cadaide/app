import { useEffect, useRef } from "react";
import { useTabbarViewState } from "@/hooks/stores/useTabbarViewState";
import { Icon, IconifyIcon } from "@iconify/react";
import { PiCircle, PiCircleFill, PiX } from "react-icons/pi";
import { EditorHook, EditorHookId } from "@/classes/EditorHook";
import { Editor } from "@/classes/Editor";

interface TabbarViewItemProps {
  path: string;
  name: string;
  icon: IconifyIcon | string;
  isActive: boolean;
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
    <div
      className="w-full h-12 bg-ctp-crust flex items-center overflow-x-hidden overflow-y-hidden hover:overflow-x-auto tabbar-scrollbar group"
      onWheel={(e) => {
        if (e.deltaY !== 0) e.currentTarget.scrollLeft += e.deltaY;
      }}
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
    </div>
  );
}

export function TabbarViewItem(props: TabbarViewItemProps) {
  const ref = useRef<HTMLDivElement>(null);

  const removeTab = useTabbarViewState((state) => state.removeTab);
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
      className={`w-fit pt-1 pb-[11px] group-hover:pb-0 shrink-0 h-full flex flex-row items-center gap-2 px-4 cursor-pointer transition-colors duration-150 ${props.isActive ? "bg-ctp-mantle border-t-2 border-ctp-lavender" : "bg-ctp-mantle/50 hover:bg-ctp-surface0 border-t-2 border-transparent"}`}
    >
      <Icon icon={props.icon} className="w-5 h-5 shrink-0" />
      <p className="whitespace-nowrap">{props.name}</p>
      {props.isDirty && (
        <PiCircleFill className="w-3 h-3 shrink-0 text-ctp-lavender" />
      )}
      <PiX
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();

          removeTab(props.path);
        }}
        className="w-6 h-6 ml-auto hover:bg-ctp-surface2 rounded-sm p-1 cursor-pointer transition-colors duration-150"
      />
    </div>
  );
}
