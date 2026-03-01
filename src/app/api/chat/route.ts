import { NextRequest } from 'next/server';
import { getOpenClawClient, ChatEvent } from '@/lib/openclaw-ws';
import { routePrompt } from '@/lib/agent-router';
import { AGENT_MAP } from '@/lib/agents';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function sseEvent(data: object): string {
  return `data: ${JSON.stringify(data)}\n\n`;
}

export async function POST(req: NextRequest) {
  let body: { message?: string };
  try {
    body = await req.json();
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  const message = body.message?.trim();
  if (!message) {
    return new Response('Missing message', { status: 400 });
  }

  const { primaryAgentId } = routePrompt(message);
  const primaryAgent = AGENT_MAP[primaryAgentId];
  const sessionKey = `agent:${primaryAgent.sessionKey}:main`;

  const client = getOpenClawClient();

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      let done = false;
      let timeout: NodeJS.Timeout;
      // eslint-disable-next-line prefer-const
      let onChat: (event: ChatEvent) => void;

      const enqueue = (data: object) => {
        if (!done) {
          controller.enqueue(encoder.encode(sseEvent(data)));
        }
      };

      const cleanup = () => {
        clearTimeout(timeout);
        client.off('chat', onChat);
      };

      const finish = () => {
        if (!done) {
          done = true;
          cleanup();
          enqueue({ type: 'done' });
          controller.close();
        }
      };

      onChat = (event: ChatEvent) => {
        if (event.sessionKey !== sessionKey) return;

        if (event.error) {
          enqueue({ type: 'error', message: event.error });
          finish();
          return;
        }

        if (event.text) {
          enqueue({ type: 'chat_token', token: event.text });
          enqueue({ type: 'agent_token', agentId: primaryAgent.id, token: event.text });
        }

        if (event.done) {
          enqueue({ type: 'agent_done', agentId: primaryAgent.id });
          finish();
        }
      };

      try {
        enqueue({
          type: 'agent_started',
          agentId: primaryAgent.id,
          agentName: primaryAgent.name,
        });

        try {
          await client.connect();
        } catch (connectErr) {
          console.error('[ws-connect]', connectErr);
          enqueue({ type: 'error', message: 'Unable to reach agent gateway' });
          finish();
          return;
        }

        client.on('chat', onChat);
        timeout = setTimeout(finish, 5 * 60 * 1000);

        req.signal.addEventListener('abort', () => {
          done = true;
          cleanup();
          controller.close();
        });

        try {
          await client.sendMessage(sessionKey, message);
        } catch (sendErr) {
          console.error('[ws-send]', sendErr);
          enqueue({
            type: 'error',
            message: 'Failed to send message to agent',
          });
          finish();
        }
      } catch (err) {
        enqueue({
          type: 'error',
          message: err instanceof Error ? err.message : 'Unknown error',
        });
        finish();
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