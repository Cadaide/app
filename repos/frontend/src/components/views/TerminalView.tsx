import "@xterm/xterm/css/xterm.css";
import {
  PiPlus,
  PiTerminal,
  PiTerminalFill,
  PiTerminalWindow,
  PiX,
} from "react-icons/pi";
import { GhostScrollbar } from "../utils/GhostScrollbar";

import { useSidebarViewState } from "@/hooks/stores/useSidebarViewState";
import { AttachAddon } from "@xterm/addon-attach";
import { FitAddon } from "@xterm/addon-fit";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useXTerm } from "react-xtermjs";
import { ITerminalOptions } from "@xterm/xterm";
import { useShellPtySessionsState } from "@/hooks/stores/useShellPtySessionsState";
import { ShellPtySession } from "@/classes/ShellPtySession";
import { useWorkspaceState } from "@/hooks/stores/useWorkspaceState";

const TERMINAL_OPTIONS: ITerminalOptions = {
  fontFamily: "var(--font-firacode-nerd)",
  fontSize: 16,
  lineHeight: 1.5,
  cursorBlink: true,
  theme: {
    cursor: "#F5E0DC",
    selectionBackground: "#585B70",

    background: "#1E1E2E",
    foreground: "#CDD6F4",

    black: "#45475A",
    red: "#F38BA8",
    green: "#A6E3A1",
    yellow: "#F9E2AF",
    blue: "#89B4FA",
    magenta: "#F5C2E7",
    cyan: "#94E2D5",
    white: "#BAC2DE",

    brightBlack: "#585B70",
    brightRed: "#F38BA8",
    brightGreen: "#A6E3A1",
    brightYellow: "#F9E2AF",
    brightBlue: "#89B4FA",
    brightMagenta: "#F5C2E7",
    brightCyan: "#94E2D5",
    brightWhite: "#A6ADC8",
  },
  fontWeight: "400",
  fontWeightBold: "700",
};

interface ITerminalInstanceProps {
  sid: string;
  session: ShellPtySession;
  isActive: boolean;
}

function TerminalInstance(props: ITerminalInstanceProps) {
  const { ref, instance } = useXTerm({
    options: TERMINAL_OPTIONS,
  });
  const setSessionTitle = useShellPtySessionsState(
    (state) => state.setSessionTitle,
  );

  useEffect(() => {
    if (!instance) return;

    //const attach = new AttachAddon(props.session.socket);
    const fitAddon = new FitAddon();

    //instance.loadAddon(attach);
    instance.loadAddon(fitAddon);

    props.session.onData((data) => instance.write(data));
    instance.onData((data) => props.session.write(data));
    instance.onResize((size) => props.session.resize(size.cols, size.rows));

    props.session.onTitleChange((title) => setSessionTitle(props.sid, title));

    const fit = () => {
      try {
        fitAddon.fit();
      } catch (e) {
        // ignore errors from fit Addon when container is zero sized
      }
    };

    let timeout: NodeJS.Timeout | null = null;
    let observer: ResizeObserver | null = null;

    if (props.isActive && ref.current) {
      timeout = setTimeout(fit, 10);
      observer = new ResizeObserver(() => fit());
      observer.observe(ref.current);

      if ("fonts" in document) document.fonts.ready.then(fit);
    }

    return () => {
      //attach.dispose();
      fitAddon.dispose();

      if (timeout) clearTimeout(timeout);
      if (observer) observer.disconnect();
    };
  }, [
    instance,
    props.session,
    props.isActive,
    ref,
    props.sid,
    setSessionTitle,
  ]);

  return (
    <div
      className={`w-full h-full ${props.isActive ? "block" : "hidden"}`}
      ref={ref}
    />
  );
}

