import React from "react"

export interface OrgColorConfig {
  bg: string
  text: string
  border: string
  abbr: string
  svgColors: { primary: string; secondary: string; accent: string }
}

export const ORG_COLORS: Record<string, OrgColorConfig> = {
  awf:         { bg: "bg-amber-500/20",  text: "text-amber-400",  border: "border-amber-500/40",  abbr: "AWF",  svgColors: { primary: "#f59e0b", secondary: "#1c1917", accent: "#fbbf24" } },
  tpw:         { bg: "bg-red-500/20",    text: "text-red-400",    border: "border-red-500/40",    abbr: "TPW",  svgColors: { primary: "#ef4444", secondary: "#1c1917", accent: "#f87171" } },
  gcw:         { bg: "bg-blue-500/20",   text: "text-blue-400",   border: "border-blue-500/40",   abbr: "GCW",  svgColors: { primary: "#3b82f6", secondary: "#1c1917", accent: "#60a5fa" } },
  pwx:         { bg: "bg-purple-500/20", text: "text-purple-400", border: "border-purple-500/40", abbr: "PWX",  svgColors: { primary: "#a855f7", secondary: "#1c1917", accent: "#c084fc" } },
  sfpw:        { bg: "bg-rose-500/20",   text: "text-rose-400",   border: "border-rose-500/40",   abbr: "SFPW", svgColors: { primary: "#f43f5e", secondary: "#1c1917", accent: "#fb7185" } },
  ira:         { bg: "bg-zinc-500/20",   text: "text-zinc-300",   border: "border-zinc-500/40",   abbr: "IRA",  svgColors: { primary: "#71717a", secondary: "#1c1917", accent: "#a1a1aa" } },
  nfw:         { bg: "bg-green-500/20",  text: "text-green-400",  border: "border-green-500/40",  abbr: "NFW",  svgColors: { primary: "#22c55e", secondary: "#1c1917", accent: "#4ade80" } },
  ccw:         { bg: "bg-sky-500/20",    text: "text-sky-400",    border: "border-sky-500/40",    abbr: "CCW",  svgColors: { primary: "#0ea5e9", secondary: "#1c1917", accent: "#38bdf8" } },
  apw:         { bg: "bg-orange-500/20", text: "text-orange-400", border: "border-orange-500/40", abbr: "APW",  svgColors: { primary: "#f97316", secondary: "#1c1917", accent: "#fb923c" } },
  luchaglobal: { bg: "bg-yellow-500/20", text: "text-yellow-400", border: "border-yellow-500/40", abbr: "LGF",  svgColors: { primary: "#eab308", secondary: "#1c1917", accent: "#facc15" } },
  nbc:         { bg: "bg-blue-600/20",   text: "text-blue-300",   border: "border-blue-600/40",   abbr: "NBC",  svgColors: { primary: "#2563eb", secondary: "#1c1917", accent: "#60a5fa" } },
  swf:         { bg: "bg-red-600/20",    text: "text-red-300",    border: "border-red-600/40",    abbr: "SWF",  svgColors: { primary: "#dc2626", secondary: "#1c1917", accent: "#f87171" } },
  hww:         { bg: "bg-zinc-700/20",   text: "text-zinc-300",   border: "border-zinc-700/40",   abbr: "HWW",  svgColors: { primary: "#52525b", secondary: "#1c1917", accent: "#a1a1aa" } },
  pwa:         { bg: "bg-teal-500/20",   text: "text-teal-400",   border: "border-teal-500/40",   abbr: "PWA",  svgColors: { primary: "#14b8a6", secondary: "#1c1917", accent: "#2dd4bf" } },
  ewuk:        { bg: "bg-indigo-500/20", text: "text-indigo-400", border: "border-indigo-500/40", abbr: "EWUK", svgColors: { primary: "#6366f1", secondary: "#1c1917", accent: "#818cf8" } },
  sfi:         { bg: "bg-yellow-600/20", text: "text-yellow-400", border: "border-yellow-600/40", abbr: "SFI",  svgColors: { primary: "#ca8a04", secondary: "#1c1917", accent: "#facc15" } },
  bpw:         { bg: "bg-lime-500/20",   text: "text-lime-400",   border: "border-lime-500/40",   abbr: "BPW",  svgColors: { primary: "#84cc16", secondary: "#1c1917", accent: "#a3e635" } },
  rwi:         { bg: "bg-red-400/20",    text: "text-red-300",    border: "border-red-400/40",    abbr: "RWI",  svgColors: { primary: "#f87171", secondary: "#1c1917", accent: "#fca5a5" } },
  wsx:         { bg: "bg-orange-600/20", text: "text-orange-300", border: "border-orange-600/40", abbr: "WSX",  svgColors: { primary: "#ea580c", secondary: "#1c1917", accent: "#fb923c" } },
  fwa:         { bg: "bg-violet-500/20", text: "text-violet-400", border: "border-violet-500/40", abbr: "FWA",  svgColors: { primary: "#8b5cf6", secondary: "#1c1917", accent: "#a78bfa" } },
  llw:         { bg: "bg-amber-700/20",  text: "text-amber-600",  border: "border-amber-700/40",  abbr: "LLW",  svgColors: { primary: "#b45309", secondary: "#1c1917", accent: "#d97706" } },
  cwl:         { bg: "bg-blue-400/20",   text: "text-blue-300",   border: "border-blue-400/40",   abbr: "CWL",  svgColors: { primary: "#60a5fa", secondary: "#1c1917", accent: "#93c5fd" } },
  pwl:         { bg: "bg-red-700/20",    text: "text-red-400",    border: "border-red-700/40",    abbr: "PWL",  svgColors: { primary: "#b91c1c", secondary: "#1c1917", accent: "#f87171" } },
  sgw:         { bg: "bg-green-600/20",  text: "text-green-400",  border: "border-green-600/40",  abbr: "SGW",  svgColors: { primary: "#16a34a", secondary: "#1c1917", accent: "#4ade80" } },
  hlw:         { bg: "bg-yellow-700/20", text: "text-yellow-500", border: "border-yellow-700/40", abbr: "HLW",  svgColors: { primary: "#a16207", secondary: "#1c1917", accent: "#eab308" } },
  underground: { bg: "bg-red-900/20",    text: "text-red-500",    border: "border-red-900/40",    abbr: "UG",   svgColors: { primary: "#7f1d1d", secondary: "#1c1917", accent: "#ef4444" } },
}

