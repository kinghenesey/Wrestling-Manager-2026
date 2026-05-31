// ─────────────────────────────────────────────────────────────────────────────
// src/engine/injuryEngine.ts
// Realistic injury simulation — legitimate injuries, kayfabe injuries,
// return pops, and wellness/suspension system
// ─────────────────────────────────────────────────────────────────────────────

import type { Wrestler, Injury } from '../types/wrestler'

// ── Injury Type Definitions ───────────────────────────────────────────────────

export interface InjuryDefinition {
  name: string
  severity: Injury['severity']
  minWeeks: number
  maxWeeks: number
  affectedStats: (keyof import('../types/wrestler').WrestlerStats)[]
  statPenalty: number       // applied to affectedStats during recovery
  reinjuryRisk: number      // 0–100 chance of reinjury if rushed back
  description: string
}

export const INJURY_TYPES: InjuryDefinition[] = [
  // ── Minor ──
  { name: 'Bruised Ribs',         severity: 'minor', minWeeks: 1,  maxWeeks: 2,  affectedStats: ['stamina','toughness'],            statPenalty: 10, reinjuryRisk: 20, description: 'Painful but manageable. Can work through it.' },
  { name: 'Sprained Ankle',       severity: 'minor', minWeeks: 1,  maxWeeks: 3,  affectedStats: ['athleticism'],                     statPenalty: 12, reinjuryRisk: 25, description: 'Common ring injury. Short layoff required.' },
  { name: 'Concussion (Mild)',     severity: 'minor', minWeeks: 2,  maxWeeks: 3,  affectedStats: ['psychology','inRing'],             statPenalty: 15, reinjuryRisk: 30, description: 'Wellness protocols require rest. No contact.' },
  { name: 'Kayfabe Attack',        severity: 'minor', minWeeks: 1,  maxWeeks: 2,  affectedStats: [],                                  statPenalty: 0,  reinjuryRisk: 0,  description: 'Storyline injury. Wrestler is fine but off TV for heat.' },
  { name: 'Strained Hamstring',    severity: 'minor', minWeeks: 2,  maxWeeks: 4,  affectedStats: ['athleticism','stamina'],           statPenalty: 14, reinjuryRisk: 28, description: 'Limits explosiveness. Rest recommended.' },

  // ── Moderate ──
  { name: 'Torn Meniscus',         severity: 'moderate', minWeeks: 6,  maxWeeks: 10, affectedStats: ['athleticism','stamina'],        statPenalty: 20, reinjuryRisk: 35, description: 'Surgery required. 6–10 week layoff.' },
  { name: 'Dislocated Shoulder',   severity: 'moderate', minWeeks: 6,  maxWeeks: 8,  affectedStats: ['inRing','athleticism'],         statPenalty: 22, reinjuryRisk: 40, description: 'Recurring issue for many wrestlers. Needs rehab.' },
  { name: 'Broken Nose',           severity: 'moderate', minWeeks: 3,  maxWeeks: 5,  affectedStats: ['look'],                         statPenalty: 15, reinjuryRisk: 15, description: 'Impacts appearance temporarily. Protective mask available.' },
  { name: 'Concussion (Moderate)', severity: 'moderate', minWeeks: 4,  maxWeeks: 8,  affectedStats: ['psychology','inRing','promo'], statPenalty: 18, reinjuryRisk: 45, description: 'Serious neurological concern. Full protocol.' },
  { name: 'Torn Pectoral',         severity: 'moderate', minWeeks: 10, maxWeeks: 16, affectedStats: ['athleticism','toughness'],      statPenalty: 25, reinjuryRisk: 20, description: 'Surgical repair needed. Significant layoff.' },

  // ── Severe ──
  { name: 'Torn ACL',              severity: 'severe', minWeeks: 26, maxWeeks: 42, affectedStats: ['athleticism','stamina','inRing'], statPenalty: 35, reinjuryRisk: 50, description: 'Career-threatening. Full reconstruction surgery. Long road back.' },
  { name: 'Torn Tricep',           severity: 'severe', minWeeks: 20, maxWeeks: 30, affectedStats: ['inRing','athleticism'],           statPenalty: 30, reinjuryRisk: 40, description: 'Major surgery required. 5–7 month recovery.' },
  { name: 'Herniated Disc',        severity: 'severe', minWeeks: 16, maxWeeks: 26, affectedStats: ['athleticism','stamina','psychology'], statPenalty: 28, reinjuryRisk: 55, description: 'Spinal injury. May require surgery. Career concern.' },
  { name: 'Broken Neck (Minor)',    severity: 'severe', minWeeks: 30, maxWeeks: 52, affectedStats: ['inRing','athleticism','stamina'], statPenalty: 40, reinjuryRisk: 60, description: 'Career-defining injury. Full recovery possible but long journey.' },
  { name: 'Legitimate Knee Tear',  severity: 'severe', minWeeks: 22, maxWeeks: 34, affectedStats: ['athleticism','stamina'],          statPenalty: 32, reinjuryRisk: 48, description: 'Multiple structures compromised. Complex surgery.' },
]

// ── Injury Probability Calculator ────────────────────────────────────────────

