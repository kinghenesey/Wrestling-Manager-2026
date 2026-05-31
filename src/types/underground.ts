// ─────────────────────────────────────────────────────────────────────────────
// src/types/underground.ts
// ─────────────────────────────────────────────────────────────────────────────
 
export interface UndergroundEvent {
  id: string
  name: string
  week: number
  venue: string                  // warehouse, back alley, etc.
  city: string
  attendance: number             // always small — underground is niche
  matchIds: string[]
  titleId: string | null         // underground title sometimes on line
  organizedBy: string | null     // rogue promoter ID (no org = true underground)
  noRules: boolean               // always true for underground
  prizePool: number              // cash prize instead of contract
}
 
export interface FreeAgent {
  wrestlerId: string
  weeksAvailable: number         // how long they've been in the pool
  askingSalary: number
  interestedOrgIds: string[]     // orgs bidding for them
  lastOrgId: string | null
  undergroundAppearances: number // how many underground events they've done
  isExclusive: boolean           // false = truly free
}