import { NextRequest } from 'next/server';
import { spawn } from 'child_process';
import { routePrompt } from '@/lib/agent-router';
import { AGENT_MAP } from '@/lib/agents';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const OPENCLAW_BIN = process.env.OPENCLAW_BIN || '/opt/homebrew/bin/openclaw';
const TIMEOUT_MS = 60_000;

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

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      let done = false;

      const enqueue = (data: object) => {
        if (!done) {
          controller.enqueue(encoder.encode(sseEvent(data)));
        }
      };

      const finish = () => {
        if (!done) {
          done = true;
          enqueue({ type: 'done' });
          controller.close();
        }
      };

      // Signal agent started
      enqueue({
        type: 'agent_started',
        agentId: primaryAgent.id,
        agentName: primaryAgent.name,
      });

      let stdout = '';
      let stderr = '';

      try {
        const proc = spawn(OPENCLAW_BIN, [
          'agent',
          '--agent', primaryAgent.id,
          '--message', message,
          '--json',
        ]);

        const timer = setTimeout(() => {
          proc.kill('SIGTERM');
          enqueue({ type: 'error', message: 'Agent timed out after 60 seconds' });
          finish();
        }, TIMEOUT_MS);

        req.signal.addEventListener('abort', () => {
          clearTimeout(timer);
          proc.kill('SIGTERM');
          done = true;
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
          enqueue({
            type: 'error',
            message: `Failed to spawn openclaw: ${err.message}`,
          });
          finish();
        });

        proc.on('close', (code: number | null) => {
          clearTimeout(timer);
          if (done) return;

          if (code !== 0) {
            enqueue({
              type: 'error',
              message: `openclaw exited with code ${code}: ${stderr}`,
            });
            finish();
            return;
          }

          try {
            const parsed = JSON.parse(stdout);
            const text: string = parsed?.result?.payloads?.[0]?.text ?? '';

            if (text) {
              // Emit tokens word by word
              const tokens = text.split(/(\s+)/);
              for (const token of tokens) {
                if (token) {
                  enqueue({ type: 'chat_token', token });
                }
              }
            }

            enqueue({ type: 'agent_done', agentId: primaryAgent.id });
          } catch {
            enqueue({ type: 'error', message: 'Failed to parse openclaw response' });
          }

          finish();
        });
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
