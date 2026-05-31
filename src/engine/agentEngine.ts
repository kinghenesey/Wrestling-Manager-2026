// ─────────────────────────────────────────────────────────────────────────────
// src/engine/agentEngine.ts
// Agent ability activation, client stat boosts, loyalty drift
// ─────────────────────────────────────────────────────────────────────────────
 
import type { Agent } from '../types/agent'
import type { Wrestler } from '../types/wrestler'
 
export interface AgentBoostResult {
  statBoosts: Record<string, number>
  moraleBoost: number
  momentumBoost: number
  description: string
}
 
export function activateAgentAbility(
  agent: Agent,
  clientId: string,
  wrestlers: Wrestler[]
): AgentBoostResult {
  const client = wrestlers.find(w => w.id === clientId)
  if (!client) return { statBoosts: {}, moraleBoost: 0, momentumBoost: 0, description: 'Client not found.' }
 
  const ability = agent.specialAbility
 
  // Scale boost by agent reputation
  const repMultiplier = 0.5 + (agent.reputation / 100) * 1.0   // 0.5–1.5x
 
  const scaledBoosts: Record<string, number> = {}
  for (const [stat, val] of Object.entries(ability.statBoost)) {
    scaledBoosts[stat] = Math.round(val * repMultiplier)
  }
 
  const moraleBoost    = Math.round(5 * repMultiplier)
  const momentumBoost  = agent.role === 'hype_man' ? Math.round(10 * repMultiplier) : 0
 
  return {
    statBoosts:    scaledBoosts,
    moraleBoost,
    momentumBoost,
    description:   `${agent.name} activated "${ability.name}" for ${client.name}. Duration: ${ability.durationWeeks} weeks.`,
  }
}
 
export function calculateAgentLoyaltyDrift(agent: Agent, weeksPaid: boolean): number {
  let delta = 0
  if (!weeksPaid) delta -= 8
  if (agent.clientIds.length >= agent.maxClients) delta -= 2
  if (agent.clientIds.length === 0) delta -= 3   // idle agents get restless
  delta += Math.round((Math.random() * 4) - 2)
  return Math.max(0, Math.min(100, agent.loyalty + delta)) - agent.loyalty
}
 
export function getAgentMatchBonus(agent: Agent): number {
  if (agent.role === 'trainer') return Math.round(agent.reputation / 20)
  if (agent.role === 'hype_man') return Math.round(agent.reputation / 25)
  return 0
}