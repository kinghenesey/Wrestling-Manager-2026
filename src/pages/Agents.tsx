// ─────────────────────────────────────────────────────────────────────────────
// src/pages/Agents.tsx
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react'
import { useAgentStore } from '@/store/useAgentStore'
import { useRosterStore } from '@/store/useRosterStore'
import { useGameStore } from '@/store/useGameStore'
import { activateAgentAbility } from '@/engine/agentEngine'
import type { Agent, AgentRole } from '@/types/agent'
import type { Wrestler } from '@/types/wrestler'
import { getPortraitSrc, getFallbackPortrait } from '@/utils/portraits'

// ── Constants ─────────────────────────────────────────────────────────────────

const ROLE_COLORS: Record<AgentRole, string> = {
  mouthpiece: 'bg-purple-900 text-purple-300',
  trainer:    'bg-blue-900 text-blue-300',
  fixer:      'bg-red-900 text-red-300',
  hype_man:   'bg-amber-900 text-amber-300',
  scout:      'bg-emerald-900 text-emerald-300',
  strategist: 'bg-cyan-900 text-cyan-300',
}

const ROLE_LABELS: Record<AgentRole, string> = {
  mouthpiece: 'Mouthpiece',
  trainer:    'Trainer',
  fixer:      'Fixer',
  hype_man:   'Hype Man',
  scout:      'Scout',
  strategist: 'Strategist',
}

const ROLE_DESC: Record<AgentRole, string> = {
  mouthpiece: 'Boosts promo & charisma stats on-show',
  trainer:    'Accelerates in-ring development',
  fixer:      'Handles suspensions & contract disputes',
  hype_man:   'Boosts crowd reaction at live events',
  scout:      'Discovers underground & indie talent',
  strategist: 'Improves match psychology & booking',
}

// ── Agent pool generator ──────────────────────────────────────────────────────

const AGENT_NAMES: Record<AgentRole, string[]> = {
  mouthpiece: ['Paul Garrison', 'Vic Heyman', 'Lenny Cross', 'Bobby Slick'],
  trainer:    ['Doc Steele', 'Iron Mike Rourke', 'Coach Rivera', 'Sal Benedetti'],
  fixer:      ['Tony Marcs', 'Raymond Voss', 'The Cleaner', 'Frank Deluca'],
  hype_man:   ['DJ Thunder', 'Rico Flames', 'Showtime Kenny', 'Big Flex'],
  scout:      ['Earl Cassidy', 'Gino Marcello', 'The Hawk', 'Slim Pickens'],
  strategist: ['Warren Ace', 'Professor Nash', 'Chess King', 'The Architect'],
}

const SPECIAL_ABILITIES: Record<AgentRole, Agent['specialAbility']> = {
  mouthpiece: { name: 'Mic Drop Moment',   description: '+20 promo for 3 weeks after a segment', statBoost: { promo: 20, charisma: 10 }, durationWeeks: 3, cooldownWeeks: 6 },
  trainer:    { name: 'Intensive Camp',     description: '+15 in-ring, +10 psychology for 4 weeks', statBoost: { inRing: 15, psychology: 10 }, durationWeeks: 4, cooldownWeeks: 8 },
  fixer:      { name: 'Crisis Managed',     description: 'Clears one suspension instantly', statBoost: {}, durationWeeks: 1, cooldownWeeks: 12 },
  hype_man:   { name: 'Crowd Ignition',     description: '+25 momentum spike at next show', statBoost: { charisma: 10 }, durationWeeks: 2, cooldownWeeks: 5 },
  scout:      { name: 'Hidden Gem Report',  description: 'Reveals one high-potential free agent', statBoost: {}, durationWeeks: 1, cooldownWeeks: 10 },
  strategist: { name: 'Blueprint Session',  description: '+15 psychology, +10 match rating bonus', statBoost: { psychology: 15 }, durationWeeks: 3, cooldownWeeks: 7 },
}

