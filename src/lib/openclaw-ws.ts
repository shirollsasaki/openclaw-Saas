import WebSocket from 'ws';
import { EventEmitter } from 'events';
import crypto from 'crypto';

// ─── JSON-RPC Protocol Types ──────────────────────────────────────────────────

interface RpcRequest {
  type: 'req';
  id: string;
  method: string;
  params?: Record<string, unknown>;
}

interface RpcResponse {
  type: 'res';
  id: string;
  ok: boolean;
  payload?: unknown;
  error?: { code: number; message: string };
}

interface GatewayEvent {
  type: 'event';
  event: string;
  payload: {
    runId?: string;
    sessionKey?: string;
    text?: string;
    done?: boolean;
    error?: string;
    state?: 'delta' | 'final';
    message?: { role: string; content: Array<{ type: string; text: string }>; timestamp?: number };
  };
}

// ─── Public Types ─────────────────────────────────────────────────────────────

export type AgentStatus = 'idle' | 'thinking' | 'responding' | 'error' | 'offline';

export interface ChatEvent {
  runId: string;
  sessionKey: string;
  text: string;
  done: boolean;
  error?: string;
}

// ─── Client ───────────────────────────────────────────────────────────────────

class OpenClawClient extends EventEmitter {
  private ws: WebSocket | null = null;
  private connected = false;
  private connecting = false;
  private pendingRequests = new Map<
    string,
    { resolve: (v: unknown) => void; reject: (e: Error) => void }
  >();
  private reconnectTimer: NodeJS.Timeout | null = null;
  private reconnectDelay = 1000;
  private readonly maxReconnectDelay = 30000;
  private agentStatuses = new Map<string, AgentStatus>();
  private msgCounter = 0;
  private lastText = new Map<string, string>();

  private get gatewayUrl(): string {
    return process.env.OPENCLAW_GATEWAY_URL ?? 'ws://127.0.0.1:18789';
  }

  private get gatewayToken(): string {
    return process.env.OPENCLAW_GATEWAY_TOKEN ?? '';
  }

  private nextId(): string {
    return `web-${++this.msgCounter}-${Date.now()}`;
  }

  // ── Connection ──────────────────────────────────────────────────────────────

  async connect(): Promise<void> {
    if (this.connected || this.connecting) return;
    this.connecting = true;

    return new Promise((resolve, reject) => {
      let settled = false;
      const settle = (fn: () => void) => {
        if (settled) return;
        settled = true;
        fn();
      };

      // Derive origin from gateway URL — gateway checks Origin header
      const gwUrl = new URL(this.gatewayUrl.replace(/^ws/, 'http'));
      const origin = gwUrl.origin;

      const ws = new WebSocket(this.gatewayUrl, {
        headers: { 'Origin': origin },
      });
      this.ws = ws;

      ws.on('open', () => {
        this.handshake()
          .then(() => {
            this.connected = true;
            this.connecting = false;
            this.reconnectDelay = 1000;
            this.emit('connected');
            settle(resolve);
          })
          .catch((err: Error) => {
            this.connecting = false;
            ws.close();
            settle(() => reject(err));
          });
      });

      ws.on('message', (data: WebSocket.Data) => {
        try {
          const msg = JSON.parse(data.toString()) as RpcResponse | GatewayEvent;
          this.handleMessage(msg);
        } catch {
          // ignore parse errors
        }
      });

      ws.on('close', () => {
        this.connected = false;
        this.connecting = false;
        this.ws = null;
        this.emit('disconnected');
        this.scheduleReconnect();
      });

      ws.on('error', (err: Error) => {
        this.connecting = false;
        this.emit('error', err);
        settle(() => reject(err));
      });
    });
  }

