'use client';

import { useEffect, useRef } from 'react';
import { useAppStore } from '@/store';

/**
 * Subscribes to the per-agent SSE stream at /api/agents/[id]/stream.
 * Dispatches agent_token, agent_done, agent_error events to Zustand store.
 * Only connects when `enabled` is true (i.e., when the agent card is expanded).
 * Automatically cleans up on unmount or when enabled becomes false.
 */
export function useAgentStream(agentId: string, enabled: boolean) {
  const esRef = useRef<EventSource | null>(null);
  const appendAgentToken = useAppStore(s => s.appendAgentToken);
  const finishAgentStream = useAppStore(s => s.finishAgentStream);
  const setAgentError = useAppStore(s => s.setAgentError);
  const setAgentStatus = useAppStore(s => s.setAgentStatus);

  useEffect(() => {
    if (!enabled) {
      // Close existing connection if disabled
      if (esRef.current) {
        esRef.current.close();
        esRef.current = null;
      }
      return;
    }

    // Open SSE connection
    const es = new EventSource(`/api/agents/${agentId}/stream`);
    esRef.current = es;

    es.onmessage = (e) => {
      try {
        const event = JSON.parse(e.data) as {
          type: string;
          agentId?: string;
          status?: string;
          token?: string;
          error?: string;
        };

        switch (event.type) {
          case 'agent_status':
            if (event.status) {
              setAgentStatus(agentId, event.status as Parameters<typeof setAgentStatus>[1]);
            }
            break;
          case 'agent_token':
            if (event.token) {
              appendAgentToken(agentId, event.token);
            }
            break;
          case 'agent_done':
            finishAgentStream(agentId);
            break;
          case 'agent_error':
            setAgentError(agentId, event.error ?? 'Unknown error');
            break;
        }
      } catch {
        // ignore parse errors
      }
    };

    es.onerror = () => {
      // EventSource auto-reconnects on error — just update status
      setAgentStatus(agentId, 'offline');
    };

    return () => {
      es.close();
      esRef.current = null;
    };
  }, [agentId, enabled, appendAgentToken, finishAgentStream, setAgentError, setAgentStatus]);
}
