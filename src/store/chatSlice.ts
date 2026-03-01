import { StateCreator } from 'zustand';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface ChatSlice {
  messages: ChatMessage[];
  isStreaming: boolean;
  currentRunId: string | null;
  streamingContent: string;
  error: string | null;

  // Actions
  addUserMessage: (content: string) => void;
  startStreaming: (runId: string) => void;
  appendToken: (token: string) => void;
  finishStreaming: () => void;
  setError: (error: string | null) => void;
  clearMessages: () => void;
}

export const createChatSlice: StateCreator<ChatSlice, [], [], ChatSlice> = (set) => ({
  messages: [],
  isStreaming: false,
  currentRunId: null,
  streamingContent: '',
  error: null,

  addUserMessage: (content) => set((state) => ({
    messages: [...state.messages, {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: Date.now(),
    }],
    error: null,
  })),

  startStreaming: (runId) => set({
    isStreaming: true,
    currentRunId: runId,
    streamingContent: '',
    error: null,
  }),

  appendToken: (token) => set((state) => ({
    streamingContent: state.streamingContent + token,
  })),

  finishStreaming: () => set((state) => {
    if (!state.streamingContent) return { isStreaming: false, currentRunId: null };
    return {
      messages: [...state.messages, {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: state.streamingContent,
        timestamp: Date.now(),
      }],
      isStreaming: false,
      currentRunId: null,
      streamingContent: '',
    };
  }),

  setError: (error) => set({ error, isStreaming: false, currentRunId: null }),

  clearMessages: () => set({
    messages: [],
    streamingContent: '',
    isStreaming: false,
    currentRunId: null,
    error: null,
  }),
});
