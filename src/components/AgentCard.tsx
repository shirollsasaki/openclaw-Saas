'use client';
import { clsx } from 'clsx';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { AgentConfig } from '@/lib/agents';
import { AgentState, AgentStatus } from '@/store/agentPanelSlice';
import AgentThread from './AgentThread';
import { useAgentStream } from '@/hooks/useAgentStream';

const COLOR_MAP: Record<string, { bg: string }> = {
  blue:   { bg: 'bg-blue-600' },
  purple: { bg: 'bg-purple-600' },
  red:    { bg: 'bg-red-600' },
  orange: { bg: 'bg-orange-500' },
  green:  { bg: 'bg-green-600' },
  teal:   { bg: 'bg-teal-600' },
  yellow: { bg: 'bg-yellow-500' },
};

function StatusDot({ status }: { status: AgentStatus }) {
  return (
    <span className={clsx(
      'w-2 h-2 rounded-full flex-shrink-0',
      status === 'idle'       && 'bg-gray-500',
      status === 'thinking'   && 'bg-yellow-400 animate-pulse',
      status === 'responding' && 'bg-green-400 animate-pulse',
      status === 'error'      && 'bg-red-500',
      status === 'offline'    && 'bg-gray-700',
    )} />
  );
}

interface AgentCardProps {
  agent: AgentConfig;
  agentState: AgentState;
  onToggle: () => void;
}

export default function AgentCard({ agent, agentState, onToggle }: AgentCardProps) {
  const colors = COLOR_MAP[agent.color] ?? COLOR_MAP.blue;
  const { status, isExpanded } = agentState;

  useAgentStream(agent.id, isExpanded);
  return (
    <div className="border border-[#2a2a2a] rounded-lg overflow-hidden mb-2">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-[#1a1a1a] transition-colors text-left"
      >
        <div className={clsx('w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0', colors.bg)}>
          {agent.initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-medium text-gray-200 truncate">{agent.name}</span>
            <StatusDot status={status} />
          </div>
          <span className="text-xs text-gray-500 truncate block">{agent.role}</span>
        </div>
        <span className="text-gray-600 flex-shrink-0">
          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </span>
      </button>
      {isExpanded && (
        <div className="border-t border-[#2a2a2a] bg-[#0f0f0f]">
          <AgentThread agentState={agentState} />
        </div>
      )}
    </div>
  );
}
