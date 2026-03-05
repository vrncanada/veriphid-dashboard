import { redirect } from "next/navigation"
import { createServerSupabaseClient } from "@/lib/supabase-server"
import { computeHCS } from "@/lib/hcs"
import { AnalyticsCharts } from "./AnalyticsCharts"
import type { C2PAAction } from "@/lib/supabase"

// ---------------------------------------------------------------------------
// Types for processed analytics data
// ---------------------------------------------------------------------------

export interface SessionSummary {
  sessionId:    string
  startedAt:    string
  actionCount:  number
  avgHcs:       number
  influxCount:  number
  aiTools:      string[]
  activityCounts: { composing: number; refining: number; influx: number }
}

export interface HCSPoint {
  time:  number   // unix ms
  label: string   // ISO date
  hcs:   number
}

export interface ActivitySlice {
  name:  string
  value: number
  color: string
}

export interface AIToolBar {
  name:  string
  count: number
}

export interface SensorPoint {
  label:        string  // date string
  dwell:        number
  flight:       number
  burst:        number
  correction:   number
  composition:  number
  paste:        number
  velocity:     number
}

export interface AnalyticsData {
  hcsTrend:          HCSPoint[]
  activityBreakdown: ActivitySlice[]
  aiTools:           AIToolBar[]
  sensorTrend:       SensorPoint[]
  sessions:          SessionSummary[]
  stats: {
    totalSessions:   number
    avgHcs:          number
    totalInflux:     number
    topAITool:       string
    writingDays:     number
  }
}

// ---------------------------------------------------------------------------
// Data processing helpers
// ---------------------------------------------------------------------------

function processActions(actions: C2PAAction[]): {
  hcsHistory:     HCSPoint[]
  activityCounts: { composing: number; refining: number; influx: number }
  aiTools:        string[]
  avgHcs:         number
} {
  const hcsHistory: HCSPoint[] = []
  const activityCounts = { composing: 0, refining: 0, influx: 0 }
  const aiToolsSet = new Set<string>()

  for (const a of actions) {
    const m = a.parameters?.entropyMetadata ?? {}
    const hcs = computeHCS({
      dwellVariance:    m.dwellVariance,
      flightVariance:   m.flightVariance,
      burstScore:       m.burstScore,
      correctionScore:  m.correctionScore,
      pasteScore:       m.pasteScore,
      velocityScore:    m.velocityScore,
      compositionScore: m.compositionScore,
    })
    hcsHistory.push({ time: new Date(a.when).getTime(), label: a.when.slice(0, 10), hcs })

    const state = a.parameters?.activityState
    if (state === 0) activityCounts.composing++
    else if (state === 1) activityCounts.refining++
    else if (state === 2) {
      activityCounts.influx++
      if (a.softwareAgent?.name && a.softwareAgent.name !== "Veriphid") {
        aiToolsSet.add(a.softwareAgent.name)
      }
    }
  }

  const avgHcs = hcsHistory.length > 0
    ? Math.round(hcsHistory.reduce((s, h) => s + h.hcs, 0) / hcsHistory.length)
    : 50

  return { hcsHistory, activityCounts, aiTools: [...aiToolsSet], avgHcs }
}

