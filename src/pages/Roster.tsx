import { useState } from "react"
import { Search, Users, UserPlus, X } from "lucide-react"
import { useRosterStore } from "@/store/useRosterStore"
import { useGameStore } from "@/store/useGameStore"
import { useDivisionStore } from "@/store/useDivisionStore"
import { getPortraitSrc, getFallbackPortrait } from "@/utils/portraits"
import type { Wrestler, Contract } from "@/types/wrestler"
import type { Title } from "@/types/title"

const PUSH_COLORS: Record<string, string> = {
  champion:    "bg-amber-500/20 text-amber-400 border-amber-500/30",
  mainevent:   "bg-purple-500/20 text-purple-400 border-purple-500/30",
  uppercard:   "bg-blue-500/20 text-blue-400 border-blue-500/30",
  midcard:     "bg-green-500/20 text-green-400 border-green-500/30",
  enhancement: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
  jobber:      "bg-zinc-700/20 text-zinc-500 border-zinc-700/30",
}

const ALIGN_COLORS: Record<string, string> = {
  face:    "text-blue-400",
  heel:    "text-red-400",
  tweener: "text-yellow-400",
}

function StatBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-zinc-500 w-24">{label}</span>
      <div className="flex-1 bg-zinc-800 rounded-full h-1.5">
        <div className="bg-amber-400 h-1.5 rounded-full" style={{ width: value + "%" }} />
      </div>
      <span className="text-xs font-medium text-zinc-300 w-6 text-right">{value}</span>
    </div>
  )
}

function MiniBar({ value, color = "bg-amber-400" }: { value: number; color?: string }) {
  return (
    <div className="w-20 flex-shrink-0">
      <div className="flex items-center gap-1">
        <div className="flex-1 bg-zinc-800 rounded-full h-1.5">
          <div className={color + " h-1.5 rounded-full"} style={{ width: value + "%" }} />
        </div>
        <span className="text-xs text-zinc-400 w-5 text-right">{value}</span>
      </div>
    </div>
  )
}

function Portrait({ portraitId, gender, size }: { portraitId: string; gender: "male" | "female"; size: "sm" | "lg" }) {
  const sz = size === "sm" ? "w-10 h-10" : "w-14 h-14"
  const src = getPortraitSrc(portraitId)
  const fallback = getFallbackPortrait(gender)
  if (src) {
    return (
      <img
        src={src}
        onError={(e) => { e.currentTarget.src = fallback }}
        className={sz + " rounded-full object-top object-cover border border-zinc-600 flex-shrink-0"}
        alt=""
      />
    )
  }
  return (
    <div className={sz + " rounded-full bg-zinc-700 border border-zinc-600 flex items-center justify-center flex-shrink-0"}>
      <span className="text-sm font-bold text-zinc-300">{gender === "female" ? "F" : "M"}</span>
    </div>
  )
}

