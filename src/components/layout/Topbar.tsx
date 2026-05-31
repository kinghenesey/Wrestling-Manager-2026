import { Calendar, ChevronRight, Pause, Play, FastForward } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useGameStore } from "@/store/useGameStore"
import { useDivisionStore } from "@/store/useDivisionStore"
import { OrgBadge } from "@/utils/orgColors"

interface TopBarProps { week: number; year: number; orgId: string }

export function TopBar({ week, year, orgId }: TopBarProps) {
  const { game, advanceWeek, setPaused, setGameSpeed } = useGameStore()
  const { getOrgById } = useDivisionStore()
  const org = getOrgById(orgId)

  return (
    <header className="h-14 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="w-4 h-4 text-zinc-500" />
          <span className="text-zinc-300 font-medium">Week {week}</span>
          <ChevronRight className="w-3 h-3 text-zinc-600" />
          <span className="text-zinc-500">{year}</span>
        </div>
        {org && <OrgBadge orgId={org.id} name={org.shortName + " - " + org.tier.charAt(0).toUpperCase() + org.tier.slice(1)} size="sm" />}
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-zinc-100" onClick={() => setPaused(!game.isPaused)}>
          {game.isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
        </Button>
        <Button variant="ghost" size="sm" className={game.gameSpeed === "fast" ? "text-amber-400" : "text-zinc-400"} onClick={() => setGameSpeed(game.gameSpeed === "fast" ? "normal" : "fast")}>
          <FastForward className="w-4 h-4" />
        </Button>
        <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-zinc-950 font-semibold text-xs" onClick={advanceWeek}>
          Advance Week
        </Button>
      </div>
    </header>
  )
}
