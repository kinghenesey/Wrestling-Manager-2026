import { useState } from "react"
import { OrgBadge } from "@/utils/orgColors"
import { useGameStore } from "@/store/useGameStore"
import { useNavigate } from "react-router-dom"
import { useRosterStore } from "@/store/useRosterStore"
import { getStarterRoster } from "@/data/wrestlers"

const STARTER_ORGS = [
  { id: "llw", name: "Local Legacy Wrestling", region: "Midwest", prestige: 8,  budget: 5000,  description: "A small community promotion with loyal local fans. Perfect starting ground." },
  { id: "cwl", name: "Community Wrestling League", region: "Southeast", prestige: 6, budget: 4500, description: "Grassroots wrestling with a tight-knit fanbase. Hungry talent everywhere." },
  { id: "pwl", name: "Pro Wrestling Local", region: "Northeast", prestige: 7, budget: 4800, description: "Northeast indie scene. Technically gifted roster, low resources." },
  { id: "sgw", name: "Small Gym Wrestling", region: "West Coast", prestige: 5, budget: 4000, description: "Bare bones. No TV. No budget. Just you, a ring, and ambition." },
  { id: "hlw", name: "Hometown Legends Wrestling", region: "Texas", prestige: 9, budget: 5500, description: "Texas wrestling royalty at the local level. Passionate crowd, small market." },
]

const GAME_STYLES = [
  { id: "simulation", label: "Full Simulation", desc: "Everything is simulated. AI books other orgs. Realistic economy." },
  { id: "story",      label: "Story Mode",      desc: "Focus on your storylines. Lighter simulation on other orgs." },
  { id: "sandbox",    label: "Sandbox",          desc: "No reputation gates. Start anywhere. Unlimited budget." },
]

