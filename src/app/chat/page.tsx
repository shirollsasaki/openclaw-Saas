import BioCanvas from '@/components/BioCanvas';
import CursorFollower from '@/components/CursorFollower';
import ChatPanel from '@/components/ChatPanel';
import AgentSidePanel from '@/components/AgentSidePanel';
import SessionsSidebar from '@/components/SessionsSidebar';

export default function ChatPage() {
  return (
    <div className="relative h-screen bg-[#030303] overflow-hidden">
      {/* Particle canvas */}
      <BioCanvas />

      {/* Noise overlay */}
      <div className="absolute inset-0 z-[2] pointer-events-none noise-overlay" />

      {/* Custom cursor */}
      <CursorFollower />

      {/* Chat UI */}
      <main className="relative z-[3] flex h-screen w-full overflow-hidden">
        <SessionsSidebar />
        <div className="flex flex-1 flex-col min-w-0">
          <ChatPanel />
        </div>
        <div className="hidden md:flex w-72 flex-shrink-0 border-l border-[#1a1a1a] flex-col">
          <AgentSidePanel />
        </div>
      </main>
    </div>
  );
}
