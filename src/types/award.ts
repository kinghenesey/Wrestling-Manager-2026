// ─────────────────────────────────────────────────────────────────────────────
// src/types/award.ts
// ─────────────────────────────────────────────────────────────────────────────
 
export type AwardCategory =
  | 'wrestler_of_year'
  | 'female_wrestler_of_year'
  | 'best_young_wrestler'        // under 25, under 2 years experience
  | 'best_tag_team'
  | 'best_feud'
  | 'best_match'                 // highest rated match of the year
  | 'best_promo'
  | 'comeback_of_year'           // returned from injury/hiatus
  | 'most_improved'
  | 'breakout_star'              // the "Obafemi Award" — overnight rise
  | 'best_manager_of_year'
  | 'best_org_of_year'
  | 'best_show_of_year'
  | 'legend_award'               // lifetime achievement
  | 'underground_king'           // underground scene award
 
export interface AwardNominee {
  id: string                     // wrestler/org/manager ID
  name: string
  votePercent: number
}
 
export interface Award {
  id: string
  year: number
  week: number                   // which week the ceremony happened
  category: AwardCategory
  nominees: AwardNominee[]
  winnerId: string
  winnerName: string
  voteBreakdown: {
    fanVotes: number             // 60% weight
    mediaVotes: number           // 25% weight
    peerVotes: number            // 15% (wrestlers vote for each other)
  }
  moraleBoostWinner: number      // morale delta for winner
  moraleDipLosers: number        // morale delta for nominees who lost
  orgId: string | null           // null = industry-wide award
}
 
export interface AwardsCeremony {
  id: string
  year: number
  week: number
  orgId: string | null
  name: string                   // e.g. "The Golden Headlock Awards"
  awards: Award[]
  tvRating: number
  attendance: number
  isSimulated: boolean
}