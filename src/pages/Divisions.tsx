import { useDivisionStore } from "@/store/useDivisionStore"
import { useGameStore } from "@/store/useGameStore"
import { OrgBadge, getOrgColor } from "@/utils/orgColors"

const TIER_ORDER = ["elite", "major", "regional", "indie", "local", "underground"]
const TIER_LABELS: Record<string, string> = {
  elite: "Tier 1 - Elite", major: "Tier 2 - Major", regional: "Tier 3 - Regional",
  indie: "Tier 4 - Indie", local: "Tier 5 - Local", underground: "Underground",
}
const REP_REQUIRED: Record<string, string> = {
  elite: "elite", major: "notable", regional: "respected", indie: "regional", local: "unknown", underground: "unknown",
}

export function Divisions() {
  const { orgs, titles } = useDivisionStore()
  const { game } = useGameStore()
  const playerRep = game.player.reputation
  const playerOrgId = game.player.currentOrgId

  const REP_ORDER = ["unknown","regional","respected","notable","elite","legendary"]
  const playerRepIdx = REP_ORDER.indexOf(playerRep)

  function isUnlocked(tier: string) {
    const required = REP_REQUIRED[tier] ?? "unknown"
    return playerRepIdx >= REP_ORDER.indexOf(required)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">Divisions</h1>
        <p className="text-sm text-zinc-500 mt-1">All 26 organizations across 5 tiers. Your reputation unlocks higher tiers.</p>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 flex items-center gap-4">
        <div>
          <p className="text-xs text-zinc-500">Your Reputation</p>
          <p className="text-lg font-bold text-amber-400 capitalize">{playerRep}</p>
        </div>
        <div className="flex-1 bg-zinc-800 rounded-full h-2">
          <div className="bg-amber-400 h-2 rounded-full" style={{ width: ({"unknown":10,"regional":28,"respected":48,"notable":68,"elite":85,"legendary":100}[playerRep] ?? 0) + "%" }} />
        </div>
        <p className="text-xs text-zinc-500 text-right">Keep booking shows to increase reputation</p>
      </div>

      {TIER_ORDER.map((tier) => {
        const tierOrgs = orgs.filter((o) => o.tier === tier)
        const unlocked = isUnlocked(tier)
        return (
          <div key={tier}>
            <div className="flex items-center gap-3 mb-3">
              <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">{TIER_LABELS[tier]}</h2>
              {!unlocked && (
                <span className="text-xs px-2 py-0.5 rounded border text-red-400 border-red-500/30">
                  Requires {REP_REQUIRED[tier]} reputation
                </span>
              )}
              {unlocked && tier !== "local" && tier !== "underground" && (
                <span className="text-xs px-2 py-0.5 rounded border text-green-400 border-green-500/30">Unlocked</span>
              )}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
              {tierOrgs.map((org) => {
                const c = getOrgColor(org.id)
                const orgTitles = titles.filter((t) => t.orgId === org.id)
                const isPlayer = org.id === playerOrgId
                return (
                  <div
                    key={org.id}
                    className={"rounded-lg border p-4 space-y-3 transition-all " + (isPlayer ? "border-amber-500/50 bg-amber-500/5" : unlocked ? "border-zinc-800 bg-zinc-900" : "border-zinc-800/50 bg-zinc-900/50 opacity-60")}
                  >
                    <div className="flex items-start justify-between">
                      <OrgBadge orgId={org.id} name={org.name} size="sm" />
                      <div className="flex items-center gap-1">
                        {isPlayer && <span className="text-xs px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold">YOU</span>}
                        {org.tvDeal && <span className="text-xs px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">TV</span>}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <p className={"text-base font-bold " + c.text}>{org.prestige}</p>
                        <p className="text-xs text-zinc-600">Prestige</p>
                      </div>
                      <div>
                        <p className={"text-base font-bold " + c.text}>{org.fanbase}</p>
                        <p className="text-xs text-zinc-600">Fanbase</p>
                      </div>
                      <div>
                        <p className={"text-base font-bold " + c.text}>${(org.wealth / 1000).toFixed(0)}k</p>
                        <p className="text-xs text-zinc-600">Budget/wk</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-zinc-500">
                      <span>{org.region}</span>
                      <span>{orgTitles.length} title{orgTitles.length !== 1 ? "s" : ""}</span>
                    </div>

                    {orgTitles.length > 0 && (
                      <div className="space-y-1">
                        {orgTitles.slice(0, 2).map((t) => (
                          <div key={t.id} className="flex items-center justify-between">
                            <span className="text-xs text-zinc-400 truncate">{t.shortName}</span>
                            <span className={"text-xs " + (t.isVacant ? "text-zinc-600" : "text-amber-400")}>
                              {t.isVacant ? "Vacant" : t.currentChampionId ?? "Champion"}
                            </span>
                          </div>
                        ))}
                        {orgTitles.length > 2 && (
                          <p className="text-xs text-zinc-600">+{orgTitles.length - 2} more titles</p>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
