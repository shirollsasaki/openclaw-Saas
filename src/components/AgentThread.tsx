'use client';
import { AgentState } from '@/store/agentPanelSlice';

interface AgentThreadProps {
  agentState: AgentState;
}

export default function AgentThread({ agentState }: AgentThreadProps) {
  const { messages, streamingContent, status } = agentState;
  const hasContent = messages.length > 0 || streamingContent;

  if (!hasContent) {
    return (
      <div className="px-3 py-3 text-xs text-gray-600 italic">
        {status === 'offline' ? 'Agent offline' : 'Waiting for tasks...'}
      </div>
    );
  }

  return (
    <div className="px-3 py-2 max-h-48 overflow-y-auto space-y-2">
      {messages.map((msg) => (
        <div key={msg.id} className="text-xs text-gray-300 leading-relaxed">{msg.content}</div>
      ))}
      {streamingContent && (
        <div className="text-xs text-gray-300 leading-relaxed">
          {streamingContent}
          <span className="inline-block w-1 h-3 bg-gray-400 ml-0.5 animate-pulse rounded-sm" />
        </div>
      )}
    </div>
  );
}
