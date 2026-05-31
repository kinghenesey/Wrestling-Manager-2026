// ─────────────────────────────────────────────────────────────────────────────
// src/types/game.ts
// ─────────────────────────────────────────────────────────────────────────────
 
import type { DivisionTier, ManagerReputation } from './division'
 
export interface JobOffer {
  orgId: string
  orgName: string
  salary: number
  tier: DivisionTier
  expiresWeek: number
  reputationRequired: ManagerReputation
}
 
export interface PlayerManager {
  id: string
  name: string
  reputation: ManagerReputation
  reputationPoints: number        // accumulates → unlocks next tier
  currentOrgId: string
  previousOrgIds: string[]
  jobOffers: JobOffer[]
  awardsWon: string[]             // award IDs
  yearsActive: number
  totalShowsBooked: number
    avgShowRating: number
  career_highlights: string[]
}
 
export interface CalendarEvent {
  week: number
  type: 'weekly_show' | 'ppv' | 'draft' | 'awards_ceremony' | 'free_agent_window' | 'contract_deadline'
  orgId: string | null
  name: string
  description: string
}
 
export interface GameState {
  week: number
  year: number
  startYear: number
  player: PlayerManager
  calendarEvents: CalendarEvent[]
  isPaused: boolean
  gameSpeed: 'slow' | 'normal' | 'fast'
  lastSaved: string | null
  version: string
}