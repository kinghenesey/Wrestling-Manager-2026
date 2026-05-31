import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { Show, Match } from "../types/show"

interface ShowStore {
  shows: Show[]
  currentShow: Show | null
  getByOrg: (orgId: string) => Show[]
  getByWeek: (week: number) => Show[]
  getPPVs: () => Show[]
  getById: (id: string) => Show | undefined
  addShow: (s: Show) => void
  updateShow: (id: string, updates: Partial<Show>) => void
  setCurrentShow: (s: Show | null) => void
  addMatch: (showId: string, match: Match) => void
  updateMatch: (showId: string, matchId: string, updates: Partial<Match>) => void
  finalizeShow: (id: string, rating: number, revenue: number) => void
}

export const useShowStore = create<ShowStore>()(
  persist(
    (set, get) => ({
      shows: [],
      currentShow: null,
      getByOrg: (orgId) => get().shows.filter((s) => s.orgId === orgId),
      getByWeek: (week) => get().shows.filter((s) => s.week === week),
      getPPVs: () => get().shows.filter((s) => s.type === "ppv"),
      getById: (id) => get().shows.find((s) => s.id === id),
      addShow: (s) => set((st) => ({ shows: [...st.shows, s] })),
      setCurrentShow: (s) => set({ currentShow: s }),
      updateShow: (id, updates) => set((st) => ({
        shows: st.shows.map((s) => (s.id === id ? { ...s, ...updates } : s)),
      })),
      addMatch: (showId, match) => set((st) => ({
        shows: st.shows.map((s) =>
          s.id === showId ? { ...s, matches: [...s.matches, match] } : s),
      })),
      updateMatch: (showId, matchId, updates) => set((st) => ({
        shows: st.shows.map((s) =>
          s.id === showId
            ? { ...s, matches: s.matches.map((m) => (m.id === matchId ? { ...m, ...updates } : m)) }
            : s),
      })),
      finalizeShow: (id, rating, revenue) => set((st) => ({
        shows: st.shows.map((s) =>
          s.id === id ? { ...s, overallRating: rating, revenue, isSimulated: true } : s),
      })),
    }),
    { name: "wm26-shows" }
  )
)
