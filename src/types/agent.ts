// ─────────────────────────────────────────────────────────────────────────────
// src/types/agent.ts
// ─────────────────────────────────────────────────────────────────────────────
 
export type AgentRole =
  | 'mouthpiece'     // Pure promo agent — boosts client's promo stat on-show
  | 'trainer'        // Accelerates in-ring stat development
  | 'fixer'          // Handles suspensions, contract disputes, media crises
  | 'hype_man'       // Boosts crowd reaction at live events
  | 'scout'          // Discovers hidden underground/indie talent
  | 'strategist'     // Improves match psychology and booking influence
 
export interface AgentSpecialAbility {
  name: string              // e.g. "Heyman Push"
  description: string       // e.g. "+30 promo to client for 4 weeks after promo segment"
  statBoost: Record<string, number>  // stat name → boost value
  durationWeeks: number
  cooldownWeeks: number
}
 
export interface Agent {
  id: string
  name: string
  role: AgentRole
  reputation: number        // 0–100
  loyalty: number           // 0–100 (low = may leave for rival org)
  salary: number            // weekly cost
  clientIds: string[]       // wrestler IDs they manage (max 3)
  maxClients: number
  specialAbility: AgentSpecialAbility
  portraitId: string | null
  currentOrgId: string | null
  bio: string
  isAvailable: boolean
}