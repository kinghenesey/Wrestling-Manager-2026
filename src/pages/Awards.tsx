// ─────────────────────────────────────────────────────────────────────────────
// src/pages/Awards.tsx
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react'
import { useAwardsStore } from '@/store/useAwardStore'
import { useRosterStore } from '@/store/useRosterStore'
import { useShowStore } from '@/store/useShowStore'
import { useGameStore } from '@/store/useGameStore'
import { buildAwardsCeremony } from '@/engine/awardsEngine'
import type { AwardsCeremony, Award, AwardCategory } from '@/types/award'

// ── Constants ─────────────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<AwardCategory, string> = {
  wrestler_of_year:      'Wrestler of the Year',
  female_wrestler_of_year: 'Female Wrestler of the Year',
  best_young_wrestler:   'Best Young Wrestler',
  best_tag_team:         'Best Tag Team',
  best_feud:             'Best Feud',
  best_match:            'Best Match',
  best_promo:            'Best Promo',
  comeback_of_year:      'Comeback of the Year',
  most_improved:         'Most Improved',
  breakout_star:         'Breakout Star (Obafemi Award)',
  best_manager_of_year:  'Best Manager of the Year',
  best_org_of_year:      'Best Organization of the Year',
  best_show_of_year:     'Best Show of the Year',
  legend_award:          'Legend Award',
  underground_king:      'Underground King',
}

const CATEGORY_ICONS: Record<AwardCategory, string> = {
  wrestler_of_year:        '🏆',
  female_wrestler_of_year: '🏆',
  best_young_wrestler:     '⭐',
  best_tag_team:           '🤝',
  best_feud:               '⚔️',
  best_match:              '🎯',
  best_promo:              '🎤',
  comeback_of_year:        '💪',
  most_improved:           '📈',
  breakout_star:           '🌟',
  best_manager_of_year:    '🎩',
  best_org_of_year:        '🏢',
  best_show_of_year:       '📺',
  legend_award:            '👑',
  underground_king:        '🔥',
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildYearStats(wrestlers: ReturnType<typeof useRosterStore.getState>['wrestlers']) {
  return wrestlers.map(w => ({
    wrestlerId:        w.id,
    totalMatches:      Math.floor(Math.random() * 30) + 10,
    avgMatchRating:    Math.floor(w.stats.inRing * 0.6 + w.momentum * 0.4),
    bestMatchRating:   Math.min(100, Math.floor(w.stats.inRing * 0.7 + w.momentum * 0.3) + Math.floor(Math.random() * 15)),
    titleReignWeeks:   w.championships.length > 0 ? Math.floor(Math.random() * 20) + 4 : 0,
    feudsCount:        Math.floor(Math.random() * 4) + 1,
    peakMomentum:      w.momentum,
    avgPopularity:     w.popularity,
    promoSegments:     Math.floor(Math.random() * 15) + 3,
    avgPromoRating:    Math.floor(w.stats.promo * 0.6 + w.stats.charisma * 0.4),
    returnedFromInjury: !!w.injury,
    weeksExperience:   w.experience,
    isRookie:          w.experience <= 104,
  }))
}

// ── Vote Bar ──────────────────────────────────────────────────────────────────

function VoteBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-zinc-500 w-16">{label}</span>
      <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${value}%` }} />
      </div>
      <span className="text-xs font-mono text-zinc-400 w-6">{value}%</span>
    </div>
  )
}

// ── Nominee Card ──────────────────────────────────────────────────────────────

function NomineeRow({
  name,
  votePercent,
  isWinner,
}: {
  name: string
  votePercent: number
  isWinner: boolean
}) {
  return (
    <div className={`flex items-center gap-3 p-2 rounded-lg ${
      isWinner ? 'bg-amber-500/10 border border-amber-500/30' : 'bg-zinc-800/50'
    }`}>
      <div className="w-5 shrink-0 text-center">
        {isWinner && <span className="text-amber-400 text-sm">🏆</span>}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm truncate ${isWinner ? 'text-amber-300 font-semibold' : 'text-zinc-300'}`}>
          {name}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <div className="w-24 h-1.5 bg-zinc-700 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full ${isWinner ? 'bg-amber-400' : 'bg-zinc-500'}`}
            style={{ width: `${votePercent}%` }}
          />
        </div>
        <span className="text-xs font-mono text-zinc-400 w-8 text-right">{votePercent}%</span>
      </div>
    </div>
  )
}

