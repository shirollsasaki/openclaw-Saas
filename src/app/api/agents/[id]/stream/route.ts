import { NextRequest } from 'next/server';
import { spawn } from 'child_process';
import { AGENT_MAP } from '@/lib/agents';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const OPENCLAW_BIN = process.env.OPENCLAW_BIN || '/opt/homebrew/bin/openclaw';
const TIMEOUT_MS = 60_000;

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

      let stdout = '';
      let stderr = '';

      try {
        const proc = spawn(OPENCLAW_BIN, [
          'agent',
          '--agent', agent.id,
          '--message', message,
          '--json',
        ]);

        const timer = setTimeout(() => {
          proc.kill('SIGTERM');
          enqueue({ type: 'agent_error', agentId: agent.id, error: 'Agent timed out after 60 seconds' });
          close();
        }, TIMEOUT_MS);

        req.signal.addEventListener('abort', () => {
          clearTimeout(timer);
          proc.kill('SIGTERM');
          closed = true;
          controller.close();
        });

        proc.stdout.on('data', (chunk: Buffer) => {
          stdout += chunk.toString();
        });

        proc.stderr.on('data', (chunk: Buffer) => {
          stderr += chunk.toString();
        });

        proc.on('error', (err: Error) => {
          clearTimeout(timer);
          enqueue({ type: 'agent_error', agentId: agent.id, error: `Failed to spawn openclaw: ${err.message}` });
          close();
        });

        proc.on('close', (code: number | null) => {
          clearTimeout(timer);
          if (closed) return;

          if (code !== 0) {
            enqueue({ type: 'agent_error', agentId: agent.id, error: `openclaw exited with code ${code}: ${stderr}` });
            close();
            return;
          }

          try {
            const parsed = JSON.parse(stdout);
            const text: string = parsed?.result?.payloads?.[0]?.text ?? '';

            if (text) {
              const tokens = text.split(/(\s+)/);
              for (const token of tokens) {
                if (token) {
                  enqueue({ type: 'agent_token', agentId: agent.id, token });
                }
              }
            }

            enqueue({ type: 'agent_done', agentId: agent.id });
          } catch {
            enqueue({ type: 'agent_error', agentId: agent.id, error: 'Failed to parse openclaw response' });
          }

          close();
        });
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
