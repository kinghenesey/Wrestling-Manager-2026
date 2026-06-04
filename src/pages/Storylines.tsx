import { useState } from "react"
import { Plus, Flame, Swords, TrendingUp, TrendingDown, X, ChevronDown, ChevronUp } from "lucide-react"
import { useStorylineStore } from "@/store/useStorylineStore"
import { useRosterStore } from "@/store/useRosterStore"
import { useGameStore } from "@/store/useGameStore"
import { getPortraitSrc, getFallbackPortrait } from "@/utils/portraits"
import { buildStoryline, getHeatLevel, getPhaseBookingAdvice, getStorylinePhase } from "@/engine/storylineEngine"
import { evaluatePush, analyzeTurnPotential } from "@/engine/pushEngine"
import type { Storyline, StorylineType } from "@/types/storyline"
import type { Wrestler } from "@/types/wrestler"

const HEAT_COLORS: Record<string, string> = {
  nuclear: "text-red-400 border-red-500/40 bg-red-500/10",
  hot:     "text-orange-400 border-orange-500/40 bg-orange-500/10",
  warm:    "text-yellow-400 border-yellow-500/40 bg-yellow-500/10",
  lukewarm:"text-zinc-400 border-zinc-500/40 bg-zinc-500/10",
  cold:    "text-blue-400 border-blue-500/40 bg-blue-500/10",
}

const STORYLINE_TYPES: StorylineType[] = [
  "title_chase","revenge","betrayal","underdog_rise",
  "dominant_run","redemption","faction_war","authority_conflict","tournament","underground_feud"
]

function Portrait({ w }: { w: Wrestler }) {
  const src = getPortraitSrc(w.portraitId)
  const fallback = getFallbackPortrait(w.gender)
  if (src) return <img src={src} onError={e => { e.currentTarget.src = fallback }} className="w-8 h-8 rounded-full object-top object-cover border border-zinc-600" alt="" />
  return <div className="w-8 h-8 rounded-full bg-zinc-700 border border-zinc-600 flex items-center justify-center"><span className="text-xs font-bold text-zinc-400">{w.name.charAt(0)}</span></div>
}

function HeatBar({ heat }: { heat: number }) {
  const level = getHeatLevel(heat)
  const colorMap: Record<string, string> = {
    nuclear: "bg-red-500", hot: "bg-orange-500", warm: "bg-yellow-500", lukewarm: "bg-zinc-500", cold: "bg-blue-500"
  }
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-zinc-800 rounded-full h-2">
        <div className={colorMap[level] + " h-2 rounded-full transition-all"} style={{ width: heat + "%" }} />
      </div>
      <span className={`text-xs font-bold px-1.5 py-0.5 rounded border ${HEAT_COLORS[level]}`}>{level}</span>
      <span className="text-xs text-zinc-400 w-6 text-right">{heat}</span>
    </div>
  )
}

function WrestlerChip({ w, onRemove }: { w: Wrestler; onRemove?: () => void }) {
  return (
    <div className="flex items-center gap-1.5 bg-zinc-800 rounded-full px-2 py-1 border border-zinc-700">
      <Portrait w={w} />
      <span className="text-xs text-zinc-200">{w.name}</span>
      {onRemove && <button onClick={onRemove} className="text-zinc-500 hover:text-red-400 ml-0.5 text-sm leading-none">x</button>}
    </div>
  )
}