function generateAgentPool(): Agent[] {
  const roles: AgentRole[] = ['mouthpiece', 'trainer', 'fixer', 'hype_man', 'scout', 'strategist']
  return roles.flatMap(role =>
    AGENT_NAMES[role].slice(0, 2).map((name, i) => ({
      id:             `agent_${role}_${i}`,
      name,
      role,
      reputation:     Math.floor(Math.random() * 40) + 55,
      loyalty:        Math.floor(Math.random() * 30) + 60,
      salary:         Math.floor(Math.random() * 400) + 200,
      clientIds:      [],
      maxClients:     3,
      specialAbility: SPECIAL_ABILITIES[role],
      portraitId:     null,
      currentOrgId:   null,
      bio:            `Experienced ${ROLE_LABELS[role].toLowerCase()} with a proven track record.`,
      isAvailable:    true,
    }))
  )
}

// ── Loyalty Bar ───────────────────────────────────────────────────────────────

function LoyaltyBar({ value }: { value: number }) {
  const color = value >= 70 ? 'bg-emerald-500' : value >= 40 ? 'bg-amber-500' : 'bg-red-500'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${value}%` }} />
      </div>
      <span className="text-xs font-mono text-zinc-400 w-6">{value}</span>
    </div>
  )
}

// ── Agent Card ────────────────────────────────────────────────────────────────

function AgentCard({
  agent,
  isHired,
  isSelected,
  onClick,
}: {
  agent: Agent
  isHired: boolean
  isSelected: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-3 rounded-xl border transition-all ${
        isSelected
          ? 'border-amber-500 bg-zinc-800'
          : isHired
          ? 'border-emerald-800 bg-zinc-900 hover:border-emerald-600'
          : 'border-zinc-800 bg-zinc-900 hover:border-zinc-600'
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0 text-lg">
          {agent.role === 'mouthpiece' ? '🎤' :
           agent.role === 'trainer'    ? '🥊' :
           agent.role === 'fixer'      ? '🔧' :
           agent.role === 'hype_man'   ? '📣' :
           agent.role === 'scout'      ? '🔍' : '♟️'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-white text-sm font-medium truncate">{agent.name}</p>
            {isHired && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-900 text-emerald-400 border border-emerald-800 shrink-0">
                Hired
              </span>
            )}
          </div>
          <span className={`text-xs px-1.5 py-0.5 rounded-full ${ROLE_COLORS[agent.role]}`}>
            {ROLE_LABELS[agent.role]}
          </span>
        </div>
        <div className="text-right shrink-0">
          <p className="text-xs text-zinc-400 font-mono">${agent.salary}/wk</p>
          <p className="text-xs text-zinc-500">Rep {agent.reputation}</p>
        </div>
      </div>

      {isHired && (
        <div className="mt-2">
          <LoyaltyBar value={agent.loyalty} />
        </div>
      )}
    </button>
  )
}

// ── Assign Client Modal ───────────────────────────────────────────────────────

function AssignClientModal({
  agent,
  orgWrestlers,
  onAssign,
  onRemove,
  onClose,
}: {
  agent: Agent
  orgWrestlers: Wrestler[]
  onAssign: (wrestlerId: string) => void
  onRemove: (wrestlerId: string) => void
  onClose: () => void
}) {
  const { wrestlers } = useRosterStore()

  function getWrestlerName(id: string) {
    return wrestlers.find(w => w.id === id)?.name ?? id
  }

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-zinc-800">
          <h2 className="text-white font-semibold">Assign Clients — {agent.name}</h2>
          <button onClick={onClose} title="Close" className="text-zinc-400 hover:text-white text-xl leading-none">×</button>
        </div>

        <div className="p-5 space-y-4">
          {/* Current clients */}
          <div>
            <p className="text-xs text-zinc-400 font-medium uppercase tracking-wide mb-2">
              Current Clients ({agent.clientIds.length}/{agent.maxClients})
            </p>
            {agent.clientIds.length === 0 ? (
              <p className="text-zinc-600 text-xs italic">No clients assigned</p>
            ) : (
              <div className="space-y-1">
                {agent.clientIds.map(id => (
                  <div key={id} className="flex items-center justify-between bg-zinc-800 rounded-lg px-3 py-2">
                    <span className="text-sm text-white">{getWrestlerName(id)}</span>
                    <button
                      onClick={() => onRemove(id)}
                      className="text-xs text-red-400 hover:text-red-300 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add clients */}
          {agent.clientIds.length < agent.maxClients && (
            <div>
              <p className="text-xs text-zinc-400 font-medium uppercase tracking-wide mb-2">Add Client</p>
              <div className="max-h-48 overflow-y-auto space-y-1">
                {orgWrestlers
                  .filter(w => !agent.clientIds.includes(w.id))
                  .map(w => {
                    const src = getPortraitSrc(w.portraitId)
                    const fallback = getFallbackPortrait(w.gender)
                    return (
                      <div
                        key={w.id}
                        onClick={() => onAssign(w.id)}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-800 cursor-pointer transition-colors"
                      >
                        <div className="w-8 h-8 rounded-lg overflow-hidden bg-zinc-800 shrink-0">
                          <img
                            src={src || fallback}
                            alt={w.name}
                            className="w-full h-full object-cover object-top"
                            onError={e => { (e.target as HTMLImageElement).src = fallback }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white truncate">{w.name}</p>
                          <p className="text-xs text-zinc-500">{w.pushLevel} · Pop {w.popularity}</p>
                        </div>
                        <span className="text-xs text-amber-400">+ Assign</span>
                      </div>
                    )
                  })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Detail Panel ──────────────────────────────────────────────────────────────

function AgentDetail({
  agent,
  isHired,
  onHire,
  onFire,
  onActivateAbility,
  onManageClients,
}: {
  agent: Agent
  isHired: boolean
  orgWrestlers: Wrestler[]
  onHire: () => void
  onFire: () => void
  onActivateAbility: (clientId: string) => void
  onManageClients: () => void
}) {
  const { wrestlers } = useRosterStore()

  function getWrestler(id: string) {
    return wrestlers.find(w => w.id === id)
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-2xl shrink-0">
          {agent.role === 'mouthpiece' ? '🎤' :
           agent.role === 'trainer'    ? '🥊' :
           agent.role === 'fixer'      ? '🔧' :
           agent.role === 'hype_man'   ? '📣' :
           agent.role === 'scout'      ? '🔍' : '♟️'}
        </div>
        <div className="flex-1">
          <h3 className="text-white font-semibold text-lg">{agent.name}</h3>
          <span className={`text-xs px-2 py-0.5 rounded-full ${ROLE_COLORS[agent.role]}`}>
            {ROLE_LABELS[agent.role]}
          </span>
          <p className="text-zinc-400 text-xs mt-1">{ROLE_DESC[agent.role]}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="bg-zinc-800 rounded-lg p-3 grid grid-cols-3 gap-3 text-center">
        <div>
          <p className="text-xs text-zinc-400">Reputation</p>
          <p className="text-white font-mono text-lg">{agent.reputation}</p>
        </div>
        <div>
          <p className="text-xs text-zinc-400">Weekly Cost</p>
          <p className="text-emerald-400 font-mono text-lg">${agent.salary}</p>
        </div>
        <div>
          <p className="text-xs text-zinc-400">Clients</p>
          <p className="text-white font-mono text-lg">{agent.clientIds.length}/{agent.maxClients}</p>
        </div>
      </div>

      {/* Loyalty */}
      {isHired && (
        <div className="bg-zinc-800 rounded-lg p-3 space-y-1.5">
          <p className="text-xs text-zinc-400 font-medium uppercase tracking-wide">Loyalty</p>
          <LoyaltyBar value={agent.loyalty} />
          {agent.loyalty < 40 && (
            <p className="text-xs text-red-400">⚠ Low loyalty — this agent may leave soon.</p>
          )}
        </div>
      )}

      {/* Special ability */}
      <div className="bg-zinc-800 rounded-lg p-3 space-y-2">
        <p className="text-xs text-zinc-400 font-medium uppercase tracking-wide">Special Ability</p>
        <p className="text-amber-400 font-medium text-sm">{agent.specialAbility.name}</p>
        <p className="text-xs text-zinc-300">{agent.specialAbility.description}</p>
        <div className="flex gap-3 text-xs text-zinc-500">
          <span>Duration: {agent.specialAbility.durationWeeks}w</span>
          <span>Cooldown: {agent.specialAbility.cooldownWeeks}w</span>
        </div>

        {isHired && agent.clientIds.length > 0 && (
          <div className="space-y-1 pt-1">
            <p className="text-xs text-zinc-500">Activate for:</p>
            {agent.clientIds.map(id => {
              const w = getWrestler(id)
              if (!w) return null
              return (
                <button
                  key={id}
                  onClick={() => onActivateAbility(id)}
                  className="w-full text-left flex items-center justify-between px-3 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg transition-colors text-sm"
                >
                  <span className="text-white">{w.name}</span>
                  <span className="text-amber-400 text-xs">Activate →</span>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Bio */}
      <div className="bg-zinc-800 rounded-lg p-3">
        <p className="text-xs text-zinc-400 font-medium uppercase tracking-wide mb-1">Bio</p>
        <p className="text-xs text-zinc-300 italic">"{agent.bio}"</p>
      </div>

      {/* Clients */}
      {isHired && (
        <div className="bg-zinc-800 rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs text-zinc-400 font-medium uppercase tracking-wide">Clients</p>
            <button
              onClick={onManageClients}
              className="text-xs text-amber-400 hover:text-amber-300 transition-colors"
            >
              Manage
            </button>
          </div>
          {agent.clientIds.length === 0 ? (
            <p className="text-xs text-zinc-600 italic">No clients assigned yet.</p>
          ) : (
            agent.clientIds.map(id => {
              const w = getWrestler(id)
              if (!w) return null
              const src = getPortraitSrc(w.portraitId)
              const fallback = getFallbackPortrait(w.gender)
              return (
                <div key={id} className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg overflow-hidden bg-zinc-700 shrink-0">
                    <img
                      src={src || fallback}
                      alt={w.name}
                      className="w-full h-full object-cover object-top"
                      onError={e => { (e.target as HTMLImageElement).src = fallback }}
                    />
                  </div>
                  <div>
                    <p className="text-xs text-white">{w.name}</p>
                    <p className="text-xs text-zinc-500">{w.pushLevel}</p>
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-2 pt-1">
        {isHired ? (
          <>
            <button
              onClick={onManageClients}
              className="w-full bg-blue-800 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors text-sm"
            >
              Manage Clients
            </button>
            <button
              onClick={onFire}
              className="w-full border border-zinc-700 hover:border-red-700 hover:text-red-400 text-zinc-400 font-medium py-2 rounded-lg transition-colors text-sm"
            >
              Release Agent
            </button>
          </>
        ) : (
          <button
            onClick={onHire}
            className="w-full bg-emerald-700 hover:bg-emerald-600 text-white font-bold py-2.5 rounded-lg transition-colors text-sm"
          >
            Hire — ${agent.salary}/week
          </button>
        )}
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function Agents() {
  const { game } = useGameStore()
  const { getByOrg, wrestlers, updateMorale, updateMomentum } = useRosterStore()
  const { agents, addAgent, assignClient, removeClient, fireAgent } = useAgentStore()

  const orgId = game.player.currentOrgId
  const orgWrestlers = getByOrg(orgId)
  const hiredAgents = agents.filter(a => a.currentOrgId === orgId)
  const [agentPool] = useState<Agent[]>(() => generateAgentPool())
  const availableAgents = agentPool.filter(
    p => !agents.some(a => a.id === p.id)
  )

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [abilityLog, setAbilityLog] = useState<string[]>([])
  const [tab, setTab] = useState<'hired' | 'available'>('hired')

  const displayList = tab === 'hired' ? hiredAgents : availableAgents
  const selected = [...hiredAgents, ...availableAgents].find(a => a.id === selectedId) ?? null
  const isHired = selected ? hiredAgents.some(a => a.id === selected.id) : false

  function handleHire(agent: Agent) {
    addAgent({ ...agent, currentOrgId: orgId, isAvailable: false })
    setSelectedId(agent.id)
    setTab('hired')
  }

  function handleFire(agentId: string) {
    fireAgent(agentId)
    setSelectedId(null)
  }

  function handleActivateAbility(agent: Agent, clientId: string) {
    const result = activateAgentAbility(agent, clientId, wrestlers)
    // Apply stat boosts as morale + momentum (full stat editing needs wrestler store expansion)
    updateMorale(clientId, result.moraleBoost)
    updateMomentum(clientId, result.momentumBoost)
    setAbilityLog(prev => [result.description, ...prev].slice(0, 6))
  }

  function handleAssign(wrestlerId: string) {
    if (!selected) return
    assignClient(selected.id, wrestlerId)
  }

  function handleRemoveClient(wrestlerId: string) {
    if (!selected) return
    removeClient(selected.id, wrestlerId)
  }

  const totalWeeklyCost = hiredAgents.reduce((sum, a) => sum + a.salary, 0)

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Agents & Staff</h1>
          <p className="text-zinc-400 text-sm mt-0.5">
            {hiredAgents.length} hired · ${totalWeeklyCost}/week total cost
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left — Agent List */}
        <div className="space-y-3">
          {/* Tabs */}
          <div className="flex gap-1 bg-zinc-800 rounded-lg p-1">
            <button
              onClick={() => setTab('hired')}
              className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
                tab === 'hired' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-zinc-300'
              }`}
            >
              Hired ({hiredAgents.length})
            </button>
            <button
              onClick={() => setTab('available')}
              className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
                tab === 'available' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-zinc-300'
              }`}
            >
              Available ({availableAgents.length})
            </button>
          </div>

          {displayList.length === 0 ? (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center">
              <p className="text-zinc-500 text-sm">
                {tab === 'hired' ? 'No agents hired yet.' : 'No agents available.'}
              </p>
            </div>
          ) : (
            displayList.map(agent => (
              <AgentCard
                key={agent.id}
                agent={agent}
                isHired={hiredAgents.some(a => a.id === agent.id)}
                isSelected={selectedId === agent.id}
                onClick={() => setSelectedId(agent.id)}
              />
            ))
          )}

          {/* Ability log */}
          {abilityLog.length > 0 && (
            <div className="mt-2 space-y-2">
              <p className="text-xs text-zinc-400 font-medium uppercase tracking-wide">Ability Log</p>
              {abilityLog.map((entry, i) => (
                <div key={i} className="text-xs px-3 py-2 rounded-lg bg-amber-950 text-amber-300">
                  {entry}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right — Detail Panel */}
        <div className="lg:col-span-2">
          {selected ? (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
              <AgentDetail
                agent={
                  // Always use live store data for hired agents
                  hiredAgents.find(a => a.id === selected.id) ?? selected
                }
                isHired={isHired}
                orgWrestlers={orgWrestlers}
                onHire={() => handleHire(selected)}
                onFire={() => handleFire(selected.id)}
                onActivateAbility={clientId => {
                  const live = hiredAgents.find(a => a.id === selected.id) ?? selected
                  handleActivateAbility(live, clientId)
                }}
                onManageClients={() => setShowAssignModal(true)}
              />
            </div>
          ) : (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-12 text-center">
              <p className="text-zinc-500">Select an agent to view details</p>
            </div>
          )}
        </div>
      </div>

      {/* Assign Modal */}
      {showAssignModal && selected && (
        <AssignClientModal
          agent={hiredAgents.find(a => a.id === selected.id) ?? selected}
          orgWrestlers={orgWrestlers}
          onAssign={handleAssign}
          onRemove={handleRemoveClient}
          onClose={() => setShowAssignModal(false)}
        />
      )}
    </div>
  )
}