import { AGENTS, AGENT_IDS } from './agents';

export interface RouteDecision {
  primaryAgentId: string;       // Always 'richard' for now
  mentionedAgentIds: string[];  // Agents @mentioned in the prompt
}

/**
 * Detect @mentions of agent names in a prompt.
 * Matches: @richard, @monica, @gilfoyle, @dinesh, @erlich, @jared, @bighead
 * Also matches agent first names without @: "ask monica", "tell gilfoyle"
 */
export function detectMentions(text: string): string[] {
  const lower = text.toLowerCase();
  const mentioned: string[] = [];

  for (const agent of AGENTS) {
    // Match @agentId or @agentName or bare first name
    const patterns = [
      `@${agent.id}`,
      `@${agent.name.split(' ')[0].toLowerCase()}`,
      // bare name only if it's a distinctive word (not "richard" as a common word)
    ];
    if (patterns.some(p => lower.includes(p))) {
      if (!mentioned.includes(agent.id)) {
        mentioned.push(agent.id);
      }
    }
  }

  return mentioned;
}

/**
 * Route a user prompt to the appropriate agent(s).
 * Current strategy: always send to Richard (orchestrator) first.
 * Richard's response may trigger additional agent activity.
 */
export function routePrompt(text: string): RouteDecision {
  const mentionedAgentIds = detectMentions(text).filter(id => id !== 'richard');

  return {
    primaryAgentId: 'richard',
    mentionedAgentIds,
  };
}

export { AGENT_IDS };
