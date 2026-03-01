import { StateCreator } from 'zustand';

export interface Session {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  messageCount: number;
}

export interface SessionSlice {
  sessions: Session[];
  activeSessionId: string | null;
  sidebarOpen: boolean;

  createSession: () => void;
  deleteSession: (id: string) => void;
  renameSession: (id: string, name: string) => void;
  setActiveSession: (id: string) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  incrementMessageCount: (id: string) => void;
  loadFromStorage: () => void;
  saveToStorage: () => void;
}

export const createSessionSlice: StateCreator<SessionSlice, [], [], SessionSlice> = (set, get) => ({
  sessions: [],
  activeSessionId: null,
  sidebarOpen: false,

  createSession: () => {
    const { sessions } = get();
    const newSession: Session = {
      id: crypto.randomUUID(),
      name: `Session ${sessions.length + 1}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messageCount: 0,
    };
    set((state) => ({
      sessions: [...state.sessions, newSession],
      activeSessionId: newSession.id,
    }));
    get().saveToStorage();
  },

  deleteSession: (id) => {
    set((state) => {
      const remaining = state.sessions.filter((s) => s.id !== id);
      let activeSessionId = state.activeSessionId;
      if (activeSessionId === id) {
        activeSessionId = remaining.length > 0 ? remaining[remaining.length - 1].id : null;
      }
      return { sessions: remaining, activeSessionId };
    });
    get().saveToStorage();
  },

  renameSession: (id, name) => {
    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.id === id ? { ...s, name, updatedAt: Date.now() } : s
      ),
    }));
    get().saveToStorage();
  },

  setActiveSession: (id) => {
    set({ activeSessionId: id });
    get().saveToStorage();
  },

  toggleSidebar: () => {
    set((state) => ({ sidebarOpen: !state.sidebarOpen }));
  },

  setSidebarOpen: (open) => {
    set({ sidebarOpen: open });
  },

  incrementMessageCount: (id) => {
    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.id === id ? { ...s, messageCount: s.messageCount + 1, updatedAt: Date.now() } : s
      ),
    }));
    get().saveToStorage();
  },

  loadFromStorage: () => {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem('openclaw-sessions');
      if (raw) {
        const parsed = JSON.parse(raw) as { sessions: Session[]; activeSessionId: string | null };
        set({ sessions: parsed.sessions, activeSessionId: parsed.activeSessionId });
      } else {
        get().createSession();
      }
    } catch {
      get().createSession();
    }
  },

  saveToStorage: () => {
    if (typeof window === 'undefined') return;
    const { sessions, activeSessionId } = get();
    localStorage.setItem('openclaw-sessions', JSON.stringify({ sessions, activeSessionId }));
  },
});
