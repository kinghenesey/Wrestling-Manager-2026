// ─────────────────────────────────────────────────────────────────────────────
// src/engine/pushEngine.ts
// The "rise to fame" engine — handles organic pushes, face/heel turns,
// the Roman Reigns slow-burn, the Obafemi overnight explosion, and everything
// in between.
// ─────────────────────────────────────────────────────────────────────────────

import type { Wrestler, PushLevel, Alignment } from '../types/wrestler'
import type { PushDecision } from '../types/storyline'

// ── Push Level Ladder ─────────────────────────────────────────────────────────

const PUSH_ORDER: PushLevel[] = [
  'jobber', 'enhancement', 'midcard', 'uppercard', 'mainevent', 'champion',
]

export function getPushIndex(level: PushLevel): number {
  return PUSH_ORDER.indexOf(level)
}

export function canPromotePush(current: PushLevel): PushLevel | null {
  const idx = getPushIndex(current)
  return idx < PUSH_ORDER.length - 1 ? PUSH_ORDER[idx + 1] : null
}

export function canDemotePush(current: PushLevel): PushLevel | null {
  const idx = getPushIndex(current)
  return idx > 0 ? PUSH_ORDER[idx - 1] : null
}

// ── Momentum Events ───────────────────────────────────────────────────────────

export type MomentumEventType =
  | 'clean_win_over_top_star'        // biggest boost
  | 'title_win'
  | 'shocking_heel_turn'
  | 'shocking_face_turn'
  | 'crowd_goes_organic'             // THE Obafemi moment — crowd just decides they love this person
  | 'strong_promo'
  | 'five_star_match'
  | 'returns_from_injury'
  | 'wins_big_stipulation_match'
  | 'wins_tournament'
  | 'regular_win'
  | 'loss_to_peer'
  | 'loss_to_lower_card'             // damaging
  | 'buried_by_booking'             // most damaging
  | 'title_loss'
  | 'injury_announced'
  | 'bad_promo'
  | 'no_show'

const MOMENTUM_DELTAS: Record<MomentumEventType, number> = {
  clean_win_over_top_star:  +18,
  title_win:                +22,
  shocking_heel_turn:       +28,
  shocking_face_turn:       +20,
  crowd_goes_organic:       +35,   // The Obafemi Moment — biggest single boost
  strong_promo:             +10,
  five_star_match:          +15,
  returns_from_injury:      +12,
  wins_big_stipulation_match: +14,
  wins_tournament:          +16,
  regular_win:              +5,
  loss_to_peer:             -6,
  loss_to_lower_card:       -14,
  buried_by_booking:        -20,
  title_loss:               -12,
  injury_announced:         -8,
  bad_promo:                -8,
  no_show:                  -15,
}

export interface MomentumEvent {
  type: MomentumEventType
  week: number
  wrestlerId: string
  context?: string   // optional description
}

export function applyMomentumEvent(
  wrestler: Wrestler,
  event: MomentumEvent
): { newMomentum: number; delta: number; isBreakoutMoment: boolean } {
  let delta = MOMENTUM_DELTAS[event.type] ?? 0

  // Charisma amplifies crowd-based events
  const crowdEvents: MomentumEventType[] = ['crowd_goes_organic', 'shocking_heel_turn', 'shocking_face_turn']
  if (crowdEvents.includes(event.type)) {
    const charismaMultiplier = wrestler.stats.charisma / 50  // 1.0 at 50, 2.0 at 100
    delta = Math.round(delta * charismaMultiplier)
  }

  // High potential wrestlers get more out of breakout moments
  if (event.type === 'crowd_goes_organic' && wrestler.potential >= 90) {
    delta += 10  // Generational talent bonus
  }

  // Low morale dampens positive momentum
  if (delta > 0 && wrestler.morale < 40) {
    delta = Math.round(delta * 0.7)
  }

  const newMomentum = Math.max(0, Math.min(100, wrestler.momentum + delta))
  const isBreakoutMoment = event.type === 'crowd_goes_organic' || (delta >= 25)

  return { newMomentum, delta, isBreakoutMoment }
}

// ── Push Evaluation — Should this wrestler be pushed? ────────────────────────

