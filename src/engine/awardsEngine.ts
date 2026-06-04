// ─────────────────────────────────────────────────────────────────────────────
// src/engine/awardsEngine.ts
// Year-end awards calculation — fan/media/peer votes, ceremony generation
// ─────────────────────────────────────────────────────────────────────────────
 
import type { Wrestler } from '../types/wrestler'
import type { Show } from '../types/show'
import type { Award, AwardCategory, AwardsCeremony, AwardNominee } from '../types/award'
 
export interface YearStats {
  wrestlerId: string
  totalMatches: number
  avgMatchRating: number
  bestMatchRating: number
  titleReignWeeks: number
  feudsCount: number
  peakMomentum: number
  avgPopularity: number
  promoSegments: number
  avgPromoRating: number
  returnedFromInjury: boolean
  weeksExperience: number
  isRookie: boolean        // under 2 years experience
}
 
// ── Nominee Generator ─────────────────────────────────────────────────────────
 
export function generateNominees(
  category: AwardCategory,
  wrestlers: Wrestler[],
  yearStats: YearStats[],
  shows: Show[]
): AwardNominee[] {
 
  const statsMap = new Map(yearStats.map(s => [s.wrestlerId, s]))
 
  let candidates = [...wrestlers]
 
  // Filter by category
  switch (category) {
    case 'wrestler_of_year':
    case 'best_promo':
      candidates = candidates.filter(w => w.gender === 'male' || w.gender === 'female')
      break
    case 'female_wrestler_of_year':
      candidates = candidates.filter(w => w.gender === 'female')
      break
    case 'best_young_wrestler':
    case 'breakout_star':
      candidates = candidates.filter(w => w.age <= 25 || w.experience <= 104)
      break
    case 'comeback_of_year':
      candidates = candidates.filter(w => statsMap.get(w.id)?.returnedFromInjury)
      break
    case 'most_improved':
      candidates = candidates.filter(w => {
        const s = statsMap.get(w.id)
        return s && s.avgMatchRating >= 65 && s.weeksExperience < 200
      })
      break
  }
 
  if (candidates.length === 0) return []
 
  // Score each candidate
  const scored = candidates.map(w => {
    const s = statsMap.get(w.id)
    const score = scoreCandidateForCategory(w, s, category, shows)
    return { wrestler: w, score }
  })
 
  // Sort and take top 5
  scored.sort((a, b) => b.score - a.score)
  const top5 = scored.slice(0, 5)
 
  const totalScore = top5.reduce((sum, c) => sum + c.score, 0)
 
  return top5.map(c => ({
    id:          c.wrestler.id,
    name:        c.wrestler.name,
    votePercent: Math.round((c.score / totalScore) * 100),
  }))
}
 
function scoreCandidateForCategory(
  wrestler: Wrestler,
  stats: YearStats | undefined,
  category: AwardCategory,
  _shows: Show[]
): number {
  if (!stats) return wrestler.overness * 0.5
 
  switch (category) {
    case 'wrestler_of_year':
    case 'female_wrestler_of_year':
      return (
        stats.avgMatchRating * 0.30 +
        wrestler.overness    * 0.25 +
        stats.avgPopularity  * 0.20 +
        stats.titleReignWeeks * 0.15 +
        stats.totalMatches   * 0.10
      )
 
    case 'best_young_wrestler':
      return (
        stats.avgMatchRating * 0.35 +
        wrestler.potential   * 0.25 +
        stats.peakMomentum   * 0.20 +
        wrestler.overness    * 0.20
      )
 
    case 'breakout_star':
      return (
        stats.peakMomentum   * 0.40 +   // the Obafemi Award — momentum is king
        wrestler.popularity  * 0.30 +
        stats.totalMatches   * 0.10 +
        wrestler.potential   * 0.20
      )
 
    case 'best_match':
      return stats.bestMatchRating
 
    case 'best_promo':
      return (
        stats.avgPromoRating  * 0.50 +
        wrestler.stats.promo  * 0.30 +
        wrestler.stats.charisma * 0.20
      )
 
    case 'comeback_of_year':
      return (
        stats.peakMomentum  * 0.40 +
        wrestler.popularity * 0.35 +
        wrestler.overness   * 0.25
      )
 
    case 'most_improved':
      return (
        stats.avgMatchRating * 0.40 +
        stats.peakMomentum   * 0.30 +
        wrestler.potential   * 0.30
      )
 
    default:
      return wrestler.overness
  }
}
 
// ── Vote Calculation ──────────────────────────────────────────────────────────
 
export function calculateAwardWinner(
  nominees: AwardNominee[],
  _category: AwardCategory
): { winnerId: string; breakdown: Award['voteBreakdown'] } {
  if (nominees.length === 0) return { winnerId: '', breakdown: { fanVotes: 0, mediaVotes: 0, peerVotes: 0 } }
 
  // Fan votes weighted by popularity/overness — already encoded in votePercent
  // Media votes have a slight bias toward technical excellence
  // Peer votes have a bias toward respected veterans
 
  const winner = nominees.reduce((best, n) => n.votePercent > best.votePercent ? n : best)
 
  return {
    winnerId: winner.id,
    breakdown: {
      fanVotes:   Math.round(winner.votePercent * 0.60),
      mediaVotes: Math.round(winner.votePercent * 0.25),
      peerVotes:  Math.round(winner.votePercent * 0.15),
    },
  }
}
 
// ── Full Ceremony Builder ─────────────────────────────────────────────────────
 
export function buildAwardsCeremony(
  id: string,
  year: number,
  week: number,
  orgId: string | null,
  wrestlers: Wrestler[],
  yearStats: YearStats[],
  shows: Show[]
): AwardsCeremony {
 
  const categories: AwardCategory[] = [
    'wrestler_of_year', 'female_wrestler_of_year', 'best_young_wrestler',
    'best_tag_team', 'best_feud', 'best_match', 'best_promo',
    'comeback_of_year', 'most_improved', 'breakout_star',
    'best_manager_of_year', 'best_org_of_year', 'underground_king', 'legend_award',
  ]
 
  const awards: Award[] = categories.map((cat, _i) => {
    const nominees = generateNominees(cat, wrestlers, yearStats, shows)
    const { winnerId, breakdown } = calculateAwardWinner(nominees, cat)
 
    return {
      id:         `award_${year}_${cat}`,
      year,
      week,
      category:   cat,
      nominees,
      winnerId,
      winnerName: wrestlers.find(w => w.id === winnerId)?.name ?? 'TBD',
      voteBreakdown: breakdown,
      moraleBoostWinner: 15,
      moraleDipLosers:   5,
      orgId,
    }
  })
 
  return {
    id,
    year,
    week,
    orgId,
    name:        `The ${year} Golden Headlock Awards`,
    awards,
    tvRating:    3.5,
    attendance:  15000,
    isSimulated: false,
  }
}