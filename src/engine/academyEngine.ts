// ─────────────────────────────────────────────────────────────────────────────
// src/engine/academyEngine.ts
// Developmental system — scouting prospects, training, graduating to main roster
// ─────────────────────────────────────────────────────────────────────────────

import type { Wrestler, WrestlerStats, Gender, WeightClass } from '../types/wrestler'

// ── Prospect Definition ───────────────────────────────────────────────────────

export type ProspectStage =
  | 'raw'           // just signed — total green
  | 'trainee'       // in training, improving fast
  | 'ready'         // ready for local/indie circuit
  | 'graduate'      // main roster callup candidate

export type TrainingFocus =
  | 'in_ring'
  | 'promo'
  | 'character'     // charisma + look
  | 'athleticism'
  | 'psychology'
  | 'general'       // balanced improvement

export interface Prospect {
  id: string
  name: string
  realName: string
  age: number
  gender: Gender
  nationality: string
  weightClass: WeightClass
  portraitId: string

  stage: ProspectStage
  weeksInAcademy: number
  trainingFocus: TrainingFocus

  // Raw attributes — these grow over time
  currentStats: WrestlerStats
  potential: number           // hidden 0–100 — determines ceiling
  peakAge: number

  // Development progress
  progressPercent: number     // 0–100 toward next stage
  weeklyGrowthRate: number    // how fast this prospect develops
  breakthroughMoments: number // count of big training milestones

  // Scouting info
  scoutedByOrgId: string
  scoutingReport: string
  scoutingRating: number      // 0–100 scout's impression
  isHiddenGem: boolean        // scout missed something — true potential higher

  // Attitude / work ethic
  workEthic: number           // 0–100 affects growth rate
  attitude: number            // 0–100 potential backstage issues if low
  coachability: number        // 0–100 how well they absorb training

  bio: string
  finisherInDevelopment: string
}

// ── Prospect Generation ───────────────────────────────────────────────────────

const NATIONALITY_POOL = [
  'American', 'British', 'Nigerian', 'Brazilian', 'Mexican', 'Japanese',
  'Canadian', 'Australian', 'Samoan', 'German', 'Irish', 'Jamaican',
  'South African', 'Egyptian', 'Colombian', 'Filipino',
]