function CreateStorylineModal({ onClose }: { onClose: () => void }) {
  const { game } = useGameStore()
  const { addStoryline } = useStorylineStore()
  const { getByOrg, wrestlers } = useRosterStore()
  const roster = getByOrg(game.player.currentOrgId)

  const [name, setName] = useState("")
  const [type, setType] = useState<StorylineType>("title_chase")
  const [protagonists, setProtagonists] = useState<string[]>([])
  const [antagonists, setAntagonists] = useState<string[]>([])
  const [search, setSearch] = useState("")
  const [adding, setAdding] = useState<"protagonist" | "antagonist" | null>(null)

  const filtered = roster.filter(w =>
    w.name.toLowerCase().includes(search.toLowerCase()) &&
    !protagonists.includes(w.id) && !antagonists.includes(w.id)
  )

  function handleCreate() {
    if (protagonists.length === 0) return
    const id = "story_" + Date.now()
    const storyline = buildStoryline(id, type, protagonists, antagonists, game.player.currentOrgId, game.week)
    if (name.trim()) storyline.name = name.trim()
    addStoryline(storyline)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl w-full max-w-lg p-6 space-y-5 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-zinc-100">Create Storyline</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-200"><X className="w-5 h-5" /></button>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Storyline Name (optional)</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Auto-generated if blank..." className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 text-zinc-100 rounded-lg text-sm focus:outline-none focus:border-amber-500" />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Storyline Type</label>
          <select value={type} onChange={e => setType(e.target.value as StorylineType)} className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 text-zinc-200 rounded-lg text-sm focus:outline-none focus:border-amber-500">
            {STORYLINE_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}</option>)}
          </select>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Face Side / Protagonists</label>
            <button onClick={() => setAdding(adding === "protagonist" ? null : "protagonist")} className="text-xs text-amber-400 hover:text-amber-300">+ Add</button>
          </div>
          <div className="flex flex-wrap gap-2 min-h-8">
            {protagonists.map(id => {
              const w = wrestlers.find(x => x.id === id)
              return w ? <WrestlerChip key={id} w={w} onRemove={() => setProtagonists(protagonists.filter(p => p !== id))} /> : null
            })}
            {protagonists.length === 0 && <p className="text-xs text-zinc-600 italic">No wrestlers added</p>}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Heel Side / Antagonists</label>
            <button onClick={() => setAdding(adding === "antagonist" ? null : "antagonist")} className="text-xs text-red-400 hover:text-red-300">+ Add</button>
          </div>
          <div className="flex flex-wrap gap-2 min-h-8">
            {antagonists.map(id => {
              const w = wrestlers.find(x => x.id === id)
              return w ? <WrestlerChip key={id} w={w} onRemove={() => setAntagonists(antagonists.filter(a => a !== id))} /> : null
            })}
            {antagonists.length === 0 && <p className="text-xs text-zinc-600 italic">No wrestlers added</p>}
          </div>
        </div>

        {adding && (
          <div className="bg-zinc-800/50 rounded-lg p-3 space-y-2 border border-zinc-700">
            <p className="text-xs font-medium text-zinc-400">Adding to {adding} side:</p>
            <input placeholder="Search roster..." className="w-full px-3 py-1.5 bg-zinc-800 border border-zinc-700 text-zinc-100 rounded text-xs focus:outline-none focus:border-amber-500" value={search} onChange={e => setSearch(e.target.value)} />
            <div className="max-h-36 overflow-y-auto space-y-1">
              {filtered.map(w => (
                <div key={w.id} onClick={() => { adding === "protagonist" ? setProtagonists([...protagonists, w.id]) : setAntagonists([...antagonists, w.id]); setAdding(null); setSearch("") }} className="flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-zinc-700 transition-colors">
                  <Portrait w={w} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-zinc-200 truncate">{w.name}</p>
                    <p className="text-xs text-zinc-500">{w.pushLevel} · {w.alignment}</p>
                  </div>
                  <span className="text-xs text-zinc-500">Pop {w.popularity}</span>
                </div>
              ))}
              {filtered.length === 0 && <p className="text-xs text-zinc-600 text-center py-3">No wrestlers available</p>}
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-sm font-medium">Cancel</button>
          <button onClick={handleCreate} disabled={protagonists.length === 0} className={"flex-1 py-2.5 rounded-lg text-sm font-bold transition-colors " + (protagonists.length > 0 ? "bg-amber-500 hover:bg-amber-600 text-zinc-950" : "bg-zinc-700 text-zinc-500 cursor-not-allowed")}>
            Create Storyline
          </button>
        </div>
      </div>
    </div>
  )
}

