import { useState } from "react"
import { Plus, Tv, Trophy, Star, Play, ChevronUp, ChevronDown, Trash2, Zap } from "lucide-react"
import { useGameStore } from "@/store/useGameStore"
import { useRosterStore } from "@/store/useRosterStore"
import { useShowStore } from "@/store/useShowStore"
import { useDivisionStore } from "@/store/useDivisionStore"
import { getPortraitSrc, getFallbackPortrait } from "@/utils/portraits"
import { MatchViewer } from "@/components/show/MatchViewer"
import type { Match, Show, MatchType, MatchStipulation, MatchResult, SegmentType } from "@/types/show"
import type { Title } from "@/types/title"
import type { Wrestler } from "@/types/wrestler"

const MATCH_TYPES: MatchType[] = ["singles","tag","triple_threat","fatal_fourway","ladder","cage","hell_in_a_cell","last_man_standing","tables","battle_royal","tournament_match","intergender"]
const STIPULATIONS: MatchStipulation[] = ["none","title_match","number_one_contender","loser_leaves","career_vs_career","mask_vs_mask","hair_vs_hair","underground_rules"]

const MATCH_TYPE_PARTICIPANTS: Record<MatchType, number> = {
  singles: 2,
  tag: 4,
  triple_threat: 3,
  fatal_fourway: 4,
  ladder: 2,
  cage: 2,
  hell_in_a_cell: 2,
  last_man_standing: 2,
  tables: 2,
  battle_royal: 8,
  tournament_match: 4,
  intergender: 2,
}

function getMatchTypeName(type: MatchType) {
  return type.replace(/_/g, " ")
}

function getRequiredParticipants(type: MatchType) {
  return MATCH_TYPE_PARTICIPANTS[type] ?? 2
}

function getTitleMatchErrors(match: Match, participants: Wrestler[], titles: Title[]): string[] {
  const errors: string[] = []
  const requiredCount = getRequiredParticipants(match.matchType)

  if (participants.length < requiredCount) {
    errors.push(`This match type requires at least ${requiredCount} competitors.`)
  }
  if (match.stipulation === "title_match" && !match.titleId) {
    errors.push("Title matches require a selected title.")
  }
  if (match.titleId && match.stipulation !== "title_match") {
    errors.push("A selected title should use the title match stipulation.")
  }

  if (!match.titleId) {
    return errors
  }

  const title = titles.find(t => t.id === match.titleId)
  if (!title) {
    errors.push("Selected title is invalid.")
    return errors
  }

  const mixedGenders = participants.some((w, _, arr) => w.gender !== arr[0]?.gender)
  if (title.tier === "tag" && match.matchType !== "tag") {
    errors.push("A tag title must be defended in a tag match.")
  }
  if (title.tier === "tag" && participants.length !== 4) {
    errors.push("Tag title matches require exactly 4 competitors.")
  }
  if (title.tier !== "tag" && match.matchType === "tag") {
    errors.push("Tag team matches cannot defend a singles title.")
  }
  if (title.gender !== "mixed" && mixedGenders) {
    errors.push(`${title.shortName} cannot be defended in a mixed gender match.`)
  }
  if (title.gender !== "mixed" && participants.some(w => w.gender !== title.gender)) {
    errors.push(`${title.shortName} requires ${title.gender} competitors.`)
  }
  if (title.gender === "mixed" && mixedGenders && match.matchType !== "intergender") {
    errors.push("Mixed gender title matches should use the intergender match type.")
  }
  if (title.weightClass && participants.some(w => w.weightClass !== title.weightClass)) {
    errors.push(`${title.shortName} requires competitors in the ${title.weightClass} division.`)
  }

  return errors
}

