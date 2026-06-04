// ─────────────────────────────────────────────────────────────────────────────
// src/pages/Academy.tsx
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react'
import { useAcademyStore } from '@/store/useAcademyStore'
import { useRosterStore } from '@/store/useRosterStore'
import { useGameStore } from '@/store/useGameStore'
import { useDivisionStore } from '@/store/useDivisionStore'
import {
  generateProspect,
  simulateWeeklyTraining,
  assessGraduationReadiness,
  graduateProspect,
} from '@/engine/academyEngine'
import type { Prospect, TrainingFocus } from '@/engine/academyEngine'
import type { Wrestler } from '@/types/wrestler'
import { getPortraitSrc, getFallbackPortrait, PORTRAIT_REGISTRY } from '@/utils/portraits'
import type { Organization } from '@/types/division'

function getRandomPortraitId(gender: 'male' | 'female'): string {
  const keys = Object.keys(PORTRAIT_REGISTRY).filter(
    k => PORTRAIT_REGISTRY[k].gender === gender
  )
  return keys[Math.floor(Math.random() * keys.length)]
}

// ── Constants ─────────────────────────────────────────────────────────────────

const TIER_CAPACITY: Record<string, number> = {
  elite: 5, major: 5, regional: 5, indie: 2, local: 2,
}

const STAGE_COLORS: Record<string, string> = {
  raw:      'bg-zinc-700 text-zinc-300',
  trainee:  'bg-blue-900 text-blue-300',
  ready:    'bg-amber-900 text-amber-300',
  graduate: 'bg-emerald-900 text-emerald-300',
}

const STAGE_LABELS: Record<string, string> = {
  raw:      'Raw',
  trainee:  'Trainee',
  ready:    'Ready',
  graduate: 'Graduate',
}

const FOCUS_OPTIONS: { value: TrainingFocus; label: string; desc: string }[] = [
  { value: 'general',     label: 'General',     desc: 'Balanced across all areas' },
  { value: 'in_ring',     label: 'In-Ring',     desc: 'Technique, stamina, psychology' },
  { value: 'promo',       label: 'Promo',        desc: 'Mic work and charisma' },
  { value: 'character',   label: 'Character',    desc: 'Charisma, look, persona' },
  { value: 'athleticism', label: 'Athleticism',  desc: 'Speed, power, stamina' },
  { value: 'psychology',  label: 'Psychology',   desc: 'Match storytelling' },
]

const WEIGHT_CLASSES = ['lightweight', 'middleweight', 'heavyweight', 'super_heavyweight'] as const
const GENDERS = ['male', 'female'] as const

type LogEntry = { id: string; message: string; type: 'good' | 'bad' | 'info' }

// ── Stat Bar ──────────────────────────────────────────────────────────────────

function StatBar({ label, value, potential }: { label: string; value: number; potential: number }) {
  return (
    <div className="space-y-0.5">
      <div className="flex justify-between text-xs">
        <span className="text-zinc-400">{label}</span>
        <span className="text-zinc-300 font-mono">{value}</span>
      </div>
      <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-zinc-600 rounded-full relative"
          style={{ width: `${potential}%` }}
        >
          <div
            className="absolute left-0 top-0 h-full bg-amber-500 rounded-full"
            style={{ width: `${(value / Math.max(potential, 1)) * 100}%` }}
          />
        </div>
      </div>
    </div>
  )
}

// ── Scout Modal ───────────────────────────────────────────────────────────────

