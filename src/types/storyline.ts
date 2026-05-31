// ─────────────────────────────────────────────────────────────────────────────
// src/types/storyline.ts
// ─────────────────────────────────────────────────────────────────────────────

export type StorylineType =
  | 'title_chase'         // chasing a championship
  | 'revenge'             // personal grudge / attack
  | 'betrayal'            // stablemate turns
  | 'underdog_rise'       // lower-card talent rising (Obafemi arc)
  | 'dominant_run'        // dominating champion era (Roman Reigns arc)
  | 'redemption'          // fallen star returning
  | 'faction_war'         // stable vs stable
  | 'authority_conflict'  // talent vs management
  | 'love_triangle'       // rarely used, soap opera element
  | 'tournament'          // competitive bracket
  | 'underground_feud'    // lawless no-rules beef

export type StorylineStatus = 'active' | 'paused' | 'concluded' | 'planned'
export type HeatLevel = 'cold' | 'lukewarm' | 'warm' | 'hot' | 'nuclear'

export interface StorylineSegment {
  id: string
  week: number
  description: string               // what happens on the show
  wrestlerIds: string[]
  segmentType: 'promo' | 'match' | 'attack' | 'reveal' | 'contract_signing' | 'award'
  heatChange: number                // +/- impact on feud heat
  crowdReaction: number             // 0–100
}

export interface Storyline {
  id: string
  name: string
  type: StorylineType
  status: StorylineStatus

  protagonistIds: string[]          // face side / main characters
  antagonistIds: string[]           // heel side
  supportingIds: string[]           // valets, agents, tag partners

  startWeek: number
  plannedEndWeek: number | null
  actualEndWeek: number | null

  heat: number                      // 0–100 current intensity
  heatLevel: HeatLevel              // human-readable version of heat
  peakHeat: number                  // historical max for this feud

  titleAtStakeId: string | null
  segments: StorylineSegment[]

  orgId: string
  brandId: string | null

  crowdChants: string[]             // organic chants that emerged
  mediaAttention: number            // 0–100 press/internet buzz
  fanVotes: number                  // 0–100 fan investment

  // Obafemi / Roman-style journey tracking
  isBreakoutStory: boolean          // flagged as career-defining arc
  pushLevelBefore: Record<string, string>   // wrestlerId → push level before arc
  pushLevelAfter: Record<string, string>    // wrestlerId → push level after arc
}

export interface PushDecision {
  wrestlerId: string
  oldPushLevel: string
  newPushLevel: string
  week: number
  reason: string
  orgId: string
  triggeredByStorylineId: string | null
}