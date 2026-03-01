'use client';

import { create } from 'zustand';
import { useShallow } from 'zustand/shallow';
import { createChatSlice, ChatSlice } from './chatSlice';
import { createAgentPanelSlice, AgentPanelSlice } from './agentPanelSlice';

export type AppStore = ChatSlice & AgentPanelSlice;

export const useAppStore = create<AppStore>()((...a) => ({
  ...createChatSlice(...a),
  ...createAgentPanelSlice(...a),
}));

// Typed selector hooks — useShallow prevents infinite re-renders from object literal selectors
export const useChat = () =>
  useAppStore(useShallow((s) => ({
    messages: s.messages,
    isStreaming: s.isStreaming,
    streamingContent: s.streamingContent,
    error: s.error,
    addUserMessage: s.addUserMessage,
    startStreaming: s.startStreaming,
    appendToken: s.appendToken,
    finishStreaming: s.finishStreaming,
    setError: s.setError,
    clearMessages: s.clearMessages,
  })));

export const useAgentPanel = () =>
  useAppStore(useShallow((s) => ({
    agents: s.agents,
    setAgentStatus: s.setAgentStatus,
    appendAgentToken: s.appendAgentToken,
    finishAgentStream: s.finishAgentStream,
    setAgentError: s.setAgentError,
    toggleAgentExpanded: s.toggleAgentExpanded,
    resetAllAgents: s.resetAllAgents,
  })));

export const useAgent = (id: string) => useAppStore((s) => s.agents[id]);
