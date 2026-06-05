// ─────────────────────────────────────────────────────────────────────────────
// src/engine/weekSimEngine.ts
// Simulates one week of world progression when the player advances without
// booking a show. Keeps the game world alive between bookings.
// ─────────────────────────────────────────────────────────────────────────────

import type { Wrestler } from '../types/wrestler'
import type { Storyline } from '../types/storyline'
import type { PlayerManager, JobOffer } from '../types/game'
import type { WeekSimResult, SimEvent } from '../types/weekSim'
import { rollInjury, processWeeklyRecovery } from './injuryEngine'
import { applyHeatDecay } from './storylineEngine'
import type { FreeAgent } from '../types/underground'

// ── Reputation tier thresholds ────────────────────────────────────────────────

export const REP_THRESHOLDS: Record<string, number> = {
  unknown:   50,
  regional:  150,
  respected: 300,
  notable:   500,
  elite:     800,
}

const REP_TIER_ORDER = ['unknown', 'regional', 'respected', 'notable', 'elite', 'legendary']

function nextRepTier(current: string): string | null {
  const idx = REP_TIER_ORDER.indexOf(current)
  if (idx === -1 || idx >= REP_TIER_ORDER.length - 1) return null
  return REP_TIER_ORDER[idx + 1]
}

// Orgs available per tier for job offer generation
const TIER_ORGS: Record<string, { id: string; name: string }[]> = {
  regional:  [{ id: 'llw', name: 'LLW' }, { id: 'cwl', name: 'CWL' }, { id: 'pwl', name: 'PWL' }],
  respected: [{ id: 'sgw', name: 'SGW' }, { id: 'hlw', name: 'HLW' }, { id: 'nbc', name: 'NBC' }],
  notable:   [{ id: 'ira', name: 'IRA' }, { id: 'nfw', name: 'NFW' }, { id: 'apw', name: 'APW' }],
  elite:     [{ id: 'awf', name: 'AWF' }, { id: 'tpw', name: 'TPW' }, { id: 'gcw', name: 'GCW' }],
  legendary: [{ id: 'awf', name: 'AWF' }, { id: 'tpw', name: 'TPW' }],
}

const TIER_SALARIES: Record<string, number> = {
  regional: 800, respected: 2500, notable: 8000, elite: 25000, legendary: 60000,
}

// ── Main simulation entry point ───────────────────────────────────────────────

export interface SimulateWeekInput {
  week: number
  year: number
  player: PlayerManager
  wrestlers: Wrestler[]
  storylines: Storyline[]
  orgId: string
  undergroundFreeAgents: FreeAgent[]
}

export interface SimulateWeekOutput extends WeekSimResult {
  updatedWrestlers: Wrestler[]
  updatedStorylines: Storyline[]
  updatedPlayer: PlayerManager
  newUndergroundAgents: FreeAgent[]
}

