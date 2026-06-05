import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { Organization } from "../types/division"
import type { Title } from "../types/title"
import { ORGANIZATIONS } from "../data/divisions"
import { TITLES } from "../data/titles"

const mapTitleIdsToOrgs = (orgs: Organization[], titles: Title[]): Organization[] => {
  const titlesByOrg: Record<string, string[]> = {}
  const titlesByBrand: Record<string, string[]> = {}

  titles.forEach((title) => {
    titlesByOrg[title.orgId] = [...(titlesByOrg[title.orgId] ?? []), title.id]
    if (title.brandId) {
      titlesByBrand[title.brandId] = [...(titlesByBrand[title.brandId] ?? []), title.id]
    }
  })

  return orgs.map((org) => ({
    ...org,
    titleIds: titlesByOrg[org.id] ?? [],
    brands: org.brands.map((brand) => ({
      ...brand,
      titleIds: titlesByBrand[brand.id] ?? [],
    })),
  }))
}

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

const ORGANIZATIONS_WITH_TITLES = mapTitleIdsToOrgs(ORGANIZATIONS, TITLES)

export const useDivisionStore = create<DivisionStore>()(
  persist(
    (set, get) => ({
      orgs: ORGANIZATIONS_WITH_TITLES,
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
    {
      name: "wm26-divisions",
      version: 1,
      migrate: (state: unknown) => {
        const prevState = state as Record<string, unknown> | undefined
        return {
          orgs: prevState?.orgs && Array.isArray(prevState.orgs)
            ? mapTitleIdsToOrgs(prevState.orgs as Organization[], TITLES)
            : ORGANIZATIONS_WITH_TITLES,
          titles: prevState?.titles && Array.isArray(prevState.titles)
            ? (prevState.titles as Title[])
            : TITLES,
        }
      },
    }
  )
)
