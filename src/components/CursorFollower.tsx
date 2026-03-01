'use client';
import { useEffect, useRef } from 'react';

export default function CursorFollower() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const move = (e: MouseEvent) => {
      if (ref.current) {
        ref.current.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
      }
    };
    window.addEventListener('mousemove', move);
    return () => window.removeEventListener('mousemove', move);
  }, []);

  return (
    <div
      ref={ref}
      className="fixed top-0 left-0 z-[10] pointer-events-none"
      style={{
        width: 20,
        height: 20,
        border: '1px solid rgba(255,255,255,0.3)',
        borderRadius: '50%',
        transform: 'translate(-1000px,-1000px)',
        mixBlendMode: 'exclusion',
        marginLeft: -10,
        marginTop: -10,
      }}
    />
  );
}
