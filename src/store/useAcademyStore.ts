  import { create } from "zustand"
  import { persist } from "zustand/middleware"

  interface Prospect {
    id: string
    name: string
    scoutedByOrgId: string
    stage: string
    trainingFocus: string
    [key: string]: unknown
  }

  interface AcademyStore {
    prospects: Prospect[]
    getByOrg: (orgId: string) => Prospect[]
    getById: (id: string) => Prospect | undefined
    getGraduates: () => Prospect[]
    addProspect: (p: Prospect) => void
    updateProspect: (id: string, updates: Partial<Prospect>) => void
    removeProspect: (id: string) => void
    setFocus: (id: string, focus: string) => void
  }

  export const useAcademyStore = create<AcademyStore>()(
    persist(
      (set, get) => ({
        prospects: [],
        getByOrg: (orgId) => get().prospects.filter((p) => p.scoutedByOrgId === orgId),
        getById: (id) => get().prospects.find((p) => p.id === id),
        getGraduates: () => get().prospects.filter((p) => p.stage === "graduate"),
        addProspect: (p) => set((s) => ({ prospects: [...s.prospects, p] })),
        removeProspect: (id) => set((s) => ({ prospects: s.prospects.filter((p) => p.id !== id) })),
        updateProspect: (id, updates) => set((s) => ({
          prospects: s.prospects.map((p) => (p.id === id ? { ...p, ...updates } : p)),
        })),
        setFocus: (id, focus) => set((s) => ({
          prospects: s.prospects.map((p) => (p.id === id ? { ...p, trainingFocus: focus } : p)),
        })),
      }),
      { name: "wm26-academy" }
    )
  )
