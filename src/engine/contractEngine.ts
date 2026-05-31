// ─────────────────────────────────────────────────────────────────────────────
// src/engine/contractEngine.ts
// Contract negotiations, salary demands, bidding wars, poaching, renewals
// ─────────────────────────────────────────────────────────────────────────────

import type { Wrestler, Contract } from '../types/wrestler'
import type { Organization } from '../types/division'

// ── Salary Demand Calculator ─────────────────────────────────────────────────
// What a wrestler thinks they deserve based on their market value

export function calculateSalaryDemand(
  wrestler: Wrestler,
  orgTier: string
): { weekly: number; signingBonus: number } {
  const tierBase: Record<string, number> = {
    elite:      20000,
    major:      6000,
    regional:   2000,
    indie:      600,
    local:      200,
    underground: 0,
  }

  const base = tierBase[orgTier] ?? 200

  // Push level multiplier
  const pushMult: Record<string, number> = {
    champion:    2.5,
    mainevent:   2.0,
    uppercard:   1.5,
    midcard:     1.1,
    enhancement: 0.8,
    jobber:      0.6,
  }

  const overness  = wrestler.overness / 100
  const momentum  = wrestler.momentum / 100
  const push      = pushMult[wrestler.pushLevel] ?? 1.0

  let weekly = base * push * (1 + overness * 0.5 + momentum * 0.3)

  // Star power premium — wrestlers with 85+ popularity demand more
  if (wrestler.popularity >= 85) weekly *= 1.3
  if (wrestler.popularity >= 95) weekly *= 1.2  // stacks

  // Veteran premium — 400+ weeks experience
  if (wrestler.experience >= 400) weekly *= 1.15

  // Potential premium — highly rated prospects demand above their current level
  if (wrestler.potential >= 90 && wrestler.experience < 200) weekly *= 1.2

  const signingBonus = Math.round(weekly * 4)

  return {
    weekly: Math.round(weekly),
    signingBonus,
  }
}

// ── Contract Offer Builder ────────────────────────────────────────────────────

export function buildContractOffer(
  org: Organization,
  wrestler: Wrestler,
  weeksLength: number,
  includeNoTrade: boolean = false
): Contract {
  const demand = calculateSalaryDemand(wrestler, org.tier)

  // Org's counteroffer is 80–95% of demand depending on their wealth
  const affordability = Math.min(1, org.wealth / (demand.weekly * 52))
  const offerPercent  = 0.75 + affordability * 0.2   // 75–95%

  const salary   = Math.round(demand.weekly * offerPercent)
  const bonuses  = Math.round(salary * 0.15)   // 15% of salary as appearance/title bonuses

  return {
    salary,
    bonuses,
    weeksRemaining: weeksLength,
    exclusivity: org.tier === 'elite' || org.tier === 'major' ? 'exclusive' : 'open',
    happiness: 75,
    noTradeClause: includeNoTrade,
    signingOrgId: org.id,
  }
}

// ── Negotiation Outcome ───────────────────────────────────────────────────────

export type NegotiationOutcome =
  | 'accepted'
  | 'countered'
  | 'rejected'
  | 'walked_away'    // wrestler signs elsewhere during negotiation

export interface NegotiationResult {
  outcome: NegotiationOutcome
  finalContract: Contract | null
  wrestlerMoodAfter: number        // 0–100
  counterOffer?: Partial<Contract>
  reason: string
}

export function simulateNegotiation(
  wrestler: Wrestler,
  offer: Contract,
  demand: { weekly: number; signingBonus: number },
  hasCompetingOffer: boolean
): NegotiationResult {

  const offerRatio = offer.salary / demand.weekly   // 1.0 = exactly what they want

  // If there's a competing offer, wrestler is emboldened
  const minAcceptRatio = hasCompetingOffer ? 0.92 : 0.82

  // Happy wrestlers are easier to sign
  const moodBonus = (wrestler.morale - 50) / 200   // ±0.25

  const effectiveMin = minAcceptRatio - moodBonus

  if (offerRatio >= 1.05) {
    // Offer exceeds demand — instant yes
    return {
      outcome: 'accepted',
      finalContract: offer,
      wrestlerMoodAfter: Math.min(100, wrestler.morale + 15),
      reason: `${wrestler.name} is thrilled with the offer. Signed immediately.`,
    }
  }

  if (offerRatio >= effectiveMin) {
    // Acceptable range — signed
    const mood = Math.round(70 + (offerRatio - effectiveMin) / (1 - effectiveMin) * 25)
    return {
      outcome: 'accepted',
      finalContract: { ...offer, happiness: mood },
      wrestlerMoodAfter: mood,
      reason: `${wrestler.name} accepts the offer. Satisfied but not ecstatic.`,
    }
  }

  if (offerRatio >= effectiveMin - 0.15) {
    // Below minimum but close — counter offer
    const counterSalary = Math.round(demand.weekly * 0.95)
    return {
      outcome: 'countered',
      finalContract: null,
      wrestlerMoodAfter: wrestler.morale,
      counterOffer: { salary: counterSalary, weeksRemaining: offer.weeksRemaining - 26 },
      reason: `${wrestler.name} wants $${counterSalary.toLocaleString()}/week. Counter offer submitted.`,
    }
  }

  // Too low — rejected
  if (hasCompetingOffer && Math.random() < 0.4) {
    return {
      outcome: 'walked_away',
      finalContract: null,
      wrestlerMoodAfter: Math.max(0, wrestler.morale - 10),
      reason: `${wrestler.name} signed with a rival org. Offer was too low and they had options.`,
    }
  }

  return {
    outcome: 'rejected',
    finalContract: null,
    wrestlerMoodAfter: Math.max(0, wrestler.morale - 5),
    reason: `${wrestler.name} rejected the offer. Significantly below their value.`,
  }
}