function buildAnalytics(manifests: { session_id: string; started_at: string; action_count: number; actions: C2PAAction[] }[]): AnalyticsData {
  const sessions: SessionSummary[] = []
  const allHcsPoints: HCSPoint[] = []
  const globalActivity = { composing: 0, refining: 0, influx: 0 }
  const aiToolCounts: Record<string, number> = {}
  const sensorByDay: Record<string, { dwell: number[]; flight: number[]; burst: number[]; correction: number[]; composition: number[]; paste: number[]; velocity: number[] }> = {}
  const writingDaySet = new Set<string>()

  for (const m of manifests) {
    const actions = m.actions ?? []
    const { hcsHistory, activityCounts, aiTools, avgHcs } = processActions(actions)

    const day = m.started_at.slice(0, 10)
    writingDaySet.add(day)

    sessions.push({
      sessionId:    m.session_id,
      startedAt:    m.started_at,
      actionCount:  m.action_count,
      avgHcs,
      influxCount:  activityCounts.influx,
      aiTools,
      activityCounts,
    })

    allHcsPoints.push(...hcsHistory)
    globalActivity.composing += activityCounts.composing
    globalActivity.refining  += activityCounts.refining
    globalActivity.influx    += activityCounts.influx

    for (const tool of aiTools) {
      aiToolCounts[tool] = (aiToolCounts[tool] ?? 0) + activityCounts.influx
    }
    // Count Veriphid-detected influx separately
    const unattributed = activityCounts.influx - aiTools.length
    if (unattributed > 0) aiToolCounts["Unknown Source"] = (aiToolCounts["Unknown Source"] ?? 0) + unattributed

    // Sensor trend by day
    if (!sensorByDay[day]) sensorByDay[day] = { dwell: [], flight: [], burst: [], correction: [], composition: [], paste: [], velocity: [] }
    for (const a of actions) {
      const em = a.parameters?.entropyMetadata ?? {}
      if (em.dwellVariance)    sensorByDay[day].dwell.push(em.dwellVariance)
      if (em.flightVariance)   sensorByDay[day].flight.push(em.flightVariance)
      if (em.burstScore)       sensorByDay[day].burst.push(em.burstScore)
      if (em.correctionScore)  sensorByDay[day].correction.push(em.correctionScore)
      if (em.compositionScore) sensorByDay[day].composition.push(em.compositionScore)
      if (em.pasteScore)       sensorByDay[day].paste.push(em.pasteScore)
      if (em.velocityScore)    sensorByDay[day].velocity.push(em.velocityScore)
    }
  }

  // HCS trend: group by day, take avg
  const hcsByDay: Record<string, number[]> = {}
  for (const p of allHcsPoints) {
    hcsByDay[p.label] = hcsByDay[p.label] ?? []
    hcsByDay[p.label].push(p.hcs)
  }
  const hcsTrend: HCSPoint[] = Object.entries(hcsByDay)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([label, vals]) => ({
      label,
      time: new Date(label).getTime(),
      hcs:  Math.round(vals.reduce((s, v) => s + v, 0) / vals.length),
    }))

  // Activity breakdown
  const totalAct = globalActivity.composing + globalActivity.refining + globalActivity.influx || 1
  const activityBreakdown: ActivitySlice[] = [
    { name: "Direct Composition", value: Math.round(globalActivity.composing / totalAct * 100), color: "#10b981" },
    { name: "Human Refinement",   value: Math.round(globalActivity.refining  / totalAct * 100), color: "#f59e0b" },
    { name: "External Influx",    value: Math.round(globalActivity.influx    / totalAct * 100), color: "#ef4444" },
  ].filter(a => a.value > 0)

  // AI tools
  const aiTools: AIToolBar[] = Object.entries(aiToolCounts)
    .sort(([, a], [, b]) => b - a)
    .map(([name, count]) => ({ name, count }))

  // Sensor trend
  const avg = (arr: number[]) => arr.length ? Math.round(arr.reduce((s, v) => s + v, 0) / arr.length) : 0
  const sensorTrend: SensorPoint[] = Object.entries(sensorByDay)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([label, s]) => ({
      label,
      dwell:       Math.min(100, avg(s.dwell) / 5),   // normalise to 0-100
      flight:      Math.min(100, avg(s.flight) / 80),
      burst:       avg(s.burst),
      correction:  avg(s.correction),
      composition: avg(s.composition),
      paste:       avg(s.paste),
      velocity:    avg(s.velocity),
    }))

  const allAvgHcs = sessions.map(s => s.avgHcs)
  const overallAvg = allAvgHcs.length ? Math.round(allAvgHcs.reduce((s, v) => s + v, 0) / allAvgHcs.length) : 50
  const topTool = aiTools[0]?.name ?? "None detected"

  return {
    hcsTrend,
    activityBreakdown,
    aiTools,
    sensorTrend,
    sessions,
    stats: {
      totalSessions: sessions.length,
      avgHcs:        overallAvg,
      totalInflux:   globalActivity.influx,
      topAITool:     topTool,
      writingDays:   writingDaySet.size,
    },
  }
}

// ---------------------------------------------------------------------------
// Date range helpers
// ---------------------------------------------------------------------------

function getRangeStart(range: string): Date {
  const now = new Date()
  switch (range) {
    case "day":   return new Date(now.getTime() - 86_400_000)
    case "week":  return new Date(now.getTime() - 7 * 86_400_000)
    case "year":  return new Date(now.getTime() - 365 * 86_400_000)
    default:      return new Date(now.getTime() - 30 * 86_400_000) // month
  }
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

interface Props { searchParams: Promise<{ range?: string }> }

export default async function AnalyticsPage({ searchParams }: Props) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { range = "month" } = await searchParams
  const since = getRangeStart(range)

  const { data: manifests } = await supabase
    .from("manifests")
    .select("session_id, started_at, action_count, actions")
    .eq("user_id", user.id)
    .gte("started_at", since.toISOString())
    .order("started_at", { ascending: false })
    .limit(200)

  const analytics = buildAnalytics((manifests ?? []) as Parameters<typeof buildAnalytics>[0])

  return (
    <div className="space-y-2">
      <AnalyticsCharts data={analytics} range={range} />
    </div>
  )
}
