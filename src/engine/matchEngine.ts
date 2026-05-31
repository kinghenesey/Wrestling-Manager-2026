// ─────────────────────────────────────────────────────────────────────────────
// src/engine/matchEngine.ts
// Core match simulation — calculates ratings, results, momentum changes
// ─────────────────────────────────────────────────────────────────────────────

import type { Wrestler } from '../types/wrestler'
import type { Match, MatchResult } from '../types/show'

// ── Helpers ──────────────────────────────────────────────────────────────────

function clamp(val: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, val))
}

function randBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function weightedRandom(weights: number[]): number {
  const total = weights.reduce((a, b) => a + b, 0)
  let r = Math.random() * total
  for (let i = 0; i < weights.length; i++) {
    r -= weights[i]
    if (r <= 0) return i
  }
  return weights.length - 1
}

// ── Match Quality Calculator ─────────────────────────────────────────────────

export interface MatchQualityInput {
  participants: Wrestler[]
  isMainEvent: boolean
  hasTitle: boolean
  feudHeat: number          // 0–100 — ongoing feud heat
  matchType: string
  stipulation: string
  crowdRegionBonus: number  // 0–20 based on regional affinity
  agentBonus: number        // 0–10 if a good agent is in corner
}

export function calculateMatchRating(input: MatchQualityInput): number {
  const { participants, isMainEvent, hasTitle, feudHeat, matchType, stipulation } = input

  if (participants.length === 0) return 0

  // Base quality from wrestler stats
  const avgInRing    = avg(participants.map(w => w.stats.inRing))
  const avgPsych     = avg(participants.map(w => w.stats.psychology))
  const avgStamina   = avg(participants.map(w => w.stats.stamina))
  const avgAthletic  = avg(participants.map(w => w.stats.athleticism))

  // Weighted formula — psychology matters most for match quality
  let base = (avgInRing * 0.35) + (avgPsych * 0.30) + (avgStamina * 0.20) + (avgAthletic * 0.15)

  // Momentum bonus — hot wrestlers produce better matches
  const avgMomentum = avg(participants.map(w => w.momentum))
  base += (avgMomentum / 100) * 8

  // Feud heat bonus — invested crowd = better match perception
  base += (feudHeat / 100) * 10

  // Main event bonus
  if (isMainEvent) base += 5

  // Title match bonus
  if (hasTitle) base += 4

  // Stipulation bonuses
  const stipBonus: Record<string, number> = {
    none: 0, title_match: 3, cage: 5, hell_in_a_cell: 7,
    ladder: 6, tables: 4, last_man_standing: 5,
    career_vs_career: 8, mask_vs_mask: 6, underground_rules: 4,
  }
  base += stipBonus[stipulation] ?? 0

  // Match type modifiers
  if (matchType === 'battle_royal') base -= 8   // inherently chaotic, lower ceiling
  if (matchType === 'triple_threat') base += 2
  if (matchType === 'fatal_fourway') base -= 2

  // Injury penalty — injured wrestlers perform below par
  const injured = participants.filter(w => w.injury && !w.injury.isKayfabe)
  base -= injured.length * 6

  // Morale penalty — unhappy wrestlers phone it in
  const lowMorale = participants.filter(w => w.morale < 40)
  base -= lowMorale.length * 5

  // Region and agent bonuses
  base += input.crowdRegionBonus
  base += input.agentBonus

  // Natural variance (±8 points)
  base += randBetween(-8, 8)

  return clamp(Math.round(base))
}

// ── Crowd Reaction Calculator ─────────────────────────────────────────────────

export function calculateCrowdReaction(
  participants: Wrestler[],
  matchRating: number,
  isMainEvent: boolean,
  feudHeat: number
): number {
  const avgOverness  = avg(participants.map(w => w.overness))
  const avgCharisma  = avg(participants.map(w => w.stats.charisma))
  const avgPopularity = avg(participants.map(w => w.popularity))

  let crowd = (avgOverness * 0.35) + (avgCharisma * 0.25) + (avgPopularity * 0.25) + (matchRating * 0.15)

  if (isMainEvent) crowd += 6
  crowd += (feudHeat / 100) * 8
  crowd += randBetween(-6, 6)

  return clamp(Math.round(crowd))
}

// ── Win Probability ───────────────────────────────────────────────────────────

export function calculateWinProbability(wrestlers: Wrestler[]): number[] {
  // Based on push level, momentum, and overness
  const pushWeight: Record<string, number> = {
    champion:   9, mainevent: 7, uppercard: 5,
    midcard: 3, enhancement: 1.5, jobber: 0.5,
  }

  const scores = wrestlers.map(w => {
    const push = pushWeight[w.pushLevel] ?? 1
    const mom  = w.momentum / 100
    const over = w.overness / 100
    return push * (1 + mom * 0.5 + over * 0.3)
  })

  const total = scores.reduce((a, b) => a + b, 0)
  return scores.map(s => s / total)
}

// ── Full Match Simulation ─────────────────────────────────────────────────────

export interface SimulateMatchOptions {
  match: Match
  participants: Wrestler[]
  feudHeat?: number
  crowdRegionBonus?: number
  agentBonus?: number
  forcedWinnerId?: string     // booker overrides result
  forcedMethod?: string
}