export function simulateWeek(input: SimulateWeekInput): SimulateWeekOutput {
  const { week, year, player, wrestlers, storylines, orgId } = input

  const events: SimEvent[] = []
  const contractsExpired: string[] = []
  const newInjuries: string[] = []
  const recoveries: string[] = []

  

  // Work on copies so original store state is untouched until commit
  let updatedWrestlers = wrestlers.map(w => ({ ...w }))
  let updatedPlayer = { ...player }
  // ── 1. Contract tick + expiry ─────────────────────────────────────────────

  updatedWrestlers = updatedWrestlers.map(w => {
    if (!w.contract || w.status === 'free_agent') return w

    const weeksLeft = w.contract.weeksRemaining - 1

    // Expiry
    if (weeksLeft <= 0) {
      contractsExpired.push(w.id)
      events.push({
        type: 'contract_expired',
        severity: 'warning',
        message: `${w.name}'s contract has expired. They are now a free agent.`,
        wrestlerId: w.id,
        wrestlerName: w.name,
      })
      return {
        ...w,
        contract: null,
        currentOrgId: 'underground',
        status: 'free_agent' as const,
        morale: Math.max(0, w.morale - 10),
      }
    }

    // 4-week warning
    if (weeksLeft === 4) {
      events.push({
        type: 'contract_warning',
        severity: 'warning',
        message: `${w.name}'s contract expires in 4 weeks. Consider renewing.`,
        wrestlerId: w.id,
        wrestlerName: w.name,
        data: { weeksRemaining: weeksLeft },
      })
    }

    return {
      ...w,
      contract: { ...w.contract, weeksRemaining: weeksLeft },
    }
  })

  // ── 2. Injury processing ──────────────────────────────────────────────────
  // Only process org wrestlers — not free agents or other orgs

  updatedWrestlers = updatedWrestlers.map(w => {
    if (w.currentOrgId !== orgId) return w

    // Recovery tick for already-injured wrestlers
    if (w.injury) {
      const recovery = processWeeklyRecovery(w, false)
      if (recovery.isReturning) {
        recoveries.push(w.id)
        events.push({
          type: 'injury_recovered',
          severity: 'positive',
          message: `${w.name} has recovered and is cleared to return! (+${recovery.returnPopBonus} momentum pop)`,
          wrestlerId: w.id,
          wrestlerName: w.name,
          data: { returnPopBonus: recovery.returnPopBonus },
        })
        return {
          ...w,
          injury: null,
          status: 'active' as const,
          momentum: Math.min(100, w.momentum + recovery.returnPopBonus),
        }
      }
      return {
        ...w,
        injury: { ...w.injury, weeksRemaining: recovery.newWeeksRemaining },
      }
    }

    // Roll new injury for active wrestlers
    const newInjury = rollInjury(w, false)
    if (newInjury) {
      newInjuries.push(w.id)
      events.push({
        type: 'injury_new',
        severity: newInjury.severity === 'severe' ? 'critical' : 'warning',
        message: `${w.name} has picked up a ${newInjury.severity} injury: ${newInjury.type}. Out for ${newInjury.weeksRemaining} week${newInjury.weeksRemaining !== 1 ? 's' : ''}.`,
        wrestlerId: w.id,
        wrestlerName: w.name,
        data: { injuryType: newInjury.type, weeksOut: newInjury.weeksRemaining },
      })
      return {
        ...w,
        injury: newInjury,
        status: 'injured' as const,
      }
    }

    return w
  })

  // ── 3. Morale drift ───────────────────────────────────────────────────────

  updatedWrestlers = updatedWrestlers.map(w => {
    if (w.currentOrgId !== orgId || w.status === 'free_agent') return w

    let moraleDelta = 1 // passive weekly tick

    if (w.contract && w.contract.weeksRemaining <= 8) moraleDelta -= 5
    if (w.injury) moraleDelta -= 3

    const clamped = Math.max(0, Math.min(100, w.morale + moraleDelta))

    if (moraleDelta < -3) {
      events.push({
        type: 'morale_drop',
        severity: 'info',
        message: `${w.name}'s morale is dropping (${clamped}/100).`,
        wrestlerId: w.id,
        wrestlerName: w.name,
        data: { morale: clamped },
      })
    }

    return { ...w, morale: clamped }
  })

  // ── 4. Momentum decay for wrestlers not on shows ──────────────────────────
  // Decay applies to all org wrestlers who aren't injured
  // (Show engine adds momentum when wrestlers appear — this is the counter-pressure)

  updatedWrestlers = updatedWrestlers.map(w => {
    if (w.currentOrgId !== orgId || w.status !== 'active') return w

    const decayed = Math.max(0, w.momentum - 2)

    if (w.momentum > 20 && decayed <= 20) {
      events.push({
        type: 'momentum_decay',
        severity: 'info',
        message: `${w.name}'s momentum is fading from inactivity.`,
        wrestlerId: w.id,
        wrestlerName: w.name,
      })
    }

    return { ...w, momentum: decayed }
  })

  // ── 5. Storyline heat decay ───────────────────────────────────────────────

  const updatedStorylines = storylines.map(s => {
    if (s.status !== 'active') return s

    const weeksSinceLast = s.segments.length > 0
      ? week - (s.segments[s.segments.length - 1].week ?? week - 1)
      : 1

    const newHeat = applyHeatDecay(s, weeksSinceLast)

    if (newHeat < s.heat) {
      events.push({
        type: 'storyline_heat_decay',
        severity: 'info',
        message: `"${s.name}" is cooling off. Heat: ${s.heat} → ${newHeat}. Book a segment to keep it alive.`,
        data: { storylineId: s.id, oldHeat: s.heat, newHeat },
      })
    }

    return { ...s, heat: newHeat }
  })

  // ── 6. Reputation check + level up ───────────────────────────────────────

  let reputationLevelUp = false
  const currentRep = updatedPlayer.reputation
  const threshold = REP_THRESHOLDS[currentRep]
  const nextTier = nextRepTier(currentRep)

  if (nextTier && threshold !== undefined && updatedPlayer.reputationPoints >= threshold) {
    updatedPlayer = {
      ...updatedPlayer,
      reputation: nextTier as PlayerManager['reputation'],
    }
    reputationLevelUp = true
    events.push({
      type: 'reputation_level_up',
      severity: 'positive',
      message: `Your reputation has grown. You are now known as a ${nextTier.charAt(0).toUpperCase() + nextTier.slice(1)} booker. New opportunities await.`,
      data: { newTier: nextTier },
    })
  }

  // ── 7. Job offer generation ───────────────────────────────────────────────
  // Triggered on level-up or randomly (5% chance) once per tier unlock

  let newJobOffer: JobOffer | null = null
  const repForOffers = updatedPlayer.reputation
  const offerPool = TIER_ORGS[repForOffers]

  const shouldGenerateOffer =
    offerPool &&
    (reputationLevelUp || Math.random() < 0.05) &&
    !updatedPlayer.jobOffers.some(o => o.tier === repForOffers)

  if (shouldGenerateOffer && offerPool) {
    const pick = offerPool[Math.floor(Math.random() * offerPool.length)]
    // Don't offer the org the player already manages
    const finalPick = pick.id === orgId
      ? (offerPool.find(o => o.id !== orgId) ?? pick)
      : pick

    newJobOffer = {
      orgId: finalPick.id,
      orgName: finalPick.name,
      salary: TIER_SALARIES[repForOffers] ?? 1000,
      tier: repForOffers as JobOffer['tier'],
      expiresWeek: week + 4,
      reputationRequired: repForOffers as JobOffer['reputationRequired'],
    }

    updatedPlayer = {
      ...updatedPlayer,
      jobOffers: [...updatedPlayer.jobOffers, newJobOffer],
    }

    events.push({
      type: 'job_offer_received',
      severity: 'positive',
      message: `${finalPick.name} has offered you a head booker position. Offer expires in 4 weeks.`,
      data: { orgId: finalPick.id, orgName: finalPick.name },
    })
  }

  // ── 8. Expire old job offers ──────────────────────────────────────────────

  updatedPlayer = {
    ...updatedPlayer,
    jobOffers: updatedPlayer.jobOffers.filter(o => o.expiresWeek > week),
  }

  // ── 9. Underground weekly injection ──────────────────────────────────────────
  // Ensure minimum 5 new fighters enter the underground pool each week

  const MIN_UNDERGROUND_WEEKLY = 5
  const newUndergroundAgents: FreeAgent[] = []

  const toGenerate = Math.max(MIN_UNDERGROUND_WEEKLY, Math.floor(Math.random() * 4) + MIN_UNDERGROUND_WEEKLY)

  for (let i = 0; i < toGenerate; i++) {
    const askingSalary = Math.floor(Math.random() * 300) + 100
    newUndergroundAgents.push({
      wrestlerId:              `ug_${week}_${i}_${Math.random().toString(36).slice(2, 7)}`,
      weeksAvailable:          0,
      askingSalary,
      interestedOrgIds:        [],
      lastOrgId:               null,
      undergroundAppearances:  Math.floor(Math.random() * 10),
      isExclusive:             false,
    })
  }

  return {
    week,
    year,
    events,
    contractsExpired,
    newInjuries,
    recoveries,
    reputationLevelUp,
    newJobOffer,
    updatedWrestlers,
    updatedStorylines,
    updatedPlayer,
    newUndergroundAgents,
  }
}