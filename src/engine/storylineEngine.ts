// ─────────────────────────────────────────────────────────────────────────────
// src/engine/storylineEngine.ts
// Manages feud heat, storyline lifecycle, segment impact, and decay over time
// ─────────────────────────────────────────────────────────────────────────────

import type { Storyline, StorylineSegment, HeatLevel, StorylineType } from '../types/storyline'
import type { Wrestler } from '../types/wrestler'

// ── Heat Level Thresholds ─────────────────────────────────────────────────────

export function getHeatLevel(heat: number): HeatLevel {
  if (heat >= 85) return 'nuclear'
  if (heat >= 65) return 'hot'
  if (heat >= 45) return 'warm'
  if (heat >= 25) return 'lukewarm'
  return 'cold'
}

// ── Weekly Heat Decay ─────────────────────────────────────────────────────────
// Feuds naturally decay without being fed content each week

export function applyHeatDecay(storyline: Storyline, weeksSinceLastSegment: number): number {
  const decayRates: Record<HeatLevel, number> = {
    nuclear:  2,   // hardest to kill
    hot:      3,
    warm:     4,
    lukewarm: 5,
    cold:     3,   // already cold, slows down
  }
  const level = getHeatLevel(storyline.heat)
  const decay = decayRates[level] * weeksSinceLastSegment
  return Math.max(0, storyline.heat - decay)
}

// ── Segment Impact on Heat ────────────────────────────────────────────────────

export type SegmentQuality = 'terrible' | 'poor' | 'average' | 'good' | 'great' | 'perfect'

const SEGMENT_HEAT_IMPACT: Record<SegmentQuality, number> = {
  terrible: -12,
  poor:     -4,
  average:  +3,
  good:     +8,
  great:    +14,
  perfect:  +22,
}

export function getSegmentQuality(rating: number): SegmentQuality {
  if (rating >= 90) return 'perfect'
  if (rating >= 75) return 'great'
  if (rating >= 60) return 'good'
  if (rating >= 45) return 'average'
  if (rating >= 30) return 'poor'
  return 'terrible'
}

export function applySegmentToHeat(
  currentHeat: number,
  segmentRating: number,
  segmentType: StorylineSegment['segmentType']
): { newHeat: number; delta: number } {
  const quality = getSegmentQuality(segmentRating)
  let delta = SEGMENT_HEAT_IMPACT[quality]

  // Promo segments build heat faster than matches in some cases
  const typeMultiplier: Record<string, number> = {
    promo:            1.2,
    attack:           1.3,  // surprise attacks spike heat
    reveal:           1.5,  // shocking reveals give biggest heat pop
    match:            1.0,
    contract_signing: 1.1,
    award:            0.8,
  }
  delta = Math.round(delta * (typeMultiplier[segmentType] ?? 1.0))

  const newHeat = Math.max(0, Math.min(100, currentHeat + delta))
  return { newHeat, delta }
}

// ── Segment Rating Calculator ─────────────────────────────────────────────────

export interface SegmentRatingInput {
  participants: Wrestler[]
  segmentType: StorylineSegment['segmentType']
  storylineHeat: number
  isOnPPV: boolean
  isMainSegment: boolean
}

export function calculateSegmentRating(input: SegmentRatingInput): number {
  const { participants, segmentType, storylineHeat, isOnPPV, isMainSegment } = input

  if (participants.length === 0) return 0

  const avg = (nums: number[]) => nums.reduce((a, b) => a + b, 0) / nums.length

  let base = 0

  if (segmentType === 'promo' || segmentType === 'contract_signing') {
    const avgPromo    = avg(participants.map(w => w.stats.promo))
    const avgCharisma = avg(participants.map(w => w.stats.charisma))
    base = (avgPromo * 0.55) + (avgCharisma * 0.45)
  } else if (segmentType === 'attack') {
    const avgCharisma  = avg(participants.map(w => w.stats.charisma))
    const avgMomentum  = avg(participants.map(w => w.momentum))
    base = (avgCharisma * 0.4) + (avgMomentum * 0.4) + (storylineHeat * 0.2)
  } else if (segmentType === 'reveal') {
    const avgPromo    = avg(participants.map(w => w.stats.promo))
    const avgOverness = avg(participants.map(w => w.overness))
    base = (avgPromo * 0.3) + (avgOverness * 0.4) + (storylineHeat * 0.3)
  } else {
    const avgCharisma = avg(participants.map(w => w.stats.charisma))
    base = avgCharisma
  }

  // Heat bonus — invested crowd elevates everything
  base += (storylineHeat / 100) * 10

  if (isOnPPV)       base += 5
  if (isMainSegment) base += 4

  // Morale check — disengaged wrestlers phone it in
  const lowMorale = participants.filter(w => w.morale < 40)
  base -= lowMorale.length * 6

  // Natural variance
  base += (Math.random() * 16) - 8

  return Math.max(0, Math.min(100, Math.round(base)))
}

