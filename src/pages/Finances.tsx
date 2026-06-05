// ─────────────────────────────────────────────────────────────────────────────
// src/pages/Finances.tsx
// ─────────────────────────────────────────────────────────────────────────────
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { useGameStore } from '@/store/useGameStore'
import { useShowStore } from '@/store/useShowStore'
import { useRosterStore } from '@/store/useRosterStore'
import { useAgentStore } from '@/store/useAgentStore'

// ── Constants ─────────────────────────────────────────────────────────────────

const VENUE_COST_PER_SHOW = 500
const MERCH_RATE = 0.08  // 8% of gate as merch

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatMoney(n: number): string {
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`
  if (Math.abs(n) >= 1_000)     return `$${(n / 1_000).toFixed(1)}k`
  return `$${n}`
}

function healthLabel(surplus: number): { label: string; color: string } {
  if (surplus >  5000) return { label: 'Healthy Surplus',  color: 'text-emerald-400' }
  if (surplus >     0) return { label: 'Breaking Even',    color: 'text-amber-400'   }
  if (surplus > -5000) return { label: 'Minor Deficit',    color: 'text-orange-400'  }
  return                      { label: 'Serious Debt',     color: 'text-red-400'     }
}

// ── Stat Card ─────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  color = 'text-white',
}: {
  label: string
  value: string
  sub?: string
  color?: string
}) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-1">
      <p className="text-xs text-zinc-500 uppercase tracking-wide">{label}</p>
      <p className={`text-2xl font-black font-mono ${color}`}>{value}</p>
      {sub && <p className="text-xs text-zinc-600">{sub}</p>}
    </div>
  )
}

// ── Custom Tooltip ────────────────────────────────────────────────────────────

// Replace the ChartTooltip function
function ChartTooltip({ active, payload, label }: {
  active?: boolean
  payload?: { name: string; value: number; color: string }[]
  label?: number
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs space-y-1">
      <p className="text-zinc-400">Week {label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: {formatMoney(p.value)}
        </p>
      ))}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function Finances() {
  const { game } = useGameStore()
  const { shows } = useShowStore()
  const { wrestlers } = useRosterStore()
  const { agents } = useAgentStore()

  const orgId = game.player.currentOrgId
  const currentWeek = game.week

  // ── Weekly salary bill ──────────────────────────────────────────────────────
  const orgWrestlers = wrestlers.filter(
    w => w.currentOrgId === orgId && w.status !== 'free_agent'
  )
  const weeklySalaryBill = orgWrestlers.reduce(
    (sum, w) => sum + (w.contract?.salary ?? 0), 0
  )

  // ── Agent fees ──────────────────────────────────────────────────────────────
  const orgAgents = agents.filter(a => a.currentOrgId === orgId)
  const weeklyAgentFees = orgAgents.reduce((sum, a) => sum + a.salary, 0)

  // ── Last 12 weeks of shows ──────────────────────────────────────────────────
  const orgShows = shows
    .filter(s => s.orgId === orgId)
    .sort((a, b) => a.week - b.week)

  const last12Weeks = (() => {
    const startWeek = Math.max(1, currentWeek - 11)
    const weeks: {
        week: number
        revenue: number
        expenses: number
        profit: number
        showName: string | null
    }[] = []

    for (let w = startWeek; w <= currentWeek; w++) {
        const weekShow = orgShows.find(s => s.week === w)
        const gateRevenue  = weekShow?.revenue ?? 0
        const merchRevenue = Math.round(gateRevenue * MERCH_RATE)
        const venueExpense = weekShow ? VENUE_COST_PER_SHOW : 0

        const revenue  = gateRevenue + merchRevenue
        const expenses = weeklySalaryBill + weeklyAgentFees + venueExpense
        const profit   = revenue - expenses

        weeks.push({
        week: w,
        revenue,
        expenses,
        profit,
        showName: weekShow?.name ?? null,
        })
    }

    return weeks
    })()

  // ── This week figures ───────────────────────────────────────────────────────
  const thisWeekShow = orgShows.find(s => s.week === currentWeek)
  const gateRevenue  = thisWeekShow?.revenue ?? 0
  const merchRevenue = Math.round(gateRevenue * MERCH_RATE)
  const venueExpense = thisWeekShow ? VENUE_COST_PER_SHOW : 0
  const totalIncome  = gateRevenue + merchRevenue
  const totalExpenses = weeklySalaryBill + weeklyAgentFees + venueExpense
  const weeklyProfit  = totalIncome - totalExpenses

  // ── Running total ───────────────────────────────────────────────────────────
  const runningTotal = last12Weeks.reduce((sum, w) => sum + w.profit, 0)

  // ── Consecutive deficit weeks ───────────────────────────────────────────────
  let deficitStreak = 0
  for (let i = last12Weeks.length - 1; i >= 0; i--) {
    if (last12Weeks[i].profit < 0) deficitStreak++
    else break
  }

  const health = healthLabel(weeklyProfit)

  // ── Top earners ─────────────────────────────────────────────────────────────
  const topEarners = [...orgWrestlers]
    .sort((a, b) => (b.contract?.salary ?? 0) - (a.contract?.salary ?? 0))
    .slice(0, 5)

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Finances</h1>
        <p className="text-zinc-400 text-sm mt-0.5">
          Week {currentWeek} · {orgId.toUpperCase()} Financial Overview
        </p>
      </div>

      {/* Deficit warning */}
      {deficitStreak >= 4 && (
        <div className="bg-red-950 border border-red-800 rounded-lg px-4 py-3 text-red-300 text-sm">
          ⚠ You have been running at a deficit for {deficitStreak} consecutive weeks.
          Continued losses will damage org prestige.
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Weekly Income"
          value={formatMoney(totalIncome)}
          sub={thisWeekShow ? `Gate + merch` : 'No show this week'}
          color="text-emerald-400"
        />
        <StatCard
          label="Weekly Expenses"
          value={formatMoney(totalExpenses)}
          sub={`${orgWrestlers.length} contracts + ${orgAgents.length} agents`}
          color="text-red-400"
        />
        <StatCard
          label="This Week"
          value={formatMoney(weeklyProfit)}
          sub={health.label}
          color={health.color}
        />
        <StatCard
          label="12-Week Total"
          value={formatMoney(runningTotal)}
          sub={runningTotal >= 0 ? 'In the black' : 'In the red'}
          color={runningTotal >= 0 ? 'text-emerald-400' : 'text-red-400'}
        />
      </div>

      {/* Chart */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
        <p className="text-sm font-medium text-zinc-300 mb-4">Revenue vs Expenses — Last 12 Weeks</p>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={last12Weeks} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis
                dataKey="week"
                tick={{ fill: '#71717a', fontSize: 11 }}
                tickFormatter={w => `W${w}`}
              />
              <YAxis
                tick={{ fill: '#71717a', fontSize: 11 }}
                tickFormatter={v => formatMoney(v)}
                width={60}
              />
              <Tooltip content={<ChartTooltip />} />
              <ReferenceLine y={0} stroke="#52525b" strokeDasharray="4 4" />
              <Line
                type="monotone"
                dataKey="revenue"
                name="Revenue"
                stroke="#34d399"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="expenses"
                name="Expenses"
                stroke="#f87171"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="profit"
                name="Profit"
                stroke="#f59e0b"
                strokeWidth={2}
                strokeDasharray="5 3"
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center gap-6 mt-3 justify-center">
          {[
            { color: '#34d399', label: 'Revenue' },
            { color: '#f87171', label: 'Expenses' },
            { color: '#f59e0b', label: 'Profit/Loss' },
          ].map(item => (
            <div key={item.label} className="flex items-center gap-1.5">
              <div className="w-3 h-0.5 rounded" style={{ backgroundColor: item.color }} />
              <span className="text-xs text-zinc-500">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Breakdown + Top earners */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Expense breakdown */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
          <p className="text-sm font-medium text-zinc-300">Weekly Expense Breakdown</p>
          <div className="space-y-2">
            {[
              { label: 'Wrestler Salaries', value: weeklySalaryBill, sub: `${orgWrestlers.length} contracts` },
              { label: 'Agent Fees',        value: weeklyAgentFees,  sub: `${orgAgents.length} agents` },
              { label: 'Venue Cost',        value: venueExpense,     sub: thisWeekShow ? '1 show this week' : 'No show booked' },
            ].map(row => (
              <div key={row.label} className="flex items-center justify-between py-2 border-b border-zinc-800 last:border-0">
                <div>
                  <p className="text-sm text-zinc-300">{row.label}</p>
                  <p className="text-xs text-zinc-600">{row.sub}</p>
                </div>
                <p className="text-sm font-mono text-red-400">{formatMoney(row.value)}</p>
              </div>
            ))}
            <div className="flex items-center justify-between pt-1">
              <p className="text-sm font-medium text-zinc-300">Total</p>
              <p className="text-sm font-mono font-bold text-red-400">{formatMoney(totalExpenses)}</p>
            </div>
          </div>
        </div>

        {/* Income breakdown */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
          <p className="text-sm font-medium text-zinc-300">Weekly Income Breakdown</p>
          <div className="space-y-2">
            {[
              { label: 'Gate Revenue',  value: gateRevenue,  sub: thisWeekShow ? `${thisWeekShow.attendance.toLocaleString()} attendance` : 'No show' },
              { label: 'Merchandise',   value: merchRevenue, sub: `${(MERCH_RATE * 100).toFixed(0)}% of gate` },
              { label: 'TV Deal',       value: 0,            sub: 'Not yet secured' },
            ].map(row => (
              <div key={row.label} className="flex items-center justify-between py-2 border-b border-zinc-800 last:border-0">
                <div>
                  <p className="text-sm text-zinc-300">{row.label}</p>
                  <p className="text-xs text-zinc-600">{row.sub}</p>
                </div>
                <p className="text-sm font-mono text-emerald-400">{formatMoney(row.value)}</p>
              </div>
            ))}
            <div className="flex items-center justify-between pt-1">
              <p className="text-sm font-medium text-zinc-300">Total</p>
              <p className="text-sm font-mono font-bold text-emerald-400">{formatMoney(totalIncome)}</p>
            </div>
          </div>
        </div>

        {/* Top earners */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-3 lg:col-span-2">
          <p className="text-sm font-medium text-zinc-300">Top Earners</p>
          {topEarners.length === 0 ? (
            <p className="text-zinc-600 text-xs italic">No contracted wrestlers.</p>
          ) : (
            <div className="space-y-2">
              {topEarners.map((w, i) => {
                const salary = w.contract?.salary ?? 0
                const pct = weeklySalaryBill > 0
                  ? Math.round((salary / weeklySalaryBill) * 100)
                  : 0
                return (
                  <div key={w.id} className="flex items-center gap-3">
                    <span className="text-xs text-zinc-600 w-4">{i + 1}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-0.5">
                        <p className="text-sm text-white">{w.name}</p>
                        <p className="text-xs font-mono text-zinc-300">{formatMoney(salary)}/wk</p>
                      </div>
                      <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-500 rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-xs text-zinc-500 w-8 text-right">{pct}%</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}