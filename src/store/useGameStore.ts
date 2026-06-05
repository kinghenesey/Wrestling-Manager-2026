import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { GameState, PlayerManager, CalendarEvent } from "@/types/game"
import { simulateWeek } from "@/engine/weekSimEngine"
import { useRosterStore } from "@/store/useRosterStore"
import { useStorylineStore } from "@/store/useStorylineStore"
import type { WeekSimResult } from "@/types/weekSim"
import { useUndergroundStore } from "./useUndergroundStore"

interface GameStore {
  game: GameState
  lastSimResult: WeekSimResult | null
  setGame: (g: GameState) => void
  advanceWeek: () => void
  updatePlayer: (updates: Partial<PlayerManager>) => void
  addCalendarEvent: (event: CalendarEvent) => void
  addReputationPoints: (points: number) => void
  setGameSpeed: (speed: GameState["gameSpeed"]) => void
  setPaused: (paused: boolean) => void
  resetGame: () => void
  startNewGame: (managerName: string, orgId: string) => void
}

const DEFAULT_PLAYER: PlayerManager = {
  id: "player_1",
  name: "New Manager",
  reputation: "unknown",
  reputationPoints: 0,
  currentOrgId: "llw",
  previousOrgIds: [],
  jobOffers: [],
  awardsWon: [],
  yearsActive: 0,
  totalShowsBooked: 0,
  avgShowRating: 0,
  career_highlights: [],
}

const DEFAULT_GAME: GameState = {
  week: 1,
  year: 2026,
  startYear: 2026,
  player: DEFAULT_PLAYER,
  calendarEvents: [],
  isPaused: false,
  gameSpeed: "normal",
  lastSaved: null,
  version: "1.0.0",
}

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      game: DEFAULT_GAME,
      lastSimResult: null,

      setGame: (g) => set({ game: g }),

      advanceWeek: () => {
        const { game } = get()
        const wrestlers = useRosterStore.getState().wrestlers
        const storylines = useStorylineStore.getState().storylines ?? []

        const newWeek = game.week + 1
        const newYear = game.startYear + Math.floor((newWeek - 1) / 52)

        const result = simulateWeek({
          week: newWeek,
          year: newYear,
          player: game.player,
          wrestlers,
          storylines,
          orgId: game.player.currentOrgId,
          undergroundFreeAgents: useUndergroundStore.getState().freeAgents,
        })

        result.newUndergroundAgents?.forEach(fa => {
          useUndergroundStore.getState().addFreeAgent(fa)
        })

        // Commit wrestler updates
        result.updatedWrestlers.forEach(w => {
          useRosterStore.getState().updateWrestler(w.id, w)
        })

        // Commit storyline updates
        const updateStoryline = useStorylineStore.getState().updateStoryline
        if (updateStoryline) {
          result.updatedStorylines.forEach(s => updateStoryline(s.id, s))
        }

        set({
          lastSimResult: result,
          game: {
            ...game,
            week: newWeek,
            year: newYear,
            player: result.updatedPlayer,
            lastSaved: new Date().toISOString(),
          },
        })
      },

      updatePlayer: (updates) => set((state) => ({
        game: { ...state.game, player: { ...state.game.player, ...updates } },
      })),

      addCalendarEvent: (event) => set((state) => ({
        game: { ...state.game, calendarEvents: [...state.game.calendarEvents, event] },
      })),

      addReputationPoints: (points) => set((state) => ({
        game: {
          ...state.game,
          player: {
            ...state.game.player,
            reputationPoints: state.game.player.reputationPoints + points,
          },
        },
      })),

      setGameSpeed: (speed) => set((state) => ({ game: { ...state.game, gameSpeed: speed } })),
      setPaused: (paused) => set((state) => ({ game: { ...state.game, isPaused: paused } })),
      resetGame: () => set({ game: DEFAULT_GAME, lastSimResult: null }),

      startNewGame: (managerName, orgId) => set({
        game: {
          ...DEFAULT_GAME,
          player: {
            ...DEFAULT_PLAYER,
            name: managerName.trim() || "The Booker",
            currentOrgId: orgId,
          },
          lastSaved: new Date().toISOString(),
        },
        lastSimResult: null,
      }),
    }),
    { name: "wm26-game-v3", version: 3 }
  )
)