// ── Storyline Lifecycle ───────────────────────────────────────────────────────

export type StorylinePhase =
  | 'ignition'    // weeks 1–3: establishing the conflict
  | 'build'       // weeks 4–8: escalation
  | 'peak'        // weeks 9–12: hottest point, PPV time
  | 'blowoff'     // week 13–14: final match / resolution
  | 'aftermath'   // week 15+: dealing with consequences

export function getStorylinePhase(
  weeksActive: number,
  storylineType: StorylineType
): StorylinePhase {
  // Tournament and title chase arcs run longer
  const longArcTypes: StorylineType[] = ['dominant_run', 'underdog_rise', 'faction_war']
  const isLong = longArcTypes.includes(storylineType)

  if (weeksActive <= 3)                       return 'ignition'
  if (weeksActive <= (isLong ? 12 : 8))       return 'build'
  if (weeksActive <= (isLong ? 20 : 12))      return 'peak'
  if (weeksActive <= (isLong ? 23 : 14))      return 'blowoff'
  return 'aftermath'
}

export function getPhaseBookingAdvice(
  phase: StorylinePhase,
  storylineType: StorylineType,
  protagonistName: string,
  antagonistName: string
): string {
  const advice: Record<StorylinePhase, Record<string, string>> = {
    ignition: {
      title_chase:    `Have ${protagonistName} earn a shot at ${antagonistName}'s title with a strong promo or win over a credible opponent.`,
      revenge:        `${antagonistName} should attack ${protagonistName} unprovoked — establish the heat clearly. No ambiguity.`,
      underdog_rise:  `Start small. ${protagonistName} loses but looks good doing it. Plant the seed. Let the crowd find them.`,
      dominant_run:   `${antagonistName} destroys everyone in their path. No mercy. Make the threat feel unstoppable.`,
      betrayal:       `Drop subtle hints this week. The betrayal should feel inevitable in hindsight.`,
      faction_war:    `Establish both sides clearly. A brawl to close the show works perfectly here.`,
      default:        `Establish your conflict clearly. Every fan should know who is who and why they should care.`,
    },
    build: {
      title_chase:    `Non-title matches, double countouts, DQ finishes — keep the tension without blowing the match off.`,
      revenge:        `Escalate. ${antagonistName} should attack ${protagonistName} in more personal ways — family, career, reputation.`,
      underdog_rise:  `${protagonistName} is getting closer. A near-fall in a big match. The crowd starts chanting. This is the Obafemi phase.`,
      dominant_run:   `${antagonistName} crushes challengers. Make one of them credible to tease vulnerability.`,
      betrayal:       `The betrayal should happen this phase. Time it with a loss or defeat — maximum damage.`,
      faction_war:    `Matches between mid-card members of each faction. Save the top stars for the peak.`,
      default:        `Escalate. Raise the stakes. Make every segment feel like it's building toward something inevitable.`,
    },
    peak: {
      title_chase:    `This is PPV time. The match should be the best either can have. Deliver.`,
      underdog_rise:  `${protagonistName} gets the win that changes everything. The crowd needs to explode here.`,
      dominant_run:   `A credible challenger threatens the reign. ${antagonistName} survives — but barely.`,
      betrayal:       `The betrayed gets their first real win over the betrayer. Or a heartbreaking second loss.`,
      faction_war:    `War Games equivalent. Everyone involved. Chaos.`,
      default:        `You are at the peak. Every booking decision matters now. Deliver the payoff your fans deserve.`,
    },
    blowoff: {
      default: `Final confrontation. Give the crowd a clean finish — or a devastating twist that plants the next arc. No loose ends.`,
    },
    aftermath: {
      default: `The dust settles. Who changed? Where does each wrestler go next? Plant seeds for the next story now.`,
    },
  }

  const phaseAdvice = advice[phase]
  return phaseAdvice[storylineType] ?? phaseAdvice['default'] ?? 'Continue building the storyline.'
}

// ── Organic Chant Detection ───────────────────────────────────────────────────

