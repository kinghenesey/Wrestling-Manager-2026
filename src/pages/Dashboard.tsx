import { TrendingUp, Users, Tv, Trophy, AlertTriangle, Star } from "lucide-react"
import { useGameStore } from "@/store/useGameStore"
import { useRosterStore } from "@/store/useRosterStore"
import { useStorylineStore } from "@/store/useStorylineStore"
import { useDivisionStore } from "@/store/useDivisionStore"

const REPUTATION_PROGRESS: Record<string, number> = {
  unknown: 10, regional: 28, respected: 48, notable: 68, elite: 85, legendary: 100,
}

const HEAT_COLORS: Record<string, string> = {
  nuclear: "text-red-400", hot: "text-orange-400",
  warm: "text-yellow-400", lukewarm: "text-zinc-400", cold: "text-blue-400",
}

function getHeatLevel(heat: number) {
  if (heat >= 85) return "nuclear"
  if (heat >= 65) return "hot"
  if (heat >= 45) return "warm"
  if (heat >= 25) return "lukewarm"
  return "cold"
}

function StatCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub: string }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-zinc-500 mb-1">{label}</p>
          <p className="text-2xl font-bold text-zinc-100">{value}</p>
          <p className="text-xs text-zinc-500 mt-0.5">{sub}</p>
        </div>
        {icon}
      </div>
    </div>
  )
}

export function Dashboard() {
  const { game } = useGameStore()
  const { wrestlers, getByOrg } = useRosterStore()
  const { getActive } = useStorylineStore()
  const { getOrgById, getTitlesByOrg } = useDivisionStore()

  const player = game.player
  const org = getOrgById(player.currentOrgId)
  const roster = getByOrg(player.currentOrgId)
  const active = getActive().filter((s) => s.orgId === player.currentOrgId)
  const titles = getTitlesByOrg(player.currentOrgId)
  const repPct = REPUTATION_PROGRESS[player.reputation] ?? 0

  const alerts: { name: string; issue: string; urgency: string }[] = []
  roster.forEach((w) => {
    if (w.morale < 40) alerts.push({ name: w.name, issue: "Very low morale", urgency: "high" })
    if ((w.contract?.weeksRemaining ?? 999) <= 8) alerts.push({ name: w.name, issue: "Contract expiring soon", urgency: "high" })
    if (w.injury && !w.injury.isKayfabe) alerts.push({ name: w.name, issue: "Injured: " + w.injury.type + " (" + w.injury.weeksRemaining + "w)", urgency: "medium" })
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">Dashboard</h1>
        <p className="text-sm text-zinc-500 mt-1">{org?.name ?? "No org"} - Week {game.week}, {game.year}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Users className="w-5 h-5 text-blue-400" />} label="Roster Size" value={String(roster.length)} sub={roster.filter((w) => w.gender === "male").length + "M / " + roster.filter((w) => w.gender === "female").length + "F"} />
        <StatCard icon={<Tv className="w-5 h-5 text-green-400" />} label="Shows Booked" value={String(player.totalShowsBooked)} sub={"Avg rating: " + (player.avgShowRating > 0 ? player.avgShowRating : "n/a")} />
        <StatCard icon={<Trophy className="w-5 h-5 text-amber-400" />} label="Active Titles" value={String(titles.length)} sub={titles.filter((t) => !t.isVacant).length + " with champions"} />
        <StatCard icon={<TrendingUp className="w-5 h-5 text-purple-400" />} label="Org Prestige" value={(org?.prestige ?? 0) + "/100"} sub={org?.tier ?? "local"} />
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 space-y-3">
        <p className="text-sm font-medium text-zinc-400">Manager Reputation</p>
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-amber-400 capitalize">{player.reputation}</span>
          <span className="text-xs text-zinc-500">{player.reputationPoints} pts</span>
        </div>
        <div className="w-full bg-zinc-800 rounded-full h-2">
          <div className="bg-amber-400 h-2 rounded-full transition-all" style={{ width: repPct + "%" }} />
        </div>
        <p className="text-xs text-zinc-500">
          {player.reputation === "legendary" ? "Legendary status achieved." : "Build reputation to unlock higher tier organizations."}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 space-y-3">
          <p className="text-sm font-medium text-zinc-400 flex items-center gap-2">
            <Star className="w-4 h-4" /> Active Storylines ({active.length})
          </p>
          {active.length === 0 && <p className="text-xs text-zinc-600">No active storylines. Create one in Storylines.</p>}
          {active.slice(0, 4).map((s) => {
            const hl = getHeatLevel(s.heat)
            return (
              <div key={s.id} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-zinc-200">{s.name}</p>
                  <p className="text-xs text-zinc-500">{s.type.replace(/_/g, " ")}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={"text-sm font-bold " + HEAT_COLORS[hl]}>{s.heat}</span>
                  <span className={"text-xs px-2 py-0.5 rounded border border-current/30 " + HEAT_COLORS[hl]}>{hl}</span>
                </div>
              </div>
            )
          })}
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 space-y-3">
          <p className="text-sm font-medium text-zinc-400 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" /> Alerts ({alerts.length})
          </p>
          {alerts.length === 0 && <p className="text-xs text-zinc-600">No urgent issues.</p>}
          {alerts.slice(0, 6).map((a, i) => (
            <div key={i} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-zinc-200">{a.name}</p>
                <p className="text-xs text-zinc-500">{a.issue}</p>
              </div>
              <span className={"text-xs px-2 py-0.5 rounded border " + (a.urgency === "high" ? "text-red-400 border-red-500/30" : "text-amber-400 border-amber-500/30")}>
                {a.urgency}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
        <p className="text-sm font-medium text-zinc-400 mb-3">All Wrestlers ({wrestlers.length} total)</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Free Agents", value: wrestlers.filter((w) => w.status === "free_agent").length, color: "text-red-400" },
            { label: "Active", value: wrestlers.filter((w) => w.status === "active").length, color: "text-green-400" },
            { label: "Injured", value: wrestlers.filter((w) => w.status === "injured").length, color: "text-orange-400" },
            { label: "Underground", value: wrestlers.filter((w) => w.currentOrgId === "underground").length, color: "text-purple-400" },
          ].map((s) => (
            <div key={s.label} className="text-center bg-zinc-800/50 rounded-lg p-3">
              <p className={"text-xl font-bold " + s.color}>{s.value}</p>
              <p className="text-xs text-zinc-500">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
