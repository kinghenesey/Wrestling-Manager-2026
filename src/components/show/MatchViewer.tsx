import { useState, useEffect, useRef } from "react"
import type { Match, MatchResult } from "@/types/show"
import type { Wrestler } from "@/types/wrestler"
import { getPortraitSrc, getFallbackPortrait } from "@/utils/portraits"

interface MatchEvent {
  minute: number
  type: "move" | "nearfall" | "momentum_shift" | "signature" | "finisher" | "crowd" | "commentary"
  text: string
  actor?: string
}

function generateMatchEvents(
  participants: Wrestler[],
  result: MatchResult,
  isTitle: boolean
): MatchEvent[] {
  const events: MatchEvent[] = []
  const duration = result.matchDurationMinutes
  const winner = participants.find(w => result.winnerIds.includes(w.id))
  const loser  = participants.find(w => !result.winnerIds.includes(w.id))
  if (!winner) return []

  const moves = [
    "lands a hard right hand",
    "executes a crisp suplex",
    "whips opponent into the ropes",
    "hits a running clothesline",
    "drops a sharp elbow",
    "delivers a stiff kick to the midsection",
    "nails a perfect dropkick",
    "slams opponent down hard",
    "catches opponent mid-air into a powerslam",
    "rocks opponent with a forearm strike",
    "applies a headlock for leverage",
    "counters with a quick rollup attempt",
  ]

  const nearfalls = [
    "hooks the leg — ONE! TWO! KICKOUT at 2!",
    "rolls up for the pin — TWO COUNT!",
    "covers — TWO AND A HALF! SO CLOSE!",
    "inside cradle — TWO! The crowd gasps!",
  ]

  const momentumShifts = [
    "blocks the strike and fires back with a flurry!",
    "counters out of nowhere and the crowd erupts!",
    "reverses the whip and takes full control!",
    "ducks under and hits a thunderous backdrop driver!",
  ]

  // Opening
  events.push({ minute: 0, type: "commentary", text: "The bell rings! Both competitors are locked in and ready." })
  events.push({ minute: 1, type: "move", text: participants[0]?.name + " " + moves[0] + ".", actor: participants[0]?.name })
  events.push({ minute: 2, type: "move", text: loser?.name + " " + moves[2] + ".", actor: loser?.name })

  // Early match
  for (let m = 3; m < Math.floor(duration * 0.3); m += 2) {
    const p = participants[Math.floor(Math.random() * participants.length)]
    const move = moves[Math.floor(Math.random() * moves.length)]
    events.push({ minute: m, type: "move", text: p?.name + " " + move + ".", actor: p?.name })
  }

  // Mid match
  const midPoint = Math.floor(duration * 0.5)
  events.push({ minute: midPoint - 2, type: "crowd", text: "The crowd is rising to their feet — the action is intensifying!" })
  events.push({ minute: midPoint, type: "momentum_shift", text: winner?.name + " " + momentumShifts[Math.floor(Math.random() * momentumShifts.length)], actor: winner?.name })

  if (result.matchRating >= 70) {
    events.push({ minute: midPoint + 1, type: "crowd", text: '"THIS IS AWESOME!" chants break out across the building.' })
  }

  // Near falls
  const nearfallMin = Math.floor(duration * 0.65)
  events.push({ minute: nearfallMin, type: "nearfall", text: winner?.name + " " + nearfalls[0], actor: winner?.name })

  if (result.matchRating >= 75) {
    events.push({ minute: nearfallMin + 2, type: "nearfall", text: loser?.name + " " + nearfalls[2], actor: loser?.name })
    events.push({ minute: nearfallMin + 3, type: "crowd", text: "The crowd cannot believe it! What a match!" })
  }

  // Signature
  const sigMin = Math.floor(duration * 0.8)
  events.push({ minute: sigMin, type: "signature", text: winner?.name + " sets up for the " + (winner?.signature ?? "signature move") + "! The crowd erupts!", actor: winner?.name })
  events.push({ minute: sigMin + 1, type: "move", text: winner?.name + " connects with the " + (winner?.signature ?? "signature") + "! Cover attempt!", actor: winner?.name })
  events.push({ minute: sigMin + 1, type: "nearfall", text: "ONE! TWO! " + loser?.name + " gets a shoulder up at the VERY last moment!", actor: loser?.name })

  // Finish
  events.push({ minute: duration - 1, type: "finisher", text: winner?.name + " calls for it — THE " + (winner?.finisher ?? "finisher").toUpperCase() + "!!!", actor: winner?.name })
  events.push({ minute: duration - 1, type: "finisher", text: winner?.name + " HITS IT! This has to be it!", actor: winner?.name })

  const finishLines: Record<string, string> = {
    pinfall:    "ONE! TWO! THREE! The referee calls it! It is OVER!",
    submission: loser?.name + " taps! " + loser?.name + " TAPS OUT! " + winner?.name + " wins by submission!",
    dq:         "The referee has seen enough and calls for the disqualification!",
    count_out:  "The referee reaches TEN! Counted out! The match is over!",
  }
  events.push({ minute: duration, type: "commentary", text: finishLines[result.method] ?? winner?.name + " wins!" })

  if (isTitle) {
    events.push({ minute: duration, type: "crowd", text: "NEW CHAMPION! " + winner?.name + " IS YOUR NEW CHAMPION! The arena is absolutely ELECTRIC!" })
  }

  if (result.matchRating >= 85) {
    events.push({ minute: duration, type: "commentary", text: "What a match. A genuine classic. Rating: " + result.matchRating + "/100." })
  } else if (result.matchRating >= 70) {
    events.push({ minute: duration, type: "commentary", text: "A very solid match tonight. Rating: " + result.matchRating + "/100." })
  } else {
    events.push({ minute: duration, type: "commentary", text: "Match rating: " + result.matchRating + "/100." })
  }

  return events.sort((a, b) => a.minute - b.minute)
}

