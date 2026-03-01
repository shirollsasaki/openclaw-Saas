import { StateCreator } from 'zustand';
import { AGENTS } from '@/lib/agents';

export type AgentStatus = 'idle' | 'thinking' | 'responding' | 'error' | 'offline';

export interface AgentMessage {
  id: string;
  content: string;
  timestamp: number;
  isStreaming?: boolean;
}

export interface AgentState {
  id: string;
  status: AgentStatus;
  messages: AgentMessage[];
  streamingContent: string;
  isExpanded: boolean;
  lastActiveAt: number | null;
}

export interface AgentPanelSlice {
  agents: Record<string, AgentState>;

  // Actions
  setAgentStatus: (agentId: string, status: AgentStatus) => void;
  appendAgentToken: (agentId: string, token: string) => void;
  finishAgentStream: (agentId: string) => void;
  setAgentError: (agentId: string, error: string) => void;
  toggleAgentExpanded: (agentId: string) => void;
  resetAllAgents: () => void;
}

const initialAgentState = (id: string): AgentState => ({
  id,
  status: 'idle',
  messages: [],
  streamingContent: '',
  isExpanded: false,
  lastActiveAt: null,
});

export const createAgentPanelSlice: StateCreator<AgentPanelSlice, [], [], AgentPanelSlice> = (set) => ({
  // Pre-populate all 7 agents in idle state
  agents: Object.fromEntries(AGENTS.map((a) => [a.id, initialAgentState(a.id)])),

  setAgentStatus: (agentId, status) => set((state) => ({
    agents: {
      ...state.agents,
      [agentId]: {
        ...state.agents[agentId],
        status,
        lastActiveAt:
          status !== 'idle' ? Date.now() : state.agents[agentId]?.lastActiveAt ?? null,
      },
    },
  })),

  appendAgentToken: (agentId, token) => set((state) => ({
    agents: {
      ...state.agents,
      [agentId]: {
        ...state.agents[agentId],
        status: 'responding',
        streamingContent: (state.agents[agentId]?.streamingContent ?? '') + token,
        lastActiveAt: Date.now(),
      },
    },
  })),

  finishAgentStream: (agentId) => set((state) => {
    const agent = state.agents[agentId];
    if (!agent) return state;
    const content = agent.streamingContent;
    if (!content) {
      return {
        agents: {
          ...state.agents,
          [agentId]: { ...agent, status: 'idle', streamingContent: '' },
        },
      };
    }
    return {
      agents: {
        ...state.agents,
        [agentId]: {
          ...agent,
          status: 'idle',
          streamingContent: '',
          messages: [
            ...agent.messages,
            {
              id: crypto.randomUUID(),
              content,
              timestamp: Date.now(),
            },
          ],
        },
      },
    };
  }),

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  setAgentError: (agentId, _) => set((state) => ({
    agents: {
      ...state.agents,
      [agentId]: {
        ...state.agents[agentId],
        status: 'error',
        streamingContent: '',
      },
    },
  })),

  toggleAgentExpanded: (agentId) => set((state) => ({
    agents: {
      ...state.agents,
      [agentId]: {
        ...state.agents[agentId],
        isExpanded: !state.agents[agentId]?.isExpanded,
      },
    },
  })),

  resetAllAgents: () => set({
    agents: Object.fromEntries(AGENTS.map((a) => [a.id, initialAgentState(a.id)])),
  }),
});