function StorylineCard({ storyline: s }: { storyline: Storyline }) {
  const { wrestlers } = useRosterStore()
  const { game } = useGameStore()
  const { updateStoryline, updateHeat, concludeStoryline } = useStorylineStore()
  const [expanded, setExpanded] = useState(false)

  const protagonists = s.protagonistIds.map(id => wrestlers.find(w => w.id === id)).filter(Boolean) as Wrestler[]
  const antagonists  = s.antagonistIds.map(id => wrestlers.find(w => w.id === id)).filter(Boolean) as Wrestler[]
  const allParticipants = [...protagonists, ...antagonists]

  const weeksActive = game.week - s.startWeek
  const phase = getStorylinePhase(weeksActive, s.type)
  const heatLevel = getHeatLevel(s.heat)
  const advice = getPhaseBookingAdvice(phase, s.type, protagonists[0]?.name ?? "protagonist", antagonists[0]?.name ?? "antagonist")

  const pushRecs = allParticipants
    .map(w => ({ w, ev: evaluatePush(w, [65, 68, 70, 72], [60, 62, 65, 68]) }))
    .filter(x => x.ev.shouldPromote && x.ev.urgency !== "low")

  const turnRecs = allParticipants
    .map(w => ({ w, turn: analyzeTurnPotential(w, [60, 62, 65, 68], w.alignment === "face" && w.popularity < 60, false) }))
    .filter(x => x.turn.shouldTurn)

  const PHASE_COLORS: Record<string, string> = {
    ignition: "text-blue-400", build: "text-yellow-400", peak: "text-orange-400", blowoff: "text-red-400", aftermath: "text-zinc-400"
  }

  return (
    <div className={"rounded-lg border transition-all " + (s.heat >= 65 ? "border-orange-500/30 bg-orange-500/5" : "border-zinc-800 bg-zinc-900")}>
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold text-zinc-100">{s.name}</h3>
              <span className="text-xs px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">{s.type.replace(/_/g, " ")}</span>
              <span className={"text-xs px-1.5 py-0.5 rounded border font-medium " + PHASE_COLORS[phase] + " border-current/30 bg-current/5"}>{phase}</span>
              {s.isBreakoutStory && <span className="text-xs px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">BREAKOUT</span>}
            </div>
            <p className="text-xs text-zinc-500 mt-0.5">Week {s.startWeek} · {weeksActive} weeks active</p>
          </div>
          <div className="flex items-center gap-2 ml-3">
            <button
              onClick={() => updateHeat(s.id, Math.min(100, s.heat + 8))}
              className="p-1.5 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-colors"
              title="Boost heat"
            >
              <Flame className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => concludeStoryline(s.id, game.week)}
              className="p-1.5 rounded bg-zinc-700 hover:bg-zinc-600 text-zinc-400 border border-zinc-600 transition-colors text-xs"
              title="Conclude storyline"
            >
              End
            </button>
            <button onClick={() => setExpanded(!expanded)} className="p-1.5 text-zinc-500 hover:text-zinc-300">
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <HeatBar heat={s.heat} />

        <div className="flex items-center gap-6">
          <div className="flex-1">
            <p className="text-xs text-blue-400 font-medium mb-1">Face Side</p>
            <div className="flex flex-wrap gap-1.5">
              {protagonists.length > 0 ? protagonists.map(w => <WrestlerChip key={w.id} w={w} />) : <p className="text-xs text-zinc-600 italic">None</p>}
            </div>
          </div>
          <Swords className="w-5 h-5 text-zinc-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-xs text-red-400 font-medium mb-1">Heel Side</p>
            <div className="flex flex-wrap gap-1.5">
              {antagonists.length > 0 ? antagonists.map(w => <WrestlerChip key={w.id} w={w} />) : <p className="text-xs text-zinc-600 italic">None</p>}
            </div>
          </div>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-zinc-800 p-4 space-y-4">
          <div className="bg-zinc-800/50 rounded-lg p-3 border border-zinc-700">
            <p className="text-xs font-medium text-amber-400 mb-1">Booker Advice — {phase.toUpperCase()}</p>
            <p className="text-xs text-zinc-400 leading-relaxed">{advice}</p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="bg-zinc-800 rounded-lg p-3">
              <p className="text-xs text-zinc-500 mb-1">Media Attention</p>
              <div className="flex items-center gap-1">
                <div className="flex-1 bg-zinc-700 rounded-full h-1.5">
                  <div className="bg-blue-400 h-1.5 rounded-full" style={{ width: s.mediaAttention + "%" }} />
                </div>
                <span className="text-xs text-zinc-300">{s.mediaAttention}</span>
              </div>
            </div>
            <div className="bg-zinc-800 rounded-lg p-3">
              <p className="text-xs text-zinc-500 mb-1">Fan Investment</p>
              <div className="flex items-center gap-1">
                <div className="flex-1 bg-zinc-700 rounded-full h-1.5">
                  <div className="bg-green-400 h-1.5 rounded-full" style={{ width: s.fanVotes + "%" }} />
                </div>
                <span className="text-xs text-zinc-300">{s.fanVotes}</span>
              </div>
            </div>
          </div>

          {pushRecs.length > 0 && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 space-y-2">
              <p className="text-xs font-medium text-green-400 flex items-center gap-1"><TrendingUp className="w-3.5 h-3.5" /> Push Recommendations</p>
              {pushRecs.map(({ w, ev }) => (
                <div key={w.id} className="text-xs text-zinc-400">
                  <span className="text-zinc-200 font-medium">{w.name}</span> — {ev.reason}
                  {ev.urgency === "critical" && <span className="ml-2 text-red-400 font-bold">CRITICAL</span>}
                </div>
              ))}
            </div>
          )}

          {turnRecs.length > 0 && (
            <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3 space-y-2">
              <p className="text-xs font-medium text-purple-400">Turn Recommendations</p>
              {turnRecs.map(({ w, turn }) => (
                <div key={w.id} className="text-xs text-zinc-400">
                  <span className="text-zinc-200 font-medium">{w.name}</span> → <span className={turn.recommendedAlignment === "heel" ? "text-red-400" : "text-blue-400"}>{turn.recommendedAlignment}</span> — {turn.reason}
                </div>
              ))}
            </div>
          )}

          {s.crowdChants.length > 0 && (
            <div>
              <p className="text-xs font-medium text-zinc-500 mb-1">Organic Crowd Chants</p>
              <div className="flex flex-wrap gap-2">
                {s.crowdChants.map((c, i) => <span key={i} className="text-xs px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700 font-mono">{c}</span>)}
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <div className="flex-1">
              <p className="text-xs text-zinc-500 mb-1">Adjust Heat</p>
              <input type="range" min={0} max={100} value={s.heat} onChange={e => updateHeat(s.id, Number(e.target.value))} className="w-full accent-amber-400" />
            </div>
            <span className="text-sm font-bold text-amber-400 w-8 text-right">{s.heat}</span>
          </div>
        </div>
      )}
    </div>
  )
}