interface Props {
  match: Match
  participants: Wrestler[]
  result: MatchResult
  isTitle: boolean
  titleName?: string
  onClose: () => void
}

function WrestlerDisplay({ wrestler, isWinner, side }: { wrestler: Wrestler | undefined; isWinner: boolean; side: "left" | "right" }) {
  if (!wrestler) return <div className="w-40" />
  const src = getPortraitSrc(wrestler.portraitId)
  const fallback = getFallbackPortrait(wrestler.gender)
  return (
    <div className={"flex flex-col gap-2 w-40 " + (side === "right" ? "items-end text-right" : "items-start text-left")}>
      <div className={"relative rounded-xl overflow-hidden border-2 transition-all duration-500 " + (isWinner ? "border-amber-500 shadow-lg shadow-amber-500/20" : "border-zinc-700")}>
        <img
          src={src}
          onError={e => { e.currentTarget.src = fallback }}
          className="w-28 h-36 object-top object-cover"
          alt={wrestler.name}
        />
        {isWinner && (
          <div className="absolute inset-0 bg-amber-500/10 flex items-end justify-center pb-2">
            <span className="text-xs font-black text-amber-400 bg-zinc-900/90 px-2 py-0.5 rounded border border-amber-500/40">WINNER</span>
          </div>
        )}
      </div>
      <div>
        <p className="text-sm font-bold text-zinc-100 leading-tight">{wrestler.name}</p>
        <p className="text-xs text-zinc-500">{wrestler.pushLevel}</p>
        <div className="flex items-center gap-1 mt-1">
          <span className="text-xs text-zinc-600">MOM</span>
          <div className="w-16 bg-zinc-800 rounded-full h-1.5">
            <div className="bg-amber-400 h-1.5 rounded-full" style={{ width: wrestler.momentum + "%" }} />
          </div>
        </div>
      </div>
    </div>
  )
}

