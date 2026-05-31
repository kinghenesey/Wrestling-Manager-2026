import { NavLink } from "react-router-dom"
import {
  LayoutDashboard, Users, Swords, Tv, GraduationCap,
  DollarSign, UserCheck, Building2, Skull, Trophy,
  CalendarDays, Settings, Shield,
} from "lucide-react"
import { cn } from "@/lib/utils"

const NAV_ITEMS = [
  { to: "/dashboard",    icon: LayoutDashboard, label: "Dashboard"    },
  { to: "/roster",       icon: Users,           label: "Roster"       },
  { to: "/storylines",   icon: Swords,          label: "Storylines"   },
  { to: "/show-planner", icon: Tv,              label: "Show Planner" },
  { to: "/academy",      icon: GraduationCap,   label: "Academy"      },
  { to: "/finances",     icon: DollarSign,      label: "Finances"     },
  { to: "/agents",       icon: UserCheck,       label: "Agents"       },
  { to: "/divisions",    icon: Building2,       label: "Divisions"    },
  { to: "/underground",  icon: Skull,           label: "Underground"  },
  { to: "/awards",       icon: Trophy,          label: "Awards"       },
  { to: "/calendar",     icon: CalendarDays,    label: "Calendar"     },
  { to: "/settings",     icon: Settings,        label: "Settings"     },
]

export function Sidebar() {
  return (
    <aside className="w-56 bg-zinc-900 border-r border-zinc-800 flex flex-col">
      <div className="flex items-center gap-2 px-4 py-5 border-b border-zinc-800">
        <Shield className="w-6 h-6 text-amber-400" />
        <span className="font-bold text-sm tracking-widest text-amber-400 uppercase">WM26</span>
      </div>
      <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                isActive
                  ? "bg-amber-500/15 text-amber-400 font-medium"
                  : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
              )
            }
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="px-4 py-3 border-t border-zinc-800">
        <p className="text-xs text-zinc-600">Wrestling Manager 26 v1.0</p>
      </div>
    </aside>
  )
}