export function generateProspect(
  orgId: string,
  gender: Gender,
  weightClass: WeightClass,
  portraitId: string
): Prospect {
  const potential   = Math.floor(Math.random() * 45) + 55   // 55–100
  const isHiddenGem = Math.random() < 0.12                  // 12% chance
  const workEthic   = Math.floor(Math.random() * 40) + 60   // 60–100
  const age         = Math.floor(Math.random() * 8) + 18    // 18–25

  // Low starting stats — this is the point, they grow
  const rawStats: WrestlerStats = {
    inRing:       Math.floor(Math.random() * 25) + 15,   // 15–40
    promo:        Math.floor(Math.random() * 25) + 15,
    charisma:     Math.floor(Math.random() * 30) + 20,   // natural charisma varies more
    athleticism:  Math.floor(Math.random() * 30) + 20,
    psychology:   Math.floor(Math.random() * 20) + 10,   // lowest — learned over time
    look:         Math.floor(Math.random() * 30) + 45,   // appearance more innate
    toughness:    Math.floor(Math.random() * 30) + 40,
    stamina:      Math.floor(Math.random() * 30) + 40,
  }

  const nationality = NATIONALITY_POOL[Math.floor(Math.random() * NATIONALITY_POOL.length)]

  return {
    id:           `prospect_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    name:         '',        // set by player when signing
    realName:     '',
    age,
    gender,
    nationality,
    weightClass,
    portraitId,
    stage:        'raw',
    weeksInAcademy: 0,
    trainingFocus:  'general',
    currentStats:   rawStats,
    potential,
    peakAge:      Math.floor(Math.random() * 6) + 27,    // peak at 27–32
    progressPercent: 0,
    weeklyGrowthRate: calculateGrowthRate(workEthic, potential),
    breakthroughMoments: 0,
    scoutedByOrgId: orgId,
    scoutingReport: generateScoutingReport(rawStats, potential, isHiddenGem),
    scoutingRating: isHiddenGem
      ? Math.floor(potential * 0.5)    // scout underrates them
      : Math.floor(potential * 0.85),
    isHiddenGem,
    workEthic,
    attitude:     Math.floor(Math.random() * 40) + 60,
    coachability: Math.floor(Math.random() * 40) + 55,
    bio:          '',
    finisherInDevelopment: '',
  }
}

function calculateGrowthRate(workEthic: number, potential: number): number {
  // Base growth 2–5 stat points per week at focused training
  return 2 + (workEthic / 100) * 2 + (potential / 100) * 1
}

// ── Weekly Training Simulation ────────────────────────────────────────────────

export interface TrainingResult {
  statGains: Partial<WrestlerStats>
  progressGained: number
  hadBreakthrough: boolean
  breakthroughDescription: string
  attitudeChange: number
  newStage: ProspectStage | null     // null = no stage change this week
}

const FOCUS_GAINS: Record<TrainingFocus, (keyof WrestlerStats)[]> = {
  in_ring:      ['inRing', 'psychology', 'stamina'],
  promo:        ['promo', 'charisma'],
  character:    ['charisma', 'look', 'promo'],
  athleticism:  ['athleticism', 'stamina', 'toughness'],
  psychology:   ['psychology', 'inRing'],
  general:      ['inRing', 'promo', 'charisma', 'athleticism', 'psychology'],
}

export function simulateWeeklyTraining(prospect: Prospect): TrainingResult {
  const statGains: Partial<WrestlerStats> = {}
  const focusStats = FOCUS_GAINS[prospect.trainingFocus]
  const baseGain   = prospect.weeklyGrowthRate

  let totalGain = 0

  for (const stat of focusStats) {
    const currentVal = prospect.currentStats[stat]
    const ceiling    = prospect.potential     // stats can't exceed potential

    if (currentVal >= ceiling) continue       // maxed out this stat

    // Diminishing returns as stat approaches ceiling
    const room       = ceiling - currentVal
    const diminish   = Math.min(1, room / 20)
    const coachMult  = prospect.coachability / 100
    const gain       = Math.round(baseGain * diminish * coachMult * (Math.random() * 0.6 + 0.7))

    if (gain > 0) {
      statGains[stat] = Math.min(gain, room)
      totalGain += statGains[stat]!
    }
  }

  // Progress toward next stage
  const progressGained = Math.round(totalGain * 0.8 + prospect.workEthic * 0.05)

  // Breakthrough moment (5% base chance, higher for high work ethic)
  const breakthroughChance = 0.05 + (prospect.workEthic - 50) / 1000
  const hadBreakthrough    = Math.random() < breakthroughChance

  let breakthroughDescription = ''
  if (hadBreakthrough) {
    const breakthroughs = [
      'Had a click moment in the ring — everything suddenly makes sense.',
      'Delivered their first genuinely great promo in training.',
      'Showed a natural instinct for reading the crowd.',
      'Their athleticism took a visible leap this week.',
      'The coaching staff is buzzing about this one.',
      'Looked like a completely different wrestler in the ring today.',
    ]
    breakthroughDescription = breakthroughs[Math.floor(Math.random() * breakthroughs.length)]
  }

  // Attitude drift
  const attitudeChange = Math.round((Math.random() * 4) - 2)   // -2 to +2

  // Stage advancement check
  let newStage: ProspectStage | null = null
  const newProgress = prospect.progressPercent + progressGained

  const STAGE_THRESHOLDS: Record<ProspectStage, number> = {
    raw: 100, trainee: 200, ready: 300, graduate: 999,
  }

  if (newProgress >= STAGE_THRESHOLDS[prospect.stage]) {
    const stageOrder: ProspectStage[] = ['raw', 'trainee', 'ready', 'graduate']
    const idx = stageOrder.indexOf(prospect.stage)
    if (idx < stageOrder.length - 1) {
      newStage = stageOrder[idx + 1]
    }
  }

  return {
    statGains,
    progressGained: hadBreakthrough ? progressGained * 2 : progressGained,
    hadBreakthrough,
    breakthroughDescription,
    attitudeChange,
    newStage,
  }
}

// ── Graduation Readiness ──────────────────────────────────────────────────────

export interface GraduationAssessment {
  isReady: boolean
  readinessScore: number       // 0–100
  recommendedPushLevel: string
  concerns: string[]
  strengths: string[]
  suggestedFirstFeud: string
}

export function assessGraduationReadiness(prospect: Prospect): GraduationAssessment {
  const stats = prospect.currentStats
  const concerns: string[] = []
  const strengths: string[] = []

  // Scoring
  const avgStats = Object.values(stats).reduce((a, b) => a + b, 0) / 8
  const readinessScore = Math.round(
    (avgStats * 0.5) +
    (prospect.potential * 0.2) +
    (prospect.workEthic * 0.15) +
    (prospect.attitude * 0.15)
  )

  // Strengths
  if (stats.inRing >= 60)      strengths.push('Solid in-ring foundation')
  if (stats.promo >= 60)       strengths.push('Can talk on the mic')
  if (stats.charisma >= 65)    strengths.push('Natural crowd connection')
  if (stats.athleticism >= 65) strengths.push('Athletic highlight package')
  if (stats.psychology >= 55)  strengths.push('Understands match storytelling')
  if (prospect.potential >= 85) strengths.push(`High ceiling — potential ${prospect.potential}/100`)

  // Concerns
  if (stats.inRing < 45)      concerns.push('Still rough in the ring — needs ring time')
  if (stats.promo < 40)       concerns.push('Weak on the mic — needs promo coach or mute gimmick')
  if (stats.psychology < 40)  concerns.push('Struggles to tell a story in matches')
  if (prospect.attitude < 55) concerns.push('Attitude issues reported — monitor closely')
  if (prospect.weeksInAcademy < 26) concerns.push('May be too early — less than 6 months in academy')

  // Recommended push
  let recommendedPushLevel = 'jobber'
  if (readinessScore >= 70) recommendedPushLevel = 'enhancement'
  if (readinessScore >= 80) recommendedPushLevel = 'midcard'

  // Suggested first feud type
  let suggestedFirstFeud = 'Enhancement matches to build experience'
  if (stats.charisma >= 65 && stats.promo >= 55) {
    suggestedFirstFeud = 'Short promo-led feud with a midcarder — let them talk their way in'
  } else if (stats.athleticism >= 70) {
    suggestedFirstFeud = 'Match-quality feud — let their athleticism do the talking'
  }

  return {
    isReady: readinessScore >= 60 && prospect.stage === 'graduate',
    readinessScore,
    recommendedPushLevel,
    concerns,
    strengths,
    suggestedFirstFeud,
  }
}

// ── Prospect to Wrestler Converter ────────────────────────────────────────────
// Graduates a prospect into a full Wrestler object for main roster

export function graduateProspect(
  prospect: Prospect,
  orgId: string,
  brandId: string | null,
  salary: number
): Omit<Wrestler, 'contract'> & { contract: import('../types/wrestler').Contract } {
  const assessment = assessGraduationReadiness(prospect)

  return {
    id:           prospect.id,
    name:         prospect.name,
    realName:     prospect.realName,
    age:          prospect.age,
    gender:       prospect.gender,
    nationality:  prospect.nationality,
    weightClass:  prospect.weightClass,
    alignment:    'face',                    // default — will evolve
    pushLevel:    assessment.recommendedPushLevel as any,
    status:       'active',
    stats:        { ...prospect.currentStats },
    potential:    prospect.potential,
    peakAge:      prospect.peakAge,
    popularity:   20,
    momentum:     25,
    morale:       85,
    overness:     15,
    experience:   prospect.weeksInAcademy,
    portraitId:   prospect.portraitId,
    portraitStyle: 'game-art',
    currentOrgId: orgId,
    currentBrandId: brandId,
    contract: {
      salary,
      bonuses:         Math.round(salary * 0.1),
      weeksRemaining:  52,
      exclusivity:     'exclusive',
      happiness:       82,
      noTradeClause:   false,
      signingOrgId:    orgId,
    },
    injury:        null,
    championships: [],
    currentFeuds:  [],
    agentId:       null,
    bio:           prospect.bio || `Graduate of the ${orgId.toUpperCase()} Performance Center.`,
    catchphrase:   '',
    finisher:      prospect.finisherInDevelopment || 'TBD',
    signature:     '',
    tagTeamPartnerIds: [],
    tagTeamChemistry:  {},
    isRookie:      true,
    careerHighlights: [`Graduated from ${orgId.toUpperCase()} Academy`],
    weeklyEarnings: salary,
    fanDemographics: { casual: 15, hardcore: 20, internet: 18, regional: 20 },
  }
}

// ── Scouting Report Generator ─────────────────────────────────────────────────

function generateScoutingReport(
  stats: WrestlerStats,
  potential: number,
  isHiddenGem: boolean
): string {
  if (isHiddenGem) {
    return 'Unpolished and easy to overlook. Limited experience shows. However, there is something intangible here — a presence that is hard to quantify. Worth monitoring closely.'
  }

  if (potential >= 90) {
    return `One of the most talented prospects I have scouted in years. The tools are all there — it is just about developing them. Generational ceiling if everything clicks.`
  }

  if (potential >= 75) {
    return `Solid prospect with a clear upside. Good fundamentals and the right attitude. Should develop into a reliable roster member with proper coaching.`
  }

  return `Functional talent with modest upside. Will likely serve as a solid addition to the roster at the mid-card level. Nothing exceptional but dependable.`
}