import { useState } from "react"
import { Skull, Flame, UserPlus, Trophy, Zap, X, DollarSign } from "lucide-react"
import { useRosterStore } from "@/store/useRosterStore"
import { useGameStore } from "@/store/useGameStore"
import { useUndergroundStore } from "@/store/useUndergroundStore"
import { getPortraitSrc, getFallbackPortrait } from "@/utils/portraits"
import type { Wrestler, Contract } from "@/types/wrestler"
import type { UndergroundEvent } from "@/types/underground"

const UNDERGROUND_VENUES = [
  "Warehouse District Arena", "The Abandoned Gym", "Back Alley Brawl Pit",
  "Industrial Complex Ring", "The Basement", "Shipping Container Arena",
  "Underground Parking Lot", "The Condemned Building", "Midnight Warehouse",
  "The Dark Alley",
]

const UNDERGROUND_CITIES = [
  "Detroit", "Chicago", "Baltimore", "Philadelphia", "Newark",
  "Memphis", "Houston", "Cleveland", "St. Louis", "Oakland",
]

function Portrait({ w }: { w: Wrestler }) {
  const src = getPortraitSrc(w.portraitId)
  const fallback = getFallbackPortrait(w.gender)
  if (src) return <img src={src} onError={e => { e.currentTarget.src = fallback }} className="w-10 h-10 rounded-full object-top object-cover border border-zinc-600 flex-shrink-0" alt="" />
  return <div className="w-10 h-10 rounded-full bg-zinc-700 border border-zinc-600 flex items-center justify-center flex-shrink-0"><span className="text-sm font-bold text-zinc-400">{w.name.charAt(0)}</span></div>
}

