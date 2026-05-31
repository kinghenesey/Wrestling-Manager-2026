import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { UndergroundEvent, FreeAgent } from "../types/underground"

interface UndergroundStore {
  events: UndergroundEvent[]
  freeAgents: FreeAgent[]
  addEvent: (e: UndergroundEvent) => void
  addFreeAgent: (fa: FreeAgent) => void
  removeFreeAgent: (wrestlerId: string) => void
  updateFreeAgent: (wrestlerId: string, updates: Partial<FreeAgent>) => void
}

export const useUndergroundStore = create<UndergroundStore>()(
  persist(
    (set) => ({
      events: [],
      freeAgents: [],
      addEvent: (e) => set((s) => ({ events: [...s.events, e] })),
      addFreeAgent: (fa) => set((s) => ({ freeAgents: [...s.freeAgents, fa] })),
      removeFreeAgent: (wrestlerId) => set((s) => ({
        freeAgents: s.freeAgents.filter((f) => f.wrestlerId !== wrestlerId),
      })),
      updateFreeAgent: (wrestlerId, updates) => set((s) => ({
        freeAgents: s.freeAgents.map((f) => (f.wrestlerId === wrestlerId ? { ...f, ...updates } : f)),
      })),
    }),
    { name: "wm26-underground" }
  )
)