export function Storylines() {
  const { game } = useGameStore()
  const { storylines, getActive, getByOrg } = useStorylineStore()
  const { getByOrg: getRoster } = useRosterStore()
  const [showCreate, setShowCreate] = useState(false)
  const [filter, setFilter] = useState<"active" | "all" | "concluded">("active")

  const roster = getRoster(game.player.currentOrgId)
  const orgStorylines = getByOrg(game.player.currentOrgId)

  const filtered = orgStorylines.filter(s => {
    if (filter === "active")    return s.status === "active"
    if (filter === "concluded") return s.status === "concluded"
    return true
  })

  const pushAlerts = roster
    .map(w => ({ w, ev: evaluatePush(w, [65, 68, 70, 72], [60, 62, 65, 68]) }))
    .filter(x => x.ev.urgency === "critical" || (x.ev.shouldPromote && x.ev.urgency === "high"))

  return (
    <div className="space-y-4">
      {showCreate && <CreateStorylineModal onClose={() => setShowCreate(false)} />}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Storylines</h1>
          <p className="text-sm text-zinc-500 mt-0.5">{getActive().filter(s => s.orgId === game.player.currentOrgId).length} active feuds · {roster.length} wrestlers on roster</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold rounded-lg text-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Storyline
        </button>
      </div>

      {pushAlerts.length > 0 && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 space-y-2">
          <p className="text-xs font-bold text-red-400 uppercase tracking-wider">Critical Push Alerts</p>
          {pushAlerts.map(({ w, ev }) => (
            <div key={w.id} className="flex items-start gap-2">
              <TrendingUp className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-zinc-400"><span className="text-zinc-200 font-medium">{w.name}</span> — {ev.reason}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-1 bg-zinc-800/50 rounded-lg p-1 w-fit">
        {(["active","all","concluded"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} className={"px-4 py-1.5 rounded-md text-sm font-medium transition-colors " + (filter === f ? "bg-zinc-700 text-zinc-100" : "text-zinc-400 hover:text-zinc-200")}>
            {f.charAt(0).toUpperCase() + f.slice(1)} ({orgStorylines.filter(s => f === "all" ? true : s.status === f).length})
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="border-2 border-dashed border-zinc-800 rounded-xl p-16 text-center space-y-3">
          <Swords className="w-10 h-10 text-zinc-700 mx-auto" />
          <p className="text-zinc-500 text-sm">{filter === "active" ? "No active storylines." : "No storylines found."}</p>
          <p className="text-zinc-600 text-xs">Create a storyline to start booking feuds, tracking heat, and building toward PPV moments.</p>
          <button onClick={() => setShowCreate(true)} className="mx-auto flex items-center gap-2 px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/30 rounded-lg text-sm transition-colors">
            <Plus className="w-4 h-4" />
            Create First Storyline
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(s => <StorylineCard key={s.id} storyline={s} />)}
        </div>
      )}
    </div>
  )
}
