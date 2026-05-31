import { useState } from "react"
import { Search, Users } from "lucide-react"
import { useRosterStore } from "@/store/useRosterStore"
import { useGameStore } from "@/store/useGameStore"
import { getPortraitSrc, getFallbackPortrait } from "@/utils/portraits"
import type { Wrestler } from "@/types/wrestler"

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
        className={sz + " rounded-full object-top border border-zinc-600 flex-shrink-0"}
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

function WrestlerRow({ wrestler: w, isSelected, onClick }: { wrestler: Wrestler; isSelected: boolean; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className={"flex items-center gap-4 p-3 rounded-lg cursor-pointer transition-colors border " + (isSelected ? "bg-zinc-700/60 border-zinc-600" : "bg-zinc-900 border-zinc-800 hover:bg-zinc-800/60")}
    >
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
          <span className="text-xs text-zinc-600">·</span>
          <span className="text-xs text-zinc-500">{w.weightClass}</span>
          <span className="text-xs text-zinc-600">·</span>
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
  )
}

function DetailPanel({ w, onClose }: { w: Wrestler; onClose: () => void }) {
  const statKeys = [
    { key: "inRing" as const,      label: "In Ring"      },
    { key: "promo" as const,       label: "Promo"        },
    { key: "charisma" as const,    label: "Charisma"     },
    { key: "athleticism" as const, label: "Athleticism"  },
    { key: "psychology" as const,  label: "Psychology"   },
    { key: "look" as const,        label: "Look"         },
    { key: "toughness" as const,   label: "Toughness"    },
    { key: "stamina" as const,     label: "Stamina"      },
  ]

  return (
    <div className="w-80 flex-shrink-0 bg-zinc-900 border border-zinc-800 rounded-lg p-4 space-y-4 overflow-y-auto max-h-[calc(100vh-160px)]">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Portrait portraitId={w.portraitId} gender={w.gender} size="lg" />
          <div>
            <h2 className="text-base font-bold text-zinc-100">{w.name}</h2>
            <p className="text-xs text-zinc-500">{w.realName}</p>
            <p className="text-xs text-zinc-500">{w.nationality} · Age {w.age}</p>
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
          { label: "Popularity", val: w.popularity, color: "text-blue-400"  },
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

      {w.injury ? (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
          <p className="text-xs font-medium text-red-400 mb-1">
            {w.injury.isKayfabe ? "Kayfabe Injury" : "Injured"}
          </p>
          <p className="text-xs text-zinc-300">{w.injury.type}</p>
          <p className="text-xs text-zinc-500">{w.injury.weeksRemaining} weeks remaining · {w.injury.severity}</p>
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
  const { getByOrg, getFreeAgents, wrestlers } = useRosterStore()
  const [search, setSearch] = useState("")
  const [tab, setTab] = useState<"male" | "female" | "free">("male")
  const [selected, setSelected] = useState<Wrestler | null>(null)

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
    { key: "male"   as const, label: "Men (" + males.length + ")"          },
    { key: "female" as const, label: "Women (" + females.length + ")"      },
    { key: "free"   as const, label: "Free Agents (" + free.length + ")"   },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Roster</h1>
          <p className="text-sm text-zinc-500 mt-0.5">{orgRoster.length} wrestlers · {wrestlers.length} total in game</p>
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
            </div>
          )}
          {currentList.map((w) => (
            <WrestlerRow
              key={w.id}
              wrestler={w}
              isSelected={selected?.id === w.id}
              onClick={() => setSelected(selected?.id === w.id ? null : w)}
            />
          ))}
        </div>
        {selected && <DetailPanel w={selected} onClose={() => setSelected(null)} />}
      </div>
    </div>
  )
}

