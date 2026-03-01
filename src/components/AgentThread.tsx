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
      <div
        className="px-5 py-3 text-[0.65rem] text-[#2a2a2a] uppercase tracking-wider"
        style={{ fontFamily: 'var(--font-mono, monospace)' }}
      >
        {status === 'offline' ? 'OFFLINE' : 'STANDBY'}
      </div>
    );
  }

  return (
    <div className="px-5 py-3 max-h-40 overflow-y-auto space-y-2">
      {messages.map((msg) => (
        <div key={msg.id} className="text-xs text-[#555] leading-relaxed font-light">{msg.content}</div>
      ))}
      {streamingContent && (
        <div className="text-xs text-[#555] leading-relaxed font-light">
          {streamingContent}
          <span className="inline-block w-px h-3 bg-[#444] ml-0.5 animate-pulse" />
        </div>
      )}
    </div>
  );
}