// ── Award Card ────────────────────────────────────────────────────────────────

function AwardCard({ award, isSelected, onClick }: {
  award: Award
  isSelected: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-3 rounded-xl border transition-all ${
        isSelected
          ? 'border-amber-500 bg-zinc-800'
          : 'border-zinc-800 bg-zinc-900 hover:border-zinc-600'
      }`}
    >
      <div className="flex items-center gap-3">
        <span className="text-xl shrink-0">{CATEGORY_ICONS[award.category]}</span>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-zinc-400 truncate">{CATEGORY_LABELS[award.category]}</p>
          <p className="text-sm text-amber-300 font-medium truncate">{award.winnerName}</p>
        </div>
      </div>
    </button>
  )
}

// ── Award Detail ──────────────────────────────────────────────────────────────

function AwardDetail({ award }: { award: Award }) {
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="text-center space-y-2 pb-4 border-b border-zinc-800">
        <span className="text-4xl">{CATEGORY_ICONS[award.category]}</span>
        <p className="text-xs text-zinc-400 uppercase tracking-widest">
          {CATEGORY_LABELS[award.category]}
        </p>
        <h3 className="text-xl font-bold text-amber-400">{award.winnerName}</h3>
        <p className="text-xs text-zinc-500">Year {award.year} Winner</p>
      </div>

      {/* Vote breakdown */}
      <div className="space-y-2">
        <p className="text-xs text-zinc-400 font-medium uppercase tracking-wide">Vote Breakdown</p>
        <VoteBar label="Fan votes"   value={award.voteBreakdown.fanVotes}   color="bg-blue-500"   />
        <VoteBar label="Media"       value={award.voteBreakdown.mediaVotes} color="bg-purple-500" />
        <VoteBar label="Peer votes"  value={award.voteBreakdown.peerVotes}  color="bg-emerald-500"/>
      </div>

      {/* Nominees */}
      <div className="space-y-2">
        <p className="text-xs text-zinc-400 font-medium uppercase tracking-wide">
          Nominees ({award.nominees.length})
        </p>
        {award.nominees.length === 0 ? (
          <p className="text-xs text-zinc-600 italic">No nominees recorded.</p>
        ) : (
          award.nominees.map(n => (
            <NomineeRow
              key={n.id}
              name={n.name}
              votePercent={n.votePercent}
              isWinner={n.id === award.winnerId}
            />
          ))
        )}
      </div>

      {/* Morale effects */}
      <div className="bg-zinc-800 rounded-lg p-3 space-y-1.5">
        <p className="text-xs text-zinc-400 font-medium uppercase tracking-wide">Morale Effects</p>
        <div className="flex justify-between text-xs">
          <span className="text-zinc-400">Winner boost</span>
          <span className="text-emerald-400 font-mono">+{award.moraleBoostWinner}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-zinc-400">Nominee dip</span>
          <span className="text-red-400 font-mono">-{award.moraleDipLosers}</span>
        </div>
      </div>
    </div>
  )
}

// ── Ceremony View ─────────────────────────────────────────────────────────────

function CeremonyView({ ceremony }: { ceremony: AwardsCeremony }) {
  const [selectedAwardId, setSelectedAwardId] = useState<string | null>(
    ceremony.awards[0]?.id ?? null
  )

  const selected = ceremony.awards.find(a => a.id === selectedAwardId) ?? null

  return (
    <div className="space-y-4">
      {/* Ceremony header */}
      <div className="bg-gradient-to-r from-amber-500/10 to-transparent border border-amber-500/20 rounded-xl p-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-amber-400">{ceremony.name}</h2>
            <p className="text-zinc-400 text-sm mt-0.5">
              Year {ceremony.year} · Week {ceremony.week} · {ceremony.awards.length} categories
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-black text-white">{ceremony.attendance.toLocaleString()}</p>
            <p className="text-xs text-zinc-500">Attendance</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Award list */}
        <div className="space-y-2 lg:col-span-1">
          <p className="text-xs text-zinc-400 font-medium uppercase tracking-wide">Categories</p>
          {ceremony.awards.map(a => (
            <AwardCard
              key={a.id}
              award={a}
              isSelected={selectedAwardId === a.id}
              onClick={() => setSelectedAwardId(a.id)}
            />
          ))}
        </div>

        {/* Detail */}
        <div className="lg:col-span-2">
          {selected ? (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
              <AwardDetail award={selected} />
            </div>
          ) : (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-12 text-center">
              <p className="text-zinc-500 text-sm">Select a category to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function Awards() {
  const { game } = useGameStore()
  const { wrestlers, updateMorale } = useRosterStore()
  const { shows } = useShowStore()
  const { ceremonies, addCeremony, getByYear } = useAwardsStore()

  const currentYear = game.year
  const currentWeek = game.week
  const orgId = game.player.currentOrgId

  const [selectedYear, setSelectedYear] = useState<number>(currentYear)
  const [isRunning, setIsRunning] = useState(false)

  const selectedCeremony = getByYear(selectedYear)
  const canRunCeremony = !getByYear(currentYear) && currentWeek >= 48

  const availableYears = [
    ...new Set(ceremonies.map(c => c.year)),
    currentYear,
  ].sort((a, b) => b - a)

  function handleRunCeremony() {
    if (isRunning) return
    setIsRunning(true)

    const orgWrestlers = wrestlers.filter(w => w.currentOrgId === orgId)
    const orgShows = shows.filter(s => s.orgId === orgId)
    const yearStats = buildYearStats(orgWrestlers)

    const ceremony = buildAwardsCeremony(
      `ceremony_${currentYear}`,
      currentYear,
      currentWeek,
      orgId,
      orgWrestlers,
      yearStats,
      orgShows
    )

    // Apply morale effects
    ceremony.awards.forEach(award => {
      if (award.winnerId) {
        updateMorale(award.winnerId, award.moraleBoostWinner)
      }
      award.nominees
        .filter(n => n.id !== award.winnerId)
        .forEach(n => updateMorale(n.id, -award.moraleDipLosers))
    })

    addCeremony(ceremony)
    setSelectedYear(currentYear)
    setIsRunning(false)
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Awards</h1>
          <p className="text-zinc-400 text-sm mt-0.5">
            Year-end ceremonies · {ceremonies.length} held so far
          </p>
        </div>
        <div className="flex items-center gap-3">
          {availableYears.length > 1 && (
            <select
              title="Select year"
              value={selectedYear}
              onChange={e => setSelectedYear(Number(e.target.value))}
              className="bg-zinc-800 border border-zinc-700 text-zinc-200 rounded-lg px-3 py-2 text-sm"
            >
              {availableYears.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          )}
          {canRunCeremony && (
            <button
              onClick={handleRunCeremony}
              disabled={isRunning}
              className="bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-bold px-4 py-2 rounded-lg text-sm transition-colors"
            >
              {isRunning ? 'Running...' : '🏆 Run Ceremony'}
            </button>
          )}
        </div>
      </div>

      {/* No ceremony yet */}
      {!selectedCeremony && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-12 text-center space-y-3">
          <span className="text-5xl">🏆</span>
          <p className="text-zinc-300 font-medium">No ceremony for {selectedYear} yet.</p>
          {currentWeek < 48 ? (
            <p className="text-zinc-500 text-sm">
              The Golden Headlock Awards ceremony becomes available at Week 48.
              Currently Week {currentWeek} — {48 - currentWeek} weeks to go.
            </p>
          ) : (
            <p className="text-zinc-500 text-sm">
              Week {currentWeek} — the ceremony is ready to run.
            </p>
          )}
          {canRunCeremony && (
            <button
              onClick={handleRunCeremony}
              className="mx-auto flex items-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg text-sm transition-colors"
            >
              🏆 Run the {currentYear} Ceremony
            </button>
          )}
        </div>
      )}

      {/* Ceremony view */}
      {selectedCeremony && <CeremonyView ceremony={selectedCeremony} />}
    </div>
  )
}