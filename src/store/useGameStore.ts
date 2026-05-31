import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { GameState, PlayerManager, CalendarEvent } from "../types/game"

interface GameStore {
  game: GameState
  setGame: (g: GameState) => void
  advanceWeek: () => void
  updatePlayer: (updates: Partial<PlayerManager>) => void
  addCalendarEvent: (event: CalendarEvent) => void
  setGameSpeed: (speed: GameState["gameSpeed"]) => void
  setPaused: (paused: boolean) => void
  resetGame: () => void
}

const DEFAULT_GAME: GameState = {
  week: 1,
  year: 2026,
  startYear: 2026,
  player: {
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
  },
  calendarEvents: [],
  isPaused: false,
  gameSpeed: "normal",
  lastSaved: null,
  version: "1.0.0",
}

export const useGameStore = create<GameStore>()(
  persist(
    (set) => ({
      game: DEFAULT_GAME,
      setGame: (g) => set({ game: g }),
      advanceWeek: () => set((state) => {
        const newWeek = state.game.week + 1
        const newYear = newWeek % 52 === 0 ? state.game.year + 1 : state.game.year
        return { game: { ...state.game, week: newWeek, year: newYear, lastSaved: new Date().toISOString() } }
      }),
      updatePlayer: (updates) => set((state) => ({
        game: { ...state.game, player: { ...state.game.player, ...updates } },
      })),
      addCalendarEvent: (event) => set((state) => ({
        game: { ...state.game, calendarEvents: [...state.game.calendarEvents, event] },
      })),
      setGameSpeed: (speed) => set((state) => ({ game: { ...state.game, gameSpeed: speed } })),
      setPaused: (paused) => set((state) => ({ game: { ...state.game, isPaused: paused } })),
      resetGame: () => set({ game: DEFAULT_GAME }),
    }),
    { name: "wm26-game" }
  )
)
