'use client';
import { useEffect, useState } from 'react';
import { useSessions } from '@/store';

export default function SessionsSidebar() {
  const {
    sessions,
    activeSessionId,
    sidebarOpen,
    createSession,
    deleteSession,
    renameSession,
    setActiveSession,
    loadFromStorage,
  } = useSessions();

  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  useEffect(() => {
    loadFromStorage();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDoubleClick = (id: string, name: string) => {
    setRenamingId(id);
    setRenameValue(name);
  };

  const handleRenameSubmit = (id: string) => {
    if (renameValue.trim()) {
      renameSession(id, renameValue.trim());
    }
    setRenamingId(null);
  };

  return (
    <div
      className={`flex-shrink-0 flex flex-col border-r border-[#111] bg-transparent overflow-hidden transition-all duration-300 ${
        sidebarOpen ? 'w-64' : 'w-0'
      }`}
    >
      {/* Header */}
      <div className="px-5 py-5 border-b border-[#111] flex-shrink-0 flex items-center justify-between min-w-[16rem]">
        <span
          className="text-[#444] text-xs uppercase tracking-widest whitespace-nowrap"
          style={{ fontFamily: 'var(--font-mono, monospace)' }}
        >
          SESSIONS // HISTORY
        </span>
        <button
          onClick={createSession}
          className="text-[#555] hover:text-[#888] text-xs uppercase tracking-widest transition-colors duration-200 whitespace-nowrap ml-3"
          style={{ fontFamily: 'var(--font-mono, monospace)' }}
          title="New Session"
        >
          + NEW
        </button>
      </div>

      {/* Session list */}
      <div className="flex-1 overflow-y-auto py-2 min-w-[16rem]">
        {sessions.map((session) => (
          <div
            key={session.id}
            className={`group relative flex items-center px-5 py-2.5 cursor-pointer transition-colors duration-200 ${
              session.id === activeSessionId
                ? 'border-l-2 border-[#444] pl-3 text-[#e0e0e0]'
                : 'border-l-2 border-transparent text-[#444] hover:text-[#666]'
            }`}
            onClick={() => setActiveSession(session.id)}
            onDoubleClick={() => handleDoubleClick(session.id, session.name)}
          >
            {renamingId === session.id ? (
              <input
                autoFocus
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onBlur={() => handleRenameSubmit(session.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleRenameSubmit(session.id);
                  if (e.key === 'Escape') setRenamingId(null);
                }}
                onClick={(e) => e.stopPropagation()}
                className="bg-transparent border-b border-[#444] text-[#e0e0e0] text-xs outline-none w-full py-0.5"
                style={{ fontFamily: 'var(--font-mono, monospace)' }}
              />
            ) : (
              <div className="flex flex-col min-w-0 flex-1">
                <span
                  className="text-xs truncate leading-snug"
                  style={{ fontFamily: 'var(--font-mono, monospace)' }}
                >
                  {session.name}
                </span>
                <span
                  className="text-[#2a2a2a] text-xs mt-0.5 leading-snug"
                  style={{ fontFamily: 'var(--font-mono, monospace)' }}
                >
                  {session.messageCount} {session.messageCount === 1 ? 'msg' : 'msgs'}
                </span>
              </div>
            )}

            {renamingId !== session.id && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteSession(session.id);
                }}
                className="opacity-0 group-hover:opacity-100 text-[#333] hover:text-[#666] text-sm ml-2 transition-opacity duration-200 flex-shrink-0 leading-none"
                style={{ fontFamily: 'var(--font-mono, monospace)' }}
                title="Delete session"
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-[#111] flex-shrink-0 min-w-[16rem]">
        <p
          className="text-[#2a2a2a] text-xs"
          style={{ fontFamily: 'var(--font-mono, monospace)' }}
        >
          {sessions.length} session{sessions.length !== 1 ? 's' : ''}
        </p>
      </div>
    </div>
  );
}