export function checkForOrganicChant(
  wrestler: Wrestler,
  crowdRating: number,
  currentChants: string[]
): string | null {
  if (crowdRating < 75 || wrestler.overness < 65) return null

  const chantTemplates = [
    `${wrestler.name.toUpperCase()}! ${wrestler.name.toUpperCase()}!`,
    `LET'S GO ${wrestler.name.split(' ')[0].toUpperCase()}!`,
    `YOU DESERVE IT!`,
    `THIS IS AWESOME!`,
    `ONE MORE MATCH!`,
  ]

  // Heels get different chants
  const heelChants = [
    `A**HOLE! A**HOLE!`,
    `YOU SUCK! YOU SUCK!`,
    `SHUT UP ${wrestler.name.split(' ')[0].toUpperCase()}!`,
  ]

  const pool = wrestler.alignment === 'heel' ? heelChants : chantTemplates
  const newChant = pool[Math.floor(Math.random() * pool.length)]

  if (currentChants.includes(newChant)) return null
  return newChant
}

// ── Storyline Conclusion Evaluator ────────────────────────────────────────────

export interface StorylineConclusion {
  rating: number         // 0–100 how well it concluded
  legacy: string         // text summary
  pushImpact: Record<string, string>  // wrestlerId → push level change note
  rematchLikelihood: number  // 0–100
}

export function evaluateStorylineConclusion(
  storyline: Storyline,
  finalMatchRating: number,
  winnerId: string | null,
  crowdReaction: number
): StorylineConclusion {

  const peakHeat     = storyline.peakHeat
  const weeksActive  = storyline.segments.length
  const avgHeat      = storyline.heat

  // Quality = combo of final match, peak heat, and crowd reaction
  const rating = Math.round(
    (finalMatchRating * 0.40) +
    (peakHeat         * 0.25) +
    (crowdReaction    * 0.25) +
    (Math.min(weeksActive, 16) / 16 * 10)  // longevity bonus capped at 16 weeks
  )

  let legacy = ''
  if (rating >= 85)      legacy = 'An all-time classic feud. Fans will talk about this for years.'
  else if (rating >= 70) legacy = 'A strong, satisfying storyline with a clean conclusion.'
  else if (rating >= 55) legacy = 'A decent feud that delivered most of what it promised.'
  else if (rating >= 40) legacy = 'An underwhelming arc. The potential was there but the execution faltered.'
  else                   legacy = 'A forgettable storyline. Fans have already moved on.'

  const pushImpact: Record<string, string> = {}
  if (winnerId) {
    pushImpact[winnerId] = rating >= 70
      ? 'Momentum spike — ready for next push level'
      : 'Win noted — no immediate push change'
  }

  return {
    rating,
    legacy,
    pushImpact,
    rematchLikelihood: peakHeat >= 70 ? Math.min(90, peakHeat) : Math.max(10, peakHeat - 20),
  }
}

// ── New Storyline Builder ─────────────────────────────────────────────────────

export function buildStoryline(
  id: string,
  type: StorylineType,
  protagonistIds: string[],
  antagonistIds: string[],
  orgId: string,
  startWeek: number,
  titleAtStakeId: string | null = null,
  brandId: string | null = null
): Storyline {
  return {
    id,
    name: generateStorylineName(type, startWeek),
    type,
    status: 'active',
    protagonistIds,
    antagonistIds,
    supportingIds: [],
    startWeek,
    plannedEndWeek: startWeek + 12,
    actualEndWeek: null,
    heat: 20,   // starts cold — must be fed
    heatLevel: 'cold',
    peakHeat: 20,
    titleAtStakeId,
    segments: [],
    orgId,
    brandId,
    crowdChants: [],
    mediaAttention: 15,
    fanVotes: 10,
    isBreakoutStory: false,
    pushLevelBefore: {},
    pushLevelAfter: {},
  }
}

function generateStorylineName(type: StorylineType, week: number): string {
  const names: Record<StorylineType, string[]> = {
    title_chase:        ['The Pursuit', 'Unfinished Business', 'My Time Is Now'],
    revenge:            ['Personal Vendetta', 'Settling the Score', 'This Is War'],
    betrayal:           ['The Knife in the Back', 'Brotherhood Broken', 'Trust Nobody'],
    underdog_rise:      ['From Nothing', 'The Ascent', 'Against All Odds', 'My Destiny'],
    dominant_run:       ['The Reign of Terror', 'Undisputed', 'Acknowledge This'],
    redemption:         ['The Return', 'One More Run', 'Unfinished Legacy'],
    faction_war:        ['Civil War', 'House Divided', 'All Out War'],
    authority_conflict: ['Fighting the Machine', 'The Rebellion', 'Versus the System'],
    love_triangle:      ['Complicated', 'The Drama'],
    tournament:         ['The Tournament Arc', 'Prove Yourself'],
    underground_feud:   ['No Rules. No Mercy.', 'Blood Feud'],
  }
  const pool = names[type] ?? ['Untitled Storyline']
  return pool[Math.floor(Math.random() * pool.length)] + ` (Week ${week})`
}