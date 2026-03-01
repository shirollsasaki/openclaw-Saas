export interface AgentConfig {
  id: string;
  name: string;
  sessionKey: string;
  role: string;
  color: string;        // Tailwind color class base (e.g. "blue")
  initials: string;
}

export const AGENTS: AgentConfig[] = [
  { id: 'richard',  name: 'Richard Hendricks', sessionKey: 'richard',  role: 'CEO / Orchestrator',    color: 'blue',   initials: 'RH' },
  { id: 'monica',   name: 'Monica Hall',        sessionKey: 'monica',   role: 'Content & Brand',       color: 'purple', initials: 'MH' },
  { id: 'gilfoyle', name: 'Gilfoyle',           sessionKey: 'gilfoyle', role: 'Builder / Engineering', color: 'red',    initials: 'GF' },
  { id: 'dinesh',   name: 'Dinesh Chugtai',     sessionKey: 'dinesh',   role: 'Research & Intel',      color: 'orange', initials: 'DC' },
  { id: 'erlich',   name: 'Erlich Bachman',     sessionKey: 'erlich',   role: 'Sales & Revenue',       color: 'green',  initials: 'EB' },
  { id: 'jared',    name: 'Jared Dunn',         sessionKey: 'jared',    role: 'Growth & Community',    color: 'teal',   initials: 'JD' },
  { id: 'bighead',  name: 'Big Head',           sessionKey: 'bighead',  role: 'Trading & Data',        color: 'yellow', initials: 'BH' },
];

export const AGENT_MAP = Object.fromEntries(
  AGENTS.map(a => [a.id, a])
) as Record<string, AgentConfig>;

export const AGENT_IDS = AGENTS.map(a => a.id);
