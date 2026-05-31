import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { Wrestler, PushLevel, Alignment, Contract, Injury } from "@/types/wrestler"
import { STARTING_WRESTLERS } from "@/data/wrestlers"

interface RosterStore {
  wrestlers: Wrestler[]
  getById: (id: string) => Wrestler | undefined
  getByOrg: (orgId: string) => Wrestler[]
  getFreeAgents: () => Wrestler[]
  getByGender: (g: "male" | "female") => Wrestler[]
  addWrestler: (w: Wrestler) => void
  updateWrestler: (id: string, updates: Partial<Wrestler>) => void
  removeWrestler: (id: string) => void
  updateMomentum: (id: string, delta: number) => void
  updatePopularity: (id: string, delta: number) => void
  updateMorale: (id: string, delta: number) => void
  setPushLevel: (id: string, level: PushLevel) => void
  setAlignment: (id: string, alignment: Alignment) => void
  signContract: (id: string, contract: Contract, orgId: string) => void
  releaseWrestler: (id: string) => void
  applyInjury: (id: string, injury: Injury) => void
  clearInjury: (id: string) => void
  resetRoster: () => void
}

export const useRosterStore = create<RosterStore>()(
  persist(
    (set, get) => ({
      wrestlers: STARTING_WRESTLERS,
      getById: (id) => get().wrestlers.find((w) => w.id === id),
      getByOrg: (orgId) => get().wrestlers.filter((w) => w.currentOrgId === orgId),
      getFreeAgents: () => get().wrestlers.filter((w) => w.status === "free_agent"),
      getByGender: (g) => get().wrestlers.filter((w) => w.gender === g),
      addWrestler: (w) => set((s) => ({ wrestlers: [...s.wrestlers, w] })),
      updateWrestler: (id, updates) => set((s) => ({
        wrestlers: s.wrestlers.map((w) => (w.id === id ? { ...w, ...updates } : w)),
      })),
      removeWrestler: (id) => set((s) => ({ wrestlers: s.wrestlers.filter((w) => w.id !== id) })),
      updateMomentum: (id, delta) => set((s) => ({
        wrestlers: s.wrestlers.map((w) =>
          w.id === id ? { ...w, momentum: Math.max(0, Math.min(100, w.momentum + delta)) } : w),
      })),
      updatePopularity: (id, delta) => set((s) => ({
        wrestlers: s.wrestlers.map((w) =>
          w.id === id ? { ...w, popularity: Math.max(0, Math.min(100, w.popularity + delta)) } : w),
      })),
      updateMorale: (id, delta) => set((s) => ({
        wrestlers: s.wrestlers.map((w) =>
          w.id === id ? { ...w, morale: Math.max(0, Math.min(100, w.morale + delta)) } : w),
      })),
      setPushLevel: (id, level) => set((s) => ({
        wrestlers: s.wrestlers.map((w) => (w.id === id ? { ...w, pushLevel: level } : w)),
      })),
      setAlignment: (id, alignment) => set((s) => ({
        wrestlers: s.wrestlers.map((w) => (w.id === id ? { ...w, alignment } : w)),
      })),
      signContract: (id, contract, orgId) => set((s) => ({
        wrestlers: s.wrestlers.map((w) =>
          w.id === id ? { ...w, contract, currentOrgId: orgId, status: "active" as const } : w),
      })),
      releaseWrestler: (id) => set((s) => ({
        wrestlers: s.wrestlers.map((w) =>
          w.id === id ? { ...w, status: "free_agent" as const, currentOrgId: "underground", contract: null } : w),
      })),
      applyInjury: (id, injury) => set((s) => ({
        wrestlers: s.wrestlers.map((w) =>
          w.id === id ? { ...w, injury, status: "injured" as const } : w),
      })),
      clearInjury: (id) => set((s) => ({
        wrestlers: s.wrestlers.map((w) =>
          w.id === id ? { ...w, injury: null, status: "active" as const } : w),
      })),
      resetRoster: () => set({ wrestlers: STARTING_WRESTLERS }),
    }),
    {
      name: "wm26-roster-v2",
      version: 2,
      migrate: () => ({ wrestlers: STARTING_WRESTLERS }),
    }
  )
)
