import { describe, it, expect } from 'vitest';
import { detectMentions, routePrompt } from '@/lib/agent-router';

describe('detectMentions', () => {
  it('detects @agentId mentions', () => {
    expect(detectMentions('hey @monica can you write a post')).toContain('monica');
  });

  it('detects @firstName mentions', () => {
    expect(detectMentions('ask @Richard about strategy')).toContain('richard');
  });

  it('returns empty array for no mentions', () => {
    expect(detectMentions('what is the weather today')).toEqual([]);
  });

  it('detects multiple mentions', () => {
    const result = detectMentions('@monica and @gilfoyle please collaborate');
    expect(result).toContain('monica');
    expect(result).toContain('gilfoyle');
  });

  it('does not duplicate mentions', () => {
    const result = detectMentions('@monica @monica write something');
    expect(result.filter(id => id === 'monica')).toHaveLength(1);
  });
});

describe('routePrompt', () => {
  it('always routes primary to richard', () => {
    const result = routePrompt('write me a blog post');
    expect(result.primaryAgentId).toBe('richard');
  });

  it('excludes richard from mentionedAgentIds', () => {
    const result = routePrompt('@richard what should we do');
    expect(result.mentionedAgentIds).not.toContain('richard');
  });

  it('includes non-richard mentions in mentionedAgentIds', () => {
    const result = routePrompt('ask @monica to write a post');
    expect(result.mentionedAgentIds).toContain('monica');
  });
});
