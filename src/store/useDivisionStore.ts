import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { Organization } from "../types/division"
import type { Title } from "../types/title"
import { ORGANIZATIONS } from "../data/divisions"
import { TITLES } from "../data/titles"

interface DivisionStore {
  orgs: Organization[]
  titles: Title[]
  getOrgById: (id: string) => Organization | undefined
  getTitleById: (id: string) => Title | undefined
  getTitlesByOrg: (orgId: string) => Title[]
  getOrgsByTier: (tier: string) => Organization[]
  updateOrg: (id: string, updates: Partial<Organization>) => void
  updateTitle: (id: string, updates: Partial<Title>) => void
  setChampion: (titleId: string, wrestlerId: string, week: number) => void
  vacateTitle: (titleId: string) => void
  addPrestige: (orgId: string, amount: number) => void
}

export const useDivisionStore = create<DivisionStore>()(
  persist(
    (set, get) => ({
      orgs: ORGANIZATIONS,  
      titles: TITLES,
      getOrgById: (id) => get().orgs.find((o) => o.id === id),
      getTitleById: (id) => get().titles.find((t) => t.id === id),
      getTitlesByOrg: (orgId) => get().titles.filter((t) => t.orgId === orgId),
      getOrgsByTier: (tier) => get().orgs.filter((o) => o.tier === tier),
      updateOrg: (id, updates) => set((s) => ({
        orgs: s.orgs.map((o) => (o.id === id ? { ...o, ...updates } : o)),
      })),
      updateTitle: (id, updates) => set((s) => ({
        titles: s.titles.map((t) => (t.id === id ? { ...t, ...updates } : t)),
      })),
      setChampion: (titleId, wrestlerId, week) => set((s) => ({
        titles: s.titles.map((t) =>
          t.id === titleId
            ? { ...t, currentChampionId: wrestlerId, currentChampionIds: [wrestlerId], reignStartWeek: week, defenses: 0, isVacant: false }
            : t),
      })),
      vacateTitle: (titleId) => set((s) => ({
        titles: s.titles.map((t) =>
          t.id === titleId
            ? { ...t, currentChampionId: null, currentChampionIds: [], isVacant: true, reignStartWeek: null }
            : t),
      })),
      addPrestige: (orgId, amount) => set((s) => ({
        orgs: s.orgs.map((o) =>
          o.id === orgId ? { ...o, prestige: Math.max(0, Math.min(100, o.prestige + amount)) } : o),
      })),
    }),
    { name: "wm26-divisions" }
  )
)
