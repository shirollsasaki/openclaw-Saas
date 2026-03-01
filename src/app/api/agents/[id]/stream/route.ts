import { NextRequest } from 'next/server';
import { getOpenClawClient, ChatEvent } from '@/lib/openclaw-ws';
import { AGENT_MAP } from '@/lib/agents';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function sseEvent(data: object): string {
  return `data: ${JSON.stringify(data)}\n\n`;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const agent = AGENT_MAP[id];

  if (!agent) {
    return new Response(JSON.stringify({ error: `Unknown agent: ${id}` }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const message = req.nextUrl.searchParams.get('message')?.trim();
  if (!message) {
    return new Response(JSON.stringify({ error: 'Missing ?message= query param' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const sessionKey = `agent:${agent.sessionKey}:main`;
  const client = getOpenClawClient();

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      let closed = false;
      let timer: NodeJS.Timeout;
      // eslint-disable-next-line prefer-const
      let onChat: (event: ChatEvent) => void;

      const enqueue = (data: object) => {
        if (!closed) {
          controller.enqueue(encoder.encode(sseEvent(data)));
        }
      };

      const cleanup = () => {
        clearTimeout(timer);
        client.off('chat', onChat);
      };

      const close = () => {
        if (!closed) {
          closed = true;
          cleanup();
          controller.close();
        }
      };

      onChat = (event: ChatEvent) => {
        if (event.sessionKey !== sessionKey) return;

        if (event.error) {
          enqueue({ type: 'agent_error', agentId: agent.id, error: event.error });
          close();
          return;
        }

        if (event.text) {
          enqueue({ type: 'agent_token', agentId: agent.id, token: event.text });
        }

        if (event.done) {
          enqueue({ type: 'agent_done', agentId: agent.id });
          close();
        }
      };

      try {
        await client.connect().catch(() => {});

        client.on('chat', onChat);
        timer = setTimeout(close, 5 * 60 * 1000);

        req.signal.addEventListener('abort', () => {
          closed = true;
          cleanup();
          controller.close();
        });

        try {
          await client.sendMessage(sessionKey, message);
        } catch {
          enqueue({
            type: 'agent_error',
            agentId: agent.id,
            error: client.isConnected()
              ? 'Failed to send message to agent'
              : 'OpenClaw gateway is offline',
          });
          close();
        }
      } catch (err) {
        enqueue({
          type: 'agent_error',
          agentId: agent.id,
          error: err instanceof Error ? err.message : 'Unknown error',
        });
        close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}