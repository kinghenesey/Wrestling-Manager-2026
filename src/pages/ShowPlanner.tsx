import { useState } from "react"
import { Plus, Tv, Trophy, Star, Play, ChevronUp, ChevronDown, Trash2, Zap } from "lucide-react"
import { useGameStore } from "@/store/useGameStore"
import { useRosterStore } from "@/store/useRosterStore"
import { useShowStore } from "@/store/useShowStore"
import { useDivisionStore } from "@/store/useDivisionStore"
import { getPortraitSrc, getFallbackPortrait } from "@/utils/portraits"
import { MatchViewer } from "@/components/show/MatchViewer"
import type { Match, Show, MatchType, MatchStipulation } from "@/types/show"
import type { Wrestler } from "@/types/wrestler"

const MATCH_TYPES: MatchType[] = ["singles","tag","triple_threat","fatal_fourway","ladder","cage","battle_royal"]
const STIPULATIONS: MatchStipulation[] = ["none","title_match","number_one_contender","loser_leaves","underground_rules"]

function Portrait({ portraitId, gender }: { portraitId: string; gender: "male" | "female" }) {
  const src = getPortraitSrc(portraitId)
  const fallback = getFallbackPortrait(gender)
  if (src) return <img src={src} onError={e => { e.currentTarget.src = fallback }} className="w-8 h-8 rounded-full object-top object-cover border border-zinc-600" alt="" />
  return <div className="w-8 h-8 rounded-full bg-zinc-700 border border-zinc-600 flex items-center justify-center"><span className="text-xs font-bold text-zinc-400">{gender === "female" ? "F" : "M"}</span></div>
}