export interface PushEvaluationResult {
  shouldPromote: boolean
  shouldDemote: boolean
  reason: string
  urgency: 'low' | 'medium' | 'high' | 'critical'
}

export function evaluatePush(
  wrestler: Wrestler,
  recentMatchRatings: number[],    // last 4 weeks of match ratings
  recentCrowdRatings: number[]     // last 4 weeks of crowd reactions
): PushEvaluationResult {

  const avgMatch  = avg(recentMatchRatings)
  const avgCrowd  = avg(recentCrowdRatings)
  const momentum  = wrestler.momentum
  const overness  = wrestler.overness
  const morale    = wrestler.morale

  // ── Critical organic push trigger (The Obafemi Rule) ──
  // When the crowd is just done with the company's plans and gets behind someone
  if (momentum >= 88 && overness >= 75 && wrestler.pushLevel === 'midcard') {
    return {
      shouldPromote: true,
      shouldDemote: false,
      reason: `${wrestler.name} has gone nuclear with the crowd. Fans are chanting for them. Push NOW or lose the moment forever.`,
      urgency: 'critical',
    }
  }

  // ── Standard promotion criteria ──
  if (
    momentum >= 75 &&
    avgCrowd >= 72 &&
    avgMatch >= 65 &&
    morale >= 60 &&
    canPromotePush(wrestler.pushLevel)
  ) {
    const nextLevel = canPromotePush(wrestler.pushLevel)!
    return {
      shouldPromote: true,
      shouldDemote: false,
      reason: `${wrestler.name} is consistently delivering and the crowd is responding. Ready for ${nextLevel} push.`,
      urgency: momentum >= 85 ? 'high' : 'medium',
    }
  }

  // ── Demotion criteria ──
  if (
    momentum <= 25 &&
    avgCrowd <= 40 &&
    morale <= 35 &&
    canDemotePush(wrestler.pushLevel)
  ) {
    return {
      shouldPromote: false,
      shouldDemote: true,
      reason: `${wrestler.name} has cooled completely. Crowd indifference, low morale. Consider pulling back before they're damaged goods.`,
      urgency: momentum <= 15 ? 'high' : 'medium',
    }
  }

  // ── Roman Reigns slow-burn detection ──
  // High overness but being booed despite face push — possible forced push
  if (
    wrestler.alignment === 'face' &&
    wrestler.pushLevel === 'mainevent' &&
    avgCrowd < 55 &&
    overness > 70
  ) {
    return {
      shouldPromote: false,
      shouldDemote: false,
      reason: `${wrestler.name} is over but the crowd is rejecting the current face booking. Consider a heel turn — the tools are there for something special.`,
      urgency: 'medium',
    }
  }

  return {
    shouldPromote: false,
    shouldDemote: false,
    reason: `${wrestler.name} is stable at ${wrestler.pushLevel} level.`,
    urgency: 'low',
  }
}

// ── Face / Heel Turn Logic ────────────────────────────────────────────────────

export interface TurnAnalysis {
  shouldTurn: boolean
  recommendedAlignment: Alignment
  reason: string
  impactScore: number   // 0–100 how big the pop/heat would be
}