export function TerminalView() {
  const activeViewIds = useSidebarViewState((state) => state.activatedViewIds);
  const {
    sessions,
    activeSession,
    setActiveSession,
    addSession,
    removeSession,
    sessionTitles,
  } = useShellPtySessionsState();
  const initializingStateRef = useRef<boolean>(false);
  const workspace = useWorkspaceState((state) => state.workspace);

  useEffect(() => {
    if (!activeSession && sessions.size > 0)
      return setActiveSession(sessions.keys().next().value!);

    if (sessions.size > 0) initializingStateRef.current = false;
    else if (!initializingStateRef.current) {
      initializingStateRef.current = true;

      const id = Math.random().toString(16);
      addSession(id, new ShellPtySession(workspace?.path));
      setActiveSession(id);
    }
  }, [sessions, activeSession, addSession, setActiveSession, workspace]);

  const handleCreateSession = useCallback(() => {
    const id = Math.random().toString(16);
    addSession(id, new ShellPtySession(workspace?.path));
    setActiveSession(id);
  }, [addSession, setActiveSession, workspace]);

  const handleDeleteSession = useCallback(
    (sid: string, e: React.MouseEvent) => {
      e.stopPropagation();

      const session = sessions.get(sid);
      if (session) session.destroy();

      removeSession(sid);

      if (activeSession === sid) {
        const remainingSids = [...sessions.keys()].filter((id) => id !== sid);
        if (remainingSids.length > 0) setActiveSession(remainingSids[0]);
        else setActiveSession(null);
      }
    },
    [sessions, activeSession, removeSession, setActiveSession],
  );

  const isActive = useMemo(
    () => activeViewIds.includes("terminal"),
    [activeViewIds],
  );
  if (!isActive) return null;

  return (
    <div className="w-full h-[40%] bg-ctp-crust border-t border-ctp-surface1">
      <div className="flex flex-row w-full h-full">
        <div className="grow relative overflow-hidden pl-2 pt-2 bg-[#1E1E2E]">
          <div className="relative w-full h-full overflow-hidden">
            {[...sessions.keys()].map((sid) => {
              const session = sessions.get(sid);
              if (!session) return null;

              return (
                <TerminalInstance
                  key={sid}
                  sid={sid}
                  session={session}
                  isActive={activeSession === sid}
                />
              );
            })}
          </div>
        </div>
        <div className="flex flex-col w-48 border-l border-ctp-surface1 bg-ctp-mantle">
          <div className="flex flex-row justify-between items-center px-4 py-2 border-b border-ctp-surface1 text-ctp-text">
            <p className="text-ctp-lavender text-[14px] font-semibold">
              Terminal
            </p>
            <button
              onClick={handleCreateSession}
              className="w-5 h-5 flex items-center justify-center hover:bg-ctp-surface2 rounded-sm cursor-pointer transition-colors duration-150"
            >
              <PiPlus />
            </button>
          </div>
          <GhostScrollbar
            direction="vertical"
            className="w-full h-full"
            contentClassName="flex flex-col"
          >
            {[...sessions.keys()].map((sid, i) => (
              <div
                key={sid}
                className={`flex flex-row justify-between items-center px-4 py-1.5 cursor-pointer group transition-colors duration-150 ${activeSession === sid ? "bg-ctp-surface0 text-ctp-lavender border-l-2 border-ctp-lavender" : "text-ctp-subtext0 hover:bg-ctp-surface0 hover:text-ctp-text border-l-2 border-transparent"}`}
                onClick={() => setActiveSession(sid)}
              >
                <div className="flex flex-row items-center gap-2">
                  <PiTerminalWindow className="w-5 h-5" />
                  <span className="text-sm truncate">
                    {sessionTitles.get(sid) ?? `Terminal ${i + 1}`}
                  </span>
                </div>
                <button
                  onClick={(e) => handleDeleteSession(sid, e)}
                  className={`w-5 h-5 flex items-center justify-center rounded-sm cursor-pointer transition-colors duration-150 ${activeSession === sid ? "hover:bg-ctp-surface2 text-ctp-lavender" : "opacity-0 group-hover:opacity-100 hover:bg-ctp-surface2 text-ctp-subtext0 hover:text-ctp-text"}`}
                >
                  <PiX />
                </button>
              </div>
            ))}
          </GhostScrollbar>
        </div>
      </div>
    </div>
  );
}