export function simulateMatch(opts: SimulateMatchOptions): MatchResult {
  const {
    match,
    participants,
    feudHeat = 30,
    crowdRegionBonus = 0,
    agentBonus = 0,
    forcedWinnerId,
    forcedMethod,
  } = opts

  // ── Calculate quality ──
  const qualityInput: MatchQualityInput = {
    participants,
    isMainEvent: match.isMainEvent,
    hasTitle: match.titleId !== null,
    feudHeat,
    matchType: match.matchType,
    stipulation: match.stipulation,
    crowdRegionBonus,
    agentBonus,
  }
  const matchRating  = calculateMatchRating(qualityInput)
  const crowdRating  = calculateCrowdReaction(participants, matchRating, match.isMainEvent, feudHeat)

  // ── Determine winner ──
  let winnerId: string | null = null
  let winnerIds: string[] = []

  if (forcedWinnerId) {
    // Booker chose the result
    winnerId = forcedWinnerId
    winnerIds = [forcedWinnerId]
  } else {
    // Engine picks based on push weight
    const probs  = calculateWinProbability(participants)
    const idx    = weightedRandom(probs)
    const winner = participants[idx]
    winnerId     = winner?.id ?? null
    winnerIds    = winner ? [winner.id] : []
  }

  // ── Determine method ──
  const methodOptions = ['pinfall', 'submission', 'pinfall', 'pinfall', 'pinfall'] // pinfall most common
  if (match.stipulation === 'underground_rules') methodOptions.push('dq') // can't happen — no DQ
  const method = (forcedMethod ?? methodOptions[randBetween(0, methodOptions.length - 1)]) as MatchResult['method']

  // ── Duration ──
  const baseMinutes = match.isMainEvent ? 20 : match.matchType === 'battle_royal' ? 15 : 8
  const matchDuration = baseMinutes + randBetween(-3, 8)

  // ── Finishing move ──
  const winner = participants.find(w => w.id === winnerId)
  const finishingMove = winner?.finisher ?? 'Pinfall'

  return {
    winnerId,
    winnerIds,
    method,
    finishingMove,
    matchRating,
    crowdRating,
    matchDurationMinutes: matchDuration,
  }
}

// ── Post-Match Momentum & Stat Changes ───────────────────────────────────────

export interface PostMatchEffect {
  wrestlerId: string
  momentumDelta: number
  popularityDelta: number
  overnessDelta: number
  moraleDelta: number
}

export function calculatePostMatchEffects(
  result: MatchResult,
  participants: Wrestler[],
  isTitle: boolean,
  isMainEvent: boolean,
  feudHeat: number
): PostMatchEffect[] {
  return participants.map(w => {
    const isWinner = result.winnerIds.includes(w.id)
    const ratingBonus = (result.matchRating - 50) / 50 * 5  // high-quality matches benefit everyone

    let momentumDelta   = 0
    let popularityDelta = 0
    let overnessDelta   = 0
    let moraleDelta     = 0

    if (isWinner) {
      momentumDelta   += randBetween(8, 15)
      popularityDelta += randBetween(2, 6)
      overnessDelta   += randBetween(1, 3)
      moraleDelta     += randBetween(3, 8)
      if (isTitle)     { momentumDelta += 15; popularityDelta += 8; overnessDelta += 5 }
      if (isMainEvent) { momentumDelta += 5;  popularityDelta += 3 }
    } else {
      momentumDelta   -= randBetween(3, 10)
      popularityDelta -= randBetween(0, 2)
      moraleDelta     -= randBetween(1, 4)
      if (isTitle)     { momentumDelta -= 5; moraleDelta -= 4 }
      // Clean losses to a big star don't hurt overness
      if (result.method === 'dq' || result.method === 'count_out') {
        momentumDelta += 4  // losing by DQ/CO protects the loser
      }
    }

    // Good match rating lifts everyone
    momentumDelta   += Math.round(ratingBonus)
    popularityDelta += Math.round(ratingBonus * 0.5)

    return {
      wrestlerId: w.id,
      momentumDelta:   clamp(w.momentum   + momentumDelta,   0, 100) - w.momentum,
      popularityDelta: clamp(w.popularity + popularityDelta, 0, 100) - w.popularity,
      overnessDelta:   clamp(w.overness   + overnessDelta,   0, 100) - w.overness,
      moraleDelta:     clamp(w.morale     + moraleDelta,     0, 100) - w.morale,
    }
  })
}

// ── Show Rating Calculator ────────────────────────────────────────────────────

export function calculateShowRating(
  matchRatings: number[],
  segmentRatings: number[],
  attendance: number,
  capacity: number
): number {
  if (matchRatings.length === 0) return 0

  // Main event counts most
  const sorted = [...matchRatings].sort((a, b) => b - a)
  const mainEvent  = sorted[0] ?? 0
  const undercard  = avg(sorted.slice(1))

  // Crowd fullness bonus
  const fullnessBonus = (attendance / capacity) * 5

  // Segment quality bonus
  const segBonus = avg(segmentRatings) * 0.1

  let overall = (mainEvent * 0.40) + (undercard * 0.45) + fullnessBonus + segBonus

  return clamp(Math.round(overall))
}

// ── Utility ───────────────────────────────────────────────────────────────────

function avg(nums: number[]): number {
  if (nums.length === 0) return 0
  return nums.reduce((a, b) => a + b, 0) / nums.length
}