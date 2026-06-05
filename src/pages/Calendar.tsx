// ─────────────────────────────────────────────────────────────────────────────
// src/pages/Calendar.tsx
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react'
import { useGameStore } from '@/store/useGameStore'
import { useShowStore } from '@/store/useShowStore'
import { useRosterStore } from '@/store/useRosterStore'
import { useDivisionStore } from '@/store/useDivisionStore'
import { getOrgSpecialEvents } from '@/data/specialEvents'
import type { CalendarEvent } from '@/types/game'

// ── Constants ─────────────────────────────────────────────────────────────────

const EVENT_STYLES: Record<CalendarEvent['type'] | 'special_event', {
  bg: string; border: string; text: string; dot: string
}> = {
  weekly_show:       { bg: 'bg-emerald-950',  border: 'border-emerald-800', text: 'text-emerald-300', dot: 'bg-emerald-400'  },
  ppv:               { bg: 'bg-amber-950',    border: 'border-amber-700',   text: 'text-amber-300',   dot: 'bg-amber-400'    },
  draft:             { bg: 'bg-blue-950',     border: 'border-blue-800',    text: 'text-blue-300',    dot: 'bg-blue-400'     },
  awards_ceremony:   { bg: 'bg-purple-950',   border: 'border-purple-800',  text: 'text-purple-300',  dot: 'bg-purple-400'   },
  free_agent_window: { bg: 'bg-cyan-950',     border: 'border-cyan-800',    text: 'text-cyan-300',    dot: 'bg-cyan-400'     },
  contract_deadline: { bg: 'bg-red-950',      border: 'border-red-800',     text: 'text-red-300',     dot: 'bg-red-400'      },
  special_event:     { bg: 'bg-pink-950',     border: 'border-pink-800',    text: 'text-pink-300',    dot: 'bg-pink-400'     },
}

const EVENT_LABELS: Record<CalendarEvent['type'], string> = {
  weekly_show:       'Weekly Show',
  ppv:               'PPV Event',
  draft:             'Draft',
  awards_ceremony:   'Awards Ceremony',
  free_agent_window: 'Free Agent Window',
  contract_deadline: 'Contract Deadline',
}

// ── PPV Name Modal ────────────────────────────────────────────────────────────

