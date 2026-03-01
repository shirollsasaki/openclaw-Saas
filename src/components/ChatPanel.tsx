'use client';
import { useRef, useEffect, useState, FormEvent } from 'react';
import { Send } from 'lucide-react';
import { clsx } from 'clsx';
import ChatMessage from './ChatMessage';
import { useChat } from '@/store';

export default function ChatPanel() {
  const { messages, isStreaming, streamingContent, error, addUserMessage, startStreaming, appendToken, finishStreaming, setError } = useChat();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  useEffect(() => {
    const ta = textareaRef.current;
    if (ta) { ta.style.height = 'auto'; ta.style.height = `${Math.min(ta.scrollHeight, 200)}px`; }
  }, [input]);

  const handleSubmit = async (e?: FormEvent) => {
    e?.preventDefault();
    const text = input.trim();
    if (!text || isStreaming) return;
    setInput('');
    addUserMessage(text);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });
      if (!res.ok || !res.body) { setError('Failed to connect to agent team'); return; }
      startStreaming('pending');
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const event = JSON.parse(line.slice(6));
            if (event.type === 'chat_token') appendToken(event.token ?? '');
            else if (event.type === 'done') finishStreaming();
            else if (event.type === 'error') setError(event.message ?? 'Agent error');
          } catch { /* ignore */ }
        }
      }
      finishStreaming();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection error');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center px-6 py-4 border-b border-[#333]">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-sm font-medium text-gray-300">OpenClaw</span>
        </div>
        <span className="ml-2 text-xs text-gray-500">7 agents ready</span>
      </div>
      <div className="flex-1 overflow-y-auto px-6 py-6">
        {messages.length === 0 && !isStreaming ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="text-4xl mb-4">🤖</div>
            <h2 className="text-xl font-semibold text-gray-200 mb-2">Your team is ready</h2>
            <p className="text-gray-500 text-sm max-w-sm">Ask anything. Richard will coordinate with Monica, Gilfoyle, Dinesh, Erlich, Jared, and Big Head.</p>
          </div>
        ) : (
          <>
            {messages.map((msg) => <ChatMessage key={msg.id} role={msg.role} content={msg.content} />)}
            {isStreaming && streamingContent && <ChatMessage role="assistant" content={streamingContent} isStreaming />}
            {isStreaming && !streamingContent && (
              <div className="flex items-center gap-2 text-gray-500 text-sm mb-6">
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">OC</div>
                <div className="flex gap-1">
                  {[0, 150, 300].map(d => <span key={d} className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />)}
                </div>
              </div>
            )}
          </>
        )}
        {error && <div className="mx-auto max-w-md bg-red-900/30 border border-red-700 rounded-lg px-4 py-3 text-red-300 text-sm mb-4">{error}</div>}
        <div ref={messagesEndRef} />
      </div>
      <div className="px-6 py-4 border-t border-[#333]">
        <form onSubmit={handleSubmit} className="relative">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message your team..."
            disabled={isStreaming}
            rows={1}
            className={clsx(
              'w-full resize-none rounded-xl bg-[#2a2a2a] border border-[#444] px-4 py-3 pr-12',
              'text-sm text-gray-100 placeholder-gray-500',
              'focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500',
              'disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150'
            )}
          />
          <button
            type="submit"
            disabled={!input.trim() || isStreaming}
            className={clsx(
              'absolute right-3 bottom-3 p-1.5 rounded-lg transition-colors',
              input.trim() && !isStreaming ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-[#444] text-gray-500 cursor-not-allowed'
            )}
          >
            <Send size={16} />
          </button>
        </form>
        <p className="text-center text-xs text-gray-600 mt-2">Enter to send · Shift+Enter for new line</p>
      </div>
    </div>
  );
}
