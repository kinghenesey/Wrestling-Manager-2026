import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { AppLayout }   from "@/components/layout/AppLayout"
import { NewGame }     from "@/pages/NewGame"
import { Dashboard }   from "@/pages/Dashboard"
import { Roster }      from "@/pages/Roster"
import { Storylines }  from "@/pages/Storylines"
import { ShowPlanner } from "@/pages/ShowPlanner"
import Academy from '@/pages/Academy'
// in routes:
<Route path="/academy" element={<Academy />} />
import { Finances }    from "@/pages/Finances"
import Agents from '@/pages/Agents'
// in routes:
<Route path="/agents" element={<Agents />} />
import { Divisions }   from "@/pages/Divisions"
import { Underground } from "@/pages/Underground"
import { Awards }      from "@/pages/Awards"
import { Calendar }    from "@/pages/Calendar"
import { Settings }    from "@/pages/Settings"

function GameRouter() {
  const saved = localStorage.getItem("wm26-game")
  const hasGame = saved && JSON.parse(saved)?.state?.game?.player?.name !== "New Manager"
  return (
    <Routes>
      <Route path="/new-game" element={<NewGame />} />
      <Route path="/" element={<AppLayout />}>
        <Route index element={<Navigate to={hasGame ? "/dashboard" : "/new-game"} replace />} />
        <Route path="dashboard"    element={<Dashboard />} />
        <Route path="roster"       element={<Roster />} />
        <Route path="storylines"   element={<Storylines />} />
        <Route path="show-planner" element={<ShowPlanner />} />
        <Route path="academy"      element={<Academy />} />
        <Route path="finances"     element={<Finances />} />
        <Route path="agents"       element={<Agents />} />
        <Route path="divisions"    element={<Divisions />} />
        <Route path="underground"  element={<Underground />} />
        <Route path="awards"       element={<Awards />} />
        <Route path="calendar"     element={<Calendar />} />
        <Route path="settings"     element={<Settings />} />
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <GameRouter />
    </BrowserRouter>
  )
}
