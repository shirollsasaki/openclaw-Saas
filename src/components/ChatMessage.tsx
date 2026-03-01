'use client';

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
}

export default function ChatMessage({ role, content, isStreaming }: ChatMessageProps) {
  const isUser = role === 'user';
  return (
    <div className={`flex w-full mb-6 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[75%] text-sm font-light leading-relaxed ${
          isUser
            ? 'bg-[#111] border border-[#1e1e1e] rounded-sm px-4 py-3 text-[#999]'
            : 'text-[#888] px-0 py-1'
        }`}
      >
        <p className="whitespace-pre-wrap break-words">{content}</p>
        {isStreaming && (
          <span className="inline-block w-px h-4 bg-[#555] ml-0.5 animate-pulse" />
        )}
      </div>
    </div>
  );
}