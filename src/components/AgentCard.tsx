'use client';
import { AgentConfig } from '@/lib/agents';
import { AgentState, AgentStatus } from '@/store/agentPanelSlice';
import AgentThread from './AgentThread';

function StatusDot({ status }: { status: AgentStatus }) {
  const color =
    status === 'thinking'   ? 'bg-yellow-500 status-pulse' :
    status === 'responding' ? 'bg-green-500 status-pulse' :
    status === 'error'      ? 'bg-red-700' :
    status === 'offline'    ? 'bg-[#1a1a1a]' :
    'bg-[#2a2a2a]'; // idle
  return <span className={`inline-block w-1.5 h-1.5 rounded-full flex-shrink-0 ${color}`} />;
}

interface AgentCardProps {
  agent: AgentConfig;
  agentState: AgentState;
  onToggle: () => void;
}

export default function AgentCard({ agent, agentState, onToggle }: AgentCardProps) {
  const { status, isExpanded } = agentState;


  return (
    <div className="border-b border-[#111]">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-[#0a0a0a] transition-colors duration-300 text-left"
      >
        {/* Initials in mono, no background */}
        <span
          className="text-[#333] text-xs w-6 flex-shrink-0"
          style={{ fontFamily: 'var(--font-mono, monospace)' }}
        >
          {agent.initials}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-light text-[#666] truncate">{agent.name}</span>
            <StatusDot status={status} />
          </div>
          <span
            className="text-[0.65rem] text-[#333] truncate block uppercase tracking-wider"
            style={{ fontFamily: 'var(--font-mono, monospace)' }}
          >
            {agent.role}
          </span>
        </div>
      </button>
      {isExpanded && (
        <div className="border-t border-[#0d0d0d] bg-[#020202]">
          <AgentThread agentState={agentState} />
        </div>
      )}
    </div>
  );
}