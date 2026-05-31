// ─────────────────────────────────────────────────────────────────────────────
// src/types/wrestler.ts
// ─────────────────────────────────────────────────────────────────────────────

export type Gender = 'male' | 'female'
export type Alignment = 'face' | 'heel' | 'tweener'
export type PushLevel = 'jobber' | 'enhancement' | 'midcard' | 'uppercard' | 'mainevent' | 'champion'
export type WrestlerStatus = 'active' | 'injured' | 'suspended' | 'developmental' | 'retired' | 'free_agent'
export type WeightClass = 'cruiserweight' | 'lightweight' | 'middleweight' | 'heavyweight' | 'super_heavyweight'
export type PortraitStyle = 'game-art' | 'realistic'

export interface WrestlerStats {
  inRing: number        // 0–100 technical match quality
  promo: number         // 0–100 mic work ability
  charisma: number      // 0–100 crowd connection
  athleticism: number   // 0–100 physical ability / moveset
  psychology: number    // 0–100 storytelling inside ring
  look: number          // 0–100 appearance / presence
  toughness: number     // 0–100 injury resistance
  stamina: number       // 0–100 late-match performance
}

export interface Contract {
  salary: number                            // weekly pay
  bonuses: number                           // title/PPV bonuses per appearance
  weeksRemaining: number
  exclusivity: 'exclusive' | 'open'         // open = can work other orgs
  happiness: number                         // 0–100
  noTradeClause: boolean
  signingOrgId: string
}

export interface Injury {
  type: string                              // e.g. "Torn ACL", "Kayfabe Injury"
  isKayfabe: boolean                        // fake injury for storyline
  weeksOut: number
  weeksRemaining: number
  severity: 'minor' | 'moderate' | 'severe'
}

export interface Championship {
  titleId: string
  wonWeek: number
  defenses: number
}

export interface Wrestler {
  id: string
  name: string                              // ring name
  realName: string
  age: number
  gender: Gender
  nationality: string
  weightClass: WeightClass
  alignment: Alignment
  pushLevel: PushLevel
  status: WrestlerStatus

  stats: WrestlerStats
  potential: number                         // hidden, 0–100
  peakAge: number                           // age they hit their ceiling

  popularity: number                        // 0–100 current crowd reaction
  momentum: number                          // 0–100 hot streak tracker
  morale: number                            // 0–100 backstage happiness
  overness: number                          // 0–100 how over they are long-term
  experience: number                        // weeks in professional wrestling

  portraitId: string                        // maps to src/assets/portraits/{id}.png/jpg
  portraitStyle: PortraitStyle

  currentOrgId: string | null
  currentBrandId: string | null
  contract: Contract | null
  injury: Injury | null
  championships: Championship[]
  currentFeuds: string[]                    // opponent wrestler IDs
  agentId: string | null                    // manager/agent ID

  bio: string
  catchphrase: string
  finisher: string
  signature: string

  tagTeamPartnerIds: string[]
  tagTeamChemistry: Record<string, number>  // partnerId → chemistry 0–100

  isRookie: boolean
  careerHighlights: string[]                // e.g. "Won AWF World Title Week 204"

  weeklyEarnings: number                    // salary + title bonus
  fanDemographics: FanDemographic           // which fans react to them
}

export interface FanDemographic {
  casual: number       // 0–100
  hardcore: number     // 0–100
  internet: number     // 0–100 (smarkish fans)
  regional: number     // 0–100 (local market fans)
}