function SigningModal({ wrestler: w, orgBudget, onSign, onClose }: {
  wrestler: Wrestler
  orgBudget: number
  onSign: (contract: Contract) => void
  onClose: () => void
}) {
  const avgStat = Math.round(Object.values(w.stats).reduce((a, b) => a + b, 0) / 8)
  const baseDemand = Math.max(150, Math.round(avgStat * 4 + w.popularity * 3 + w.overness * 2))
  const [offerSalary, setOfferSalary] = useState(Math.round(baseDemand * 0.85))
  const [offerWeeks, setOfferWeeks] = useState(26)

  const canAfford = offerSalary <= orgBudget
  const wrestlerHappy = offerSalary >= baseDemand * 0.8
  const willSign = wrestlerHappy && canAfford

  function handleSign() {
    if (!willSign) return
    const contract: Contract = {
      salary: offerSalary,
      bonuses: Math.round(offerSalary * 0.1),
      weeksRemaining: offerWeeks,
      exclusivity: offerWeeks >= 52 ? "exclusive" : "open",
      happiness: offerSalary >= baseDemand ? 90 : 70,
      noTradeClause: false,
      signingOrgId: "player_org",
    }
    onSign(contract)
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl w-full max-w-md p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-zinc-100">Sign {w.name}</h2>
          <button title="Close" onClick={onClose} className="text-zinc-500 hover:text-zinc-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-3 bg-zinc-800/50 rounded-lg p-3">
          <Portrait portraitId={w.portraitId} gender={w.gender} size="sm" />
          <div>
            <p className="text-sm font-medium text-zinc-100">{w.name}</p>
            <p className="text-xs text-zinc-500">{w.nationality} � {w.weightClass} � {w.pushLevel}</p>
            <p className={"text-xs font-medium " + (ALIGN_COLORS[w.alignment] ?? "")}>{w.alignment}</p>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Quick Stats</p>
          <div className="grid grid-cols-3 gap-2 text-center">
            {[
              { label: "In Ring", val: w.stats.inRing },
              { label: "Promo",   val: w.stats.promo   },
              { label: "Charisma",val: w.stats.charisma },
            ].map((s) => (
              <div key={s.label} className="bg-zinc-800 rounded p-2">
                <p className="text-base font-bold text-amber-400">{s.val}</p>
                <p className="text-xs text-zinc-500">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-zinc-400">Weekly Salary Offer</label>
              <span className="text-xs text-zinc-500">Wants: ${baseDemand.toLocaleString()}/wk</span>
            </div>
            <input
              title="Weekly Salary"
              type="range"
              min={100}
              max={Math.round(baseDemand * 1.5)}
              step={50}
              value={offerSalary}
              onChange={(e) => setOfferSalary(Number(e.target.value))}
              className="w-full accent-amber-400"
            />
            <div className="flex justify-between text-xs mt-1">
              <span className={canAfford ? "text-green-400" : "text-red-400"}>
                Your offer: ${offerSalary.toLocaleString()}/wk
              </span>
              <span className="text-zinc-500">Budget: ${orgBudget.toLocaleString()}/wk</span>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-zinc-400">Contract Length</label>
              <span className="text-xs text-zinc-300">{offerWeeks} weeks ({Math.round(offerWeeks/52*10)/10} years)</span>
            </div>
            <input
              title="Contract Length"
              type="range"
              min={13}
              max={156}
              step={13}
              value={offerWeeks}
              onChange={(e) => setOfferWeeks(Number(e.target.value))}
              className="w-full accent-amber-400"
            />
          </div>
        </div>

        <div className={"rounded-lg p-3 border text-sm " + (willSign ? "bg-green-500/10 border-green-500/30 text-green-400" : !wrestlerHappy ? "bg-red-500/10 border-red-500/30 text-red-400" : "bg-orange-500/10 border-orange-500/30 text-orange-400")}>
          {!canAfford && "You cannot afford this salary with your current budget."}
          {canAfford && !wrestlerHappy && w.name + " finds this offer insulting. Increase the salary."}
          {willSign && w.name + " is happy with this offer and will sign."}
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-sm font-medium">
            Cancel
          </button>
          <button
            onClick={handleSign}
            disabled={!willSign}
            className={"flex-1 py-2.5 rounded-lg text-sm font-bold transition-colors " + (willSign ? "bg-amber-500 hover:bg-amber-600 text-zinc-950" : "bg-zinc-700 text-zinc-500 cursor-not-allowed")}
          >
            Sign Contract
          </button>
        </div>
      </div>
    </div>
  )
}

function AssignTitleModal({
  wrestler,
  titles,
  selectedTitleId,
  onSelect,
  onAssign,
  onClose,
}: {
  wrestler: Wrestler
  titles: Title[]
  selectedTitleId: string | null
  onSelect: (titleId: string) => void
  onAssign: () => void
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl w-full max-w-lg p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-zinc-100">Assign Title to {wrestler.name}</h2>
          <button title="Close" onClick={onClose} className="text-zinc-500 hover:text-zinc-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3">
          <p className="text-sm text-zinc-400">Choose an eligible championship for this wrestler.</p>
          <div className="grid gap-2">
            {titles.length === 0 ? (
              <div className="rounded-lg border border-zinc-700 bg-zinc-800 p-4 text-sm text-zinc-400">
                No eligible titles are available for this wrestler.
              </div>
            ) : (
              titles.map((title) => (
                <label key={title.id} className="block rounded-lg border border-zinc-700 p-3 cursor-pointer hover:border-amber-500">
                  <input
                    type="radio"
                    name="assign-title"
                    value={title.id}
                    checked={selectedTitleId === title.id}
                    onChange={() => onSelect(title.id)}
                    className="mr-3 accent-amber-400"
                  />
                  <span className="font-medium text-zinc-100">{title.shortName}</span>
                  <span className="ml-2 text-xs text-zinc-500">
                    {title.gender === "mixed" ? "Intergender" : title.gender} · {title.weightClass ?? "Open"}
                  </span>
                  <p className="text-xs text-zinc-500 mt-1">
                    {title.isVacant ? "Vacant" : `Current champion: ${title.currentChampionId ?? "Unknown"}`}
                  </p>
                </label>
              ))
            )}
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-sm font-medium">
            Cancel
          </button>
          <button
            onClick={onAssign}
            disabled={!selectedTitleId || titles.length === 0}
            className={"flex-1 py-2.5 rounded-lg text-sm font-bold transition-colors " + (!selectedTitleId ? "bg-zinc-700 text-zinc-500 cursor-not-allowed" : "bg-amber-500 hover:bg-amber-600 text-zinc-950")}
          >
            Assign Title
          </button>
        </div>
      </div>
    </div>
  )
}

function WrestlerRow({ wrestler: w, isSelected, onClick, showSignButton, onSign }: {
  wrestler: Wrestler
  isSelected: boolean
  onClick: () => void
  showSignButton?: boolean
  onSign?: () => void
}) {
  return (
    <div
      className={"flex items-center gap-4 p-3 rounded-lg border transition-colors " + (isSelected ? "bg-zinc-700/60 border-zinc-600" : "bg-zinc-900 border-zinc-800 hover:bg-zinc-800/60")}
    >
      <div onClick={onClick} className="flex items-center gap-4 flex-1 min-w-0 cursor-pointer">
        <Portrait portraitId={w.portraitId} gender={w.gender} size="sm" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-zinc-100 truncate">{w.name}</span>
            <span className={"text-xs font-medium " + (ALIGN_COLORS[w.alignment] ?? "text-zinc-400")}>{w.alignment}</span>
            {w.injury && !w.injury.isKayfabe && (
              <span className="text-xs px-1.5 py-0.5 rounded border text-red-400 border-red-500/30">Injured</span>
            )}
            {w.isRookie && (
              <span className="text-xs px-1.5 py-0.5 rounded border text-green-400 border-green-500/30">Rookie</span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-zinc-500">{w.nationality}</span>
            <span className="text-xs text-zinc-600">�</span>
            <span className="text-xs text-zinc-500">{w.weightClass}</span>
            <span className="text-xs text-zinc-600">�</span>
            <span className="text-xs text-zinc-500">Age {w.age}</span>
          </div>
        </div>
        <span className={"text-xs px-2 py-0.5 rounded border flex-shrink-0 " + (PUSH_COLORS[w.pushLevel] ?? "")}>
          {w.pushLevel}
        </span>
        <div className="hidden lg:flex items-center gap-4 flex-shrink-0">
          <div>
            <p className="text-xs text-zinc-500 mb-0.5">Momentum</p>
            <MiniBar value={w.momentum} color="bg-amber-400" />
          </div>
          <div>
            <p className="text-xs text-zinc-500 mb-0.5">Popularity</p>
            <MiniBar value={w.popularity} color="bg-blue-400" />
          </div>
          <div>
            <p className="text-xs text-zinc-500 mb-0.5">Morale</p>
            <MiniBar value={w.morale} color="bg-green-400" />
          </div>
        </div>
      </div>
      {showSignButton && onSign && (
        <button
          onClick={onSign}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-zinc-950 text-xs font-bold rounded-lg flex-shrink-0 transition-colors"
        >
          <UserPlus className="w-3.5 h-3.5" />
          Sign
        </button>
      )}
    </div>
  )
}

function DetailPanel({ w, onClose, isPlayerOrg, onAssignTitle }: { w: Wrestler; onClose: () => void; isPlayerOrg: boolean; onAssignTitle: () => void }) {
  const statKeys = [
    { key: "inRing" as const,      label: "In Ring"     },
    { key: "promo" as const,       label: "Promo"       },
    { key: "charisma" as const,    label: "Charisma"    },
    { key: "athleticism" as const, label: "Athleticism" },
    { key: "psychology" as const,  label: "Psychology"  },
    { key: "look" as const,        label: "Look"        },
    { key: "toughness" as const,   label: "Toughness"   },
    { key: "stamina" as const,     label: "Stamina"     },
  ]

  return (
    <div className="w-80 flex-shrink-0 bg-zinc-900 border border-zinc-800 rounded-lg p-4 space-y-4 overflow-y-auto max-h-[calc(100vh-160px)]">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Portrait portraitId={w.portraitId} gender={w.gender} size="lg" />
          <div>
            <h2 className="text-base font-bold text-zinc-100">{w.name}</h2>
            <p className="text-xs text-zinc-500">{w.realName}</p>
            <p className="text-xs text-zinc-500">{w.nationality} � Age {w.age}</p>
          </div>
        </div>
        <button onClick={onClose} className="text-zinc-600 hover:text-zinc-300 text-xl leading-none">x</button>
      </div>

      <div className="flex flex-wrap gap-1">
        <span className={"text-xs px-2 py-0.5 rounded border " + (PUSH_COLORS[w.pushLevel] ?? "")}>{w.pushLevel}</span>
        <span className={"text-xs px-2 py-0.5 rounded border border-zinc-600 " + (ALIGN_COLORS[w.alignment] ?? "")}>{w.alignment}</span>
        <span className="text-xs px-2 py-0.5 rounded border text-zinc-400 border-zinc-600">{w.weightClass}</span>
        {w.isRookie && <span className="text-xs px-2 py-0.5 rounded border text-green-400 border-green-500/30">Rookie</span>}
      </div>

      <div className="grid grid-cols-3 gap-2 py-2 border-y border-zinc-800">
        {[
          { label: "Momentum",  val: w.momentum,  color: "text-amber-400" },
          { label: "Popularity", val: w.popularity, color: "text-blue-400" },
          { label: "Morale",    val: w.morale,    color: "text-green-400" },
        ].map((x) => (
          <div key={x.label} className="text-center">
            <p className={"text-xl font-bold " + x.color}>{x.val}</p>
            <p className="text-xs text-zinc-500">{x.label}</p>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Attributes</p>
        {statKeys.map(({ key, label }) => (
          <StatBar key={key} label={label} value={w.stats[key]} />
        ))}
      </div>

      <div className="space-y-1">
        <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Overness</p>
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-zinc-800 rounded-full h-2">
            <div className="bg-purple-400 h-2 rounded-full" style={{ width: w.overness + "%" }} />
          </div>
          <span className="text-xs text-zinc-300">{w.overness}</span>
        </div>
        <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mt-2">Potential</p>
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-zinc-800 rounded-full h-2">
            <div className="bg-amber-400 h-2 rounded-full" style={{ width: w.potential + "%" }} />
          </div>
          <span className="text-xs text-zinc-300">{w.potential}</span>
        </div>
      </div>

      {w.bio ? (
        <div>
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">Bio</p>
          <p className="text-xs text-zinc-400 leading-relaxed">{w.bio}</p>
        </div>
      ) : null}

      {w.finisher ? (
        <div>
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">Finisher</p>
          <p className="text-sm text-amber-400 font-medium">{w.finisher}</p>
          {w.catchphrase ? <p className="text-xs text-zinc-500 mt-0.5 italic">"{w.catchphrase}"</p> : null}
        </div>
      ) : null}

      {w.contract ? (
        <div className="bg-zinc-800/50 rounded-lg p-3 space-y-1">
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Contract</p>
          <div className="flex justify-between text-xs">
            <span className="text-zinc-400">Weekly Salary</span>
            <span className="text-zinc-200 font-medium">${w.contract.salary.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-zinc-400">Weeks Remaining</span>
            <span className={w.contract.weeksRemaining <= 8 ? "text-red-400 font-medium" : "text-zinc-200"}>
              {w.contract.weeksRemaining}w
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-zinc-400">Exclusivity</span>
            <span className="text-zinc-200">{w.contract.exclusivity}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-zinc-400">Happiness</span>
            <span className={w.contract.happiness >= 70 ? "text-green-400" : "text-red-400"}>
              {w.contract.happiness}/100
            </span>
          </div>
        </div>
      ) : null}

      {w.championships.length > 0 ? (
        <div>
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Championships</p>
          {w.championships.map((c) => (
            <div key={c.titleId} className="flex justify-between text-xs bg-amber-500/10 border border-amber-500/20 rounded px-2 py-1 mb-1">
              <span className="text-amber-400 font-medium">{c.titleId.replace(/_/g, " ").toUpperCase()}</span>
              <span className="text-zinc-400">{c.defenses} defenses</span>
            </div>
          ))}
        </div>
      ) : null}

      {isPlayerOrg ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
            <div>
              <p className="text-xs font-medium text-amber-200 uppercase tracking-wider">Title Assignment</p>
              <p className="text-sm text-zinc-300">Assign this wrestler to a championship in your organization.</p>
            </div>
            <button
              onClick={onAssignTitle}
              className="rounded-lg bg-amber-500 px-3 py-2 text-xs font-bold text-zinc-950 hover:bg-amber-600 transition-colors"
            >
              Assign Title
            </button>
          </div>
        </div>
      ) : null}

      {w.careerHighlights.length > 0 ? (
        <div>
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Career Highlights</p>
          <ul className="space-y-1">
            {w.careerHighlights.map((h, i) => (
              <li key={i} className="text-xs text-zinc-400">- {h}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  )
}

export function Roster() {
  const { game } = useGameStore()
  const { getByOrg, getFreeAgents, wrestlers, signContract, updateWrestler, getById } = useRosterStore()
  const { getOrgById, getTitlesByOrg, setChampion } = useDivisionStore()
  const [search, setSearch] = useState("")
  const [tab, setTab] = useState<"male" | "female" | "free">("male")
  const [assignTitleTarget, setAssignTitleTarget] = useState<Wrestler | null>(null)
  const [selectedTitleId, setSelectedTitleId] = useState<string | null>(null)
  const [selected, setSelected] = useState<Wrestler | null>(null)
  const [signingTarget, setSigningTarget] = useState<Wrestler | null>(null)

  const org = getOrgById(game.player.currentOrgId)
  const orgBudget = org?.wealth ?? 5000

  const eligibleTitlesForWrestler = (w: Wrestler) => {
    if (!w.currentOrgId) return []
    return getTitlesByOrg(w.currentOrgId).filter((title) =>
      title.tier !== "tag" &&
      (title.gender === "mixed" || title.gender === w.gender) &&
      (!title.weightClass || title.weightClass === w.weightClass)
    )
  }

  const orgRoster = getByOrg(game.player.currentOrgId)
  const freeAgents = getFreeAgents()

  const filterList = (list: Wrestler[]) =>
    search.trim()
      ? list.filter((w) =>
          w.name.toLowerCase().includes(search.toLowerCase()) ||
          w.nationality.toLowerCase().includes(search.toLowerCase()) ||
          w.pushLevel.toLowerCase().includes(search.toLowerCase())
        )
      : list

  const males   = filterList(orgRoster.filter((w) => w.gender === "male"))
  const females = filterList(orgRoster.filter((w) => w.gender === "female"))
  const free    = filterList(freeAgents)

  const currentList = tab === "male" ? males : tab === "female" ? females : free

  const tabs = [
    { key: "male"   as const, label: "Men (" + males.length + ")"         },
    { key: "female" as const, label: "Women (" + females.length + ")"     },
    { key: "free"   as const, label: "Free Agents (" + free.length + ")"  },
  ]

  function handleSign(contract: Contract) {
    if (!signingTarget) return
    signContract(signingTarget.id, contract, game.player.currentOrgId)
    updateWrestler(signingTarget.id, {
      status: "active",
      currentOrgId: game.player.currentOrgId,
    })
    setSigningTarget(null)
    setTab(signingTarget.gender === "female" ? "female" : "male")
  }

  function handleAssignTitle() {
    if (!assignTitleTarget || !selectedTitleId) return
    const title = getTitlesByOrg(assignTitleTarget.currentOrgId ?? "").find((t) => t.id === selectedTitleId)
    if (!title) return

    const previousChampionId = title.currentChampionId
    if (previousChampionId && previousChampionId !== assignTitleTarget.id) {
      const previousChampion = getById(previousChampionId)
      if (previousChampion) {
        updateWrestler(previousChampion.id, {
          championships: previousChampion.championships.filter((c) => c.titleId !== title.id),
        })
      }
    }

    setChampion(title.id, assignTitleTarget.id, game.week)
    const alreadyChampion = assignTitleTarget.championships.some((c) => c.titleId === title.id)
    const updatedChampionships = alreadyChampion
      ? assignTitleTarget.championships
      : [...assignTitleTarget.championships, { titleId: title.id, wonWeek: game.week, defenses: 0 }]

    updateWrestler(assignTitleTarget.id, {
      championships: updatedChampionships,
      pushLevel: "champion",
      careerHighlights: [...assignTitleTarget.careerHighlights, `Won ${title.shortName} in week ${game.week}`],
    })

    setAssignTitleTarget(null)
    setSelectedTitleId(null)
  }

  return (
    <div className="space-y-4">
      {signingTarget && (
        <SigningModal
          wrestler={signingTarget}
          orgBudget={orgBudget}
          onSign={handleSign}
          onClose={() => setSigningTarget(null)}
        />
      )}
      {assignTitleTarget && (
        <AssignTitleModal
          wrestler={assignTitleTarget}
          titles={eligibleTitlesForWrestler(assignTitleTarget)}
          selectedTitleId={selectedTitleId}
          onSelect={setSelectedTitleId}
          onAssign={handleAssignTitle}
          onClose={() => {
            setAssignTitleTarget(null)
            setSelectedTitleId(null)
          }}
        />
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Roster</h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            {orgRoster.length} under contract � {freeAgents.length} free agents � {wrestlers.length} total in game
          </p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            placeholder="Search wrestlers..."
            className="pl-9 pr-4 py-2 bg-zinc-800 border border-zinc-700 text-zinc-100 rounded-md text-sm w-56 focus:outline-none focus:border-amber-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {tab === "free" && free.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg px-4 py-3 text-sm text-amber-400">
          <strong>{free.length} free agents</strong> available to sign. Click Sign on any wrestler to make an offer.
        </div>
      )}

      <div className="flex gap-1 bg-zinc-800/50 rounded-lg p-1 w-fit">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={"px-4 py-1.5 rounded-md text-sm font-medium transition-colors " + (tab === t.key ? "bg-zinc-700 text-zinc-100" : "text-zinc-400 hover:text-zinc-200")}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex gap-4">
        <div className="flex-1 space-y-1.5 overflow-y-auto max-h-[calc(100vh-240px)]">
          {currentList.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-zinc-600">
              <Users className="w-12 h-12 mb-3 opacity-30" />
              <p className="text-sm">No wrestlers found.</p>
              {tab === "free" && <p className="text-xs mt-1">All free agents have been signed.</p>}
            </div>
          )}
          {currentList.map((w) => (
            <WrestlerRow
              key={w.id}
              wrestler={w}
              isSelected={selected?.id === w.id}
              onClick={() => setSelected(selected?.id === w.id ? null : w)}
              showSignButton={tab === "free"}
              onSign={() => setSigningTarget(w)}
            />
          ))}
        </div>
        {selected && (
          <DetailPanel
            w={selected}
            onClose={() => setSelected(null)}
            isPlayerOrg={selected.currentOrgId === game.player.currentOrgId}
            onAssignTitle={() => setAssignTitleTarget(selected)}
          />
        )}
      </div>
    </div>
  )
}