export function NewGame() {
  const { updatePlayer, setGame, game } = useGameStore()
  const navigate = useNavigate()

  const [step, setStep] = useState<"manager" | "org" | "style" | "confirm">("manager")
  const [managerName, setManagerName] = useState("")
  const [selectedOrg, setSelectedOrg] = useState(STARTER_ORGS[0])
  const [gameStyle, setGameStyle] = useState(GAME_STYLES[0])
  const [orgAlias, setOrgAlias] = useState("")

  function handleStart() {
    const starterWrestlers = getStarterRoster(selectedOrg.id)
    useRosterStore.setState((s) => ({
      wrestlers: [
        ...s.wrestlers.filter((w) => w.currentOrgId !== selectedOrg.id),
        ...starterWrestlers,
      ]
    }))
    updatePlayer({
      name: managerName || "The Booker",
      currentOrgId: selectedOrg.id,
    })
    navigate("/dashboard")
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl space-y-6">

        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-10 h-10 bg-amber-400 rounded-lg flex items-center justify-center">
              <span className="text-zinc-950 font-black text-lg">W</span>
            </div>
            <span className="text-2xl font-black text-amber-400 tracking-wider">WRESTLING MANAGER 26</span>
          </div>
          <p className="text-zinc-500 text-sm">Your journey from local booker to legendary promoter starts here.</p>
        </div>

        <div className="flex items-center justify-between mb-2">
          {["manager","org","style","confirm"].map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={"w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold " + (step === s ? "bg-amber-400 text-zinc-950" : ["manager","org","style","confirm"].indexOf(step) > i ? "bg-zinc-700 text-zinc-300" : "bg-zinc-800 text-zinc-600")}>
                {i + 1}
              </div>
              {i < 3 && <div className={"flex-1 h-px w-16 " + (["manager","org","style","confirm"].indexOf(step) > i ? "bg-zinc-600" : "bg-zinc-800")} />}
            </div>
          ))}
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-5">

          {step === "manager" && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-zinc-100">Create Your Manager</h2>
              <p className="text-sm text-zinc-500">You are the booker. The strategist. The one who builds champions.</p>
              <div className="space-y-2">
                <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Manager Name</label>
                <input
                  value={managerName}
                  onChange={(e) => setManagerName(e.target.value)}
                  placeholder="Enter your name..."
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 text-zinc-100 rounded-lg text-sm focus:outline-none focus:border-amber-500"
                  maxLength={30}
                />
              </div>
              <div className="bg-zinc-800/50 rounded-lg p-4 space-y-2">
                <p className="text-xs font-medium text-zinc-400">Starting Reputation: <span className="text-amber-400">Unknown</span></p>
                <p className="text-xs text-zinc-500">You start with zero reputation. Every decision you make builds toward becoming a legend. Elite orgs will not even take your calls — yet.</p>
              </div>
              <button
                onClick={() => setStep("org")}
                className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold rounded-lg transition-colors"
              >
                Continue
              </button>
            </div>
          )}

          {step === "org" && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-zinc-100">Choose Your Starting Org</h2>
              <p className="text-sm text-zinc-500">All Tier 5 local promotions. Your job: build it from nothing.</p>
              <div className="space-y-2">
                {STARTER_ORGS.map((org) => (
                  <div
                    key={org.id}
                    onClick={() => setSelectedOrg(org)}
                    className={"p-4 rounded-lg border cursor-pointer transition-colors " + (selectedOrg.id === org.id ? "border-amber-500 bg-amber-500/10" : "border-zinc-700 bg-zinc-800/50 hover:border-zinc-600")}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <OrgBadge orgId={org.id} name={org.name} size="sm" />
                        <p className="text-xs text-zinc-500 mt-0.5">{org.region} · Prestige {org.prestige}/100 · Budget ${org.budget.toLocaleString()}/wk</p>
                        <p className="text-xs text-zinc-400 mt-1">{org.description}</p>
                      </div>
                      {selectedOrg.id === org.id && (
                        <span className="text-amber-400 text-lg ml-3">&#10003;</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Custom Show Name (optional)</label>
                <input
                  value={orgAlias}
                  onChange={(e) => setOrgAlias(e.target.value)}
                  placeholder={"e.g. " + selectedOrg.name + " Monday Night..."}
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 text-zinc-100 rounded-lg text-sm focus:outline-none focus:border-amber-500"
                  maxLength={40}
                />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep("manager")} className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium rounded-lg transition-colors">Back</button>
                <button onClick={() => setStep("style")} className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold rounded-lg transition-colors">Continue</button>
              </div>
            </div>
          )}

          {step === "style" && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-zinc-100">Game Style</h2>
              <p className="text-sm text-zinc-500">How do you want to play?</p>
              <div className="space-y-2">
                {GAME_STYLES.map((style) => (
                  <div
                    key={style.id}
                    onClick={() => setGameStyle(style)}
                    className={"p-4 rounded-lg border cursor-pointer transition-colors " + (gameStyle.id === style.id ? "border-amber-500 bg-amber-500/10" : "border-zinc-700 bg-zinc-800/50 hover:border-zinc-600")}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-bold text-zinc-100">{style.label}</p>
                        <p className="text-xs text-zinc-400 mt-0.5">{style.desc}</p>
                      </div>
                      {gameStyle.id === style.id && <span className="text-amber-400 text-lg ml-3">&#10003;</span>}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep("org")} className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium rounded-lg transition-colors">Back</button>
                <button onClick={() => setStep("confirm")} className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold rounded-lg transition-colors">Continue</button>
              </div>
            </div>
          )}

          {step === "confirm" && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-zinc-100">Ready to Begin</h2>
              <div className="bg-zinc-800/50 rounded-lg p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Manager</span>
                  <span className="text-zinc-100 font-medium">{managerName || "The Booker"}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Starting Org</span>
                  <span className="text-zinc-100 font-medium">{selectedOrg.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Region</span>
                  <span className="text-zinc-100 font-medium">{selectedOrg.region}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Weekly Budget</span>
                  <span className="text-amber-400 font-medium">${selectedOrg.budget.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Game Style</span>
                  <span className="text-zinc-100 font-medium">{gameStyle.label}</span>
                </div>
              </div>
              <p className="text-xs text-zinc-600 text-center">Your reputation is unknown. Every org above Tier 5 is out of reach — for now. Build your legacy one show at a time.</p>
              <div className="flex gap-3">
                <button onClick={() => setStep("style")} className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium rounded-lg transition-colors">Back</button>
                <button onClick={handleStart} className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold rounded-lg transition-colors text-lg">
                  Start Career
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

