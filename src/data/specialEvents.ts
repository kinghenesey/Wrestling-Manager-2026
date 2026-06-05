// ─────────────────────────────────────────────────────────────────────────────
// src/data/specialEvents.ts
// Special events per org tier — counts and names vary by tier
// ─────────────────────────────────────────────────────────────────────────────

export interface SpecialEventTemplate {
  name: string
  weekOfYear: number   // approximate week in the calendar year (1–52)
  isSignature: boolean // true = org's biggest event of the year
  prestige: number     // 0–100 how prestigious this event is
}

// Number of special events per tier
export const TIER_EVENT_COUNT: Record<string, number> = {
  elite:      12,  // monthly PPVs like WWE
  major:       6,  // bi-monthly
  regional:    4,  // quarterly
  indie:       2,  // twice a year
  local:       1,  // once a year
  underground: 0,  // no scheduled events — all spontaneous
}

// Generic special event name pools per tier
const ELITE_EVENTS: SpecialEventTemplate[] = [
  { name: 'Royal Rumble',         weekOfYear: 4,  isSignature: false, prestige: 90 },
  { name: 'Elimination Chamber', weekOfYear: 8,  isSignature: false, prestige: 80 },
  { name: 'WrestleMania',         weekOfYear: 13, isSignature: true,  prestige: 100 },
  { name: 'Backlash',             weekOfYear: 17, isSignature: false, prestige: 70 },
  { name: 'King of the Ring',     weekOfYear: 21, isSignature: false, prestige: 75 },
  { name: 'Money in the Bank',    weekOfYear: 25, isSignature: false, prestige: 82 },
  { name: 'SummerSlam',           weekOfYear: 30, isSignature: false, prestige: 92 },
  { name: 'Clash of Champions',   weekOfYear: 34, isSignature: false, prestige: 72 },
  { name: 'Hell in a Cell',       weekOfYear: 38, isSignature: false, prestige: 78 },
  { name: 'Crown Jewel',          weekOfYear: 42, isSignature: false, prestige: 68 },
  { name: 'Survivor Series',      weekOfYear: 46, isSignature: false, prestige: 85 },
  { name: 'TLC',                  weekOfYear: 50, isSignature: false, prestige: 74 },
]

const MAJOR_EVENTS: SpecialEventTemplate[] = [
  { name: 'Genesis',              weekOfYear: 5,  isSignature: false, prestige: 68 },
  { name: 'Lockdown',             weekOfYear: 14, isSignature: true,  prestige: 80 },
  { name: 'Slammiversary',        weekOfYear: 25, isSignature: false, prestige: 72 },
  { name: 'Bound for Glory',      weekOfYear: 38, isSignature: false, prestige: 85 },
  { name: 'Final Resolution',     weekOfYear: 46, isSignature: false, prestige: 65 },
  { name: 'Turning Point',        weekOfYear: 50, isSignature: false, prestige: 62 },
]

const REGIONAL_EVENTS: SpecialEventTemplate[] = [
  { name: 'Winter War',           weekOfYear: 6,  isSignature: false, prestige: 55 },
  { name: 'Spring Showdown',      weekOfYear: 16, isSignature: true,  prestige: 65 },
  { name: 'Summer Brawl',         weekOfYear: 30, isSignature: false, prestige: 60 },
  { name: 'Autumn Assault',       weekOfYear: 42, isSignature: false, prestige: 58 },
]

const INDIE_EVENTS: SpecialEventTemplate[] = [
  { name: 'Supershow',            weekOfYear: 15, isSignature: true,  prestige: 40 },
  { name: 'Year-End Spectacular', weekOfYear: 48, isSignature: false, prestige: 38 },
]

const LOCAL_EVENTS: SpecialEventTemplate[] = [
  { name: 'Anniversary Show',     weekOfYear: 26, isSignature: true,  prestige: 25 },
]

export const TIER_EVENTS: Record<string, SpecialEventTemplate[]> = {
  elite:      ELITE_EVENTS,
  major:      MAJOR_EVENTS,
  regional:   REGIONAL_EVENTS,
  indie:      INDIE_EVENTS,
  local:      LOCAL_EVENTS,
  underground: [],
}

// Generate org-specific event names by replacing generic names with org branding
export function getOrgSpecialEvents(
  orgId: string,
  orgShortName: string,
  tier: string,
  startYear: number,
  currentYear: number
): { name: string; week: number; isSignature: boolean; prestige: number; year: number }[] {
  const templates = TIER_EVENTS[tier] ?? []
  const yearOffset = (currentYear - startYear) * 52

  return templates.map(t => ({
    name:        t.isSignature ? `${orgShortName} ${t.name}` : t.name,
    week:        t.weekOfYear + yearOffset,
    isSignature: t.isSignature,
    prestige:    t.prestige,
    year:        currentYear,
  }))
}