  private async handshake(): Promise<void> {
    // Step 1: Wait for connect.challenge event (gateway sends nonce)
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('handshake timeout: no challenge')), 8000);
      const onMsg = (data: WebSocket.Data) => {
        try {
          const msg = JSON.parse(data.toString()) as RpcResponse | GatewayEvent;
          if (msg.type === 'event' && msg.event === 'connect.challenge') {
            clearTimeout(timeout);
            this.ws?.off('message', onMsg);
            resolve();
          }
        } catch { /* ignore */ }
      };
      this.ws?.on('message', onMsg);
    });

    // Step 2: Send connect with correct protocol
    const id = this.nextId();
    await this.sendRpc({
      type: 'req',
      id,
      method: 'connect',
      params: {
        minProtocol: 3,
        maxProtocol: 3,
        client: {
          id: 'openclaw-control-ui',
          version: '1.0.0',
          platform: 'web',
          mode: 'ui',
          instanceId: 'openclaw-saas',
        },
        role: 'operator',
        // operator.admin bypasses all scope checks in the gateway
        scopes: ['operator.admin', 'operator.approvals', 'operator.pairing', 'operator.write', 'operator.read', 'operator.talk.secrets'],
        caps: [],
        auth: { token: this.gatewayToken },
        userAgent: 'openclaw-saas/1.0',
      },
    });
  }

  // ── Message Handling ────────────────────────────────────────────────────────

  private handleMessage(msg: RpcResponse | GatewayEvent): void {
    if (msg.type === 'res') {
      const pending = this.pendingRequests.get(msg.id);
      if (pending) {
        this.pendingRequests.delete(msg.id);
        if (msg.ok) {
          pending.resolve(msg.payload);
        } else {
          pending.reject(new Error(msg.error?.message ?? 'RPC error'));
        }
      }
    } else if (msg.type === 'event' && msg.event === 'chat') {
      const p = msg.payload;
      const sessionKey = p.sessionKey ?? '';
      const fullText = p.message?.content?.[0]?.text ?? p.text ?? '';
      const isDone = p.state === 'final' || p.done === true;
      const prev = this.lastText.get(sessionKey) ?? '';
      const delta = fullText.length > prev.length ? fullText.slice(prev.length) : '';
      if (fullText) this.lastText.set(sessionKey, fullText);
      if (isDone) this.lastText.delete(sessionKey);
      if (isDone) this.agentStatuses.set(sessionKey, 'idle');
      else if (p.error) this.agentStatuses.set(sessionKey, 'error');
      else if (delta) this.agentStatuses.set(sessionKey, 'responding');
      const chatEvent: ChatEvent = { runId: p.runId ?? '', sessionKey, text: delta, done: isDone, error: p.error };
      this.emit(`chat:${sessionKey}`, chatEvent);
      this.emit('chat', chatEvent);
    }
  }

  // ── RPC ─────────────────────────────────────────────────────────────────────

  private sendRpc(req: RpcRequest): Promise<unknown> {
    return new Promise((resolve, reject) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        reject(new Error('WebSocket not connected'));
        return;
      }
      this.pendingRequests.set(req.id, { resolve, reject });
      this.ws.send(JSON.stringify(req));

      // 10-second timeout per request
      setTimeout(() => {
        if (this.pendingRequests.has(req.id)) {
          this.pendingRequests.delete(req.id);
          reject(new Error(`RPC timeout: ${req.method}`));
        }
      }, 10_000);
    });
  }

  // ── Public API ──────────────────────────────────────────────────────────────

  async sendMessage(
    sessionKey: string,
    text: string,
  ): Promise<{ runId: string }> {
    if (!this.connected) await this.connect();
    this.agentStatuses.set(sessionKey, 'thinking');
    const id = this.nextId();
    const result = await this.sendRpc({
      type: 'req',
      id,
      method: 'chat.send',
      params: { sessionKey, message: text, idempotencyKey: crypto.randomUUID() },
    });
    return result as { runId: string };
  }

  getAgentStatus(sessionKey: string): AgentStatus {
    if (!this.connected) return 'offline';
    return this.agentStatuses.get(sessionKey) ?? 'idle';
  }

  isConnected(): boolean {
    return this.connected;
  }

  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.ws?.close();
    this.ws = null;
    this.connected = false;
  }

  // ── Reconnect ───────────────────────────────────────────────────────────────

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect().catch(() => {
        // Next attempt will be triggered by the 'close' event
      });
    }, this.reconnectDelay);
    this.reconnectDelay = Math.min(
      this.reconnectDelay * 2,
      this.maxReconnectDelay,
    );
  }
}

// ─── Singleton ────────────────────────────────────────────────────────────────
// One WS connection shared across all Next.js route handlers (server process).

let _client: OpenClawClient | null = null;

export function getOpenClawClient(): OpenClawClient {
  if (!_client) {
    _client = new OpenClawClient();
  }
  return _client;
}

export default getOpenClawClient;
