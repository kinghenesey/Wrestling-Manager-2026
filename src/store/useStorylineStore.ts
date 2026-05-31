import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { Storyline, StorylineSegment, PushDecision } from "../types/storyline"

interface StorylineStore {
  storylines: Storyline[]
  pushHistory: PushDecision[]
  getActive: () => Storyline[]
  getByOrg: (orgId: string) => Storyline[]
  getById: (id: string) => Storyline | undefined
  addStoryline: (s: Storyline) => void
  updateStoryline: (id: string, updates: Partial<Storyline>) => void
  addSegment: (storylineId: string, segment: StorylineSegment) => void
  concludeStoryline: (id: string, week: number) => void
  updateHeat: (id: string, newHeat: number) => void
  addPushDecision: (d: PushDecision) => void
}

export const useStorylineStore = create<StorylineStore>()(
  persist(
    (set, get) => ({
      storylines: [],
      pushHistory: [],
      getActive: () => get().storylines.filter((s) => s.status === "active"),
      getByOrg: (orgId) => get().storylines.filter((s) => s.orgId === orgId),
      getById: (id) => get().storylines.find((s) => s.id === id),
      addStoryline: (s) => set((st) => ({ storylines: [...st.storylines, s] })),
      updateStoryline: (id, updates) => set((st) => ({
        storylines: st.storylines.map((s) => (s.id === id ? { ...s, ...updates } : s)),
      })),
      addSegment: (storylineId, segment) => set((st) => ({
        storylines: st.storylines.map((s) =>
          s.id === storylineId ? { ...s, segments: [...s.segments, segment] } : s),
      })),
      concludeStoryline: (id, week) => set((st) => ({
        storylines: st.storylines.map((s) =>
          s.id === id ? { ...s, status: "concluded" as const, actualEndWeek: week } : s),
      })),
      updateHeat: (id, newHeat) => set((st) => ({
        storylines: st.storylines.map((s) =>
          s.id === id ? { ...s, heat: newHeat, peakHeat: Math.max(s.peakHeat, newHeat) } : s),
      })),
      addPushDecision: (d) => set((st) => ({ pushHistory: [...st.pushHistory, d] })),
    }),
    { name: "wm26-storylines" }
  )
)
