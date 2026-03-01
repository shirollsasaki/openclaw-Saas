'use client';
import { useRef, useEffect, useState, FormEvent } from 'react';
import ChatMessage from './ChatMessage';
import { useChat } from '@/store';

export default function ChatPanel() {
  const {
    messages, isStreaming, streamingContent, error,
    addUserMessage, startStreaming, appendToken, finishStreaming, setError,
  } = useChat();
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
    <div className="flex flex-col h-full bg-transparent">
      {/* Header */}
      <div className="flex items-center px-8 py-5 border-b border-[#111]">
        <span
          className="text-[#444] text-xs uppercase tracking-widest"
          style={{ fontFamily: 'var(--font-mono, monospace)' }}
        >
          ACTIVE SESSION // OPENCLAW
        </span>
        <span className="ml-3 inline-block w-1.5 h-1.5 bg-[#444] rounded-full status-pulse" />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-8 py-8">
        {messages.length === 0 && !isStreaming ? (
          <div className="flex flex-col items-start justify-center h-full">
            <p
              className="text-[#333] text-sm font-light leading-relaxed max-w-sm"
              style={{ fontFamily: 'var(--font-mono, monospace)' }}
            >
              The system is listening.<br />
              Ask anything — Richard will coordinate.
            </p>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <ChatMessage key={msg.id} role={msg.role} content={msg.content} />
            ))}
            {isStreaming && streamingContent && (
              <ChatMessage role="assistant" content={streamingContent} isStreaming />
            )}
            {isStreaming && !streamingContent && (
              <div className="flex items-center gap-3 mb-6">
                <span
                  className="text-[#333] text-xs uppercase tracking-widest"
                  style={{ fontFamily: 'var(--font-mono, monospace)' }}
                >
                  processing
                </span>
                <span className="flex gap-1">
                  {[0, 150, 300].map(d => (
                    <span
                      key={d}
                      className="w-1 h-1 bg-[#444] rounded-full animate-bounce"
                      style={{ animationDelay: `${d}ms` }}
                    />
                  ))}
                </span>
              </div>
            )}
          </>
        )}
        {error && (
          <div
            className="text-[#555] text-xs mb-4"
            style={{ fontFamily: 'var(--font-mono, monospace)' }}
          >
            ERROR: {error}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-8 py-6 border-t border-[#111]">
        <form onSubmit={handleSubmit}>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="speak to your team..."
            disabled={isStreaming}
            rows={1}
            className="w-full resize-none bg-transparent border-0 border-b border-[#222] text-[#e0e0e0] placeholder-[#333] text-base font-light py-2 outline-none focus:border-[#555] transition-colors duration-500 disabled:opacity-40"
            style={{ fontFamily: 'inherit' }}
          />
        </form>
        <p
          className="text-[#2a2a2a] text-xs mt-3"
          style={{ fontFamily: 'var(--font-mono, monospace)' }}
        >
          return to send · shift+return for newline
        </p>
      </div>
    </div>
  );
}