import type { Wrestler } from "@/types/wrestler"
import type { Match, MatchResult } from "@/types/show"

export interface CommentaryLine {
  type: "play_by_play" | "color" | "crowd" | "hype" | "result"
  text: string
  timestamp: number  // match minute
}

const COMMENTATOR_A = "Mike Castello"  // play by play
const COMMENTATOR_B = "Jake Donovan"   // color

// ── Opening Lines ──────────────────────────────────────────────────────────
function getOpeningLines(participants: Wrestler[], isMainEvent: boolean): CommentaryLine[] {
  const lines: CommentaryLine[] = []

  if (isMainEvent) {
    lines.push({ type: "hype", text: `${COMMENTATOR_A}: "And now, the moment we have all been waiting for — the MAIN EVENT of the evening!"`, timestamp: 0 })
    lines.push({ type: "color", text: `${COMMENTATOR_B}: "The electricity in this building right now is absolutely incredible. You can feel it."`, timestamp: 0 })
  } else {
    lines.push({ type: "play_by_play", text: `${COMMENTATOR_A}: "And here we go, folks. Both competitors making their way to the ring now."`, timestamp: 0 })
  }

  participants.forEach(w => {
    if (w.momentum >= 80) {
      lines.push({ type: "color", text: `${COMMENTATOR_B}: "${w.name} has been on an absolute tear lately. The momentum is real — you can see it in their eyes."`, timestamp: 0 })
    }
    if (w.pushLevel === "champion") {
      lines.push({ type: "hype", text: `${COMMENTATOR_A}: "The champion ${w.name} entering to that iconic music now. What a presence."`, timestamp: 0 })
    }
    if (w.isRookie) {
      lines.push({ type: "color", text: `${COMMENTATOR_B}: "Keep your eyes on ${w.name} — still green, but the potential is undeniable. One to watch."`, timestamp: 0 })
    }
  })

  return lines
}

// ── Mid Match Lines ────────────────────────────────────────────────────────
function getMidMatchLines(participants: Wrestler[], matchRating: number, minute: number): CommentaryLine[] {
  const lines: CommentaryLine[] = []
  const names = participants.map(w => w.name)

  const midMatchLines = [
    `${COMMENTATOR_A}: "Back and forth action here, neither competitor willing to give an inch!"`,
    `${COMMENTATOR_B}: "The technical wrestling on display here is absolutely textbook. Beautiful to watch."`,
    `${COMMENTATOR_A}: "The crowd is getting behind ${names[Math.floor(Math.random() * names.length)]} now!"`,
    `${COMMENTATOR_B}: "You have to wonder how much both of these competitors have left in the tank."`,
    `${COMMENTATOR_A}: "A near fall there! The crowd thought that was it!"`,
    `${COMMENTATOR_B}: "The ring awareness of ${names[0]} is on another level tonight."`,
    `${COMMENTATOR_A}: "Listen to this crowd! They are absolutely electric right now!"`,
    `${COMMENTATOR_B}: "Championship caliber action right here. No question about it."`,
  ]

  if (matchRating >= 75) {
    lines.push({ type: "color", text: `${COMMENTATOR_B}: "This is what professional wrestling is all about, folks. Pure magic."`, timestamp: minute })
    lines.push({ type: "crowd", text: `*The crowd erupts as both competitors trade massive strikes*`, timestamp: minute })
  }

  if (matchRating >= 85) {
    lines.push({ type: "hype", text: `${COMMENTATOR_A}: "WE ARE WITNESSING SOMETHING SPECIAL TONIGHT! What a match this has become!"`, timestamp: minute })
  }

  lines.push({ type: "play_by_play", text: midMatchLines[Math.floor(Math.random() * midMatchLines.length)], timestamp: minute })

  return lines
}

// ── Crowd Reactions ────────────────────────────────────────────────────────
function getCrowdLines(crowdRating: number, wrestler: Wrestler): CommentaryLine[] {
  if (crowdRating >= 85) {
    return [
      { type: "crowd", text: `*"${wrestler.name.toUpperCase()}!" chants break out across the arena*`, timestamp: 0 },
      { type: "color", text: `${COMMENTATOR_B}: "Listen to that! The crowd absolutely LOVES ${wrestler.name}!"`, timestamp: 0 },
    ]
  }
  if (crowdRating >= 70) {
    return [{ type: "crowd", text: `*Loud crowd reaction as ${wrestler.name} gains momentum*`, timestamp: 0 }]
  }
  if (wrestler.alignment === "heel" && crowdRating >= 60) {
    return [{ type: "crowd", text: `*Cascade of boos raining down on ${wrestler.name}*`, timestamp: 0 }]
  }
  return []
}