function SignFromUndergroundModal({ wrestler: w, onSign, onClose }: {
  wrestler: Wrestler
  onSign: (contract: Contract) => void
  onClose: () => void
}) {
  const { game } = useGameStore()
  const avgStat = Math.round(Object.values(w.stats).reduce((a, b) => a + b, 0) / 8)
  const demand = Math.max(150, Math.round(avgStat * 2.5 + w.popularity * 1.5 + w.overness * 1))
  const [salary, setSalary] = useState(Math.round(demand * 0.8))
  const [weeks, setWeeks] = useState(26)
  const [result, setResult] = useState<"idle" | "accepted" | "rejected" | "countered">("idle")
  const [counterSalary, setCounterSalary] = useState(0)

  function makeOffer() {
    const ratio = salary / demand
    if (ratio >= 0.9) {
      setResult("accepted")
      setTimeout(() => {
        onSign({ salary, bonuses: Math.round(salary * 0.1), weeksRemaining: weeks, exclusivity: weeks >= 52 ? "exclusive" : "open", happiness: ratio >= 1.05 ? 90 : 75, noTradeClause: false, signingOrgId: game.player.currentOrgId })
      }, 1000)
    } else if (ratio >= 0.7) {
      const counter = Math.round(demand * 0.88)
      setCounterSalary(counter)
      setResult("countered")
    } else {
      setResult("rejected")
    }
  }

  function acceptCounter() {
    onSign({ salary: counterSalary, bonuses: Math.round(counterSalary * 0.1), weeksRemaining: weeks, exclusivity: weeks >= 52 ? "exclusive" : "open", happiness: 78, noTradeClause: false, signingOrgId: game.player.currentOrgId })
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl w-full max-w-md p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-zinc-100">Sign from Underground</h2>
          <button title="Close" onClick={onClose}><X className="w-5 h-5 text-zinc-500 hover:text-zinc-200" /></button>
        </div>

        <div className="flex items-center gap-3 bg-zinc-800/50 rounded-lg p-3 border border-zinc-700">
          <Portrait w={w} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-zinc-100">{w.name}</p>
            <p className="text-xs text-zinc-500">{w.nationality} · {w.weightClass} · {w.pushLevel}</p>
            <div className="flex gap-3 mt-1 text-xs">
              <span className="text-zinc-500">Pop: <span className="text-zinc-300">{w.popularity}</span></span>
              <span className="text-zinc-500">Overness: <span className="text-zinc-300">{w.overness}</span></span>
              <span className="text-zinc-500">Momentum: <span className="text-zinc-300">{w.momentum}</span></span>
            </div>
          </div>
        </div>

        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-xs text-red-400 space-y-1">
          <p className="font-medium">Underground Talent Warning</p>
          <p className="text-zinc-400">{w.name} has been operating outside the system. They may have baggage — other orgs may react to you signing underground talent.</p>
        </div>

        {result === "idle" && (
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-1">
                <label className="text-xs font-medium text-zinc-400">Weekly Salary Offer</label>
                <span className="text-xs text-zinc-500">Estimated: ~${demand.toLocaleString()}/wk</span>
              </div>
              <input type="range" min={Math.round(demand * 0.5)} max={Math.round(demand * 1.5)} step={100} value={salary} onChange={e => setSalary(Number(e.target.value))} className="w-full accent-red-500" aria-label="Weekly salary offer" title="Weekly salary offer" />
              <p className="text-xs text-amber-400 mt-1">Your offer: ${salary.toLocaleString()}/wk</p>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <label className="text-xs font-medium text-zinc-400">Contract Length</label>
                <span className="text-xs text-zinc-300">{weeks}w</span>
              </div>
              <input type="range" min={13} max={104} step={13} value={weeks} onChange={e => setWeeks(Number(e.target.value))} className="w-full accent-red-500" aria-label="Contract length" title="Contract length" />
            </div>
            <div className="flex gap-3">
              <button onClick={onClose} className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-sm font-medium">Cancel</button>
              <button onClick={makeOffer} className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-sm">Make Offer</button>
            </div>
          </div>
        )}

        {result === "accepted" && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 text-center">
            <p className="text-green-400 font-bold text-sm animate-pulse">Signed! {w.name} joins your roster.</p>
          </div>
        )}

        {result === "rejected" && (
          <div className="space-y-3">
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-center">
              <p className="text-red-400 font-bold text-sm">Rejected.</p>
              <p className="text-xs text-zinc-400 mt-1">{w.name} finds the offer insulting. They would rather stay underground.</p>
            </div>
            <button onClick={onClose} className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-sm font-medium">Close</button>
          </div>
        )}

        {result === "countered" && (
          <div className="space-y-3">
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
              <p className="text-amber-400 font-bold text-sm">Counter Offer</p>
              <p className="text-xs text-zinc-400 mt-1">{w.name} wants <span className="text-amber-400 font-bold">${counterSalary.toLocaleString()}/wk</span> minimum. Take it or leave it.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={onClose} className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-sm font-medium">Walk Away</button>
              <button onClick={acceptCounter} className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold rounded-lg text-sm">Accept ${counterSalary.toLocaleString()}/wk</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function RunUndergroundEventModal({ freeAgents, onRun, onClose }: {
  freeAgents: Wrestler[]
  onRun: (event: UndergroundEvent, results: { wrestler: Wrestler; won: boolean; prizeWon: number }[]) => void
  onClose: () => void
}) {
  const { game } = useGameStore()
  const [selectedFighters, setSelectedFighters] = useState<string[]>([])
  const [prizePool, setPrizePool] = useState(500)
  const [ran, setRan] = useState(false)
  const [results, setResults] = useState<{ wrestler: Wrestler; won: boolean; prizeWon: number }[]>([])

  const males   = freeAgents.filter(w => w.gender === "male")
  const females = freeAgents.filter(w => w.gender === "female")

  function toggleFighter(id: string) {
    setSelectedFighters(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  function runEvent() {
    if (selectedFighters.length < 2) return
    const fighters = selectedFighters.map(id => freeAgents.find(w => w.id === id)).filter(Boolean) as Wrestler[]

    const venue = UNDERGROUND_VENUES[Math.floor(Math.random() * UNDERGROUND_VENUES.length)]
    const city  = UNDERGROUND_CITIES[Math.floor(Math.random() * UNDERGROUND_CITIES.length)]

    const eventResults = fighters.map(w => {
      const score = w.stats.inRing * 0.3 + w.stats.toughness * 0.3 + w.momentum * 0.2 + Math.random() * 30
      return { wrestler: w, score }
    }).sort((a, b) => b.score - a.score)

    const finalResults = eventResults.map((r, i) => ({
      wrestler: r.wrestler,
      won: i === 0,
      prizeWon: i === 0 ? prizePool : Math.floor(prizePool * 0.1),
    }))

    const event: UndergroundEvent = {
      id: "ug_event_" + Date.now(),
      name: "Underground Fight Night",
      week: game.week,
      venue,
      city,
      attendance: Math.floor(Math.random() * 200) + 50,
      matchIds: [],
      titleId: "underground_title",
      organizedBy: null,
      noRules: true,
      prizePool,
    }

    setResults(finalResults)
    setRan(true)
    onRun(event, finalResults)
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl w-full max-w-lg p-6 space-y-5 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skull className="w-5 h-5 text-red-500" />
            <h2 className="text-lg font-bold text-zinc-100">Underground Fight Night</h2>
          </div>
          <button title="Close" onClick={onClose}><X className="w-5 h-5 text-zinc-500 hover:text-zinc-200" /></button>
        </div>

        {!ran ? (
          <>
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-xs text-zinc-400 space-y-1">
              <p className="text-red-400 font-medium">No rules. No contracts. No owner.</p>
              <p>Select fighters from the underground pool. Winner takes the prize pool. This is off the books.</p>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <label className="text-xs font-medium text-zinc-400">Prize Pool</label>
                <span className="text-xs text-amber-400">${prizePool.toLocaleString()}</span>
              </div>
              <input type="range" min={100} max={5000} step={100} value={prizePool} onChange={e => setPrizePool(Number(e.target.value))} className="w-full accent-red-500" aria-label="Prize pool amount" title="Prize pool amount" />
            </div>

            <div className="space-y-3">
              {males.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Male Fighters ({males.length})</p>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {males.map(w => (
                      <div key={w.id} onClick={() => toggleFighter(w.id)} className={"flex items-center gap-3 p-2.5 rounded-lg cursor-pointer border transition-colors " + (selectedFighters.includes(w.id) ? "bg-red-500/20 border-red-500/40" : "bg-zinc-800 border-zinc-700 hover:border-zinc-600")}>
                        <Portrait w={w} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-zinc-100 truncate">{w.name}</p>
                          <p className="text-xs text-zinc-500">{w.nationality} · {w.pushLevel}</p>
                        </div>
                        <div className="text-right text-xs">
                          <p className="text-zinc-400">Tough: {w.stats.toughness}</p>
                          <p className="text-zinc-500">Mom: {w.momentum}</p>
                        </div>
                        {selectedFighters.includes(w.id) && <span className="text-red-400 font-bold text-sm">✓</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {females.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Female Fighters ({females.length})</p>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {females.map(w => (
                      <div key={w.id} onClick={() => toggleFighter(w.id)} className={"flex items-center gap-3 p-2.5 rounded-lg cursor-pointer border transition-colors " + (selectedFighters.includes(w.id) ? "bg-red-500/20 border-red-500/40" : "bg-zinc-800 border-zinc-700 hover:border-zinc-600")}>
                        <Portrait w={w} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-zinc-100 truncate">{w.name}</p>
                          <p className="text-xs text-zinc-500">{w.nationality} · {w.pushLevel}</p>
                        </div>
                        <div className="text-right text-xs">
                          <p className="text-zinc-400">Tough: {w.stats.toughness}</p>
                          <p className="text-zinc-500">Mom: {w.momentum}</p>
                        </div>
                        {selectedFighters.includes(w.id) && <span className="text-red-400 font-bold text-sm">✓</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {selectedFighters.length < 2 && (
              <p className="text-xs text-zinc-600 text-center">Select at least 2 fighters</p>
            )}

            <div className="flex gap-3">
              <button onClick={onClose} className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-sm font-medium">Cancel</button>
              <button onClick={runEvent} disabled={selectedFighters.length < 2} className={"flex-1 py-2.5 rounded-lg font-bold text-sm transition-colors " + (selectedFighters.length >= 2 ? "bg-red-600 hover:bg-red-700 text-white" : "bg-zinc-700 text-zinc-500 cursor-not-allowed")}>
                Run Event ({selectedFighters.length} fighters)
              </button>
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-center">
              <p className="text-red-400 font-bold">Fight Night Complete</p>
              <p className="text-xs text-zinc-500 mt-1">No cameras. No commentary. Just the result.</p>
            </div>

            <div className="space-y-2">
              {results.map((r, i) => (
                <div key={r.wrestler.id} className={"flex items-center gap-3 p-3 rounded-lg border " + (r.won ? "bg-amber-500/10 border-amber-500/30" : "bg-zinc-800 border-zinc-700")}>
                  <span className={"text-lg font-black w-6 text-center " + (i === 0 ? "text-amber-400" : "text-zinc-600")}>{i + 1}</span>
                  <Portrait w={r.wrestler} />
                  <div className="flex-1 min-w-0">
                    <p className={"text-sm font-bold truncate " + (r.won ? "text-amber-400" : "text-zinc-300")}>{r.wrestler.name}</p>
                    <p className="text-xs text-zinc-500">{r.won ? "WINNER" : "Lost"}</p>
                  </div>
                  <div className="text-right">
                    <p className={"text-sm font-bold " + (r.won ? "text-green-400" : "text-zinc-600")}>
                      +${r.prizeWon.toLocaleString()}
                    </p>
                    <p className="text-xs text-zinc-600">prize</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-zinc-800/50 rounded-lg p-3 text-xs text-zinc-500 space-y-1">
              <p>Winner gains momentum. All participants gain experience.</p>
              <p>Signing the winner now could be good value before their stock rises.</p>
            </div>

            <button onClick={onClose} className="w-full py-2.5 bg-zinc-700 hover:bg-zinc-600 text-zinc-200 rounded-lg text-sm font-medium">Close</button>
          </div>
        )}
      </div>
    </div>
  )
}

export function Underground() {
  const { wrestlers, signContract, updateWrestler, updateMomentum } = useRosterStore()
  const { game } = useGameStore()
  const { events, addEvent } = useUndergroundStore()

  const [signingTarget, setSigningTarget] = useState<Wrestler | null>(null)
  const [showEventModal, setShowEventModal] = useState(false)
  const [filter, setFilter] = useState<"all" | "male" | "female">("all")

  const freeAgents = wrestlers.filter(w => w.status === "free_agent" || w.currentOrgId === "underground")
  const filtered = filter === "all" ? freeAgents : freeAgents.filter(w => w.gender === filter)
  const recentEvents = [...events].sort((a, b) => b.week - a.week).slice(0, 5)

  function handleSign(contract: Contract) {
    if (!signingTarget) return
    signContract(signingTarget.id, contract, game.player.currentOrgId)
    updateWrestler(signingTarget.id, { status: "active", currentOrgId: game.player.currentOrgId })
    setSigningTarget(null)
  }

  function handleRunEvent(event: UndergroundEvent, results: { wrestler: Wrestler; won: boolean; prizeWon: number }[]) {
    addEvent(event)
    results.forEach(r => {
      updateMomentum(r.wrestler.id, r.won ? 12 : 3)
      updateWrestler(r.wrestler.id, {
        experience: (r.wrestler.experience ?? 0) + 1,
      })
    })
  }

  const PUSH_COLORS: Record<string, string> = {
    champion: "text-amber-400", mainevent: "text-purple-400", uppercard: "text-blue-400",
    midcard: "text-green-400", enhancement: "text-zinc-400", jobber: "text-zinc-500",
  }

  const ALIGN_COLORS: Record<string, string> = {
    face: "text-blue-400", heel: "text-red-400", tweener: "text-yellow-400",
  }

  return (
    <div className="space-y-5">
      {signingTarget && (
        <SignFromUndergroundModal
          wrestler={signingTarget}
          onSign={handleSign}
          onClose={() => setSigningTarget(null)}
        />
      )}
      {showEventModal && (
        <RunUndergroundEventModal
          freeAgents={freeAgents}
          onRun={(event, results) => { handleRunEvent(event, results); setShowEventModal(false) }}
          onClose={() => setShowEventModal(false)}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Skull className="w-6 h-6 text-red-500" />
            <h1 className="text-2xl font-bold text-zinc-100">The Underground</h1>
          </div>
          <p className="text-sm text-zinc-500 mt-1">No owner. No rules. No contract. Just wrestlers fighting for survival.</p>
        </div>
        <button
          onClick={() => setShowEventModal(true)}
          disabled={freeAgents.length < 2}
          className={"flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-colors " + (freeAgents.length >= 2 ? "bg-red-600 hover:bg-red-700 text-white" : "bg-zinc-700 text-zinc-500 cursor-not-allowed")}
        >
          <Zap className="w-4 h-4" />
          Run Fight Night
        </button>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 text-center">
          <p className="text-2xl font-black text-red-400">{freeAgents.length}</p>
          <p className="text-xs text-zinc-500">In the Underground</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 text-center">
          <p className="text-2xl font-black text-amber-400">{freeAgents.filter(w => w.pushLevel === "uppercard" || w.pushLevel === "mainevent" || w.pushLevel === "champion").length}</p>
          <p className="text-xs text-zinc-500">High Value Targets</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 text-center">
          <p className="text-2xl font-black text-zinc-300">{events.length}</p>
          <p className="text-xs text-zinc-500">Events Run</p>
        </div>
      </div>

      {/* Warning banner */}
      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 space-y-1">
        <div className="flex items-center gap-2">
          <Flame className="w-4 h-4 text-red-400" />
          <p className="text-sm font-medium text-red-400">Underground Rules</p>
        </div>
        <p className="text-xs text-zinc-400 leading-relaxed">
          These wrestlers exist outside the system. No organization owns them. Signing underground talent can boost your roster quickly but may raise eyebrows from rival orgs. The underground title carries no weekly bonus — only reputation.
        </p>
      </div>

      <div className="flex gap-4">
        {/* Free agent pool */}
        <div className="flex-1 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-zinc-300">Free Agent Pool</p>
            <div className="flex gap-1 bg-zinc-800/50 rounded-lg p-1">
              {(["all","male","female"] as const).map(f => (
                <button key={f} onClick={() => setFilter(f)} title={"Filter " + f} className={"px-3 py-1 rounded text-xs font-medium transition-colors " + (filter === f ? "bg-zinc-700 text-zinc-100" : "text-zinc-400 hover:text-zinc-200")}>
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="border-2 border-dashed border-zinc-800 rounded-xl p-16 text-center">
              <Skull className="w-10 h-10 text-zinc-700 mx-auto mb-3 opacity-30" />
              <p className="text-zinc-500 text-sm">The underground is quiet.</p>
              <p className="text-zinc-600 text-xs mt-1">No free agents available right now.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map(w => (
                <div key={w.id} className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 hover:border-zinc-700 transition-colors">
                  <div className="flex items-center gap-3">
                    <Portrait w={w} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-zinc-100">{w.name}</span>
                        <span className={"text-xs font-medium " + (ALIGN_COLORS[w.alignment] ?? "")}>{w.alignment}</span>
                        {w.potential >= 85 && <span className="text-xs px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">High Potential</span>}
                      </div>
                      <p className="text-xs text-zinc-500 mt-0.5">{w.nationality} · {w.weightClass} · Age {w.age}</p>
                      <p className="text-xs text-zinc-600 mt-0.5 italic truncate">&quot;{w.catchphrase}&quot;</p>
                    </div>
                    <div className="flex-shrink-0 text-right space-y-1">
                      <span className={"text-xs font-bold " + (PUSH_COLORS[w.pushLevel] ?? "")}>{w.pushLevel}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-2 mt-3 text-center">
                    {[
                      { label: "In Ring", val: w.stats.inRing },
                      { label: "Promo",   val: w.stats.promo },
                      { label: "Tough",   val: w.stats.toughness },
                      { label: "Pop",     val: w.popularity },
                    ].map(s => (
                      <div key={s.label} className="bg-zinc-800 rounded p-1.5">
                        <p className="text-xs font-bold text-zinc-200">{s.val}</p>
                        <p className="text-xs text-zinc-600">{s.label}</p>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-zinc-600">Momentum</span>
                        <div className="w-16 bg-zinc-800 rounded-full h-1.5">
                          <div className="bg-amber-400 h-1.5 rounded-full" style={{ width: w.momentum + "%" }} />
                        </div>
                        <span className="text-xs text-zinc-400">{w.momentum}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => setSigningTarget(w)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition-colors"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      Sign
                    </button>
                  </div>

                  {w.bio && (
                    <p className="text-xs text-zinc-600 mt-2 italic leading-relaxed border-t border-zinc-800 pt-2">{w.bio}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right panel - recent events + underground title */}
        <div className="w-72 flex-shrink-0 space-y-4">
          <div className="bg-zinc-900 border border-red-500/20 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-red-400" />
              <p className="text-sm font-bold text-zinc-100">Underground Title</p>
            </div>
            <p className="text-xs text-zinc-400">The Strap — no weekly bonus, no org backing. Purely reputation.</p>
            <div className="bg-zinc-800 rounded-lg p-3 text-center">
              <p className="text-xs text-zinc-500 mb-1">Current Holder</p>
              <p className="text-sm font-bold text-red-400">VACANT</p>
              <p className="text-xs text-zinc-600 mt-1">Run a Fight Night to crown a champion</p>
            </div>
          </div>

          {recentEvents.length > 0 && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 space-y-3">
              <p className="text-sm font-medium text-zinc-300">Recent Fight Nights</p>
              {recentEvents.map(e => (
                <div key={e.id} className="bg-zinc-800 rounded-lg p-3 space-y-1">
                  <p className="text-xs font-medium text-zinc-200">{e.name}</p>
                  <p className="text-xs text-zinc-500">{e.venue} · {e.city}</p>
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-600">Week {e.week}</span>
                    <span className="text-zinc-500">{e.attendance} fans</span>
                    <span className="text-amber-400">${e.prizePool.toLocaleString()} pool</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 space-y-2">
            <p className="text-sm font-medium text-zinc-300 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-green-400" />
              Scouting Value
            </p>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Underground talent is often undervalued. A wrestler dominating the underground scene can be signed at local org rates but perform at regional or higher level.
            </p>
            <div className="space-y-1">
              {freeAgents.filter(w => w.potential >= 85).map(w => (
                <div key={w.id} className="flex items-center justify-between text-xs bg-zinc-800 rounded px-2 py-1.5">
                  <span className="text-zinc-300 font-medium">{w.name}</span>
                  <span className="text-amber-400">Potential {w.potential}</span>
                </div>
              ))}
              {freeAgents.filter(w => w.potential >= 85).length === 0 && (
                <p className="text-xs text-zinc-600 italic">No high-potential targets currently.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
