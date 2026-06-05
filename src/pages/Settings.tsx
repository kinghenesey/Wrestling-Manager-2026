// ─────────────────────────────────────────────────────────────────────────────
// src/pages/Settings.tsx
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react'
import { useGameStore } from '@/store/useGameStore'
import { useRosterStore } from '@/store/useRosterStore'
import { useStorylineStore } from '@/store/useStorylineStore'
import { useShowStore } from '@/store/useShowStore'
import { useAcademyStore } from '@/store/useAcademyStore'
import { useAgentStore } from '@/store/useAgentStore'
import { useAwardsStore } from '@/store/useAwardStore'
import { useUndergroundStore } from '@/store/useUndergroundStore'

type GameSpeed = 'slow' | 'normal' | 'fast'

const SPEED_LABELS: Record<GameSpeed, string> = {
  slow:   'Slow — more time to plan each week',
  normal: 'Normal — recommended',
  fast:   'Fast — for experienced bookers',
}

function ConfirmModal({
  title,
  message,
  onConfirm,
  onClose,
}: {
  title: string
  message: string
  onConfirm: () => void
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl w-full max-w-sm shadow-2xl p-6 space-y-4">
        <h3 className="text-white font-semibold">{title}</h3>
        <p className="text-zinc-400 text-sm">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 border border-zinc-700 hover:border-zinc-500 text-zinc-300 font-medium py-2.5 rounded-lg transition-colors text-sm"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 bg-red-700 hover:bg-red-600 text-white font-bold py-2.5 rounded-lg transition-colors text-sm"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Settings() {
  const { game, setGameSpeed, resetGame } = useGameStore()
  const { resetRoster } = useRosterStore()
  const { storylines } = useStorylineStore()
  const { shows } = useShowStore()

  const [confirmReset, setConfirmReset] = useState(false)
  const [confirmClearShows, setConfirmClearShows] = useState(false)
  const [saved, setSaved] = useState(false)

  function handleSpeedChange(speed: GameSpeed) {
    setGameSpeed(speed)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function handleFullReset() {
    resetGame()
    resetRoster()
    useStorylineStore.setState({ storylines: [], pushHistory: [] })
    useShowStore.setState({ shows: [], currentShow: null })
    useAcademyStore.setState({ prospects: [] })
    useAgentStore.setState({ agents: [] })
    useAwardsStore.setState({ ceremonies: [] })
    useUndergroundStore.setState({ events: [], freeAgents: [] })
    localStorage.clear()
    window.location.href = '/'
  }

  function handleClearShows() {
    useShowStore.setState({ shows: [], currentShow: null })
    setConfirmClearShows(false)
  }

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-zinc-400 text-sm mt-0.5">
          Game preferences and data management
        </p>
      </div>

      {/* Game info */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-3">
        <p className="text-sm font-medium text-zinc-300">Current Save</p>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Manager',     value: game.player.name },
            { label: 'Org',         value: game.player.currentOrgId.toUpperCase() },
            { label: 'Week',        value: `Week ${game.week}, ${game.year}` },
            { label: 'Reputation',  value: game.player.reputation },
            { label: 'Rep Points',  value: `${game.player.reputationPoints} pts` },
            { label: 'Shows Booked', value: game.player.totalShowsBooked },
            { label: 'Avg Rating',  value: `${game.player.avgShowRating}/100` },
            { label: 'Last Saved',  value: game.lastSaved ? new Date(game.lastSaved).toLocaleString() : 'Never' },
          ].map(row => (
            <div key={row.label} className="bg-zinc-800 rounded-lg p-3 flex justify-between items-center">
              <span className="text-xs text-zinc-500">{row.label}</span>
              <span className="text-sm text-white font-medium capitalize">{String(row.value)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Game speed */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-zinc-300">Game Speed</p>
          {saved && <span className="text-xs text-emerald-400">Saved ✓</span>}
        </div>
        <div className="space-y-2">
          {(['slow', 'normal', 'fast'] as GameSpeed[]).map(speed => (
            <button
              key={speed}
              onClick={() => handleSpeedChange(speed)}
              className={`w-full text-left px-4 py-3 rounded-lg border transition-all ${
                game.gameSpeed === speed
                  ? 'border-amber-500 bg-amber-950 text-amber-300'
                  : 'border-zinc-700 bg-zinc-800 text-zinc-300 hover:border-zinc-500'
              }`}
            >
              <p className="font-medium text-sm capitalize">{speed}</p>
              <p className="text-xs opacity-60 mt-0.5">{SPEED_LABELS[speed]}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Data stats */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-3">
        <p className="text-sm font-medium text-zinc-300">Save Data</p>
        <div className="grid grid-cols-3 gap-3 text-center">
          {[
            { label: 'Shows',      value: shows.length },
            { label: 'Storylines', value: storylines.length },
            { label: 'Version',    value: game.version },
          ].map(item => (
            <div key={item.label} className="bg-zinc-800 rounded-lg p-3">
              <p className="text-lg font-bold text-white">{item.value}</p>
              <p className="text-xs text-zinc-500">{item.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Danger zone */}
      <div className="bg-zinc-900 border border-red-900/50 rounded-xl p-5 space-y-3">
        <p className="text-sm font-medium text-red-400">Danger Zone</p>
        <div className="space-y-2">
          <div className="flex items-center justify-between p-3 bg-zinc-800 rounded-lg">
            <div>
              <p className="text-sm text-zinc-300">Clear Show History</p>
              <p className="text-xs text-zinc-500">Removes all {shows.length} recorded shows. Cannot be undone.</p>
            </div>
            <button
              onClick={() => setConfirmClearShows(true)}
              className="px-3 py-1.5 bg-zinc-700 hover:bg-red-900 border border-zinc-600 hover:border-red-700 text-zinc-300 hover:text-red-300 text-xs font-medium rounded-lg transition-colors"
            >
              Clear Shows
            </button>
          </div>

          <div className="flex items-center justify-between p-3 bg-zinc-800 rounded-lg">
            <div>
              <p className="text-sm text-zinc-300">Reset All Data</p>
              <p className="text-xs text-zinc-500">Wipes everything and returns to the new game screen.</p>
            </div>
            <button
              onClick={() => setConfirmReset(true)}
              className="px-3 py-1.5 bg-red-900 hover:bg-red-800 border border-red-700 text-red-300 text-xs font-medium rounded-lg transition-colors"
            >
              Full Reset
            </button>
          </div>
        </div>
      </div>

      {/* About */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-2">
        <p className="text-sm font-medium text-zinc-300">About</p>
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-zinc-500">Game</span>
            <span className="text-zinc-300">Wrestling Manager 26</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-zinc-500">Version</span>
            <span className="text-zinc-300">{game.version}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-zinc-500">Stack</span>
            <span className="text-zinc-300">React 18 + TypeScript + Zustand</span>
          </div>
        </div>
      </div>

      {/* Modals */}
      {confirmReset && (
        <ConfirmModal
          title="Reset All Data?"
          message="This will permanently delete your save including your roster, shows, storylines, and career progress. This cannot be undone."
          onConfirm={handleFullReset}
          onClose={() => setConfirmReset(false)}
        />
      )}
      {confirmClearShows && (
        <ConfirmModal
          title="Clear Show History?"
          message={`This will delete all ${shows.length} recorded shows. Your wrestlers, storylines, and career progress will be unaffected.`}
          onConfirm={handleClearShows}
          onClose={() => setConfirmClearShows(false)}
        />
      )}
    </div>
  )
}