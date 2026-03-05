/**
 * Human Confidence Score (HCS) — 0 to 100.
 * Exact port from the Veriphid extension — weights and ceilings must stay in sync.
 */

const MAX_JITTER_VAR = 5_000
const MAX_DWELL_VAR  = 500
const MAX_FLIGHT_VAR = 8_000

const W_VARIANCE   = 1.0
const W_DIRECT     = 1.5
const W_CUMULATIVE = 0.5

function normalise(variance: number, max: number): number {
  return Math.min(100, (variance / max) * 100)
}

export interface SignalScores {
  jitterVariance:   number
  dwellVariance:    number
  flightVariance:   number
  burstScore:       number
  correctionScore:  number
  pasteScore:       number
  velocityScore:    number
  compositionScore: number
}

export function computeHCS(signals: Partial<SignalScores>): number {
  let weightedSum = 0
  let totalWeight = 0

  function add(score: number | undefined, weight: number) {
    if (!score || score <= 0) return
    weightedSum += score * weight
    totalWeight += weight
  }

  add(normalise(signals.jitterVariance ?? 0, MAX_JITTER_VAR), W_VARIANCE)
  add(normalise(signals.dwellVariance  ?? 0, MAX_DWELL_VAR),  W_VARIANCE)
  add(normalise(signals.flightVariance ?? 0, MAX_FLIGHT_VAR), W_VARIANCE)
  add(signals.velocityScore,    W_DIRECT)
  add(signals.compositionScore, W_DIRECT)
  add(signals.burstScore,       W_CUMULATIVE)
  add(signals.correctionScore,  W_CUMULATIVE)
  add(signals.pasteScore,       W_CUMULATIVE)

  if (totalWeight === 0) return 50
  return Math.round(weightedSum / totalWeight)
}

export type HCSLabel = "Generated" | "Boosted" | "Blended" | "Handmade" | "Organic"

export function hcsLabel(hcs: number): HCSLabel {
  if (hcs < 20) return "Generated"
  if (hcs < 40) return "Boosted"
  if (hcs < 60) return "Blended"
  if (hcs < 80) return "Handmade"
  return "Organic"
}

export const HCS_TIER_COLORS: Record<HCSLabel, string> = {
  Generated: "#ef4444",
  Boosted:   "#f97316",
  Blended:   "#f59e0b",
  Handmade:  "#22c55e",
  Organic:   "#10b981",
}
