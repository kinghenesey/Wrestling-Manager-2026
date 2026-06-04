// ─────────────────────────────────────────────────────────────────────────────
// src/types/weekSim.ts
// Result types for the week simulation engine
// ─────────────────────────────────────────────────────────────────────────────

export type SimEventType =
  | 'contract_expired'
  | 'contract_warning'
  | 'injury_new'
  | 'injury_recovered'
  | 'morale_drop'
  | 'morale_rise'
  | 'momentum_decay'
  | 'reputation_gained'
  | 'reputation_level_up'
  | 'job_offer_received'
  | 'storyline_heat_decay'
  | 'wrestler_released'

export type SimEventSeverity = 'info' | 'warning' | 'critical' | 'positive'

export interface SimEvent {
  type: SimEventType
  severity: SimEventSeverity
  message: string
  wrestlerId?: string
  wrestlerName?: string
  data?: Record<string, unknown>
}

export interface WeekSimResult {
  week: number
  year: number
  events: SimEvent[]
  contractsExpired: string[]      // wrestler IDs
  newInjuries: string[]           // wrestler IDs
  recoveries: string[]            // wrestler IDs
  reputationLevelUp: boolean
  newJobOffer: import('./game').JobOffer | null
}