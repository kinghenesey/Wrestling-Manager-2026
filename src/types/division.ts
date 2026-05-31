// ─────────────────────────────────────────────────────────────────────────────
// src/types/division.ts
// ─────────────────────────────────────────────────────────────────────────────

import type { Gender } from './wrestler'

export type DivisionTier =
  | 'elite'        // Tier 1 — top orgs, TV deals, massive budgets
  | 'major'        // Tier 2 — national presence, some TV
  | 'regional'     // Tier 3 — strong regional following
  | 'indie'        // Tier 4 — independent circuit
  | 'local'        // Tier 5 — where player starts
  | 'underground'  // No owner, lawless, free agent zone

export type ManagerReputation =
  | 'unknown'      // Tier 5 only (starting reputation)
  | 'regional'     // Unlocks Tier 4
  | 'respected'    // Unlocks Tier 3
  | 'notable'      // Unlocks Tier 2
  | 'elite'        // Unlocks Tier 1
  | 'legendary'    // All orgs, underground influence

export interface Brand {
  id: string
  orgId: string
  name: string                    // e.g. "Apex Raw", "Apex Friday Fury"
  gender: Gender | 'mixed'
  roster: string[]                // wrestler IDs on this brand
  titleIds: string[]
  weeklyShowName: string          // e.g. "Monday Mayhem"
  weeklyShowDay: string           // "Monday" | "Friday" etc.
  avgViewership: number           // weekly viewers
}

export interface Organization {
  id: string
  name: string
  shortName: string               // e.g. "AWF", "TPW"
  tier: DivisionTier
  logoPath: string | null
  region: string                  // main operating region
  prestige: number                // 0–100
  fanbase: number                 // 0–100
  wealth: number                  // weekly budget in $
  tvDeal: boolean
  tvNetwork: string | null        // e.g. "Apex Sports Network"
  tvRating: number                // weekly TV rating (0–10 scale)
  ppvBuyrate: number              // avg PPV buys

  roster: string[]                // wrestler IDs
  brands: Brand[]
  titleIds: string[]

  managerId: string | null        // player or AI manager
  rivalOrgIds: string[]           // orgs they compete with for talent

  canPoachFrom: DivisionTier[]    // which tiers they recruit from
  reputationRequired: ManagerReputation  // manager rep needed to be hired
}