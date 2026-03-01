# OpenClaw SaaS Platform

A GPT-like web interface for the OpenClaw 7-agent AI team. Type natural language prompts and watch Richard, Monica, Gilfoyle, Dinesh, Erlich, Jared, and Big Head work in real-time.

## Live Demo

**🚀 [https://openclaw-saas-hazel.vercel.app](https://openclaw-saas-hazel.vercel.app)**

## The Team

| Agent | Role |
|-------|------|
| Richard | CEO/Orchestrator — strategy & routing |
| Monica | Content & Brand |
| Gilfoyle | Builder/Engineering |
| Dinesh | Research & Intel |
| Erlich | Sales & Revenue |
| Jared | Growth & Community |
| Big Head | Trading & Data |

## Tech Stack

- Next.js 14 App Router + TypeScript + Tailwind CSS
- Zustand for state management
- SSE streaming for real-time agent responses
- OpenClaw gateway WebSocket proxy

## Getting Started

1. Clone the repo
2. Copy `.env.example` to `.env.local` and fill in your OpenClaw gateway token
3. `npm install`
4. `npm run dev`
5. Open http://localhost:3000

## Environment Variables

- `OPENCLAW_GATEWAY_URL` — WebSocket URL of your OpenClaw gateway (default: `ws://127.0.0.1:18789`)
- `OPENCLAW_GATEWAY_TOKEN` — Authentication token for the gateway

## Scripts

```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run start      # Start production server
npm run lint       # Run ESLint
npm run test       # Run unit tests (vitest)
npm run test:watch # Run tests in watch mode
npm run test:e2e   # Run end-to-end tests (playwright)
```