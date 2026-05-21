import { ShellPtySession } from "@/classes/ShellPtySession";
import { create } from "zustand";

export const useShellPtySessionsState = create<{
  sessions: Map<string, ShellPtySession>;
  sessionTitles: Map<string, string>;
  activeSession: string | null;

  addSession: (sessionId: string, session: ShellPtySession) => void;
  removeSession: (sessionId: string) => void;
  setActiveSession: (sessionId: string | null) => void;
  setSessionTitle: (sessionId: string, title: string) => void;
}>((set) => ({
  sessions: new Map(),
  sessionTitles: new Map(),
  activeSession: null,

  addSession: (sessionId: string, session: ShellPtySession) =>
    set((state) => {
      const newSessions = new Map(state.sessions);
      newSessions.set(sessionId, session);

      return { sessions: newSessions };
    }),
  removeSession: (sessionId: string) =>
    set((state) => {
      const newSessions = new Map(state.sessions);
      newSessions.delete(sessionId);

      return { sessions: newSessions };
    }),
  setActiveSession: (sessionId: string | null) =>
    set((state) => ({ activeSession: sessionId })),
  setSessionTitle: (sessionId: string, title: string) =>
    set((state) => {
      const newSessionTitles = new Map(state.sessionTitles);
      newSessionTitles.set(sessionId, title);

      return { sessionTitles: newSessionTitles };
    }),
}));
