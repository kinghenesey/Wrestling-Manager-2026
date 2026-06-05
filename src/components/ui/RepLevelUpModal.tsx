// ─────────────────────────────────────────────────────────────────────────────
// src/components/ui/RepLevelUpModal.tsx
// Shown when player hits a reputation threshold or receives a job offer
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react'
import { Trophy, Briefcase, ChevronRight, X } from 'lucide-react'
import { useGameStore } from '@/store/useGameStore'
import { useRosterStore } from '@/store/useRosterStore'
import { OrgBadge } from '@/utils/orgColors'
import type { JobOffer } from '@/types/game'

interface Props {
  levelUp: { oldTier: string; newTier: string } | null
  jobOffer: JobOffer | null
  onClose: () => void
}

const TIER_DESCRIPTIONS: Record<string, string> = {
  regional:  'Regional promotions are now within reach. Your name is spreading.',
  respected: 'You are a respected booker. Mid-tier organizations are watching.',
  notable:   'Notable promotions are taking notice. The big leagues are closer.',
  elite:     'Elite organizations want you. You are among the best in the business.',
  legendary: 'Legendary status. Your career will be studied for generations.',
}

export function RepLevelUpModal({ levelUp, jobOffer, onClose }: Props) {
  const { game, updatePlayer } = useGameStore()
  const { resetRoster } = useRosterStore()
  const [step, setStep] = useState<'levelup' | 'joboffer'>(
    levelUp ? 'levelup' : 'joboffer'
  )

  function handleAcceptOffer() {
    if (!jobOffer) return
    updatePlayer({
      currentOrgId: jobOffer.orgId,
      previousOrgIds: [...game.player.previousOrgIds, game.player.currentOrgId],
      jobOffers: [],
    })
    resetRoster()
    onClose()
  }

  function handleDeclineOffer() {
    updatePlayer({
      jobOffers: game.player.jobOffers.filter(o => o.orgId !== jobOffer?.orgId),
    })
    onClose()
  }

  function handleLevelUpContinue() {
    if (jobOffer) {
      setStep('joboffer')
    } else {
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl w-full max-w-md shadow-2xl overflow-hidden">

        {step === 'levelup' && levelUp && (
          <>
            <div className="bg-gradient-to-b from-amber-500/20 to-transparent p-8 text-center border-b border-zinc-800">
              <div className="w-16 h-16 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center mx-auto mb-4">
                <Trophy className="w-8 h-8 text-amber-400" />
              </div>
              <p className="text-xs text-amber-400 font-medium uppercase tracking-widest mb-2">Reputation Milestone</p>
              <h2 className="text-2xl font-bold text-white mb-1">
                {levelUp.newTier.charAt(0).toUpperCase() + levelUp.newTier.slice(1)} Booker
              </h2>
              <p className="text-zinc-400 text-sm">
                {TIER_DESCRIPTIONS[levelUp.newTier] ?? 'Your reputation continues to grow.'}
              </p>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-zinc-800 rounded-lg p-3 flex items-center justify-between">
                <span className="text-zinc-400 text-sm">Previous tier</span>
                <span className="text-zinc-300 text-sm capitalize">{levelUp.oldTier}</span>
              </div>
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 flex items-center justify-between">
                <span className="text-amber-300 text-sm font-medium">New tier</span>
                <span className="text-amber-400 text-sm font-bold capitalize">{levelUp.newTier}</span>
              </div>
              {jobOffer && (
                <p className="text-xs text-zinc-500 text-center">
                  A new opportunity awaits — continue to see your job offer.
                </p>
              )}
              <button
                onClick={handleLevelUpContinue}
                className="w-full bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {jobOffer ? 'View Job Offer' : 'Continue'}
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </>
        )}

        {step === 'joboffer' && jobOffer && (
          <>
            <div className="flex items-center justify-between p-5 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-emerald-400" />
                <h2 className="text-white font-semibold">Job Offer</h2>
              </div>
              <button
                onClick={onClose}
                title="Close"
                className="text-zinc-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="text-center space-y-2">
                <OrgBadge orgId={jobOffer.orgId} name={jobOffer.orgName} size="lg" />
                <p className="text-zinc-400 text-sm mt-3">
                  <span className="text-white font-medium">{jobOffer.orgName}</span> has offered you
                  the head booker position.
                </p>
              </div>

              <div className="space-y-2">
                <div className="bg-zinc-800 rounded-lg p-3 flex justify-between items-center">
                  <span className="text-zinc-400 text-sm">Weekly salary</span>
                  <span className="text-emerald-400 font-mono font-bold">
                    ${jobOffer.salary.toLocaleString()}
                  </span>
                </div>
                <div className="bg-zinc-800 rounded-lg p-3 flex justify-between items-center">
                  <span className="text-zinc-400 text-sm">Org tier</span>
                  <span className="text-white text-sm capitalize">{jobOffer.tier}</span>
                </div>
                <div className="bg-zinc-800 rounded-lg p-3 flex justify-between items-center">
                  <span className="text-zinc-400 text-sm">Offer expires</span>
                  <span className="text-amber-400 text-sm">Week {jobOffer.expiresWeek}</span>
                </div>
              </div>

              <div className="bg-amber-950 border border-amber-800 rounded-lg p-3">
                <p className="text-amber-300 text-xs">
                  ⚠ Accepting will move you to {jobOffer.orgName}. Your current roster stays behind —
                  you will inherit {jobOffer.orgName}'s wrestlers.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleDeclineOffer}
                  className="flex-1 border border-zinc-700 hover:border-zinc-500 text-zinc-300 font-medium py-2.5 rounded-lg transition-colors text-sm"
                >
                  Decline
                </button>
                <button
                  onClick={handleAcceptOffer}
                  className="flex-1 bg-emerald-700 hover:bg-emerald-600 text-white font-bold py-2.5 rounded-lg transition-colors text-sm"
                >
                  Accept & Move
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}