function PPVModal({
  week,
  onConfirm,
  onClose,
}: {
  week: number
  onConfirm: (name: string) => void
  onClose: () => void
}) {
  const [name, setName] = useState('')

  const PPV_SUGGESTIONS = [
    'WrestleMania', 'SummerSlam', 'Survivor Series', 'Royal Rumble',
    'King of the Ring', 'Night of Champions', 'Hell in a Cell',
    'Clash of Champions', 'Payback', 'Backlash', 'Extreme Rules', 'TakeOver',
  ]

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-zinc-800">
          <h2 className="text-white font-semibold">Schedule PPV — Week {week}</h2>
          <button onClick={onClose} title="Close" className="text-zinc-400 hover:text-white text-xl leading-none">×</button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs text-zinc-400 mb-1.5">Event Name</label>
            <input
              type="text"
              aria-label="PPV event name"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. WrestleMania..."
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-amber-500 outline-none"
            />
          </div>
          <div>
            <p className="text-xs text-zinc-400 mb-2">Quick suggestions:</p>
            <div className="flex flex-wrap gap-2">
              {PPV_SUGGESTIONS.map(s => (
                <button
                  key={s}
                  onClick={() => setName(s)}
                  className={`text-xs px-2 py-1 rounded-lg border transition-colors ${
                    name === s
                      ? 'border-amber-500 bg-amber-950 text-amber-300'
                      : 'border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-zinc-500'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-1">
            <button
              onClick={onClose}
              className="flex-1 border border-zinc-700 hover:border-zinc-500 text-zinc-300 font-medium py-2.5 rounded-lg transition-colors text-sm"
            >
              Cancel
            </button>
            <button
              onClick={() => { if (name.trim()) onConfirm(name.trim()) }}
              disabled={!name.trim()}
              className="flex-1 bg-amber-600 hover:bg-amber-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-2.5 rounded-lg transition-colors text-sm"
            >
              Schedule PPV
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Week Cell ─────────────────────────────────────────────────────────────────

function WeekCell({
  week,
  isCurrentWeek,
  isPast,
  events,
  hasShow,
  contractWarnings,
  specialEvents,
  onSchedulePPV,
  onRemoveEvent,
}: {
  week: number
  isCurrentWeek: boolean
  isPast: boolean
  events: CalendarEvent[]
  hasShow: boolean
  contractWarnings: string[]
  specialEvents: { name: string; isSignature: boolean; prestige: number }[]
  onSchedulePPV: (week: number) => void
  onRemoveEvent: (week: number, type: CalendarEvent['type']) => void
}) {
  const hasPPV = events.some(e => e.type === 'ppv')
  const hasAwards = events.some(e => e.type === 'awards_ceremony')
  const hasSpecial = specialEvents.length > 0

  return (
    <div className={`rounded-xl border p-3 space-y-2 min-h-32 transition-all ${
      isCurrentWeek
        ? 'border-amber-500 bg-amber-500/5'
        : isPast
        ? 'border-zinc-800 bg-zinc-900/50 opacity-60'
        : 'border-zinc-800 bg-zinc-900 hover:border-zinc-700'
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className={`text-sm font-bold ${isCurrentWeek ? 'text-amber-400' : 'text-zinc-300'}`}>
            W{week}
          </span>
          {isCurrentWeek && (
            <span className="text-xs px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
              NOW
            </span>
          )}
        </div>
        {!isPast && !hasPPV && !hasAwards && !hasSpecial && (
          <button
            onClick={() => onSchedulePPV(week)}
            title="Schedule PPV"
            className="text-xs text-zinc-600 hover:text-amber-400 transition-colors"
          >
            + PPV
          </button>
        )}
      </div>

      {hasShow && (
        <div className={`text-xs px-2 py-1 rounded-lg border ${EVENT_STYLES.weekly_show.bg} ${EVENT_STYLES.weekly_show.border} ${EVENT_STYLES.weekly_show.text}`}>
          <div className="flex items-center gap-1.5">
            <div className={`w-1.5 h-1.5 rounded-full ${EVENT_STYLES.weekly_show.dot}`} />
            Show Booked
          </div>
        </div>
      )}

      {/* Special events */}
      {specialEvents.map((se, i) => (
        <div
          key={i}
          className={`text-xs px-2 py-1 rounded-lg border ${EVENT_STYLES.special_event.bg} ${EVENT_STYLES.special_event.border} ${EVENT_STYLES.special_event.text}`}
        >
          <div className="flex items-center gap-1.5">
            <div className={`w-1.5 h-1.5 rounded-full ${EVENT_STYLES.special_event.dot}`} />
            <span className="truncate font-medium">{se.name}</span>
            {se.isSignature && <span className="text-pink-400 shrink-0">★</span>}
          </div>
          <p className="text-xs opacity-50 pl-3">Prestige {se.prestige}</p>
        </div>
      ))}

      {events.map((event, i) => {
        const style = EVENT_STYLES[event.type]
        return (
          <div
            key={i}
            className={`text-xs px-2 py-1 rounded-lg border ${style.bg} ${style.border} ${style.text} group relative`}
          >
            <div className="flex items-center justify-between gap-1">
              <div className="flex items-center gap-1.5 min-w-0">
                <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${style.dot}`} />
                <span className="truncate">{event.name}</span>
              </div>
              {!isPast && event.type === 'ppv' && (
                <button
                  onClick={() => onRemoveEvent(week, event.type)}
                  title="Remove event"
                  className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-red-400 transition-all shrink-0 text-xs leading-none"
                >
                  ×
                </button>
              )}
            </div>
          </div>
        )
      })}

      {contractWarnings.length > 0 && (
        <div className={`text-xs px-2 py-1 rounded-lg border ${EVENT_STYLES.contract_deadline.bg} ${EVENT_STYLES.contract_deadline.border} ${EVENT_STYLES.contract_deadline.text}`}>
          <div className="flex items-center gap-1.5">
            <div className={`w-1.5 h-1.5 rounded-full ${EVENT_STYLES.contract_deadline.dot}`} />
            <span>{contractWarnings.length} contract{contractWarnings.length !== 1 ? 's' : ''} expiring</span>
          </div>
          <div className="mt-1 space-y-0.5 pl-3">
            {contractWarnings.slice(0, 2).map((name, i) => (
              <p key={i} className="text-red-400 truncate">{name}</p>
            ))}
            {contractWarnings.length > 2 && (
              <p className="text-zinc-500">+{contractWarnings.length - 2} more</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Legend ────────────────────────────────────────────────────────────────────

function Legend() {
  const items: { type: keyof typeof EVENT_STYLES; label: string }[] = [
    { type: 'weekly_show',       label: 'Show Booked'      },
    { type: 'special_event',     label: 'Special Event'    },
    { type: 'ppv',               label: 'PPV Event'        },
    { type: 'awards_ceremony',   label: 'Awards'           },
    { type: 'contract_deadline', label: 'Contract Expiry'  },
  ]
  return (
    <div className="flex flex-wrap gap-3">
      {items.map(({ type, label }) => {
        const style = EVENT_STYLES[type]
        return (
          <div key={type} className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${style.dot}`} />
            <span className="text-xs text-zinc-500">{label}</span>
          </div>
        )
      })}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function Calendar() {
  const { game, addCalendarEvent } = useGameStore()
  const { shows } = useShowStore()
  const { wrestlers } = useRosterStore()
  const { orgs } = useDivisionStore()

  const orgId = game.player.currentOrgId
  const currentWeek = game.week
  const startWeek = currentWeek
  const endWeek = currentWeek + 11

  const [ppvModal, setPPVModal] = useState<number | null>(null)

  const calendarEvents = game.calendarEvents.filter(e => e.orgId === orgId)
  const awardsWeek = Math.ceil(currentWeek / 52) * 52 - 4
  const hasAwardsEvent = calendarEvents.some(e => e.type === 'awards_ceremony')

  const showWeeks = new Set(
    shows.filter(s => s.orgId === orgId).map(s => s.week)
  )

  // Contract expirations
  const contractExpirations: Record<number, string[]> = {}
  wrestlers
    .filter(w => w.currentOrgId === orgId && w.contract)
    .forEach(w => {
      const expiryWeek = currentWeek + w.contract!.weeksRemaining
      if (expiryWeek >= startWeek && expiryWeek <= endWeek) {
        if (!contractExpirations[expiryWeek]) contractExpirations[expiryWeek] = []
        contractExpirations[expiryWeek].push(w.name)
      }
    })

  // Special events for this org
  const currentOrg = orgs.find(o => o.id === orgId)
  const specialEvents = currentOrg
    ? getOrgSpecialEvents(
        orgId,
        currentOrg.shortName,
        currentOrg.tier,
        game.startYear,
        game.year
      )
    : []

  // Map special events by week
  const specialEventsByWeek: Record<number, typeof specialEvents> = {}
  specialEvents.forEach(se => {
    const relativeWeek = (se.week % 52) + Math.floor(currentWeek / 52) * 52
    if (relativeWeek >= startWeek && relativeWeek <= endWeek) {
      if (!specialEventsByWeek[relativeWeek]) specialEventsByWeek[relativeWeek] = []
      specialEventsByWeek[relativeWeek].push(se)
    }
  })

  const weeks = Array.from({ length: 12 }, (_, i) => startWeek + i)

  function handleConfirmPPV(week: number, name: string) {
    addCalendarEvent({
      week,
      type: 'ppv',
      orgId,
      name,
      description: `${name} — PPV event scheduled for Week ${week}`,
    })
    setPPVModal(null)
  }

  function handleRemoveEvent(week: number, type: CalendarEvent['type']) {
    const { game: g, setGame } = useGameStore.getState()
    setGame({
      ...g,
      calendarEvents: g.calendarEvents.filter(
        e => !(e.week === week && e.type === type && e.orgId === orgId)
      ),
    })
  }

  const upcomingPPVs = calendarEvents
    .filter(e => e.type === 'ppv' && e.week >= currentWeek)
    .sort((a, b) => a.week - b.week)

  const upcomingSpecials = specialEvents
    .map(se => ({
      ...se,
      relativeWeek: (se.week % 52) + Math.floor(currentWeek / 52) * 52,
    }))
    .filter(se => se.relativeWeek >= currentWeek && se.relativeWeek <= endWeek)
    .sort((a, b) => a.relativeWeek - b.relativeWeek)

  const bookedShows       = weeks.filter(w => showWeeks.has(w)).length
  const scheduledPPVs     = calendarEvents.filter(e => e.type === 'ppv' && e.week >= startWeek && e.week <= endWeek).length
  const expiringContracts = Object.values(contractExpirations).flat().length
  const upcomingSpecialCount = upcomingSpecials.length

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Calendar</h1>
          <p className="text-zinc-400 text-sm mt-0.5">
            Weeks {startWeek}–{endWeek} · {game.year}
          </p>
        </div>
        <Legend />
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Shows Booked',       value: bookedShows,          color: 'text-emerald-400' },
          { label: 'PPVs Scheduled',     value: scheduledPPVs,        color: 'text-amber-400'   },
          { label: 'Special Events',     value: upcomingSpecialCount, color: 'text-pink-400'    },
          { label: 'Expiring Contracts', value: expiringContracts,    color: 'text-red-400'     },
        ].map(item => (
          <div key={item.label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-center">
            <p className={`text-2xl font-black ${item.color}`}>{item.value}</p>
            <p className="text-xs text-zinc-500 mt-0.5">{item.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* 12-week grid */}
        <div className="xl:col-span-3">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {weeks.map(week => {
              const weekEvents = calendarEvents.filter(e => e.week === week)
              const displayEvents = [...weekEvents]

              if (week === awardsWeek && !hasAwardsEvent && week >= 48) {
                displayEvents.push({
                  week,
                  type: 'awards_ceremony' as const,
                  orgId,
                  name: 'Golden Headlock Awards',
                  description: 'Year-end awards ceremony',
                })
              }

              return (
                <WeekCell
                  key={week}
                  week={week}
                  isCurrentWeek={week === currentWeek}
                  isPast={week < currentWeek}
                  events={displayEvents}
                  hasShow={showWeeks.has(week)}
                  contractWarnings={contractExpirations[week] ?? []}
                  specialEvents={specialEventsByWeek[week] ?? []}
                  onSchedulePPV={setPPVModal}
                  onRemoveEvent={handleRemoveEvent}
                />
              )
            })}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Upcoming special events */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3">
            <p className="text-sm font-medium text-zinc-300">Special Events</p>
            {upcomingSpecials.length === 0 ? (
              <p className="text-xs text-zinc-600 italic">
                No special events in the next 12 weeks.
              </p>
            ) : (
              upcomingSpecials.map((se, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-pink-300 font-medium">
                      {se.name}
                      {se.isSignature && <span className="ml-1 text-pink-400">★</span>}
                    </p>
                    <p className="text-xs text-zinc-500">Week {se.relativeWeek} · Prestige {se.prestige}</p>
                  </div>
                  <span className="text-xs text-zinc-500 font-mono">
                    {se.relativeWeek - currentWeek}w
                  </span>
                </div>
              ))
            )}
          </div>

          {/* Upcoming PPVs */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3">
            <p className="text-sm font-medium text-zinc-300">Upcoming PPVs</p>
            {upcomingPPVs.length === 0 ? (
              <p className="text-xs text-zinc-600 italic">No PPVs scheduled.</p>
            ) : (
              upcomingPPVs.map((e, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-amber-300 font-medium">{e.name}</p>
                    <p className="text-xs text-zinc-500">Week {e.week}</p>
                  </div>
                  <span className="text-xs text-zinc-500 font-mono">
                    {e.week - currentWeek}w away
                  </span>
                </div>
              ))
            )}
          </div>

          {/* Contract deadlines */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3">
            <p className="text-sm font-medium text-zinc-300">Contract Deadlines</p>
            {expiringContracts === 0 ? (
              <p className="text-xs text-zinc-600 italic">
                No contracts expiring in the next 12 weeks.
              </p>
            ) : (
              Object.entries(contractExpirations)
                .sort(([a], [b]) => Number(a) - Number(b))
                .map(([week, names]) => (
                  <div key={week}>
                    <p className="text-xs text-zinc-500 mb-1">Week {week}</p>
                    {names.map(name => (
                      <div key={name} className="flex items-center gap-2 py-0.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                        <p className="text-xs text-red-300">{name}</p>
                      </div>
                    ))}
                  </div>
                ))
            )}
          </div>

          {/* Legend guide */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-2">
            <p className="text-sm font-medium text-zinc-300">Event Types</p>
            {(Object.keys(EVENT_LABELS) as CalendarEvent['type'][]).map(type => {
              const style = EVENT_STYLES[type]
              return (
                <div key={type} className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${style.dot}`} />
                  <span className="text-xs text-zinc-500">{EVENT_LABELS[type]}</span>
                </div>
              )
            })}
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full shrink-0 ${EVENT_STYLES.special_event.dot}`} />
              <span className="text-xs text-zinc-500">Special Event ★ = Signature</span>
            </div>
          </div>
        </div>
      </div>

      {ppvModal !== null && (
        <PPVModal
          week={ppvModal}
          onConfirm={name => handleConfirmPPV(ppvModal, name)}
          onClose={() => setPPVModal(null)}
        />
      )}
    </div>
  )
}