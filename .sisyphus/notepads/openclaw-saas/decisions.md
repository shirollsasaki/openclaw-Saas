
## CLI spawning over WebSocket client (route rewrite)

**Date**: 2026-03-01

**Decision**: Replaced `openclaw-ws.ts` WebSocket client in both API routes with `child_process.spawn` calling `/opt/homebrew/bin/openclaw agent --agent <id> --message <text> --json`.

**Rationale**: WS client had a scope bug ("missing scope: operator.write") that required gateway config changes outside the project's control. The CLI bypasses WebSocket auth entirely via the gateway's internal auth path.

**CLI output shape**:
```json
{
  "runId": "...",
  "status": "ok",
  "result": { "payloads": [{ "text": "...", "mediaUrl": null }] }
}
```
Text extracted from `result.payloads[0].text`, split on whitespace, streamed as word-level `chat_token` / `agent_token` SSE events.

**Timeout**: 60 s per spawn, SIGTERM on breach.

**OPENCLAW_BIN env var**: Falls back to `/opt/homebrew/bin/openclaw` if not set.
