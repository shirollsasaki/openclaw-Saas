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
    <div className="flex flex-col h-full bg-[#111] overflow-hidden">
      <div className="px-4 py-4 border-b border-[#222] flex-shrink-0">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Your Team</h2>
          {activeCount > 0 && (
            <span className="text-xs bg-green-900/50 text-green-400 px-2 py-0.5 rounded-full">
              {activeCount} active
            </span>
          )}
        </div>
        <p className="text-xs text-gray-600 mt-1">7 agents · always on</p>
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-3">
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
      <div className="px-4 py-3 border-t border-[#222] flex-shrink-0">
        <p className="text-xs text-gray-600 text-center">Powered by OpenClaw</p>
      </div>
    </div>
  );
}
