// ─────────────────────────────────────────────────────────────────────────────
// src/engine/crowdEngine.ts
// Regional crowd psychology — different markets react differently
// ─────────────────────────────────────────────────────────────────────────────
 
export type CrowdRegion =
  | 'northeast_us'
  | 'southern_us'
  | 'midwest_us'
  | 'west_coast_us'
  | 'uk_europe'
  | 'japan'
  | 'latin_america'
  | 'africa'
  | 'australia'
  | 'middle_east'
 
export interface RegionProfile {
  name: string
  prefersStyle: ('technical' | 'brawler' | 'highflyer' | 'powerhouse' | 'charismatic')[]
  heelReactionBonus: number    // how much extra heat heels get here
  faceReactionBonus: number
  chantCulture: number         // 0–100 how likely organic chants are
  sophistication: number       // 0–100 (high = internet/smark crowd)
  bonus: number                // flat show rating bonus in this region
}
 
export const REGION_PROFILES: Record<CrowdRegion, RegionProfile> = {
  northeast_us: {
    name: 'Northeast US',
    prefersStyle: ['technical', 'charismatic'],
    heelReactionBonus: 8,
    faceReactionBonus: 5,
    chantCulture: 90,
    sophistication: 85,
    bonus: 3,
  },
  southern_us: {
    name: 'Southern US',
    prefersStyle: ['brawler', 'powerhouse'],
    heelReactionBonus: 12,
    faceReactionBonus: 10,
    chantCulture: 55,
    sophistication: 45,
    bonus: 2,
  },
  midwest_us: {
    name: 'Midwest US',
    prefersStyle: ['powerhouse', 'brawler', 'charismatic'],
    heelReactionBonus: 7,
    faceReactionBonus: 9,
    chantCulture: 60,
    sophistication: 55,
    bonus: 2,
  },
  west_coast_us: {
    name: 'West Coast US',
    prefersStyle: ['highflyer', 'technical', 'charismatic'],
    heelReactionBonus: 6,
    faceReactionBonus: 8,
    chantCulture: 80,
    sophistication: 78,
    bonus: 2,
  },
  uk_europe: {
    name: 'UK / Europe',
    prefersStyle: ['technical', 'charismatic', 'brawler'],
    heelReactionBonus: 10,
    faceReactionBonus: 7,
    chantCulture: 95,   // British crowds are THE chant culture
    sophistication: 80,
    bonus: 3,
  },
  japan: {
    name: 'Japan',
    prefersStyle: ['technical', 'highflyer'],
    heelReactionBonus: 4,   // Japanese crowds respect heels more
    faceReactionBonus: 6,
    chantCulture: 20,        // respectful applause, not chants
    sophistication: 95,
    bonus: 4,                // matches rated higher for pure quality
  },
  latin_america: {
    name: 'Latin America',
    prefersStyle: ['highflyer', 'charismatic'],
    heelReactionBonus: 14,
    faceReactionBonus: 14,
    chantCulture: 85,
    sophistication: 60,
    bonus: 3,
  },
  africa: {
    name: 'Africa',
    prefersStyle: ['powerhouse', 'charismatic', 'brawler'],
    heelReactionBonus: 12,
    faceReactionBonus: 15,
    chantCulture: 70,
    sophistication: 50,
    bonus: 2,
  },
  australia: {
    name: 'Australia',
    prefersStyle: ['brawler', 'technical'],
    heelReactionBonus: 9,
    faceReactionBonus: 8,
    chantCulture: 72,
    sophistication: 70,
    bonus: 2,
  },
  middle_east: {
    name: 'Middle East',
    prefersStyle: ['powerhouse', 'charismatic'],
    heelReactionBonus: 5,
    faceReactionBonus: 10,
    chantCulture: 40,
    sophistication: 55,
    bonus: 5,   // huge production budgets, premium atmosphere
  },
}
 
export function getRegionBonus(
  region: CrowdRegion,
  wrestlerAlignment: 'face' | 'heel' | 'tweener'
): number {
  const profile = REGION_PROFILES[region]
  if (wrestlerAlignment === 'heel') return profile.heelReactionBonus
  if (wrestlerAlignment === 'face') return profile.faceReactionBonus
  return Math.round((profile.heelReactionBonus + profile.faceReactionBonus) / 2)
}
 
export function getShowRegionBonus(region: CrowdRegion): number {
  return REGION_PROFILES[region]?.bonus ?? 0
}
 