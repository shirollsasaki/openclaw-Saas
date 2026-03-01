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

  const client = getOpenClawClient();

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      let closed = false;

      const enqueue = (data: object) => {
        if (!closed) {
          controller.enqueue(encoder.encode(sseEvent(data)));
        }
      };

      const close = () => {
        if (!closed) {
          closed = true;
          controller.close();
        }
      };

      // Send initial status
      enqueue({
        type: 'agent_status',
        agentId: agent.id,
        status: client.getAgentStatus(agent.sessionKey),
      });

      const onChat = (event: ChatEvent) => {
        if (event.sessionKey !== agent.sessionKey) return;

        if (event.error) {
          enqueue({ type: 'agent_error', agentId: agent.id, error: event.error });
          return;
        }

        if (event.text) {
          enqueue({ type: 'agent_token', agentId: agent.id, token: event.text });
        }

        if (event.done) {
          enqueue({ type: 'agent_done', agentId: agent.id });
        }
      };

      client.on('chat', onChat);

      // Clean up on client disconnect
      req.signal.addEventListener('abort', () => {
        client.off('chat', onChat);
        close();
      });
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