// ── Poaching System ───────────────────────────────────────────────────────────

export interface PoachingAttempt {
  targetWrestlerId: string
  fromOrgId: string
  toOrgId: string
  offerSalary: number
  offerWeeks: number
  weekAttempted: number
}

export function calculatePoachingInterest(
  wrestler: Wrestler,
  currentOrg: Organization,
  targetOrg: Organization
): number {
  // 0–100: how interested a wrestler is in leaving

  let interest = 0

  // Tier upgrade is very attractive
  const tierValues: Record<string, number> = {
    elite: 5, major: 4, regional: 3, indie: 2, local: 1, underground: 0,
  }
  const currentTierVal = tierValues[currentOrg.tier] ?? 1
  const targetTierVal  = tierValues[targetOrg.tier] ?? 1
  const tierDiff = targetTierVal - currentTierVal

  if (tierDiff > 0) interest += tierDiff * 20   // each tier jump = +20 interest
  if (tierDiff < 0) interest -= 30              // going down a tier = strong deterrent

  // Low morale = more open to leaving
  if (wrestler.morale < 40) interest += 25
  if (wrestler.morale < 60) interest += 10

  // Contract expiring soon = more open
  const weeksLeft = wrestler.contract?.weeksRemaining ?? 0
  if (weeksLeft <= 8)  interest += 30
  if (weeksLeft <= 16) interest += 15

  // Has no-trade clause — protected
  if (wrestler.contract?.noTradeClause) interest -= 40

  // Exclusive contract penalty
  if (wrestler.contract?.exclusivity === 'exclusive') interest -= 15

  // High momentum wrestlers are targets
  if (wrestler.momentum >= 80) interest += 10

  return Math.max(0, Math.min(100, interest))
}

// ── Contract Expiry Warnings ──────────────────────────────────────────────────

export type ContractUrgency = 'safe' | 'watch' | 'urgent' | 'critical'

export function getContractUrgency(weeksRemaining: number): ContractUrgency {
  if (weeksRemaining > 26) return 'safe'
  if (weeksRemaining > 13) return 'watch'
  if (weeksRemaining > 4)  return 'urgent'
  return 'critical'
}

export function getContractWarningMessage(
  wrestler: Wrestler,
  urgency: ContractUrgency
): string {
  const name = wrestler.name
  const weeks = wrestler.contract?.weeksRemaining ?? 0

  switch (urgency) {
    case 'watch':
      return `${name}'s contract expires in ${weeks} weeks. Begin renewal talks soon.`
    case 'urgent':
      return `${name} is ${weeks} weeks from free agency. Rival orgs are circling. Act now.`
    case 'critical':
      return `${name} becomes a free agent in ${weeks} week${weeks === 1 ? '' : 's'}. This is a crisis — negotiate or lose them.`
    default:
      return `${name} is under contract for ${weeks} more weeks.`
  }
}

// ── Release / Cut System ─────────────────────────────────────────────────────

export interface ReleaseResult {
  buyoutCost: number         // how much it costs to release early
  moralePenaltyToRoster: number  // unhappy roster when a popular person gets cut
  reputationPenalty: number     // org prestige hit
}

export function calculateReleaseCost(wrestler: Wrestler): ReleaseResult {
  const weeksRemaining = wrestler.contract?.weeksRemaining ?? 0
  const weeklySalary   = wrestler.contract?.salary ?? 0

  // Buyout = 50% of remaining contract value
  const buyoutCost = Math.round(weeksRemaining * weeklySalary * 0.5)

  // Popular wrestlers leaving hurts morale
  const moralePenalty = wrestler.popularity >= 75 ? Math.round((wrestler.popularity - 50) / 5) : 0

  // Prestige hit for releasing well-liked wrestlers
  const prestigePenalty = wrestler.overness >= 80 ? 3 : wrestler.overness >= 60 ? 1 : 0

  return {
    buyoutCost,
    moralePenaltyToRoster: moralePenalty,
    reputationPenalty: prestigePenalty,
  }
}