export function getOrgColor(orgId: string): OrgColorConfig {
  return ORG_COLORS[orgId] ?? { bg: "bg-zinc-800", text: "text-zinc-400", border: "border-zinc-700", abbr: "???", svgColors: { primary: "#52525b", secondary: "#1c1917", accent: "#a1a1aa" } }
}

function GeneratedLogo({ orgId, size }: { orgId: string; size: "sm" | "md" | "lg" }) {
  const c = getOrgColor(orgId)
  const { primary, secondary, accent } = c.svgColors
  const abbr = c.abbr
  const dim = size === "sm" ? 20 : size === "lg" ? 40 : 28
  const fontSize = abbr.length > 3 ? dim * 0.28 : dim * 0.32

  const shapes: Record<string, React.ReactNode> = {
    awf:         <><circle cx="50" cy="50" r="45" fill={secondary} stroke={primary} strokeWidth="4"/><polygon points="50,15 62,42 90,42 68,58 76,85 50,68 24,85 32,58 10,42 38,42" fill={primary}/></>,
    tpw:         <><circle cx="50" cy="50" r="45" fill={secondary} stroke={primary} strokeWidth="4"/><rect x="20" y="30" width="60" height="8" rx="4" fill={primary}/><rect x="44" y="30" width="12" height="40" rx="4" fill={accent}/></>,
    gcw:         <><circle cx="50" cy="50" r="45" fill={secondary} stroke={primary} strokeWidth="4"/><circle cx="50" cy="50" r="28" fill="none" stroke={primary} strokeWidth="4"/><circle cx="50" cy="50" r="12" fill={primary}/></>,
    pwx:         <><circle cx="50" cy="50" r="45" fill={secondary} stroke={primary} strokeWidth="4"/><line x1="20" y1="20" x2="80" y2="80" stroke={primary} strokeWidth="8" strokeLinecap="round"/><line x1="80" y1="20" x2="20" y2="80" stroke={accent} strokeWidth="8" strokeLinecap="round"/></>,
    sfpw:        <><circle cx="50" cy="50" r="45" fill={secondary} stroke={primary} strokeWidth="4"/><polygon points="50,20 56,38 76,38 60,50 66,68 50,57 34,68 40,50 24,38 44,38" fill={primary}/></>,
    apw:         <><circle cx="50" cy="50" r="45" fill={secondary} stroke={primary} strokeWidth="4"/><polygon points="50,18 58,40 82,40 63,54 70,76 50,62 30,76 37,54 18,40 42,40" fill={primary}/><circle cx="50" cy="50" r="8" fill={accent}/></>,
    underground: <><circle cx="50" cy="50" r="45" fill={secondary} stroke={primary} strokeWidth="4"/><path d="M30,35 L50,20 L70,35 L65,65 L50,75 L35,65 Z" fill={primary} opacity="0.8"/><circle cx="42" cy="45" r="5" fill={accent}/><circle cx="58" cy="45" r="5" fill={accent}/><path d="M40,62 Q50,55 60,62" stroke={accent} strokeWidth="3" fill="none"/></>,
  }

  const defaultShape = (
    <>
      <circle cx="50" cy="50" r="45" fill={secondary} stroke={primary} strokeWidth="5"/>
      <circle cx="50" cy="50" r="30" fill="none" stroke={primary} strokeWidth="3" opacity="0.5"/>
      <text x="50" y="57" textAnchor="middle" fill={primary} fontSize={fontSize * 2.5} fontWeight="900" fontFamily="system-ui,sans-serif">{abbr}</text>
    </>
  )

  return (
    <svg width={dim} height={dim} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      {shapes[orgId] ?? defaultShape}
    </svg>
  )
}

interface OrgBadgeProps { orgId: string; name?: string; size?: "sm" | "md" | "lg" }

export function OrgBadge({ orgId, name, size = "md" }: OrgBadgeProps) {
  const c = getOrgColor(orgId)
  const [useSvg, setUseSvg] = React.useState(false)

  React.useEffect(() => {
    const img = new Image()
    img.onload  = () => setUseSvg(false)
    img.onerror = () => setUseSvg(true)
    img.src = "/logos/" + orgId + ".png"
  }, [orgId])

  const containerSize = size === "sm" ? "w-6 h-6" : size === "lg" ? "w-12 h-12" : "w-8 h-8"

  return (
    <div className="inline-flex items-center gap-2">
      <div className={"rounded-lg border flex items-center justify-center flex-shrink-0 overflow-hidden " + containerSize + " " + c.bg + " " + c.border}>
        {useSvg
          ? <GeneratedLogo orgId={orgId} size={size} />
          : <img src={"/logos/" + orgId + ".png"} onError={() => setUseSvg(true)} className="w-full h-full object-contain" alt={c.abbr} />
        }
      </div>
      {name && <span className={"font-medium " + c.text + " " + (size === "sm" ? "text-xs" : size === "lg" ? "text-base" : "text-sm")}>{name}</span>}
    </div>
  )
}
