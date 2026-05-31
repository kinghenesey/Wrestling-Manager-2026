import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { AwardsCeremony } from "../types/award"

interface AwardsStore {
  ceremonies: AwardsCeremony[]
  addCeremony: (c: AwardsCeremony) => void
  updateCeremony: (id: string, updates: Partial<AwardsCeremony>) => void
  getByYear: (year: number) => AwardsCeremony | undefined
}

export const useAwardsStore = create<AwardsStore>()(
  persist(
    (set, get) => ({
      ceremonies: [],
      addCeremony: (c) => set((s) => ({ ceremonies: [...s.ceremonies, c] })),
      updateCeremony: (id, updates) => set((s) => ({
        ceremonies: s.ceremonies.map((c) => (c.id === id ? { ...c, ...updates } : c)),
      })),
      getByYear: (year) => get().ceremonies.find((c) => c.year === year),
    }),
    { name: "wm26-awards" }
  )
)
