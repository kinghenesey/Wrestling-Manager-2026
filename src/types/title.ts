// ─────────────────────────────────────────────────────────────────────────────
// src/types/title.ts
// ─────────────────────────────────────────────────────────────────────────────

import type { Gender, WeightClass } from './wrestler'

export type TitleTier =
  | 'world'          // Top title of an org — highest bonus
  | 'secondary'      // Mid-card prestige title
  | 'tag'            // Tag team titles (held by a pair)
  | 'divisional'     // Weight class or specialty (cruiserweight, etc.)
  | 'underground'    // No weekly bonus — bragging rights only

export interface TitleReign {
  wrestlerId: string
  startWeek: number
  endWeek: number | null
  defenses: number
  lostTo: string | null          // wrestler ID who ended the reign
}

export interface Title {
  id: string
  orgId: string
  brandId: string | null         // null = org-wide title
  name: string                   // e.g. "AWF World Heavyweight Championship"
  shortName: string              // e.g. "AWF World Title"
  tier: TitleTier
  gender: Gender | 'mixed'       // mixed = intergender (special events only)
  weightClass: WeightClass | null // null = open weight

  weeklyBonus: number            // added to champion's weekly pay
  prestigeValue: number          // 0–100 how prestigious this belt is

  currentChampionId: string | null
  currentChampionIds: string[]   // for tag titles (2 wrestlers)
  reignStartWeek: number | null
  defenses: number

  history: TitleReign[]
  isVacant: boolean
  canBeUnified: boolean          // can be merged with another title
  isUndergroundTitle: boolean    // no owner, no weekly bonus
}

// ─────────────────────────────────────────────────────────────────────────────
// TITLE WEEKLY BONUSES BY TIER & ORG TIER
// Reference these when creating title data
// ─────────────────────────────────────────────────────────────────────────────
export const TITLE_BONUS_SCALE: Record<string, Record<string, number>> = {
  // orgTier → titleTier → weekly bonus ($)
  elite:      { world: 25000, secondary: 8000,  tag: 5000,  divisional: 4000, underground: 0 },
  major:      { world: 10000, secondary: 3500,  tag: 2000,  divisional: 1500, underground: 0 },
  regional:   { world: 4000,  secondary: 1500,  tag: 800,   divisional: 600,  underground: 0 },
  indie:      { world: 1500,  secondary: 500,   tag: 300,   divisional: 200,  underground: 0 },
  local:      { world: 500,   secondary: 150,   tag: 100,   divisional: 75,   underground: 0 },
  underground:{ world: 0,     secondary: 0,     tag: 0,     divisional: 0,    underground: 0 },
}