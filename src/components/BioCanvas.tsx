'use client';
import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  angle: number;
}

export default function BioCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let rafId = 0;
    const mouse = { x: -1000, y: -1000 };
    const PARTICLE_COUNT = 50;
    const CONNECTION_DIST = 150;
    const WANDER = 0.5;
    const particles: Particle[] = [];

    function resize() {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas!.width = width;
      canvas!.height = height;
    }

    function initParticles() {
      particles.length = 0;
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        particles.push({
          x: width / 2 + (Math.random() - 0.5) * 200,
          y: height / 2 + (Math.random() - 0.5) * 200,
          vx: (Math.random() - 0.5) * 2,
          vy: (Math.random() - 0.5) * 2,
          radius: 12 + Math.random() * 8,
          angle: Math.random() * Math.PI * 2,
        });
      }
    }

    function update(p: Particle) {
      p.angle += (Math.random() - 0.5) * 0.2;
      p.vx += Math.cos(p.angle) * WANDER;
      p.vy += Math.sin(p.angle) * WANDER;
      p.vx *= 0.95;
      p.vy *= 0.95;

      const dx = mouse.x - p.x;
      const dy = mouse.y - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 400) {
        p.vx += dx * 0.002;
        p.vy += dy * 0.002;
      }

      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0) p.x = width;
      if (p.x > width) p.x = 0;
      if (p.y < 0) p.y = height;
      if (p.y > height) p.y = 0;
    }

    function animate() {
      ctx!.clearRect(0, 0, width, height);
      ctx!.strokeStyle = 'rgba(120,120,120,0.15)';
      ctx!.lineWidth = 4;

      for (let i = 0; i < particles.length; i++) {
        const p1 = particles[i];
        update(p1);

        ctx!.beginPath();
        ctx!.arc(p1.x, p1.y, p1.radius, 0, Math.PI * 2);
        ctx!.fillStyle = 'rgba(200,200,200,0.8)';
        ctx!.fill();

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < CONNECTION_DIST) {
            ctx!.beginPath();
            ctx!.moveTo(p1.x, p1.y);
            ctx!.lineTo(p2.x, p2.y);
            ctx!.stroke();
          }
        }
      }
      rafId = requestAnimationFrame(animate);
    }

    const onMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    const onResize = () => {
      resize();
    };

    resize();
    initParticles();
    animate();
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <>
      {/* SVG filter defs — must be in DOM for canvas CSS filter to reference */}
      <svg style={{ position: 'absolute', width: 0, height: 0 }}>
        <defs>
          <filter id="liquid-filter">
            <feGaussianBlur in="SourceGraphic" stdDeviation="12" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9"
              result="goo"
            />
            <feTurbulence type="fractalNoise" baseFrequency="0.01" numOctaves="3" result="noise" />
            <feDisplacementMap in="goo" in2="noise" scale="20" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
      </svg>
      <div
        className="absolute inset-0 z-[1] pointer-events-none"
        style={{
          filter: "url('#liquid-filter') contrast(150%) brightness(100%)",
          opacity: 0.9,
        }}
      >
        <canvas ref={canvasRef} className="w-full h-full" />
      </div>
    </>
  );
}
