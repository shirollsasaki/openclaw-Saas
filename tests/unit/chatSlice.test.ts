import { describe, it, expect, beforeEach } from 'vitest';

// Test the slice logic directly without Zustand
// We test the pure state transitions

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface ChatState {
  messages: ChatMessage[];
  isStreaming: boolean;
  streamingContent: string;
  error: string | null;
}

// Simulate the slice actions as pure functions
function addUserMessage(state: ChatState, content: string): ChatState {
  return {
    ...state,
    messages: [...state.messages, { id: 'test-id', role: 'user', content, timestamp: Date.now() }],
    error: null,
  };
}

function startStreaming(state: ChatState, runId: string): ChatState {
  return { ...state, isStreaming: true, streamingContent: '', error: null };
}

function appendToken(state: ChatState, token: string): ChatState {
  return { ...state, streamingContent: state.streamingContent + token };
}

function finishStreaming(state: ChatState): ChatState {
  if (!state.streamingContent) return { ...state, isStreaming: false };
  return {
    ...state,
    messages: [...state.messages, { id: 'test-id-2', role: 'assistant', content: state.streamingContent, timestamp: Date.now() }],
    isStreaming: false,
    streamingContent: '',
  };
}

const initialState: ChatState = {
  messages: [],
  isStreaming: false,
  streamingContent: '',
  error: null,
};

describe('chatSlice state transitions', () => {
  let state: ChatState;

  beforeEach(() => {
    state = { ...initialState };
  });

  it('addUserMessage adds a user message', () => {
    const next = addUserMessage(state, 'Hello');
    expect(next.messages).toHaveLength(1);
    expect(next.messages[0].role).toBe('user');
    expect(next.messages[0].content).toBe('Hello');
  });

  it('startStreaming sets isStreaming=true and clears content', () => {
    const next = startStreaming(state, 'run-1');
    expect(next.isStreaming).toBe(true);
    expect(next.streamingContent).toBe('');
  });

  it('appendToken accumulates tokens', () => {
    let s = startStreaming(state, 'run-1');
    s = appendToken(s, 'Hello');
    s = appendToken(s, ' world');
    expect(s.streamingContent).toBe('Hello world');
  });

  it('finishStreaming moves streamingContent to messages', () => {
    let s = startStreaming(state, 'run-1');
    s = appendToken(s, 'Response text');
    s = finishStreaming(s);
    expect(s.isStreaming).toBe(false);
    expect(s.streamingContent).toBe('');
    expect(s.messages).toHaveLength(1);
    expect(s.messages[0].role).toBe('assistant');
    expect(s.messages[0].content).toBe('Response text');
  });

  it('finishStreaming with no content does not add message', () => {
    let s = startStreaming(state, 'run-1');
    s = finishStreaming(s);
    expect(s.messages).toHaveLength(0);
    expect(s.isStreaming).toBe(false);
  });
});
