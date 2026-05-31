// ─────────────────────────────────────────────────────────────────────────────
// src/types/show.ts
// ─────────────────────────────────────────────────────────────────────────────

export type ShowType = 'weekly' | 'ppv' | 'special' | 'underground_event'
export type MatchType =
  | 'singles'
  | 'tag'
  | 'triple_threat'
  | 'fatal_fourway'
  | 'ladder'
  | 'cage'
  | 'hell_in_a_cell'
  | 'last_man_standing'
  | 'tables'
  | 'battle_royal'
  | 'tournament_match'
  | 'intergender'         // special events only

export type MatchStipulation =
  | 'none'
  | 'title_match'
  | 'number_one_contender'
  | 'loser_leaves'
  | 'career_vs_career'
  | 'mask_vs_mask'
  | 'hair_vs_hair'
  | 'underground_rules'   // no DQ, no count-out

export type SegmentType =
  | 'match'
  | 'promo'
  | 'interview'
  | 'attack'
  | 'contract_signing'
  | 'title_presentation'
  | 'entrance_spectacle'
  | 'award_presentation'

export interface MatchResult {
  winnerId: string | null           // null = draw
  winnerIds: string[]               // for tag matches
  method: 'pinfall' | 'submission' | 'dq' | 'count_out' | 'no_contest' | 'forfeit'
  finishingMove: string
  matchRating: number               // 0–100 quality of match
  crowdRating: number               // 0–100 crowd reaction
  matchDurationMinutes: number
}

export interface Match {
  id: string
  showId: string
  matchType: MatchType
  stipulation: MatchStipulation
  titleId: string | null            // title on the line

  participantIds: string[]          // all wrestlers in match
  teamA: string[]
  teamB: string[]
  refereeid: string | null

  position: number                  // show order (1 = opener, last = main event)
  isMainEvent: boolean
  expectedRating: number            // booker's expectation before show
  result: MatchResult | null        // null = not yet happened

  storylineId: string | null
  notes: string                     // booker notes
}

export interface ShowSegment {
  id: string
  showId: string
  type: SegmentType
  position: number
  participantIds: string[]
  description: string
  durationMinutes: number
  heatGenerated: number             // 0–100
  rating: number                    // 0–100 quality score
}

export interface Show {
  id: string
  orgId: string
  brandId: string | null
  name: string                      // e.g. "Monday Mayhem Week 47"
  type: ShowType
  week: number                      // game week number
  venue: string
  city: string
  region: string
  attendance: number
  capacity: number

  segments: ShowSegment[]
  matches: Match[]

  overallRating: number             // 0–100 calculated after show
  crowdRating: number               // 0–100
  tvRating: number                  // 0–10 scale
  ppvBuys: number | null            // only for PPV shows
  revenue: number                   // gate + merch + TV deal

  isSimulated: boolean              // false = player booked it
  notes: string
}