function ScoutModal({
  orgId,
  onClose,
  onSign,
}: {
  orgId: string
  onClose: () => void
  onSign: (p: Prospect) => void
}) {
  const [gender, setGender] = useState<'male' | 'female'>('male')
  const [weightClass, setWeightClass] = useState<typeof WEIGHT_CLASSES[number]>('middleweight')
  const [prospect, setProspect] = useState<Prospect | null>(null)
  const [name, setName] = useState('')

  function handleScout() {
    const portraitId = getRandomPortraitId(gender)
    const p = generateProspect(orgId, gender, weightClass, portraitId)
    setProspect(p)
    setName('')
  }

  function handleSign() {
    if (!prospect || !name.trim()) return
    onSign({ ...prospect, name: name.trim(), realName: name.trim() })
  }

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-zinc-800">
          <h2 className="text-white font-semibold text-lg">Scout New Prospect</h2>
          <button
            onClick={onClose}
            title="Close modal"
            className="text-zinc-400 hover:text-white transition-colors text-xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-zinc-400 mb-1.5">Gender</label>
              <select
                title="Select gender"
                value={gender}
                onChange={e => setGender(e.target.value as 'male' | 'female')}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white"
              >
                {GENDERS.map(g => (
                  <option key={g} value={g}>{g.charAt(0).toUpperCase() + g.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1.5">Weight Class</label>
              <select
                title="Select weight class"
                value={weightClass}
                onChange={e => setWeightClass(e.target.value as typeof WEIGHT_CLASSES[number])}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white"
              >
                {WEIGHT_CLASSES.map(w => (
                  <option key={w} value={w}>{w.replace('_', ' ')}</option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={handleScout}
            className="w-full bg-amber-600 hover:bg-amber-500 text-white font-medium py-2.5 rounded-lg transition-colors text-sm"
          >
            Run Scouting Report
          </button>

          {prospect && (
            <div className="bg-zinc-800 rounded-lg p-4 space-y-3 border border-zinc-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-zinc-400">
                    {prospect.nationality} · {prospect.weightClass.replace('_', ' ')} · Age {prospect.age}
                  </p>
                  <p className="text-amber-400 text-sm font-medium mt-0.5">
                    Scout Rating: {prospect.scoutingRating}/100
                    {prospect.isHiddenGem && (
                      <span className="ml-2 text-emerald-400">★ Hidden Gem</span>
                    )}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-zinc-400">Potential</p>
                  <p className="text-white font-mono text-lg">{prospect.potential}</p>
                </div>
              </div>

              <p className="text-xs text-zinc-300 italic">"{prospect.scoutingReport}"</p>

              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                {Object.entries(prospect.currentStats).map(([stat, val]) => (
                  <StatBar key={stat} label={stat} value={val} potential={prospect.potential} />
                ))}
              </div>

              <div>
                <label className="block text-xs text-zinc-400 mb-1.5">Ring Name</label>
                <input
                  type="text"
                  aria-label="Ring name for prospect"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Enter ring name..."
                  className="w-full bg-zinc-900 border border-zinc-600 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-amber-500 outline-none"
                />
              </div>

              <button
                onClick={handleSign}
                disabled={!name.trim()}
                className="w-full bg-emerald-700 hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-lg transition-colors text-sm"
              >
                Sign to Academy
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Prospect Card ─────────────────────────────────────────────────────────────

function ProspectCard({
  prospect,
  isSelected,
  onClick,
}: {
  prospect: Prospect
  isSelected: boolean
  onClick: () => void
}) {
  const portraitSrc = getPortraitSrc(prospect.portraitId)

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
        <div className="w-10 h-10 rounded-lg overflow-hidden bg-zinc-800 shrink-0">
          <img
            src={portraitSrc || getFallbackPortrait(prospect.gender)}
            alt={prospect.name}
            className="w-full h-full object-cover object-top"
            onError={e => {
              ;(e.target as HTMLImageElement).src = getFallbackPortrait(prospect.gender)
            }}
          />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-medium truncate">{prospect.name}</p>
          <p className="text-zinc-400 text-xs">{prospect.nationality} · Age {prospect.age}</p>
        </div>
        <div className="shrink-0">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STAGE_COLORS[prospect.stage]}`}>
            {STAGE_LABELS[prospect.stage]}
          </span>
        </div>
      </div>

      <div className="mt-2.5">
        <div className="flex justify-between text-xs text-zinc-500 mb-1">
          <span>Progress</span>
          <span>{Math.min(prospect.progressPercent, 100)}%</span>
        </div>
        <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-amber-500 rounded-full transition-all"
            style={{ width: `${Math.min(prospect.progressPercent, 100)}%` }}
          />
        </div>
      </div>
    </button>
  )
}

// ── Detail Panel ──────────────────────────────────────────────────────────────

function ProspectDetail({
  prospect,
  onFocusChange,
  onTrain,
  onGraduate,
  onRelease,
}: {
  prospect: Prospect
  onFocusChange: (focus: TrainingFocus) => void
  onTrain: () => void
  onGraduate: () => void
  onRelease: () => void
}) {
  const assessment = assessGraduationReadiness(prospect)
  const portraitSrc = getPortraitSrc(prospect.portraitId)
  const weeksRevealed = prospect.weeksInAcademy >= 4

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 rounded-xl overflow-hidden bg-zinc-800 shrink-0">
          <img
            src={portraitSrc || getFallbackPortrait(prospect.gender)}
            alt={prospect.name}
            className="w-full h-full object-cover object-top"
            onError={e => {
              ;(e.target as HTMLImageElement).src = getFallbackPortrait(prospect.gender)
            }}
          />
        </div>
        <div className="flex-1">
          <h3 className="text-white font-semibold text-lg">{prospect.name}</h3>
          <p className="text-zinc-400 text-sm">
            {prospect.nationality} · Age {prospect.age} · {prospect.weightClass.replace('_', ' ')}
          </p>
          <div className="flex items-center gap-2 mt-1.5">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STAGE_COLORS[prospect.stage]}`}>
              {STAGE_LABELS[prospect.stage]}
            </span>
            <span className="text-xs text-zinc-500">{prospect.weeksInAcademy}w in academy</span>
            {prospect.breakthroughMoments > 0 && (
              <span className="text-xs text-amber-400">
                ⚡ {prospect.breakthroughMoments} breakthrough{prospect.breakthroughMoments !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="bg-zinc-800 rounded-lg p-3 grid grid-cols-3 gap-3 text-center">
        <div>
          <p className="text-xs text-zinc-400">Potential</p>
          <p className="text-white font-mono text-lg">
            {weeksRevealed ? prospect.potential : '??'}
          </p>
        </div>
        <div>
          <p className="text-xs text-zinc-400">Work Ethic</p>
          <p className="text-white font-mono text-lg">{prospect.workEthic}</p>
        </div>
        <div>
          <p className="text-xs text-zinc-400">Attitude</p>
          <p className={`font-mono text-lg ${
            prospect.attitude >= 70 ? 'text-emerald-400' :
            prospect.attitude >= 50 ? 'text-amber-400' : 'text-red-400'
          }`}>
            {prospect.attitude}
          </p>
        </div>
      </div>

      <div className="bg-zinc-800 rounded-lg p-3 space-y-2">
        <p className="text-xs text-zinc-400 font-medium uppercase tracking-wide mb-2">Current Stats</p>
        {Object.entries(prospect.currentStats).map(([stat, val]) => (
          <StatBar key={stat} label={stat} value={val} potential={weeksRevealed ? prospect.potential : 100} />
        ))}
      </div>

      <div>
        <p className="text-xs text-zinc-400 font-medium uppercase tracking-wide mb-2">Training Focus</p>
        <div className="grid grid-cols-2 gap-2">
          {FOCUS_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => onFocusChange(opt.value)}
              title={opt.desc}
              className={`text-left px-3 py-2 rounded-lg border text-sm transition-all ${
                prospect.trainingFocus === opt.value
                  ? 'border-amber-500 bg-amber-950 text-amber-300'
                  : 'border-zinc-700 bg-zinc-800 text-zinc-300 hover:border-zinc-500'
              }`}
            >
              <p className="font-medium text-xs">{opt.label}</p>
              <p className="text-xs opacity-60 mt-0.5">{opt.desc}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-zinc-800 rounded-lg p-3">
        <p className="text-xs text-zinc-400 font-medium uppercase tracking-wide mb-1.5">Scouting Report</p>
        <p className="text-xs text-zinc-300 italic">"{prospect.scoutingReport}"</p>
      </div>

      {prospect.stage === 'graduate' && (
        <div className="bg-emerald-950 border border-emerald-800 rounded-lg p-3 space-y-2">
          <p className="text-emerald-300 text-sm font-medium">Graduation Assessment</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full"
                style={{ width: `${assessment.readinessScore}%` }}
              />
            </div>
            <span className="text-emerald-400 font-mono text-sm">{assessment.readinessScore}/100</span>
          </div>
          <p className="text-xs text-zinc-300">
            Recommended push: <span className="text-white font-medium">{assessment.recommendedPushLevel}</span>
          </p>
          {assessment.strengths.length > 0 && (
            <ul className="text-xs text-emerald-400 space-y-0.5">
              {assessment.strengths.map(s => <li key={s}>✓ {s}</li>)}
            </ul>
          )}
          {assessment.concerns.length > 0 && (
            <ul className="text-xs text-amber-400 space-y-0.5">
              {assessment.concerns.map(c => <li key={c}>⚠ {c}</li>)}
            </ul>
          )}
          <p className="text-xs text-zinc-400 italic">{assessment.suggestedFirstFeud}</p>
        </div>
      )}

      <div className="flex flex-col gap-2 pt-1">
        <button
          onClick={onTrain}
          className="w-full bg-blue-800 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors text-sm"
        >
          Run Training Session
        </button>
        {prospect.stage === 'graduate' && assessment.isReady && (
          <button
            onClick={onGraduate}
            className="w-full bg-emerald-700 hover:bg-emerald-600 text-white font-medium py-2.5 rounded-lg transition-colors text-sm"
          >
            Graduate to Main Roster
          </button>
        )}
        <button
          onClick={onRelease}
          className="w-full bg-transparent border border-zinc-700 hover:border-red-700 hover:text-red-400 text-zinc-400 font-medium py-2 rounded-lg transition-colors text-sm"
        >
          Release Prospect
        </button>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function Academy() {
  const { game } = useGameStore()
  const { addWrestler } = useRosterStore()
  const { orgs } = useDivisionStore()
  const { prospects, addProspect, updateProspect, removeProspect } = useAcademyStore()

  const orgId = game.player.currentOrgId
  const currentOrg = orgs.find((o: Organization) => o.id === orgId)
  const orgTier = currentOrg?.tier ?? 'local'
  const capacity = TIER_CAPACITY[orgTier] ?? 2

  const orgProspects = (prospects as unknown as Prospect[]).filter(
    p => p.scoutedByOrgId === orgId
  )

  const [selectedId, setSelectedId] = useState<string | null>(
    orgProspects[0]?.id ?? null
  )
  const [showScoutModal, setShowScoutModal] = useState(false)
  const [trainingLog, setTrainingLog] = useState<LogEntry[]>([])

  const selected = orgProspects.find(p => p.id === selectedId) ?? null
  const atCapacity = orgProspects.length >= capacity

  function handleSign(p: Prospect) {
    addProspect(p as unknown as Parameters<typeof addProspect>[0])
    setSelectedId(p.id)
    setShowScoutModal(false)
  }

  function handleFocusChange(focus: TrainingFocus) {
    if (!selected) return
    updateProspect(selected.id, { trainingFocus: focus })
  }

  function handleTrain() {
    if (!selected) return
    const result = simulateWeeklyTraining(selected)

    const newStats = { ...selected.currentStats }
    for (const [stat, gain] of Object.entries(result.statGains)) {
      const key = stat as keyof typeof newStats
      newStats[key] = Math.min(
        selected.potential,
        (newStats[key] ?? 0) + (gain ?? 0)
      )
    }

    const newProgress = selected.progressPercent + result.progressGained
    const newBreakthroughs = selected.breakthroughMoments + (result.hadBreakthrough ? 1 : 0)
    const newAttitude = Math.max(0, Math.min(100, selected.attitude + result.attitudeChange))

    updateProspect(selected.id, {
      currentStats: newStats,
      progressPercent: newProgress,
      breakthroughMoments: newBreakthroughs,
      attitude: newAttitude,
      weeksInAcademy: selected.weeksInAcademy + 1,
      stage: result.newStage ?? selected.stage,
    } as Parameters<typeof updateProspect>[1])

    const entry: LogEntry = result.hadBreakthrough
      ? {
          id: crypto.randomUUID(),
          message: `⚡ ${selected.name}: ${result.breakthroughDescription}`,
          type: 'good',
        }
      : {
          id: crypto.randomUUID(),
          message: `${selected.name} completed a training session. +${result.progressGained} progress.`,
          type: 'info',
        }

    setTrainingLog(prev => [entry, ...prev].slice(0, 8))
  }

  function handleGraduate() {
    if (!selected) return
    const assessment = assessGraduationReadiness(selected)
    const wrestler = graduateProspect(selected, orgId, null, 300)
    addWrestler(wrestler as unknown as Wrestler)
    removeProspect(selected.id)
    setSelectedId(orgProspects.find(p => p.id !== selected.id)?.id ?? null)
    setTrainingLog(prev => [
      {
        id: crypto.randomUUID(),
        message: `🎓 ${selected.name} graduated! Recommended as ${assessment.recommendedPushLevel}.`,
        type: 'good' as const,
      },
      ...prev,
    ].slice(0, 8))
  }

  function handleRelease(id: string) {
    removeProspect(id)
    setSelectedId(orgProspects.find(p => p.id !== id)?.id ?? null)
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Performance Academy</h1>
          <p className="text-zinc-400 text-sm mt-0.5">
            {orgProspects.length}/{capacity} prospects · {orgId.toUpperCase()} Development System
          </p>
        </div>
        <button
          onClick={() => setShowScoutModal(true)}
          disabled={atCapacity}
          title={atCapacity ? 'Academy at capacity' : 'Scout a new prospect'}
          className="bg-amber-600 hover:bg-amber-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium px-4 py-2.5 rounded-lg transition-colors text-sm"
        >
          + Scout Prospect
        </button>
      </div>

      {atCapacity && (
        <div className="bg-amber-950 border border-amber-800 rounded-lg px-4 py-3 text-amber-300 text-sm">
          Academy is at capacity ({capacity} prospects). Graduate or release a prospect to scout new talent.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-3">
          <p className="text-xs text-zinc-400 font-medium uppercase tracking-wide">Prospects</p>

          {orgProspects.length === 0 ? (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center">
              <p className="text-zinc-500 text-sm">No prospects signed.</p>
              <p className="text-zinc-600 text-xs mt-1">Scout new talent to get started.</p>
            </div>
          ) : (
            orgProspects.map(p => (
              <ProspectCard
                key={p.id}
                prospect={p}
                isSelected={selectedId === p.id}
                onClick={() => setSelectedId(p.id)}
              />
            ))
          )}

          {trainingLog.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-xs text-zinc-400 font-medium uppercase tracking-wide">Training Log</p>
              {trainingLog.map(entry => (
                <div
                  key={entry.id}
                  className={`text-xs px-3 py-2 rounded-lg ${
                    entry.type === 'good' ? 'bg-emerald-950 text-emerald-300' :
                    entry.type === 'bad'  ? 'bg-red-950 text-red-300' :
                    'bg-zinc-800 text-zinc-400'
                  }`}
                >
                  {entry.message}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-2">
          {selected ? (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
              <ProspectDetail
                prospect={selected}
                onFocusChange={handleFocusChange}
                onTrain={handleTrain}
                onGraduate={handleGraduate}
                onRelease={() => handleRelease(selected.id)}
              />
            </div>
          ) : (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-12 text-center">
              <p className="text-zinc-500">Select a prospect to view details</p>
            </div>
          )}
        </div>
      </div>

      {showScoutModal && (
        <ScoutModal
          orgId={orgId}
          onClose={() => setShowScoutModal(false)}
          onSign={handleSign}
        />
      )}
    </div>
  )
}