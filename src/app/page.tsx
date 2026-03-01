import Link from 'next/link';
import BioCanvas from '@/components/BioCanvas';
import CursorFollower from '@/components/CursorFollower';
import { AGENTS } from '@/lib/agents';

const COLOR_DOT: Record<string, string> = {
  blue:   'bg-blue-600',
  purple: 'bg-purple-600',
  red:    'bg-red-600',
  orange: 'bg-orange-500',
  green:  'bg-green-600',
  teal:   'bg-teal-600',
  yellow: 'bg-yellow-500',
};

export default function LandingPage() {
  return (
    <div className="relative min-h-screen bg-[#030303] overflow-hidden">
      {/* Particle canvas */}
      <BioCanvas />

      {/* Noise overlay */}
      <div className="absolute inset-0 z-[2] pointer-events-none noise-overlay" />

      {/* Custom cursor */}
      <CursorFollower />

      {/* Main content */}
      <div className="relative z-[3] flex flex-col min-h-screen px-[10%] md:px-[15%] py-16">
        {/* Top label */}
        <span
          className="text-[#444] text-xs uppercase tracking-widest mb-20"
          style={{ fontFamily: 'var(--font-mono, monospace)' }}
        >
          OPENCLAW // MULTI-AGENT SYSTEM
        </span>

        {/* Hero */}
        <div className="flex-1 flex flex-col justify-center">
          <h1 className="text-5xl md:text-6xl font-light text-[#e0e0e0] leading-tight mb-8 tracking-tight">
            Your team thinks<br />while you sleep.
          </h1>

          <p className="text-lg font-light text-[#6a6a6a] max-w-md mb-16 leading-relaxed">
            Seven specialized agents — Richard, Monica, Gilfoyle, Dinesh, Erlich, Jared, Big Head — working in parallel on your behalf.
          </p>

          {/* Agent row */}
          <div className="flex flex-wrap gap-6 mb-16">
            {AGENTS.map((agent) => (
              <div key={agent.id} className="flex flex-col items-center gap-2">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-medium text-white ${COLOR_DOT[agent.color] ?? 'bg-gray-600'}`}
                  style={{ opacity: 0.7 }}
                >
                  {agent.initials}
                </div>
                <span
                  className="text-[#333] text-[0.65rem] uppercase tracking-wider"
                  style={{ fontFamily: 'var(--font-mono, monospace)' }}
                >
                  {agent.id}
                </span>
              </div>
            ))}
          </div>

          {/* CTA */}
          <Link
            href="/chat"
            className="inline-block font-light text-[#6a6a6a] border-b border-[#333] pb-1 hover:text-[#e0e0e0] hover:border-[#666] transition-all duration-500 w-fit text-lg"
          >
            enter the system →
          </Link>
        </div>
      </div>

      {/* Bottom-right HUD */}
      <div
        className="fixed bottom-8 right-8 z-[4] flex flex-col items-end gap-2 pointer-events-none"
        style={{ fontFamily: 'var(--font-mono, monospace)' }}
      >
        <span className="text-[#333] text-[0.7rem] uppercase tracking-wider">AGENTS ONLINE: 7</span>
        <span className="text-[#333] text-[0.7rem] uppercase tracking-wider flex items-center gap-2">
          STATUS: ACTIVE
          <span className="inline-block w-1.5 h-1.5 bg-[#444] rounded-full status-pulse" />
        </span>
      </div>
    </div>
  );
}