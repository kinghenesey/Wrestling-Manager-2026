import React from "react"

export const ORG_COLORS: Record<string, { bg: string; text: string; border: string; abbr: string }> = {
  awf:         { bg: "bg-amber-500/20",  text: "text-amber-400",  border: "border-amber-500/40",  abbr: "AWF"  },
  tpw:         { bg: "bg-red-500/20",    text: "text-red-400",    border: "border-red-500/40",    abbr: "TPW"  },
  gcw:         { bg: "bg-blue-500/20",   text: "text-blue-400",   border: "border-blue-500/40",   abbr: "GCW"  },
  pwx:         { bg: "bg-purple-500/20", text: "text-purple-400", border: "border-purple-500/40", abbr: "PWX"  },
  sfpw:        { bg: "bg-rose-500/20",   text: "text-rose-400",   border: "border-rose-500/40",   abbr: "SFPW" },
  ira:         { bg: "bg-zinc-500/20",   text: "text-zinc-300",   border: "border-zinc-500/40",   abbr: "IRA"  },
  nfw:         { bg: "bg-green-500/20",  text: "text-green-400",  border: "border-green-500/40",  abbr: "NFW"  },
  ccw:         { bg: "bg-sky-500/20",    text: "text-sky-400",    border: "border-sky-500/40",    abbr: "CCW"  },
  apw:         { bg: "bg-orange-500/20", text: "text-orange-400", border: "border-orange-500/40", abbr: "APW"  },
  luchaglobal: { bg: "bg-yellow-500/20", text: "text-yellow-400", border: "border-yellow-500/40", abbr: "LGF"  },
  nbc:         { bg: "bg-blue-600/20",   text: "text-blue-300",   border: "border-blue-600/40",   abbr: "NBC"  },
  swf:         { bg: "bg-red-600/20",    text: "text-red-300",    border: "border-red-600/40",    abbr: "SWF"  },
  hww:         { bg: "bg-zinc-700/20",   text: "text-zinc-300",   border: "border-zinc-700/40",   abbr: "HWW"  },
  pwa:         { bg: "bg-teal-500/20",   text: "text-teal-400",   border: "border-teal-500/40",   abbr: "PWA"  },
  ewuk:        { bg: "bg-indigo-500/20", text: "text-indigo-400", border: "border-indigo-500/40", abbr: "EWUK" },
  sfi:         { bg: "bg-yellow-600/20", text: "text-yellow-400", border: "border-yellow-600/40", abbr: "SFI"  },
  bpw:         { bg: "bg-lime-500/20",   text: "text-lime-400",   border: "border-lime-500/40",   abbr: "BPW"  },
  rwi:         { bg: "bg-red-400/20",    text: "text-red-300",    border: "border-red-400/40",    abbr: "RWI"  },
  wsx:         { bg: "bg-orange-600/20", text: "text-orange-300", border: "border-orange-600/40", abbr: "WSX"  },
  fwa:         { bg: "bg-violet-500/20", text: "text-violet-400", border: "border-violet-500/40", abbr: "FWA"  },
  llw:         { bg: "bg-amber-700/20",  text: "text-amber-600",  border: "border-amber-700/40",  abbr: "LLW"  },
  cwl:         { bg: "bg-blue-400/20",   text: "text-blue-300",   border: "border-blue-400/40",   abbr: "CWL"  },
  pwl:         { bg: "bg-red-700/20",    text: "text-red-400",    border: "border-red-700/40",    abbr: "PWL"  },
  sgw:         { bg: "bg-green-600/20",  text: "text-green-400",  border: "border-green-600/40",  abbr: "SGW"  },
  hlw:         { bg: "bg-yellow-700/20", text: "text-yellow-500", border: "border-yellow-700/40", abbr: "HLW"  },
  underground: { bg: "bg-red-900/20",    text: "text-red-500",    border: "border-red-900/40",    abbr: "UG"   },
}

export function getOrgColor(orgId: string) {
  return ORG_COLORS[orgId] ?? { bg: "bg-zinc-800", text: "text-zinc-400", border: "border-zinc-700", abbr: "???" }
}

interface OrgBadgeProps { orgId: string; name?: string; size?: "sm" | "md" | "lg" }

export function OrgBadge({ orgId, name, size = "md" }: OrgBadgeProps) {
  const c = getOrgColor(orgId)
  const logoPath = "/logos/" + orgId + ".png"
  const sizeClass = size === "sm" ? "w-5 h-5 text-xs" : size === "lg" ? "w-10 h-10 text-base" : "w-7 h-7 text-xs"

  return (
    <div className={"inline-flex items-center gap-2"}>
      <div className={"rounded-md border flex items-center justify-center font-black flex-shrink-0 " + sizeClass + " " + c.bg + " " + c.border}>
        <OrgLogo orgId={orgId} abbr={c.abbr} textColor={c.text} size={size} />
      </div>
      {name && <span className={"font-medium " + c.text + " " + (size === "sm" ? "text-xs" : size === "lg" ? "text-base" : "text-sm")}>{name}</span>}
    </div>
  )
}

function OrgLogo({ orgId, abbr, textColor, size }: { orgId: string; abbr: string; textColor: string; size: string }) {
  const [hasLogo, setHasLogo] = React.useState(true)
  const imgSize = size === "sm" ? "w-4 h-4" : size === "lg" ? "w-8 h-8" : "w-5 h-5"

  if (hasLogo) {
    return (
      <img
        src={"/logos/" + orgId + ".png"}
        onError={() => setHasLogo(false)}
        className={imgSize + " object-contain"}
        alt={abbr}
      />
    )
  }
  return <span className={"font-black " + textColor + " " + (size === "lg" ? "text-xs" : "text-[10px]")}>{abbr}</span>
}