export function calculateInjuryProbability(wrestler: Wrestler): number {
  const BASE_WEEKLY_CHANCE = 3  // 3% base per match

  let chance = BASE_WEEKLY_CHANCE

  // Toughness reduces injury risk
  chance -= (wrestler.stats.toughness - 50) / 50 * 2  // -2% to +2%

  // Age factor — 35+ increases risk
  if (wrestler.age >= 38) chance += 3
  else if (wrestler.age >= 35) chance += 1.5

  // Already injured? Can't get injured again (kayfabe exception below)
  if (wrestler.injury && !wrestler.injury.isKayfabe) return 0

  // High stamina reduces cumulative fatigue injuries
  chance -= (wrestler.stats.stamina - 50) / 100 * 1.5

  // Championship / main event wrestlers work more — higher exposure
  if (wrestler.pushLevel === 'champion' || wrestler.pushLevel === 'mainevent') {
    chance += 1
  }

  return Math.max(0.5, Math.min(15, chance))
}

// ── Generate Random Injury ────────────────────────────────────────────────────

export function rollInjury(wrestler: Wrestler, isFromMatch: boolean): Injury | null {
  const probability = calculateInjuryProbability(wrestler)
  const roll = Math.random() * 100

  if (roll > probability) return null

  // Weight toward minor injuries
  const severityWeights = [60, 28, 12]   // minor, moderate, severe
  const severityRoll = Math.random() * 100
  let severity: Injury['severity']

  if (severityRoll < severityWeights[0]) severity = 'minor'
  else if (severityRoll < severityWeights[0] + severityWeights[1]) severity = 'moderate'
  else severity = 'severe'

  // Filter by severity, pick random
  const candidates = INJURY_TYPES.filter(
    i => i.severity === severity && !i.name.startsWith('Kayfabe')
  )
  const def = candidates[Math.floor(Math.random() * candidates.length)]

  const weeks = Math.floor(
    Math.random() * (def.maxWeeks - def.minWeeks + 1) + def.minWeeks
  )

  return {
    type: def.name,
    isKayfabe: false,
    weeksOut: weeks,
    weeksRemaining: weeks,
    severity,
  }
}

// ── Create Kayfabe Injury ─────────────────────────────────────────────────────
// Booker manually creates a fake injury for storyline purposes

export function createKayfabeInjury(weeksOut: number): Injury {
  return {
    type: 'Kayfabe Injury',
    isKayfabe: true,
    weeksOut,
    weeksRemaining: weeksOut,
    severity: 'minor',
  }
}

// ── Weekly Injury Recovery ────────────────────────────────────────────────────

export interface RecoveryResult {
  stillInjured: boolean
  newWeeksRemaining: number
  isReturning: boolean
  returnPopBonus: number    // momentum bonus on return
}

export function processWeeklyRecovery(
  wrestler: Wrestler,
  isRushedBack: boolean     // booker forcing early return
): RecoveryResult {
  if (!wrestler.injury) {
    return { stillInjured: false, newWeeksRemaining: 0, isReturning: false, returnPopBonus: 0 }
  }

  const current = wrestler.injury
  let weeksRemaining = current.weeksRemaining - 1

  // Rushed return — risk of reinjury
  if (isRushedBack && !current.isKayfabe) {
    const def = INJURY_TYPES.find(i => i.name === current.type)
    const reinjuryRoll = Math.random() * 100
    if (def && reinjuryRoll < def.reinjuryRisk) {
      // Reinjured — add extra weeks
      weeksRemaining += Math.floor(Math.random() * 4) + 2
    }
  }

  if (weeksRemaining <= 0) {
    // Calculate return pop — longer absences = bigger pop
    const weeksOut = current.weeksOut
    const returnPop = Math.min(30, Math.floor(weeksOut / 2) + (current.severity === 'severe' ? 15 : 5))

    return {
      stillInjured: false,
      newWeeksRemaining: 0,
      isReturning: true,
      returnPopBonus: returnPop,
    }
  }

  return {
    stillInjured: true,
    newWeeksRemaining: weeksRemaining,
    isReturning: false,
    returnPopBonus: 0,
  }
}

// ── Suspension System ─────────────────────────────────────────────────────────

export type SuspensionReason =
  | 'wellness_violation'
  | 'conduct_unbecoming'
  | 'missing_show'
  | 'public_incident'
  | 'contract_dispute'

export interface Suspension {
  wrestlerId: string
  reason: SuspensionReason
  weeksRemaining: number
  isPublic: boolean     // public = affects org reputation
  orgPrestigePenalty: number
  moralePenaltyOnReturn: number
}

export const SUSPENSION_LENGTHS: Record<SuspensionReason, { min: number; max: number; public: boolean }> = {
  wellness_violation:   { min: 4,  max: 8,  public: true  },
  conduct_unbecoming:   { min: 2,  max: 6,  public: false },
  missing_show:         { min: 1,  max: 2,  public: false },
  public_incident:      { min: 4,  max: 12, public: true  },
  contract_dispute:     { min: 2,  max: 8,  public: false },
}

export function createSuspension(
  wrestlerId: string,
  reason: SuspensionReason
): Suspension {
  const config = SUSPENSION_LENGTHS[reason]
  const weeks = Math.floor(Math.random() * (config.max - config.min + 1)) + config.min

  return {
    wrestlerId,
    reason,
    weeksRemaining: weeks,
    isPublic: config.public,
    orgPrestigePenalty: config.public ? Math.floor(Math.random() * 5) + 2 : 0,
    moralePenaltyOnReturn: Math.floor(Math.random() * 10) + 5,
  }
}

// ── Stat Impact During Injury ─────────────────────────────────────────────────

export function getInjuryStatPenalties(
  injury: Injury
): Partial<Record<keyof import('../types/wrestler').WrestlerStats, number>> {
  const def = INJURY_TYPES.find(i => i.name === injury.type)
  if (!def || def.statPenalty === 0) return {}

  const penalties: Partial<Record<string, number>> = {}
  for (const stat of def.affectedStats) {
    penalties[stat] = def.statPenalty
  }
  return penalties
}