function getTitleOptionReason(matchType: MatchType, title: Title, participants: Wrestler[]): string | null {
  const mixedGenders = participants.some((w, _, arr) => w.gender !== arr[0]?.gender)

  if (title.tier === "tag" && participants.length > 4) {
    return "Tag titles require exactly 4 competitors."
  }
  if (title.tier !== "tag" && matchType === "tag") {
    return "Tag matches can only defend tag titles."
  }
  if (title.gender !== "mixed" && participants.some(w => w.gender !== title.gender)) {
    return `${title.shortName} requires ${title.gender} competitors.`
  }
  if (title.gender === "mixed" && mixedGenders && matchType !== "intergender") {
    return "Mixed gender title matches should use the intergender match type."
  }
  if (title.weightClass && participants.some(w => w.weightClass !== title.weightClass)) {
    return `${title.weightClass} competitors only.`
  }

  return null
}

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

function MatchBuilder({ match, index, total, titles, onUpdate, onRemove, onMoveUp, onMoveDown }: {
  match: Match
  index: number
  total: number
  titles: Title[]
  onUpdate: (m: Match) => void
  onRemove: () => void
  onMoveUp: () => void
  onMoveDown: () => void
}) {
  const { wrestlers } = useRosterStore()
  const [showPicker, setShowPicker] = useState(false)
  const participants = match.participantIds.map(id => wrestlers.find(w => w.id === id)).filter(Boolean) as Wrestler[]
  const isMainEvent = index === total - 1

  const firstWrestler = participants[0]
  const genderLock = firstWrestler?.gender
  const selectedTitle = titles.find(t => t.id === match.titleId) ?? null
  const isTitleMatch = Boolean(match.titleId)
  const validTitles = titles
    .sort((a, b) => {
      const aVacant = a.isVacant ? 0 : 1
      const bVacant = b.isVacant ? 0 : 1
      if (aVacant !== bVacant) return aVacant - bVacant
      if (a.id === match.titleId) return -1
      if (b.id === match.titleId) return 1
      return a.shortName.localeCompare(b.shortName)
    })

  function toggleWrestler(w: Wrestler) {
    const ids = match.participantIds
    const updated = ids.includes(w.id) ? ids.filter(id => id !== w.id) : [...ids, w.id]
    onUpdate({ ...match, participantIds: updated, teamA: updated.slice(0, Math.ceil(updated.length / 2)), teamB: updated.slice(Math.ceil(updated.length / 2)) })
  }

  function handleTitleChange(value: string) {
    const titleId = value || null
    const nextStipulation = titleId ? "title_match" : match.stipulation === "title_match" ? "none" : match.stipulation
    onUpdate({ ...match, titleId, stipulation: nextStipulation })
  }

  const cardStyle = isMainEvent
    ? "border-amber-500/40 bg-amber-500/5"
    : isTitleMatch
      ? "border-amber-500/30 bg-amber-500/10"
      : "border-zinc-800 bg-zinc-900"

  return (
    <div className={"rounded-lg border p-4 space-y-3 " + cardStyle}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-zinc-500 w-6">{index + 1}</span>
          {isMainEvent && <span className="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold">MAIN EVENT</span>}
          {index === 0 && total > 1 && <span className="text-xs px-2 py-0.5 rounded bg-zinc-700 text-zinc-400 border border-zinc-600">OPENER</span>}
          {genderLock && <span className={"text-xs px-1.5 py-0.5 rounded border " + (genderLock === "female" ? "text-pink-400 border-pink-500/30" : "text-blue-400 border-blue-500/30")}>{genderLock}</span>}
          {selectedTitle && (
            <span className="text-xs px-2 py-0.5 rounded border border-amber-500/30 bg-amber-500/10 text-amber-200 font-bold">
              TITLE MATCH
            </span>
          )}
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
          <label className="text-xs text-zinc-500">Participants ({participants.length} / {getRequiredParticipants(match.matchType)})</label>
          <button
            type="button"
            onClick={() => setShowPicker(prev => !prev)}
            className="text-xs font-medium text-amber-400 hover:text-amber-200"
          >
            {showPicker ? "Done" : "+ Add wrestlers"}
          </button>
        </div>

        <div className="grid grid-cols-1 gap-2 mb-3">
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Title On The Line</label>
            <select
              title="Title on the line"
              value={match.titleId ?? ""}
              onChange={e => handleTitleChange(e.target.value)}
              className="w-full px-2 py-1.5 bg-zinc-800 border border-zinc-700 text-zinc-200 rounded text-xs focus:outline-none focus:border-amber-500"
            >
              <option value="">No title</option>
              {validTitles.map(t => {
                const champion = wrestlers.find(w => w.id === t.currentChampionId)
                const reason = getTitleOptionReason(match.matchType, t, participants)
                return (
                  <option key={t.id} value={t.id} disabled={Boolean(reason)}>
                    {t.shortName}{t.isVacant ? " — Vacant" : champion ? ` — ${champion.name}` : ""}{reason ? ` (${reason})` : ""}
                  </option>
                )
              })}
            </select>
            {match.titleId && selectedTitle && (
              <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-2 mt-2 text-xs text-amber-100 space-y-1">
                <p><span className="font-semibold">{selectedTitle.shortName}</span> is on the line.</p>
                {selectedTitle.isVacant ? (
                  <p>Winner becomes the new champion.</p>
                ) : (
                  <p>Current champion: {wrestlers.find(w => w.id === selectedTitle.currentChampionId)?.name ?? "Unknown"}</p>
                )}
                <p>{selectedTitle.tier === "tag" ? "Tag title matches must use a 4-person tag match." : selectedTitle.weightClass ? `Weight class: ${selectedTitle.weightClass}` : "Open weight title."}</p>
              </div>
            )}
            {match.titleId && selectedTitle && getTitleMatchErrors(match, participants, titles).map(error => (
              <p key={error} className="text-xs text-red-400 mt-1">{error}</p>
            ))}
          </div>
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

        {participants.length > 0 && participants.length < getRequiredParticipants(match.matchType) && (
          <p className="text-xs text-red-400 mt-1">This match type requires at least {getRequiredParticipants(match.matchType)} competitors.</p>
        )}

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
  const { game, advanceWeek, updatePlayer, addReputationPoints } = useGameStore()
  const { getByOrg, wrestlers, updateMomentum, updatePopularity, updateMorale } = useRosterStore()
  const { addShow } = useShowStore()
  const { getOrgById, getTitleById, getTitlesByOrg, setChampion } = useDivisionStore()

  const org = getOrgById(game.player.currentOrgId)
  const roster = getByOrg(game.player.currentOrgId)
  const titles = getTitlesByOrg(game.player.currentOrgId)

  const [matches, setMatches] = useState<Match[]>([])
  const [showName, setShowName] = useState("")
  const [venue, setVenue] = useState("")

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
    const participants = match.participantIds.map(id => wrestlers.find(w => w.id === id)).filter(Boolean) as Wrestler[]
    if (participants.length === 0) {
      return { ...match, result: { winnerId: null, winnerIds: [], method: "no_contest", finishingMove: "N/A", matchRating: 30, crowdRating: 25, matchDurationMinutes: 5 } }
    }

    const requiredCount = getRequiredParticipants(match.matchType)
    const avgInRing = participants.reduce((sum, w) => sum + w.stats.inRing, 0) / participants.length
    const avgPsych = participants.reduce((sum, w) => sum + w.stats.psychology, 0) / participants.length
    const avgCharisma = participants.reduce((sum, w) => sum + w.stats.charisma, 0) / participants.length
    const avgPop = participants.reduce((sum, w) => sum + w.popularity, 0) / participants.length
    const avgAthleticism = participants.reduce((sum, w) => sum + w.stats.athleticism, 0) / participants.length
    const avgStamina = participants.reduce((sum, w) => sum + w.stats.stamina, 0) / participants.length
    const isMain = match.isMainEvent

    const typeBonuses: Record<MatchType, number> = {
      singles: 0,
      tag: 2,
      triple_threat: 1,
      fatal_fourway: 3,
      ladder: 5,
      cage: 4,
      hell_in_a_cell: 5,
      last_man_standing: 4,
      tables: 4,
      battle_royal: 2,
      tournament_match: 3,
      intergender: 2,
    }

    const stipulationBonus: Record<MatchStipulation, number> = {
      none: 0,
      title_match: 5,
      number_one_contender: 2,
      loser_leaves: 3,
      career_vs_career: 5,
      mask_vs_mask: 4,
      hair_vs_hair: 4,
      underground_rules: 2,
    }

    const flowBonus = Math.max(0, Math.min(8, avgStamina / 15 - Math.abs(participants.length - requiredCount)))
    let base = (avgInRing * 0.35) + (avgPsych * 0.25) + (avgCharisma * 0.18) + (avgAthleticism * 0.12) + (avgStamina * 0.1)
    base += typeBonuses[match.matchType] ?? 0
    base += stipulationBonus[match.stipulation] ?? 0
    base += isMain ? 4 : 0
    base += flowBonus
    base += (Math.random() * 14) - 7
    const matchRating = Math.max(20, Math.min(100, Math.round(base)))

    const winnerChance = participants.map(w => {
      const pushWeight = { champion: 10, mainevent: 7, uppercard: 5, midcard: 3, enhancement: 1.5, jobber: 1 }[w.pushLevel] ?? 2
      const momentumWeight = 1 + w.momentum / 150
      return pushWeight * momentumWeight * (1 + w.stats.inRing / 200)
    })
    const totalWeight = winnerChance.reduce((a, b) => a + b, 0)
    let roll = Math.random() * totalWeight
    let winnerIdx = 0
    for (let i = 0; i < winnerChance.length; i++) {
      roll -= winnerChance[i]
      if (roll <= 0) { winnerIdx = i; break }
    }
    const winner = participants[winnerIdx]

    const methodWeights: Record<MatchResult["method"], number> = {
      pinfall: 50,
      submission: 20 + (avgPsych > 65 ? 10 : 0),
      dq: match.stipulation === "underground_rules" ? 0 : 10,
      count_out: 10,
      no_contest: 2,
      forfeit: 3,
    }

    if (match.stipulation === "loser_leaves" || match.stipulation === "career_vs_career" || match.stipulation === "mask_vs_mask" || match.stipulation === "hair_vs_hair") {
      methodWeights.dq = 0
      methodWeights.count_out = 0
      methodWeights.no_contest = 0
    }

    const methodOptions = Object.entries(methodWeights).flatMap(([method, weight]) => Array(Math.max(0, Math.round(weight))).fill(method))
    const method = (methodOptions[Math.floor(Math.random() * methodOptions.length)] as MatchResult["method"]) ?? "pinfall"
    const durationBase: Record<MatchType, [number, number]> = {
      singles: [7, 12],
      tag: [10, 15],
      triple_threat: [11, 16],
      fatal_fourway: [12, 18],
      ladder: [14, 20],
      cage: [13, 18],
      hell_in_a_cell: [15, 22],
      last_man_standing: [14, 20],
      tables: [12, 18],
      battle_royal: [12, 20],
      tournament_match: [11, 17],
      intergender: [8, 13],
    }
    const [minDur, maxDur] = durationBase[match.matchType] ?? [8, 14]
    const duration = Math.round(Math.min(25, Math.max(minDur, Math.min(maxDur, minDur + Math.round((matchRating - 50) / 10) + (isMain ? 2 : 0) + (Math.random() * 3)))))

    const crowdBase = (avgPop * 0.35) + (avgCharisma * 0.25) + (matchRating * 0.25) + (isMain ? 5 : 0) + (match.stipulation === "title_match" ? 4 : 0)
    const crowdRating = Math.max(15, Math.min(100, Math.round(crowdBase + (Math.random() * 12) - 5)))

    return {
      ...match,
      result: {
        winnerId: winner?.id ?? null,
        winnerIds: winner ? [winner.id] : [],
        method,
        finishingMove: winner?.finisher ?? "Pinfall",
        matchRating,
        crowdRating,
        matchDurationMinutes: duration,
      }
    }
  }

  function runShow() {
    if (!canRunShow) return
    if (matches.length === 0) return

    const simulatedMatches = matches.map(m => simulateSingleMatch(m))
    const matchRatings = simulatedMatches.map(m => m.result?.matchRating ?? 0)
    const avgRating = Math.round(matchRatings.reduce((a, b) => a + b, 0) / simulatedMatches.length)
    const mainRating = simulatedMatches[simulatedMatches.length - 1]?.result?.matchRating ?? 0
    const pacingBonus = simulatedMatches.length >= 4 ? 3 : 0
    const overallRating = Math.round(Math.min(100, (mainRating * 0.45) + (avgRating * 0.45) + pacingBonus))

    const capacity = Math.round((org?.fanbase ?? 10) * 50 + 200)
    const demandMod = overallRating / 100 + (org?.tier === "elite" ? 0.2 : org?.tier === "regional" ? 0.05 : 0)
    const attendance = Math.round(capacity * Math.min(1, 0.35 + demandMod + (simulatedMatches.length / 20)))
    const revenue = Math.round(attendance * 18 + overallRating * 12)

    const segments = simulatedMatches.map((match, index) => ({
      id: `segment_${match.id}`,
      showId: "pending",
      type: "match" as SegmentType,
      position: index,
      participantIds: match.participantIds,
      description: `${getMatchTypeName(match.matchType)}${match.stipulation !== "none" ? ` (${match.stipulation.replace(/_/g, " ")})` : ""} with ${match.participantIds.length} competitors`,
      durationMinutes: match.result?.matchDurationMinutes ?? 0,
      heatGenerated: match.result ? Math.min(100, Math.round(match.result.matchRating * 0.9)) : 0,
      rating: match.result?.matchRating ?? 0,
    }))

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
      segments,
      matches: simulatedMatches,
      overallRating,
      crowdRating: Math.round(simulatedMatches.reduce((sum, m) => sum + (m.result?.crowdRating ?? 0), 0) / simulatedMatches.length),
      tvRating: Math.round(Math.min(10, overallRating / 11)),
      ppvBuys: null,
      revenue,
      isSimulated: true,
      notes: "",
    }

    addShow(show)

    simulatedMatches.forEach(m => {
      if (!m.result) return
      if (m.titleId && m.result.winnerId) {
        setChampion(m.titleId, m.result.winnerId, game.week)
      }

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
    updatePlayer({ totalShowsBooked: newTotal, avgShowRating: newAvg })
    addReputationPoints(repGained)

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

  const matchValidationErrors = matches.map(m => {
    const participants = m.participantIds.map(id => wrestlers.find(w => w.id === id)).filter(Boolean) as Wrestler[]
    return getTitleMatchErrors(m, participants, titles)
  })
  const hasMatchErrors = matchValidationErrors.some(errors => errors.length > 0)
  const hasEnoughWrestlers = roster.length >= 2
  const canRunShow = matches.length > 0 && matches.every(m => m.participantIds.length >= getRequiredParticipants(m.matchType)) && !hasMatchErrors

  const currentMatch = matchQueue[currentMatchIdx]
  const currentParticipants = currentMatch
    ? currentMatch.participantIds.map(id => wrestlers.find(w => w.id === id)).filter(Boolean) as Wrestler[]
    : []
  const currentMatchTitle = currentMatch?.titleId ? getTitleById(currentMatch.titleId) : undefined

  return (
    <div className="space-y-4">
      {watchingMatches && currentMatch && currentMatch.result && (
        <MatchViewer
          match={currentMatch}
          participants={currentParticipants}
          result={currentMatch.result}
          isTitle={currentMatch.titleId !== null}
          titleName={currentMatchTitle?.shortName ?? undefined}
          onClose={handleMatchViewerClose}
        />
      )}

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
            titles={titles}
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
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 space-y-3">
          {hasMatchErrors && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
              <p className="font-semibold text-red-100">Fix invalid title booking before running the show.</p>
              <ul className="list-disc list-inside space-y-1 mt-2">
                {matches.map((match, index) => {
                  const errors = matchValidationErrors[index]
                  if (errors.length === 0) return null
                  return (
                    <li key={match.id}>
                      <span className="font-semibold">Match {index + 1}:</span> {errors.join(' ')}
                    </li>
                  )
                })}
              </ul>
            </div>
          )}
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