function WrestlerPicker({ onSelect, selected, firstGender }: {
  onSelect: (w: Wrestler) => void
  selected: string[]
  firstGender?: "male" | "female"
}) {
  const { game } = useGameStore()
  const { getByOrg } = useRosterStore()
  const [search, setSearch] = useState("")
  const allRoster = getByOrg(game.player.currentOrgId)
  const roster = firstGender ? allRoster.filter(w => w.gender === firstGender) : allRoster
  const filtered = roster.filter(w => w.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="space-y-2">
      <input
        placeholder={firstGender ? "Search " + firstGender + " wrestlers..." : "Search roster..."}
        className="w-full px-3 py-1.5 bg-zinc-800 border border-zinc-700 text-zinc-100 rounded text-xs focus:outline-none focus:border-amber-500"
        value={search}
        onChange={e => setSearch(e.target.value)}
      />
      {firstGender && (
        <p className="text-xs text-zinc-600 italic">Showing {firstGender} wrestlers only. Mixed gender matches only in Storylines.</p>
      )}
      <div className="max-h-40 overflow-y-auto space-y-1">
        {filtered.map(w => (
          <div
            key={w.id}
            onClick={() => onSelect(w)}
            className={"flex items-center gap-2 p-2 rounded cursor-pointer transition-colors " + (selected.includes(w.id) ? "bg-amber-500/20 border border-amber-500/30" : "hover:bg-zinc-700 border border-transparent")}
          >
            <Portrait portraitId={w.portraitId} gender={w.gender} />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-zinc-200 truncate">{w.name}</p>
              <p className="text-xs text-zinc-500">{w.pushLevel} · {w.alignment}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-zinc-400">IR:{w.stats.inRing}</p>
              <p className="text-xs text-zinc-500">Pop:{w.popularity}</p>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p className="text-xs text-zinc-600 text-center py-4">No wrestlers found</p>}
      </div>
    </div>
  )
}

function MatchBuilder({ match, index, total, onUpdate, onRemove, onMoveUp, onMoveDown }: {
  match: Match
  index: number
  total: number
  onUpdate: (m: Match) => void
  onRemove: () => void
  onMoveUp: () => void
  onMoveDown: () => void
}) {
  const { wrestlers } = useRosterStore()
  const [showPicker, setShowPicker] = useState(false)
  const participants = match.participantIds.map(id => wrestlers.find(w => w.id === id)).filter(Boolean) as Wrestler[]
  const isMainEvent = index === total - 1

  // Determine gender lock from first selected wrestler
  const firstWrestler = participants[0]
  const genderLock = firstWrestler?.gender

  function toggleWrestler(w: Wrestler) {
    const ids = match.participantIds
    const updated = ids.includes(w.id) ? ids.filter(id => id !== w.id) : [...ids, w.id]
    onUpdate({ ...match, participantIds: updated, teamA: updated.slice(0, Math.ceil(updated.length / 2)), teamB: updated.slice(Math.ceil(updated.length / 2)) })
  }

  return (
    <div className={"rounded-lg border p-4 space-y-3 " + (isMainEvent ? "border-amber-500/40 bg-amber-500/5" : "border-zinc-800 bg-zinc-900")}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-zinc-500 w-6">{index + 1}</span>
          {isMainEvent && <span className="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold">MAIN EVENT</span>}
          {index === 0 && total > 1 && <span className="text-xs px-2 py-0.5 rounded bg-zinc-700 text-zinc-400 border border-zinc-600">OPENER</span>}
          {genderLock && <span className={"text-xs px-1.5 py-0.5 rounded border " + (genderLock === "female" ? "text-pink-400 border-pink-500/30" : "text-blue-400 border-blue-500/30")}>{genderLock}</span>}
        </div>
        <div className="flex items-center gap-1">
          <button title="Move match up" onClick={onMoveUp} disabled={index === 0} className="p-1 text-zinc-500 hover:text-zinc-300 disabled:opacity-30"><ChevronUp className="w-4 h-4" /></button>
          <button title="Move match down" onClick={onMoveDown} disabled={index === total - 1} className="p-1 text-zinc-500 hover:text-zinc-300 disabled:opacity-30"><ChevronDown className="w-4 h-4" /></button>
          <button title="Remove match" onClick={onRemove} className="p-1 text-zinc-500 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-zinc-500 mb-1 block">Match Type</label>
          <select title="Match type" value={match.matchType} onChange={e => onUpdate({ ...match, matchType: e.target.value as MatchType })} className="w-full px-2 py-1.5 bg-zinc-800 border border-zinc-700 text-zinc-200 rounded text-xs focus:outline-none focus:border-amber-500">
            {MATCH_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-zinc-500 mb-1 block">Stipulation</label>
          <select title="Stipulation" value={match.stipulation} onChange={e => onUpdate({ ...match, stipulation: e.target.value as MatchStipulation })} className="w-full px-2 py-1.5 bg-zinc-800 border border-zinc-700 text-zinc-200 rounded text-xs focus:outline-none focus:border-amber-500">
            {STIPULATIONS.map(s => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
          </select>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs text-zinc-500">Participants ({participants.length})</label>
          <button onClick={() => setShowPicker(!showPicker)} className="text-xs text-amber-400 hover:text-amber-300">
            {showPicker ? "Done" : "+ Add wrestlers"}
          </button>
        </div>

        {participants.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {participants.map(w => (
              <div key={w.id} className="flex items-center gap-1.5 bg-zinc-800 rounded-full px-2 py-1 border border-zinc-700">
                <Portrait portraitId={w.portraitId} gender={w.gender} />
                <span className="text-xs text-zinc-200">{w.name}</span>
                <button onClick={() => toggleWrestler(w)} className="text-zinc-500 hover:text-red-400 ml-1 text-sm leading-none">x</button>
              </div>
            ))}
          </div>
        )}

        {participants.length === 0 && !showPicker && <p className="text-xs text-zinc-600 italic">No wrestlers added yet</p>}

        {showPicker && (
          <WrestlerPicker
            onSelect={toggleWrestler}
            selected={match.participantIds}
            firstGender={genderLock}
          />
        )}
      </div>

      <div>
        <label className="text-xs text-zinc-500 mb-1 block">Booker Notes</label>
        <input
          value={match.notes}
          onChange={e => onUpdate({ ...match, notes: e.target.value })}
          placeholder="e.g. Iron Marcus retains via cheating, sets up next week..."
          className="w-full px-3 py-1.5 bg-zinc-800 border border-zinc-700 text-zinc-200 rounded text-xs focus:outline-none focus:border-amber-500"
        />
      </div>
    </div>
  )
}

function ShowSummaryModal({ show, onClose }: { show: Show; onClose: () => void }) {
  const { wrestlers } = useRosterStore()
  const [expandedMatch, setExpandedMatch] = useState<string | null>(null)

  function getWrestlerName(id: string) {
    return wrestlers.find(w => w.id === id)?.name ?? id
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl w-full max-w-lg p-6 space-y-5 max-h-[85vh] overflow-y-auto">
        <div className="text-center space-y-1">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Zap className="w-6 h-6 text-amber-400" />
            <h2 className="text-xl font-bold text-zinc-100">Show Complete!</h2>
          </div>
          <p className="text-sm text-zinc-400">{show.name}</p>
        </div>

        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="bg-zinc-800 rounded-lg p-3">
            <p className={"text-3xl font-black " + (show.overallRating >= 70 ? "text-green-400" : show.overallRating >= 50 ? "text-amber-400" : "text-red-400")}>
              {show.overallRating}
            </p>
            <p className="text-xs text-zinc-500 mt-0.5">Overall Rating</p>
          </div>
          <div className="bg-zinc-800 rounded-lg p-3">
            <p className="text-3xl font-black text-blue-400">{show.attendance.toLocaleString()}</p>
            <p className="text-xs text-zinc-500 mt-0.5">Attendance</p>
          </div>
          <div className="bg-zinc-800 rounded-lg p-3">
            <p className="text-3xl font-black text-green-400">${(show.revenue / 1000).toFixed(1)}k</p>
            <p className="text-xs text-zinc-500 mt-0.5">Revenue</p>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Match Results</p>
          {show.matches.map((m, i) => (
            <div key={m.id} className="bg-zinc-800 rounded-lg overflow-hidden">
              <div className="flex items-center justify-between p-3 cursor-pointer" onClick={() => setExpandedMatch(expandedMatch === m.id ? null : m.id)}>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-500">Match {i + 1}</span>
                    {m.isMainEvent && <span className="text-xs px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">MAIN</span>}
                    <span className="text-xs text-zinc-600">{m.matchType.replace(/_/g, " ")}</span>
                  </div>
                  {m.result?.winnerId && (
                    <p className="text-xs text-zinc-300 mt-0.5">
                      <span className="text-amber-400 font-medium">{getWrestlerName(m.result.winnerId)}</span>
                      <span className="text-zinc-500"> via {m.result.method} · {m.result.matchDurationMinutes}min</span>
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <span className={"text-xl font-black " + (m.result && m.result.matchRating >= 70 ? "text-green-400" : m.result && m.result.matchRating >= 50 ? "text-amber-400" : "text-red-400")}>
                    {m.result?.matchRating ?? 0}
                  </span>
                  <span className="text-zinc-600 text-xs">/100</span>
                </div>
              </div>
              {expandedMatch === m.id && m.result && (
                <div className="border-t border-zinc-700 p-3 space-y-1">
                  <p className="text-xs text-zinc-500">Crowd: {m.result.crowdRating}/100</p>
                  <p className="text-xs text-zinc-500">Wrestlers: {m.participantIds.map(id => getWrestlerName(id)).join(", ")}</p>
                  {m.notes && <p className="text-xs text-zinc-600 italic">{m.notes}</p>}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className={"rounded-lg p-4 border text-center " + (show.overallRating >= 70 ? "bg-green-500/10 border-green-500/30" : show.overallRating >= 50 ? "bg-amber-500/10 border-amber-500/30" : "bg-red-500/10 border-red-500/30")}>
          <p className={"text-sm font-medium " + (show.overallRating >= 70 ? "text-green-400" : show.overallRating >= 50 ? "text-amber-400" : "text-red-400")}>
            {show.overallRating >= 80 ? "Incredible show! Reputation growing fast." :
             show.overallRating >= 70 ? "Solid show. Fans are impressed." :
             show.overallRating >= 60 ? "Decent show. Room to improve." :
             show.overallRating >= 50 ? "Average show. Fans expected more." :
             "Rough show. Back to the drawing board."}
          </p>
          <p className="text-xs text-zinc-500 mt-1">+{Math.round(show.overallRating / 10)} reputation points earned</p>
        </div>

        <button onClick={onClose} className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold rounded-lg transition-colors">
          Continue to Week {show.week + 1}
        </button>
      </div>
    </div>
  )
}

export function ShowPlanner() {
  const { game, advanceWeek, updatePlayer } = useGameStore()
  const { getByOrg, wrestlers, updateMomentum, updatePopularity, updateMorale } = useRosterStore()
  const { addShow } = useShowStore()
  const { getOrgById } = useDivisionStore()

  const org = getOrgById(game.player.currentOrgId)
  const roster = getByOrg(game.player.currentOrgId)

  const [matches, setMatches] = useState<Match[]>([])
  const [showName, setShowName] = useState("")
  const [venue, setVenue] = useState("")

  // Match viewer queue
  const [matchQueue, setMatchQueue] = useState<Match[]>([])
  const [currentMatchIdx, setCurrentMatchIdx] = useState(0)
  const [watchingMatches, setWatchingMatches] = useState(false)
  const [pendingShow, setPendingShow] = useState<Show | null>(null)
  const [completedShow, setCompletedShow] = useState<Show | null>(null)

  function addMatch() {
    const newMatch: Match = {
      id: "match_" + Date.now(),
      showId: "",
      matchType: "singles",
      stipulation: "none",
      titleId: null,
      participantIds: [],
      teamA: [],
      teamB: [],
      refereeid: null,
      position: matches.length,
      isMainEvent: false,
      expectedRating: 60,
      result: null,
      storylineId: null,
      notes: "",
    }
    setMatches([...matches, newMatch])
  }

  function updateMatch(index: number, updated: Match) {
    const arr = [...matches]
    arr[index] = { ...updated, isMainEvent: index === matches.length - 1 }
    setMatches(arr)
  }

  function removeMatch(index: number) {
    setMatches(matches.filter((_, i) => i !== index))
  }

  function moveMatch(index: number, dir: "up" | "down") {
    const arr = [...matches]
    const swapIdx = dir === "up" ? index - 1 : index + 1
    if (swapIdx < 0 || swapIdx >= arr.length) return
    ;[arr[index], arr[swapIdx]] = [arr[swapIdx], arr[index]]
    setMatches(arr.map((m, i) => ({ ...m, position: i, isMainEvent: i === arr.length - 1 })))
  }

  function simulateSingleMatch(match: Match): Match {
    if (match.participantIds.length === 0) {
      return { ...match, result: { winnerId: null, winnerIds: [], method: "no_contest", finishingMove: "N/A", matchRating: 30, crowdRating: 25, matchDurationMinutes: 5 } }
    }

    const participants = match.participantIds.map(id => wrestlers.find(w => w.id === id)).filter(Boolean) as Wrestler[]
    const avgInRing = participants.reduce((sum, w) => sum + w.stats.inRing, 0) / participants.length
    const avgPsych  = participants.reduce((sum, w) => sum + w.stats.psychology, 0) / participants.length
    const avgMom    = participants.reduce((sum, w) => sum + w.momentum, 0) / participants.length
    const isMain    = match.isMainEvent

    let base = (avgInRing * 0.4) + (avgPsych * 0.3) + (avgMom * 0.2)
    if (isMain) base += 5
    if (match.stipulation !== "none") base += 4
    base += (Math.random() * 16) - 8
    const matchRating = Math.max(20, Math.min(100, Math.round(base)))

    const avgCharisma = participants.reduce((sum, w) => sum + w.stats.charisma, 0) / participants.length
    const avgPop      = participants.reduce((sum, w) => sum + w.popularity, 0) / participants.length
    const crowdRating = Math.max(10, Math.min(100, Math.round((avgCharisma * 0.4) + (avgPop * 0.4) + (matchRating * 0.2) + (Math.random() * 10) - 5)))

    const pushWeights: Record<string, number> = { champion: 8, mainevent: 6, uppercard: 4, midcard: 2, enhancement: 1, jobber: 0.5 }
    const scores = participants.map(w => (pushWeights[w.pushLevel] ?? 1) * (1 + w.momentum / 200))
    const total   = scores.reduce((a, b) => a + b, 0)
    let rand = Math.random() * total
    let winnerIdx = 0
    for (let i = 0; i < scores.length; i++) {
      rand -= scores[i]
      if (rand <= 0) { winnerIdx = i; break }
    }
    const winner  = participants[winnerIdx]
    const methods = ["pinfall","pinfall","pinfall","submission","pinfall"] as const
    const method  = methods[Math.floor(Math.random() * methods.length)]

    return {
      ...match,
      result: {
        winnerId: winner?.id ?? null,
        winnerIds: winner ? [winner.id] : [],
        method,
        finishingMove: winner?.finisher ?? "Pinfall",
        matchRating,
        crowdRating,
        matchDurationMinutes: isMain ? 18 + Math.floor(Math.random() * 8) : 6 + Math.floor(Math.random() * 8),
      }
    }
  }

  function runShow() {
    if (matches.length === 0) return

    const simulatedMatches = matches.map(m => simulateSingleMatch(m))
    const matchRatings  = simulatedMatches.map(m => m.result?.matchRating ?? 0)
    const avgRating     = Math.round(matchRatings.reduce((a, b) => a + b, 0) / matchRatings.length)
    const mainRating    = simulatedMatches[simulatedMatches.length - 1]?.result?.matchRating ?? 0
    const overallRating = Math.round((mainRating * 0.4) + (avgRating * 0.6))

    const capacity   = Math.round((org?.fanbase ?? 10) * 50 + 200)
    const attendance = Math.round(capacity * (0.4 + overallRating / 200))
    const revenue    = attendance * 15

    const show: Show = {
      id: "show_" + Date.now(),
      orgId: game.player.currentOrgId,
      brandId: null,
      name: showName || (org?.shortName ?? "Show") + " Week " + game.week,
      type: "weekly",
      week: game.week,
      venue: venue || "Local Arena",
      city: org?.region ?? "Unknown",
      region: org?.region ?? "Unknown",
      attendance,
      capacity,
      segments: [],
      matches: simulatedMatches,
      overallRating,
      crowdRating: Math.round(simulatedMatches.reduce((sum, m) => sum + (m.result?.crowdRating ?? 0), 0) / simulatedMatches.length),
      tvRating: 0,
      ppvBuys: null,
      revenue,
      isSimulated: true,
      notes: "",
    }

    addShow(show)

    // Apply post-match effects
    simulatedMatches.forEach(m => {
      if (!m.result) return
      m.participantIds.forEach(id => {
        const isWinner = m.result!.winnerIds.includes(id)
        updateMomentum(id, isWinner ? Math.floor(Math.random() * 8) + 5 : -(Math.floor(Math.random() * 5) + 2))
        updatePopularity(id, isWinner ? Math.floor(Math.random() * 3) + 1 : 0)
        updateMorale(id, isWinner ? Math.floor(Math.random() * 5) + 2 : -(Math.floor(Math.random() * 3) + 1))
      })
    })

    const repGained = Math.round(overallRating / 10)
    const newTotal  = game.player.totalShowsBooked + 1
    const newAvg    = Math.round(((game.player.avgShowRating * game.player.totalShowsBooked) + overallRating) / newTotal)
    updatePlayer({ totalShowsBooked: newTotal, avgShowRating: newAvg, reputationPoints: game.player.reputationPoints + repGained })

    // Start match viewer queue
    setPendingShow(show)
    setMatchQueue(simulatedMatches)
    setCurrentMatchIdx(0)
    setWatchingMatches(true)
  }

  function handleMatchViewerClose() {
    const next = currentMatchIdx + 1
    if (next < matchQueue.length) {
      setCurrentMatchIdx(next)
    } else {
      setWatchingMatches(false)
      setCompletedShow(pendingShow)
    }
  }

  function handleCloseResults() {
    setCompletedShow(null)
    setPendingShow(null)
    setMatchQueue([])
    setCurrentMatchIdx(0)
    setMatches([])
    setShowName("")
    setVenue("")
    advanceWeek()
  }

  const hasEnoughWrestlers = roster.length >= 2
  const canRunShow = matches.length > 0 && matches.every(m => m.participantIds.length >= 2)

  const currentMatch = matchQueue[currentMatchIdx]
  const currentParticipants = currentMatch
    ? currentMatch.participantIds.map(id => wrestlers.find(w => w.id === id)).filter(Boolean) as Wrestler[]
    : []

  return (
    <div className="space-y-4">

      {/* Match viewer - shows each match one by one */}
      {watchingMatches && currentMatch && currentMatch.result && (
        <MatchViewer
          match={currentMatch}
          participants={currentParticipants}
          result={currentMatch.result}
          isTitle={currentMatch.titleId !== null}
          titleName={currentMatch.titleId ?? undefined}
          onClose={handleMatchViewerClose}
        />
      )}

      {/* Show summary after all matches viewed */}
      {completedShow && <ShowSummaryModal show={completedShow} onClose={handleCloseResults} />}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Show Planner</h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            Week {game.week} · {org?.name ?? "Unknown Org"} · {roster.length} wrestlers available
          </p>
        </div>
        <button
          onClick={runShow}
          disabled={!canRunShow}
          className={"flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-sm transition-colors " + (canRunShow ? "bg-amber-500 hover:bg-amber-600 text-zinc-950" : "bg-zinc-700 text-zinc-500 cursor-not-allowed")}
        >
          <Play className="w-4 h-4" />
          Run Show
        </button>
      </div>

      {!hasEnoughWrestlers && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-sm text-red-400">
          You need at least 2 wrestlers to run a show. Go to Roster and sign some free agents first.
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-zinc-500 mb-1 block">Show Name</label>
          <input
            value={showName}
            onChange={e => setShowName(e.target.value)}
            placeholder={(org?.shortName ?? "Show") + " Week " + game.week}
            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 text-zinc-100 rounded-lg text-sm focus:outline-none focus:border-amber-500"
          />
        </div>
        <div>
          <label className="text-xs text-zinc-500 mb-1 block">Venue</label>
          <input
            value={venue}
            onChange={e => setVenue(e.target.value)}
            placeholder="Local Arena..."
            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 text-zinc-100 rounded-lg text-sm focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Tv className="w-4 h-4 text-zinc-500" />
            <span className="text-sm font-medium text-zinc-300">Match Card ({matches.length} matches)</span>
          </div>
          <button
            onClick={addMatch}
            disabled={!hasEnoughWrestlers}
            className={"flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors " + (hasEnoughWrestlers ? "bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700" : "bg-zinc-800/50 text-zinc-600 cursor-not-allowed")}
          >
            <Plus className="w-3.5 h-3.5" />
            Add Match
          </button>
        </div>

        {matches.length === 0 && (
          <div className="border-2 border-dashed border-zinc-800 rounded-xl p-12 text-center space-y-3">
            <Trophy className="w-10 h-10 text-zinc-700 mx-auto" />
            <p className="text-zinc-500 text-sm">No matches booked yet</p>
            <p className="text-zinc-600 text-xs">Click Add Match to start building your card</p>
            <button
              onClick={addMatch}
              disabled={!hasEnoughWrestlers}
              className="mx-auto flex items-center gap-2 px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/30 rounded-lg text-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add First Match
            </button>
          </div>
        )}

        {matches.map((match, i) => (
          <MatchBuilder
            key={match.id}
            match={match}
            index={i}
            total={matches.length}
            onUpdate={m => updateMatch(i, m)}
            onRemove={() => removeMatch(i)}
            onMoveUp={() => moveMatch(i, "up")}
            onMoveDown={() => moveMatch(i, "down")}
          />
        ))}
      </div>

      {matches.length > 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Star className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-medium text-zinc-300">Show Preview</span>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-zinc-500 text-xs">Matches</p>
              <p className="text-zinc-100 font-bold">{matches.length}</p>
            </div>
            <div>
              <p className="text-zinc-500 text-xs">Wrestlers Used</p>
              <p className="text-zinc-100 font-bold">{new Set(matches.flatMap(m => m.participantIds)).size}</p>
            </div>
            <div>
              <p className="text-zinc-500 text-xs">Ready</p>
              <p className={canRunShow ? "text-green-400 font-bold" : "text-red-400 font-bold"}>{canRunShow ? "Yes" : "No"}</p>
            </div>
          </div>
          {!canRunShow && matches.some(m => m.participantIds.length < 2) && (
            <p className="text-xs text-red-400 mt-2 text-center">Some matches need at least 2 wrestlers</p>
          )}
        </div>
      )}
    </div>
  )
}


