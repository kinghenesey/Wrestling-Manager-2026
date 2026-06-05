import { useState, useEffect, useRef } from 'react'
import { Calendar, ChevronRight, Pause, Play, FastForward, Briefcase } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useGameStore } from '@/store/useGameStore'
import { useDivisionStore } from '@/store/useDivisionStore'
import { OrgBadge } from '@/utils/orgColors'
import { RepLevelUpModal } from '@/components/ui/RepLevelUpModal'
import { REP_THRESHOLDS } from '@/engine/weekSimEngine'
import type { JobOffer } from '@/types/game'

interface TopBarProps { week: number; year: number; orgId: string }

export function TopBar({ week, year, orgId }: TopBarProps) {
  const { game, advanceWeek, setPaused, setGameSpeed } = useGameStore()
  const { getOrgById } = useDivisionStore()
  const org = getOrgById(orgId)

  const [modal, setModal] = useState<{
    levelUp: { oldTier: string; newTier: string } | null
    jobOffer: JobOffer | null
  } | null>(null)

  // Track previous rep tier and job offers to detect changes
  const prevRepRef = useRef(game.player.reputation)
  const prevOffersRef = useRef(game.player.jobOffers.length)

  useEffect(() => {
    const prevRep = prevRepRef.current
    const currRep = game.player.reputation
    const prevOfferCount = prevOffersRef.current
    const currOfferCount = game.player.jobOffers.length

    const leveledUp = prevRep !== currRep
    const gotOffer = currOfferCount > prevOfferCount

    if (leveledUp || gotOffer) {
      setModal({
        levelUp: leveledUp ? { oldTier: prevRep, newTier: currRep } : null,
        jobOffer: gotOffer
          ? game.player.jobOffers[game.player.jobOffers.length - 1]
          : null,
      })
    }

    prevRepRef.current = currRep
    prevOffersRef.current = currOfferCount
  }, [game.player.reputation, game.player.jobOffers.length])

  const pendingOffers = game.player.jobOffers.length
  const repThreshold = REP_THRESHOLDS[game.player.reputation]
  const repPoints = game.player.reputationPoints
  const repProgress = repThreshold
    ? Math.min(100, Math.round((repPoints / repThreshold) * 100))
    : 100

  return (
    <>
      <header className="h-14 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-zinc-500" />
            <span className="text-zinc-300 font-medium">Week {week}</span>
            <ChevronRight className="w-3 h-3 text-zinc-600" />
            <span className="text-zinc-500">{year}</span>
          </div>
          {org && (
            <OrgBadge
              orgId={org.id}
              name={org.shortName + ' — ' + org.tier.charAt(0).toUpperCase() + org.tier.slice(1)}
              size="sm"
            />
          )}

          {/* Reputation progress */}
          <div className="hidden md:flex items-center gap-2">
            <span className="text-xs text-zinc-500 capitalize">{game.player.reputation}</span>
            <div className="w-24 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full transition-all duration-500"
                style={{ width: `${repProgress}%` }}
              />
            </div>
            <span className="text-xs text-zinc-600 font-mono">
              {repPoints}/{repThreshold ?? '∞'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Job offer badge */}
          {pendingOffers > 0 && (
            <button
              title={`${pendingOffers} job offer${pendingOffers !== 1 ? 's' : ''} pending`}
              onClick={() =>
                setModal({
                  levelUp: null,
                  jobOffer: game.player.jobOffers[0],
                })
              }
              className="relative flex items-center gap-1.5 px-3 py-1.5 bg-emerald-900/50 border border-emerald-700 hover:border-emerald-500 rounded-lg text-emerald-400 text-xs font-medium transition-colors"
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>{pendingOffers} Offer{pendingOffers !== 1 ? 's' : ''}</span>
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            </button>
          )}

          <Button
            variant="ghost"
            size="sm"
            className="text-zinc-400 hover:text-zinc-100"
            onClick={() => setPaused(!game.isPaused)}
            title={game.isPaused ? 'Resume' : 'Pause'}
          >
            {game.isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            title="Toggle fast speed"
            className={game.gameSpeed === 'fast' ? 'text-amber-400' : 'text-zinc-400'}
            onClick={() => setGameSpeed(game.gameSpeed === 'fast' ? 'normal' : 'fast')}
          >
            <FastForward className="w-4 h-4" />
          </Button>

          <Button
            size="sm"
            className="bg-amber-500 hover:bg-amber-600 text-zinc-950 font-semibold text-xs"
            onClick={advanceWeek}
          >
            Advance Week
          </Button>
        </div>
      </header>

      {modal && (
        <RepLevelUpModal
          levelUp={modal.levelUp}
          jobOffer={modal.jobOffer}
          onClose={() => setModal(null)}
        />
      )}
    </>
  )
}