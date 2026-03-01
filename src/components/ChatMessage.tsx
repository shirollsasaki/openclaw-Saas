'use client';
import { clsx } from 'clsx';

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
}

export default function ChatMessage({ role, content, isStreaming }: ChatMessageProps) {
  const isUser = role === 'user';
  return (
    <div className={clsx('flex w-full mb-6', isUser ? 'justify-end' : 'justify-start')}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white mr-3 flex-shrink-0 mt-0.5">
          OC
        </div>
      )}
      <div className={clsx(
        'max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed',
        isUser ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-[#2a2a2a] text-gray-100 rounded-bl-sm'
      )}>
        <p className="whitespace-pre-wrap break-words">{content}</p>
        {isStreaming && <span className="inline-block w-1.5 h-4 bg-gray-400 ml-0.5 animate-pulse rounded-sm" />}
      </div>
      {isUser && (
        <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center text-xs font-bold text-white ml-3 flex-shrink-0 mt-0.5">
          U
        </div>
      )}
    </div>
  );
}
