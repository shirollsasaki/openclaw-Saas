'use client';
import { AGENTS } from '@/lib/agents';
import { useAgentPanel } from '@/store';
import AgentCard from './AgentCard';

export default function AgentSidePanel() {
  const { agents, toggleAgentExpanded } = useAgentPanel();

  const activeCount = Object.values(agents).filter(
    a => a.status === 'thinking' || a.status === 'responding'
  ).length;

  return (
    <div className="flex flex-col h-full bg-transparent overflow-hidden">
      {/* Header */}
      <div className="px-5 py-5 border-b border-[#111] flex-shrink-0">
        <div className="flex items-center justify-between">
          <span
            className="text-[#444] text-xs uppercase tracking-widest"
            style={{ fontFamily: 'var(--font-mono, monospace)' }}
          >
            SUBSTRATE // AGENTS
          </span>
          {activeCount > 0 && (
            <span
              className="text-[#444] text-xs"
              style={{ fontFamily: 'var(--font-mono, monospace)' }}
            >
              {activeCount} active
            </span>
          )}
        </div>
      </div>

      {/* Agent list */}
      <div className="flex-1 overflow-y-auto">
        {AGENTS.map((agent) => {
          const agentState = agents[agent.id];
          if (!agentState) return null;
          return (
            <AgentCard
              key={agent.id}
              agent={agent}
              agentState={agentState}
              onToggle={() => toggleAgentExpanded(agent.id)}
            />
          );
        })}
      </div>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-[#111] flex-shrink-0">
        <p
          className="text-[#2a2a2a] text-xs"
          style={{ fontFamily: 'var(--font-mono, monospace)' }}
        >
          POWERED BY OPENCLAW
        </p>
      </div>
    </div>
  );
}