// ── Finish Lines ───────────────────────────────────────────────────────────
function getFinishLines(result: MatchResult, winner: Wrestler | undefined, loser: Wrestler | undefined, isTitle: boolean): CommentaryLine[] {
  const lines: CommentaryLine[] = []

  if (!winner) return [{ type: "result", text: `${COMMENTATOR_A}: "We have seen a no contest here tonight folks."`, timestamp: 0 }]

  const finishDescriptions: Record<string, string> = {
    pinfall:    `drives ${loser?.name ?? "their opponent"} into the mat and hooks the leg — ONE, TWO, THREE!`,
    submission: `locks in the ${winner.finisher} and ${loser?.name ?? "their opponent"} has NO CHOICE but to tap out!`,
    dq:         `and this one is thrown out! The referee has seen enough and calls for the bell!`,
    count_out:  `and ${loser?.name ?? "their opponent"} cannot beat the referee count! They are counted out!`,
  }

  const desc = finishDescriptions[result.method] ?? "and scores the victory!"

  lines.push({ type: "hype", text: `${COMMENTATOR_A}: "${winner.name} ${desc}"`, timestamp: result.matchDurationMinutes })
  lines.push({ type: "result", text: `${COMMENTATOR_B}: "What a performance from ${winner.name} tonight. Absolutely dominant."`, timestamp: result.matchDurationMinutes })

  if (isTitle && result.method !== "dq" && result.method !== "count_out") {
    lines.push({ type: "hype", text: `${COMMENTATOR_A}: "NEW CHAMPION! WE HAVE A NEW CHAMPION! ${winner.name} HAS DONE IT!"`, timestamp: result.matchDurationMinutes })
    lines.push({ type: "crowd", text: `*The arena EXPLODES as ${winner.name} is handed the championship*`, timestamp: result.matchDurationMinutes })
  }

  if (result.matchRating >= 80) {
    lines.push({ type: "color", text: `${COMMENTATOR_B}: "I have called a lot of matches in my career, but what we just witnessed here tonight was truly something special."`, timestamp: result.matchDurationMinutes })
  }

  if (result.matchRating < 50) {
    lines.push({ type: "color", text: `${COMMENTATOR_B}: "Well... that was certainly a match that happened. We move on."`, timestamp: result.matchDurationMinutes })
  }

  return lines
}

// ── Main Commentary Generator ─────────────────────────────────────────────
export function generateMatchCommentary(
  match: Match,
  participants: Wrestler[],
  result: MatchResult,
  isTitle: boolean
): CommentaryLine[] {
  const lines: CommentaryLine[] = []
  const winner = participants.find(w => result.winnerIds.includes(w.id))
  const losers = participants.filter(w => !result.winnerIds.includes(w.id))
  const loser  = losers[0]

  // Opening
  lines.push(...getOpeningLines(participants, match.isMainEvent))

  // Early match
  const earlyMin = Math.floor(result.matchDurationMinutes * 0.25)
  lines.push({ type: "play_by_play", text: `${COMMENTATOR_A}: "And we are underway! Both competitors feeling each other out in the early going."`, timestamp: earlyMin })

  // Mid match
  const midMin = Math.floor(result.matchDurationMinutes * 0.5)
  lines.push(...getMidMatchLines(participants, result.matchRating, midMin))

  // Crowd reaction
  if (winner) lines.push(...getCrowdLines(result.crowdRating, winner))

  // Late match
  const lateMin = Math.floor(result.matchDurationMinutes * 0.8)
  if (result.matchRating >= 70) {
    lines.push({ type: "hype", text: `${COMMENTATOR_A}: "We are in the closing stages now and BOTH of these competitors have given absolutely everything!"`, timestamp: lateMin })
  }

  // Finish
  lines.push(...getFinishLines(result, winner, loser, isTitle))

  return lines
}

// ── Show Intro Commentary ──────────────────────────────────────────────────
export function generateShowIntro(showName: string, attendance: number, orgName: string): CommentaryLine[] {
  return [
    { type: "hype", text: `${COMMENTATOR_A}: "HELLO EVERYBODY and welcome to ${showName}! I am ${COMMENTATOR_A} alongside my broadcast partner ${COMMENTATOR_B} and WE ARE LIVE!"`, timestamp: 0 },
    { type: "color", text: `${COMMENTATOR_B}: "What a night we have in store. ${attendance.toLocaleString()} fans packed into this arena tonight for ${orgName} action!"`, timestamp: 0 },
    { type: "play_by_play", text: `${COMMENTATOR_A}: "We have an incredible card lined up tonight. Let us not waste another second — let us get to the action!"`, timestamp: 0 },
  ]
}

// ── Segment Commentary ─────────────────────────────────────────────────────
export function generatePromoCommentary(wrestler: Wrestler, rating: number): CommentaryLine[] {
  const lines: CommentaryLine[] = []

  lines.push({ type: "play_by_play", text: `${COMMENTATOR_A}: "${wrestler.name} has taken the microphone now. The crowd hanging on every word."`, timestamp: 0 })

  if (rating >= 80) {
    lines.push({ type: "color", text: `${COMMENTATOR_B}: "Now THAT is how you cut a promo. ${wrestler.name} just set this building on fire with their words."`, timestamp: 0 })
    lines.push({ type: "crowd", text: `*Massive crowd reaction to every line ${wrestler.name} delivers*`, timestamp: 0 })
  } else if (rating >= 65) {
    lines.push({ type: "color", text: `${COMMENTATOR_B}: "Solid mic work from ${wrestler.name}. Getting the message across effectively."`, timestamp: 0 })
  } else if (rating < 45) {
    lines.push({ type: "color", text: `${COMMENTATOR_B}: "Well... ${wrestler.name} is certainly trying up there. The crowd is... patient."`, timestamp: 0 })
  }

  return lines
}
