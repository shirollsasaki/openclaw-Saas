'use client';

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { createChatSlice, ChatSlice } from './chatSlice';
import { createAgentPanelSlice, AgentPanelSlice } from './agentPanelSlice';

export type AppStore = ChatSlice & AgentPanelSlice;

export const useAppStore = create<AppStore>()(
  devtools(
    (...a) => ({
      ...createChatSlice(...a),
      ...createAgentPanelSlice(...a),
    }),
    { name: 'OpenClawStore' }
  )
);

// Typed selector hooks
export const useChat = () =>
  useAppStore((s) => ({
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
  }));

export const useAgentPanel = () =>
  useAppStore((s) => ({
    agents: s.agents,
    setAgentStatus: s.setAgentStatus,
    appendAgentToken: s.appendAgentToken,
    finishAgentStream: s.finishAgentStream,
    setAgentError: s.setAgentError,
    toggleAgentExpanded: s.toggleAgentExpanded,
    resetAllAgents: s.resetAllAgents,
  }));

export const useAgent = (id: string) => useAppStore((s) => s.agents[id]);
