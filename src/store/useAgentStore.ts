import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { Agent } from "../types/agent"

interface AgentStore {
  agents: Agent[]
  getById: (id: string) => Agent | undefined
  getAvailable: () => Agent[]
  getByOrg: (orgId: string) => Agent[]
  addAgent: (a: Agent) => void
  updateAgent: (id: string, updates: Partial<Agent>) => void
  assignClient: (agentId: string, wrestlerId: string) => void
  removeClient: (agentId: string, wrestlerId: string) => void
  fireAgent: (id: string) => void
}

export const useAgentStore = create<AgentStore>()(
  persist(
    (set, get) => ({
      agents: [],
      getById: (id) => get().agents.find((a) => a.id === id),
      getAvailable: () => get().agents.filter((a) => a.isAvailable),
      getByOrg: (orgId) => get().agents.filter((a) => a.currentOrgId === orgId),
      addAgent: (a) => set((s) => ({ agents: [...s.agents, a] })),
      fireAgent: (id) => set((s) => ({ agents: s.agents.filter((a) => a.id !== id) })),
      updateAgent: (id, updates) => set((s) => ({
        agents: s.agents.map((a) => (a.id === id ? { ...a, ...updates } : a)),
      })),
      assignClient: (agentId, wrestlerId) => set((s) => ({
        agents: s.agents.map((a) =>
          a.id === agentId && !a.clientIds.includes(wrestlerId) && a.clientIds.length < a.maxClients
            ? { ...a, clientIds: [...a.clientIds, wrestlerId] } : a),
      })),
      removeClient: (agentId, wrestlerId) => set((s) => ({
        agents: s.agents.map((a) =>
          a.id === agentId
            ? { ...a, clientIds: a.clientIds.filter((id) => id !== wrestlerId) } : a),
      })),
    }),
    { name: "wm26-agents" }
  )
)
