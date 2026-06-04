import type { Wrestler, Contract } from "@/types/wrestler"
import type { Organization } from "@/types/division"

export interface NegotiationResult {
  outcome: "accepted" | "rejected" | "countered" | "ghosted"
  reason: string
  counterOffer?: { salary: number; weeksRemaining: number }
  alternativeOrgHint?: string
  wrestlerMood: "thrilled" | "happy" | "neutral" | "unhappy" | "insulted"
}

const REP_TIER_VALUE: Record<string, number> = {
  legendary: 100, elite: 80, notable: 60, respected: 40, regional: 20, unknown: 5
}

const ORG_TIER_VALUE: Record<string, number> = {
  elite: 100, major: 70, regional: 45, indie: 25, local: 10, underground: 0
}

const ALTERNATIVE_ORGS: Record<string, string[]> = {
  elite:      ["AWF", "TPW", "GCW"],
  major:      ["IRA", "NFW", "APW"],
  regional:   ["NBC", "SWF", "EWUK"],
  indie:      ["SFI", "RWI", "WSX"],
  local:      ["LLW", "CWL", "HLW"],
  underground:["The Underground"],
}

export function simulateFreeAgentResponse(
  wrestler: Wrestler,
  offer: Contract,
  org: Organization,
  managerReputation: string
): NegotiationResult {
  const orgTierVal  = ORG_TIER_VALUE[org.tier] ?? 10
  const repVal      = REP_TIER_VALUE[managerReputation] ?? 5
  const wrestlerVal = Math.round((wrestler.overness + wrestler.popularity + wrestler.momentum) / 3)

  // How attractive is this org to this wrestler
  // High overness wrestlers want better orgs
  const orgAttractiveness = orgTierVal + (repVal * 0.3)
  const wrestlerExpectation = wrestlerVal * 0.8

  const gap = wrestlerExpectation - orgAttractiveness

  // Salary check
  const avgStat = Math.round(Object.values(wrestler.stats).reduce((a, b) => a + b, 0) / 8)
  const minimumAcceptable = Math.max(100, Math.round(avgStat * 3 + wrestler.popularity * 2 + wrestlerVal * 1.5))
  const offerRatio = offer.salary / minimumAcceptable

  // ── Superstar refuses low-tier org outright ──────────────────────────────
  if (wrestler.pushLevel === "champion" || wrestler.pushLevel === "mainevent") {
    if (org.tier === "local" || org.tier === "indie") {
      const altTier = wrestler.overness >= 80 ? "major" : "regional"
      return {
        outcome: "rejected",
        reason: `${wrestler.name} is a main event caliber talent. They have no interest in working at the ${org.tier} level. They want a bigger stage.`,
        alternativeOrgHint: ALTERNATIVE_ORGS[altTier]?.[Math.floor(Math.random() * 3)] ?? "a major org",
        wrestlerMood: "insulted",
      }
    }
  }

  if (wrestler.pushLevel === "uppercard" && org.tier === "local") {
    if (Math.random() < 0.65) {
      return {
        outcome: "rejected",
        reason: `${wrestler.name} feels they are past the local circuit stage. They are looking for regional or higher exposure.`,
        alternativeOrgHint: ALTERNATIVE_ORGS["regional"]?.[0] ?? "a regional org",
        wrestlerMood: "unhappy",
      }
    }
  }

  // ── Gap too large — reputation mismatch ─────────────────────────────────
  if (gap > 40 && Math.random() < 0.7) {
    return {
      outcome: "rejected",
      reason: `${wrestler.name} does not feel ${org.name} is the right fit for their career right now. The org prestige (${org.prestige}/100) is below what they are looking for.`,
      alternativeOrgHint: ALTERNATIVE_ORGS["major"]?.[Math.floor(Math.random() * 3)] ?? "a higher tier org",
      wrestlerMood: "unhappy",
    }
  }

  // ── Salary too low — counter offer ───────────────────────────────────────
  if (offerRatio < 0.75) {
    const counterSalary = Math.round(minimumAcceptable * 0.9)
    return {
      outcome: "countered",
      reason: `${wrestler.name} appreciates the interest but finds the salary below market value. They want $${counterSalary.toLocaleString()}/week minimum.`,
      counterOffer: { salary: counterSalary, weeksRemaining: offer.weeksRemaining },
      wrestlerMood: "unhappy",
    }
  }

  if (offerRatio < 0.88) {
    if (Math.random() < 0.45) {
      const counterSalary = Math.round(minimumAcceptable * 0.95)
      return {
        outcome: "countered",
        reason: `${wrestler.name} likes the org but wants slightly better terms. Counter offer submitted.`,
        counterOffer: { salary: counterSalary, weeksRemaining: Math.max(offer.weeksRemaining, 26) },
        wrestlerMood: "neutral",
      }
    }
  }

  // ── Ghosted — free agent signs elsewhere ────────────────────────────────
  if (gap > 20 && Math.random() < 0.25) {
    const altOrg = ALTERNATIVE_ORGS[org.tier === "local" ? "regional" : "major"]?.[0] ?? "another org"
    return {
      outcome: "ghosted",
      reason: `${wrestler.name} stopped responding. Word is they signed with ${altOrg} instead. You needed better reputation to compete.`,
      alternativeOrgHint: altOrg,
      wrestlerMood: "neutral",
    }
  }

  // ── Accepted ─────────────────────────────────────────────────────────────
  const mood = offerRatio >= 1.1 ? "thrilled" : offerRatio >= 0.95 ? "happy" : "neutral"
  const moodMessages: Record<string, string> = {
    thrilled: `${wrestler.name} is thrilled with the offer and signs immediately. Great deal for both sides!`,
    happy:    `${wrestler.name} accepts the offer. They are happy with the terms and excited to join.`,
    neutral:  `${wrestler.name} accepts the offer. They see it as a stepping stone and will prove themselves.`,
  }

  return {
    outcome: "accepted",
    reason: moodMessages[mood] ?? moodMessages.neutral,
    wrestlerMood: mood as any,
  }
}

export function calculateSalaryDemand(wrestler: Wrestler, orgTier: string): number {
  const tierBase: Record<string, number> = {
    elite: 20000, major: 6000, regional: 2000, indie: 600, local: 200, underground: 0
  }
  const base = tierBase[orgTier] ?? 200
  const pushMult: Record<string, number> = {
    champion: 2.5, mainevent: 2.0, uppercard: 1.5, midcard: 1.1, enhancement: 0.8, jobber: 0.6
  }
  const overness  = wrestler.overness / 100
  const momentum  = wrestler.momentum / 100
  const push      = pushMult[wrestler.pushLevel] ?? 1.0
  let weekly = base * push * (1 + overness * 0.5 + momentum * 0.3)
  if (wrestler.popularity >= 85) weekly *= 1.3
  if (wrestler.experience >= 400) weekly *= 1.15
  return Math.round(weekly)
}