export function analyzeTurnPotential(
  wrestler: Wrestler,
  recentCrowdRatings: number[],
  isBeingBooed: boolean,           // face getting boos
  hasNaturalChemistryAsHeel: boolean  // booker's opinion
): TurnAnalysis {

  const charisma = wrestler.stats.charisma
  const promo    = wrestler.stats.promo
  const overness = wrestler.overness
  const avgCrowd = avg(recentCrowdRatings)

  // ── Face → Heel turn (The Roman Reigns scenario) ──
  if (
    wrestler.alignment === 'face' &&
    isBeingBooed &&
    promo >= 80 &&
    overness >= 75
  ) {
    const impact = Math.round((promo * 0.4) + (charisma * 0.4) + (overness * 0.2))
    return {
      shouldTurn: true,
      recommendedAlignment: 'heel',
      reason: `${wrestler.name} has elite promo skills and undeniable presence — but fans reject the face booking. A heel turn would unlock a dominant era.`,
      impactScore: Math.min(100, impact + 10),
    }
  }

  // ── Heel → Face turn (Organic crowd support) ──
  if (
    wrestler.alignment === 'heel' &&
    avgCrowd >= 70 &&
    wrestler.momentum >= 75 &&
    charisma >= 75
  ) {
    const impact = Math.round((charisma * 0.5) + (wrestler.momentum * 0.3) + (promo * 0.2))
    return {
      shouldTurn: true,
      recommendedAlignment: 'face',
      reason: `The crowd is cheering ${wrestler.name} despite the heel booking. Let the organic turn happen — fighting it will only hurt both sides.`,
      impactScore: Math.min(100, impact),
    }
  }

  // ── Tweener potential ──
  if (promo >= 85 && charisma >= 85 && wrestler.pushLevel === 'mainevent') {
    return {
      shouldTurn: false,
      recommendedAlignment: 'tweener',
      reason: `${wrestler.name} is elite enough to work as a tweener — neither face nor heel, just undeniably compelling.`,
      impactScore: 60,
    }
  }

  return {
    shouldTurn: false,
    recommendedAlignment: wrestler.alignment,
    reason: 'No turn recommended at this time.',
    impactScore: 0,
  }
}

// ── Career Arc Milestones ─────────────────────────────────────────────────────

export type MilestoneType =
  | 'first_win'
  | 'first_title'
  | 'main_event_debut'
  | 'breakout_moment'
  | 'face_turn'
  | 'heel_turn'
  | 'injury_return'
  | 'title_reign_milestone'  // e.g. 10 defenses
  | 'legend_status'          // overness 95+ for 52 weeks

export interface CareerMilestone {
  wrestlerId: string
  type: MilestoneType
  week: number
  description: string
  momentumBonus: number
  popularityBonus: number
}

export function checkForMilestone(
  wrestler: Wrestler,
  week: number,
  event: MomentumEventType,
  prevPushLevel: PushLevel
): CareerMilestone | null {

  // First title win
  if (event === 'title_win' && wrestler.championships.length === 1) {
    return {
      wrestlerId: wrestler.id,
      type: 'first_title',
      week,
      description: `${wrestler.name} wins their first championship!`,
      momentumBonus: 15,
      popularityBonus: 10,
    }
  }

  // Main event debut
  if (
    wrestler.pushLevel === 'mainevent' &&
    prevPushLevel !== 'mainevent' &&
    prevPushLevel !== 'champion'
  ) {
    return {
      wrestlerId: wrestler.id,
      type: 'main_event_debut',
      week,
      description: `${wrestler.name} has arrived in the main event!`,
      momentumBonus: 10,
      popularityBonus: 8,
    }
  }

  // Breakout moment
  if (event === 'crowd_goes_organic') {
    return {
      wrestlerId: wrestler.id,
      type: 'breakout_moment',
      week,
      description: `${wrestler.name} has their Obafemi Moment — the crowd erupts organically. Nothing will be the same.`,
      momentumBonus: 20,
      popularityBonus: 15,
    }
  }

  // Legend status
  if (wrestler.overness >= 95 && wrestler.experience >= 520) {
    return {
      wrestlerId: wrestler.id,
      type: 'legend_status',
      week,
      description: `${wrestler.name} has reached legendary status. A true icon of the sport.`,
      momentumBonus: 5,
      popularityBonus: 5,
    }
  }

  return null
}

// ── Booking Push Decision Generator ──────────────────────────────────────────

export function createPushDecision(
  wrestler: Wrestler,
  newLevel: PushLevel,
  week: number,
  reason: string,
  storylineId: string | null = null
): PushDecision {
  return {
    wrestlerId: wrestler.id,
    oldPushLevel: wrestler.pushLevel,
    newPushLevel: newLevel,
    week,
    reason,
    orgId: wrestler.currentOrgId ?? 'unknown',
    triggeredByStorylineId: storylineId,
  }
}

// ── Utility ───────────────────────────────────────────────────────────────────

function avg(nums: number[]): number {
  if (nums.length === 0) return 0
  return nums.reduce((a, b) => a + b, 0) / nums.length
}