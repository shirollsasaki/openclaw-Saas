import ChatPanel from '@/components/ChatPanel';
import AgentSidePanel from '@/components/AgentSidePanel';

export default function Home() {
  return (
    <main className="flex h-screen w-full overflow-hidden bg-[#0f0f0f]">
      <div className="flex flex-1 flex-col min-w-0">
        <ChatPanel />
      </div>
      <div className="hidden md:flex w-80 flex-shrink-0 border-l border-[#333] flex-col">
        <AgentSidePanel />
      </div>
    </main>
  );
}