export function MatchViewer({ match, participants, result, isTitle, titleName, onClose }: Props) {
  const [currentMinute, setCurrentMinute] = useState(0)
  const [visibleEvents, setVisibleEvents] = useState<MatchEvent[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [speed, setSpeed] = useState<1 | 2 | 4>(1)
  const feedRef = useRef<HTMLDivElement>(null)

  const events = generateMatchEvents(participants, result, isTitle)
  const duration = result.matchDurationMinutes
  const winner = participants.find(w => result.winnerIds.includes(w.id))
  const home = participants[0]
  const away = participants[1] ?? participants[0]
  const homeWins = winner?.id === home?.id

  useEffect(() => {
    if (!isRunning || isComplete) return
    const interval = setInterval(() => {
      setCurrentMinute(prev => {
        const next = prev + 1
        const newEvs = events.filter(e => e.minute === next)
        if (newEvs.length > 0) {
          setVisibleEvents(ve => [...ve, ...newEvs])
          setTimeout(() => {
            feedRef.current?.scrollTo({ top: feedRef.current.scrollHeight, behavior: "smooth" })
          }, 50)
        }
        if (next >= duration) {
          setIsComplete(true)
          setIsRunning(false)
        }
        return next
      })
    }, 1000 / speed)
    return () => clearInterval(interval)
  }, [isRunning, isComplete, speed, duration])

  function skipToEnd() {
    setVisibleEvents(events)
    setCurrentMinute(duration)
    setIsComplete(true)
    setIsRunning(false)
    setTimeout(() => { feedRef.current?.scrollTo({ top: feedRef.current.scrollHeight, behavior: "smooth" }) }, 100)
  }

  const progressPct = Math.min(100, (currentMinute / duration) * 100)

  const EVENT_STYLES: Record<string, string> = {
    move:             "text-zinc-300",
    nearfall:         "text-amber-300 font-semibold",
    momentum_shift:   "text-blue-300 font-semibold",
    signature:        "text-purple-300 font-semibold",
    finisher:         "text-red-300 font-bold",
    crowd:            "text-green-400 italic",
    commentary:       "text-zinc-500 italic",
  }

  const EVENT_ICONS: Record<string, string> = {
    move: "·", nearfall: "!", momentum_shift: "↑",
    signature: "★", finisher: "⚡", crowd: "♟", commentary: "🎙",
  }

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl">

        {/* Header */}
        <div className="bg-zinc-950 px-5 py-3 border-b border-zinc-800 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
              {match.matchType.replace(/_/g, " ")}
              {match.stipulation !== "none" ? " · " + match.stipulation.replace(/_/g, " ") : ""}
              {match.isMainEvent ? " · MAIN EVENT" : ""}
            </p>
            {isTitle && titleName && <p className="text-xs text-amber-400 mt-0.5">{titleName} on the line</p>}
          </div>
          <div className="text-sm font-mono text-zinc-400">
            {String(currentMinute).padStart(2, "0")}:{String(0).padStart(2, "0")} / {String(duration).padStart(2, "0")}:00
          </div>
        </div>

        {/* Wrestlers vs display */}
        <div className="px-5 py-4">
          <div className="flex items-center justify-between">
            <WrestlerDisplay wrestler={home} isWinner={homeWins && isComplete} side="left" />
            <div className="flex flex-col items-center gap-2 px-3">
              <span className="text-3xl font-black text-zinc-700">VS</span>
              {isComplete && winner && (
                <div className="text-center animate-pulse">
                  <p className="text-xs font-black text-amber-400">{winner.name}</p>
                  <p className="text-xs text-zinc-500">wins via {result.method}</p>
                </div>
              )}
            </div>
            <WrestlerDisplay wrestler={away} isWinner={!homeWins && isComplete} side="right" />
          </div>

          {/* Progress */}
          <div className="mt-3 space-y-1">
            <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
              <div
                className={"h-2 rounded-full transition-all duration-1000 " + (isComplete ? "bg-amber-500" : "bg-blue-500")}
                style={{ width: progressPct + "%" }}
              />
            </div>
            <div className="flex justify-between text-xs text-zinc-700">
              <span>Start</span>
              <span>Finish ({duration} min)</span>
            </div>
          </div>
        </div>

        {/* Commentary feed */}
        <div
          ref={feedRef}
          className="mx-4 mb-3 bg-zinc-950 rounded-xl h-52 overflow-y-auto p-3 space-y-1.5 border border-zinc-800"
        >
          {visibleEvents.length === 0 && !isRunning && (
            <div className="flex items-center justify-center h-full">
              <p className="text-xs text-zinc-600">Press Play to watch the match</p>
            </div>
          )}
          {visibleEvents.map((ev, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="text-zinc-700 text-xs w-7 flex-shrink-0 font-mono mt-0.5">{String(ev.minute).padStart(2, "0")}&apos;</span>
              <span className="text-zinc-600 flex-shrink-0 w-3">{EVENT_ICONS[ev.type] ?? "·"}</span>
              <span className={"text-xs leading-relaxed " + (EVENT_STYLES[ev.type] ?? "text-zinc-300")}>
                {ev.text}
              </span>
            </div>
          ))}
          {isRunning && (
            <div className="flex items-center gap-2 text-xs text-zinc-700 pt-1">
              <span className="animate-pulse">●</span>
              <span>Live</span>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="px-4 pb-4 space-y-3">
          {isComplete ? (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-zinc-800 rounded-lg p-2">
                  <p className={"text-xl font-black " + (result.matchRating >= 70 ? "text-green-400" : result.matchRating >= 50 ? "text-amber-400" : "text-red-400")}>
                    {result.matchRating}
                  </p>
                  <p className="text-xs text-zinc-500">Rating</p>
                </div>
                <div className="bg-zinc-800 rounded-lg p-2">
                  <p className="text-xl font-black text-blue-400">{result.crowdRating}</p>
                  <p className="text-xs text-zinc-500">Crowd</p>
                </div>
                <div className="bg-zinc-800 rounded-lg p-2">
                  <p className="text-xl font-black text-purple-400">{result.matchDurationMinutes}m</p>
                  <p className="text-xs text-zinc-500">Duration</p>
                </div>
              </div>
              <button onClick={onClose} className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold rounded-lg transition-colors">
                Continue
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsRunning(!isRunning)}
                className={"flex-1 py-2.5 rounded-lg font-bold text-sm transition-colors " + (isRunning ? "bg-zinc-700 hover:bg-zinc-600 text-zinc-300" : "bg-amber-500 hover:bg-amber-600 text-zinc-950")}
              >
                {isRunning ? "⏸ Pause" : "▶ Play"}
              </button>
              <div className="flex items-center bg-zinc-800 rounded-lg p-1 gap-0.5">
                {([1, 2, 4] as const).map(s => (
                  <button
                    key={s}
                    onClick={() => setSpeed(s)}
                    className={"px-3 py-1.5 rounded text-xs font-bold transition-colors " + (speed === s ? "bg-zinc-600 text-zinc-100" : "text-zinc-500 hover:text-zinc-300")}
                  >
                    {s}x
                  </button>
                ))}
              </div>
              <button
                onClick={skipToEnd}
                className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 rounded-lg text-xs font-medium transition-colors"
              >
                Skip
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}