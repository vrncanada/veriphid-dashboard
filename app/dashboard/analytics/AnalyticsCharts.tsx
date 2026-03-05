"use client"

import { useRouter, usePathname } from "next/navigation"
import {
  ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine,
  AreaChart, Area, Legend,
  PieChart, Pie, Cell,
  BarChart, Bar,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from "recharts"
import { useState, useCallback } from "react"
import type { AnalyticsData, SessionSummary } from "./page"

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ACTIVITY_COLORS = {
  "Direct Composition": "#10b981",
  "Human Refinement":   "#f59e0b",
  "External Influx":    "#ef4444",
} as const

const TIER_COLOR = (hcs: number) =>
  hcs >= 80 ? "#10b981"
  : hcs >= 60 ? "#22c55e"
  : hcs >= 40 ? "#f59e0b"
  : hcs >= 20 ? "#f97316"
  : "#ef4444"

const TIER_LABEL = (hcs: number) =>
  hcs >= 80 ? "Organic" : hcs >= 60 ? "Handmade" : hcs >= 40 ? "Blended" : hcs >= 20 ? "Boosted" : "Generated"

const AI_TOOL_COLORS = ["#818cf8", "#a78bfa", "#c084fc", "#e879f9", "#f472b6", "#fb7185", "#94a3b8"]

// ---------------------------------------------------------------------------
// Shared tooltip style
// ---------------------------------------------------------------------------

const TooltipStyle = { backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: 8, color: "#e2e8f0", fontSize: 12 }

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StatCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4 flex flex-col gap-1">
      <div className="text-xs text-slate-500 uppercase tracking-wider">{label}</div>
      <div className="text-2xl font-bold" style={{ color: color ?? "#e2e8f0" }}>{value}</div>
      {sub && <div className="text-xs text-slate-500">{sub}</div>}
    </div>
  )
}

function ChartCard({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-slate-700 bg-slate-800/30 p-5 ${className}`}>
      <h3 className="text-sm font-semibold text-slate-300 mb-4">{title}</h3>
      {children}
    </div>
  )
}

// ---------------------------------------------------------------------------
// HCS Trend Chart
// ---------------------------------------------------------------------------

function HCSTrendChart({ data }: { data: AnalyticsData["hcsTrend"] }) {
  if (data.length === 0) return <EmptyState />
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="hcsGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.03} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
        {/* Tier bands */}
        <ReferenceLine y={80} stroke="#10b981" strokeDasharray="4 4" strokeOpacity={0.4} label={{ value: "Organic", fill: "#10b981", fontSize: 10, position: "right" }} />
        <ReferenceLine y={60} stroke="#22c55e" strokeDasharray="4 4" strokeOpacity={0.3} />
        <ReferenceLine y={40} stroke="#f59e0b" strokeDasharray="4 4" strokeOpacity={0.3} />
        <ReferenceLine y={20} stroke="#ef4444" strokeDasharray="4 4" strokeOpacity={0.4} label={{ value: "Generated", fill: "#ef4444", fontSize: 10, position: "right" }} />
        <XAxis dataKey="label" tick={{ fill: "#64748b", fontSize: 11 }} tickLine={false} axisLine={false} />
        <YAxis domain={[0, 100]} tick={{ fill: "#64748b", fontSize: 11 }} tickLine={false} axisLine={false} />
        <Tooltip
          contentStyle={TooltipStyle}
          formatter={(v: number | undefined) => [`HCS ${v ?? "?"} — ${v != null ? TIER_LABEL(v) : ""}`, ""]}
          labelStyle={{ color: "#94a3b8" }}
        />
        <Area
          type="monotone"
          dataKey="hcs"
          stroke="#3b82f6"
          strokeWidth={2.5}
          fill="url(#hcsGrad)"
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          dot={(props: any) => props.cx != null && props.cy != null ? (
            <circle key={`dot-${props.cx}-${props.cy}`} cx={props.cx} cy={props.cy} r={3} fill={TIER_COLOR(props.payload?.hcs ?? 50)} stroke="#0f172a" strokeWidth={1.5} />
          ) : null}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

// ---------------------------------------------------------------------------
// Activity Distribution Donut
// ---------------------------------------------------------------------------

function ActivityDonut({ data }: { data: AnalyticsData["activityBreakdown"] }) {
  const [active, setActive] = useState<number | null>(null)
  if (data.length === 0) return <EmptyState />
  const displayed = active !== null ? data[active] : null
  return (
    <div className="flex flex-col items-center">
      <ResponsiveContainer width="100%" height={180}>
        <PieChart>
          <Pie
            data={data}
            cx="50%" cy="50%"
            innerRadius={52} outerRadius={76}
            dataKey="value"
            onMouseEnter={(_, i) => setActive(i)}
            onMouseLeave={() => setActive(null)}
            strokeWidth={0}
          >
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color} opacity={active === null || active === i ? 1 : 0.4} />
            ))}
          </Pie>
          <Tooltip contentStyle={TooltipStyle} formatter={(v: number | undefined) => [`${v ?? 0}%`, ""]} />
        </PieChart>
      </ResponsiveContainer>
      {displayed ? (
        <div className="text-center -mt-2 mb-2">
          <span className="text-2xl font-bold" style={{ color: displayed.color }}>{displayed.value}%</span>
          <span className="text-xs text-slate-400 ml-2">{displayed.name}</span>
        </div>
      ) : (
        <div className="h-8" />
      )}
      <div className="flex flex-wrap justify-center gap-3">
        {data.map((d, i) => (
          <button key={i} onClick={() => setActive(active === i ? null : i)} className="flex items-center gap-1.5 text-xs transition-opacity" style={{ opacity: active === null || active === i ? 1 : 0.5 }}>
            <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: d.color }} />
            <span className="text-slate-300">{d.name}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// AI Tools Bar Chart
// ---------------------------------------------------------------------------

function AIToolsChart({ data }: { data: AnalyticsData["aiTools"] }) {
  if (data.length === 0) return (
    <div className="flex flex-col items-center justify-center h-36 text-slate-500 text-sm gap-2">
      <span className="text-2xl">🤖</span>
      <span>No AI tool pastes detected yet</span>
      <span className="text-xs text-slate-600">Open ChatGPT/Claude/Gemini and paste into a document</span>
    </div>
  )
  return (
    <ResponsiveContainer width="100%" height={Math.max(140, data.length * 36)}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
        <XAxis type="number" tick={{ fill: "#64748b", fontSize: 11 }} tickLine={false} axisLine={false} />
        <YAxis type="category" dataKey="name" width={130} tick={{ fill: "#cbd5e1", fontSize: 12 }} tickLine={false} axisLine={false} />
        <Tooltip contentStyle={TooltipStyle} formatter={(v: number | undefined) => [v ?? 0, "paste events"]} />
        <Bar dataKey="count" radius={[0, 4, 4, 0]}>
          {data.map((_, i) => <Cell key={i} fill={AI_TOOL_COLORS[i % AI_TOOL_COLORS.length]} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

// ---------------------------------------------------------------------------
// Sensor Trend (multi-line)
// ---------------------------------------------------------------------------

function SensorTrendChart({ data }: { data: AnalyticsData["sensorTrend"] }) {
  if (data.length === 0) return <EmptyState />
  const sensors = [
    { key: "dwell",       name: "Dwell",       color: "#3b82f6" },
    { key: "flight",      name: "Flight",       color: "#8b5cf6" },
    { key: "burst",       name: "Burst",        color: "#06b6d4" },
    { key: "correction",  name: "Correction",   color: "#f59e0b" },
    { key: "composition", name: "Composition",  color: "#10b981" },
    { key: "paste",       name: "Paste Context",color: "#f97316" },
    { key: "velocity",    name: "Velocity",     color: "#ec4899" },
  ] as const
  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
        <XAxis dataKey="label" tick={{ fill: "#64748b", fontSize: 10 }} tickLine={false} axisLine={false} />
        <YAxis domain={[0, 100]} tick={{ fill: "#64748b", fontSize: 10 }} tickLine={false} axisLine={false} />
        <Tooltip contentStyle={TooltipStyle} />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, color: "#94a3b8" }} />
        {sensors.map(s => (
          <Line key={s.key} type="monotone" dataKey={s.key} name={s.name} stroke={s.color} strokeWidth={2} dot={false} />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}

// ---------------------------------------------------------------------------
// Sensor Radar (latest session)
// ---------------------------------------------------------------------------

function SensorRadar({ session }: { session: SessionSummary | undefined }) {
  if (!session) return <EmptyState />
  // We don't have per-session sensor values here directly, so approximate from activity counts
  const { activityCounts } = session
  const total = activityCounts.composing + activityCounts.refining + activityCounts.influx || 1
  const radarData = [
    { subject: "Composition", value: Math.round((activityCounts.composing / total) * 100) },
    { subject: "Refinement",  value: Math.round((activityCounts.refining  / total) * 100) },
    { subject: "Consistency", value: Math.min(100, session.actionCount * 4) },
    { subject: "HCS",         value: session.avgHcs },
    { subject: "Clean Paste", value: Math.max(0, 100 - session.influxCount * 20) },
  ]
  return (
    <ResponsiveContainer width="100%" height={200}>
      <RadarChart data={radarData} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
        <PolarGrid stroke="#334155" />
        <PolarAngleAxis dataKey="subject" tick={{ fill: "#94a3b8", fontSize: 11 }} />
        <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: "#475569", fontSize: 9 }} />
        <Radar dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.25} strokeWidth={2} />
        <Tooltip contentStyle={TooltipStyle} />
      </RadarChart>
    </ResponsiveContainer>
  )
}

// ---------------------------------------------------------------------------
// Session list
// ---------------------------------------------------------------------------

function SessionList({ sessions }: { sessions: SessionSummary[] }) {
  if (sessions.length === 0) return <EmptyState message="No sessions in this period" />
  return (
    <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
      {sessions.slice(0, 20).map(s => {
        const total = s.activityCounts.composing + s.activityCounts.refining + s.activityCounts.influx || 1
        const compPct = s.activityCounts.composing / total * 100
        const refPct  = s.activityCounts.refining  / total * 100
        const infPct  = s.activityCounts.influx    / total * 100
        const color   = TIER_COLOR(s.avgHcs)
        return (
          <a key={s.sessionId} href={`/verify/${s.sessionId}`}
            className="flex items-center gap-3 rounded-lg border border-slate-700/50 bg-slate-800/20 px-4 py-3 hover:bg-slate-700/30 transition-colors group">
            {/* HCS badge */}
            <div className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm shrink-0" style={{ backgroundColor: `${color}22`, color }}>
              {s.avgHcs}
            </div>
            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs text-slate-400">{new Date(s.startedAt).toLocaleDateString()}</span>
                <span className="text-xs text-slate-600">{s.actionCount} actions</span>
                {s.aiTools.length > 0 && (
                  <span className="text-xs px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    {s.aiTools[0]}
                  </span>
                )}
                {s.influxCount > 0 && (
                  <span className="text-xs px-1.5 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
                    {s.influxCount} influx
                  </span>
                )}
              </div>
              {/* Mini timeline */}
              <div className="flex h-2 rounded-full overflow-hidden gap-px w-full">
                {compPct > 0 && <div style={{ width: `${compPct}%`, backgroundColor: "#10b981" }} />}
                {refPct  > 0 && <div style={{ width: `${refPct}%`,  backgroundColor: "#f59e0b" }} />}
                {infPct  > 0 && <div style={{ width: `${infPct}%`,  backgroundColor: "#ef4444" }} />}
              </div>
            </div>
            <span className="text-slate-600 group-hover:text-slate-400 transition-colors text-xs">→</span>
          </a>
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

function EmptyState({ message = "No data yet for this period" }: { message?: string }) {
  return (
    <div className="flex items-center justify-center h-32 text-slate-600 text-sm">{message}</div>
  )
}

// ---------------------------------------------------------------------------
// Range filter
// ---------------------------------------------------------------------------

const RANGES = [
  { value: "day",   label: "24h" },
  { value: "week",  label: "7d" },
  { value: "month", label: "30d" },
  { value: "year",  label: "1y" },
]

function RangeFilter({ current }: { current: string }) {
  const router   = useRouter()
  const pathname = usePathname()
  const set = useCallback((r: string) => router.push(`${pathname}?range=${r}`), [router, pathname])
  return (
    <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-1">
      {RANGES.map(r => (
        <button key={r.value} onClick={() => set(r.value)}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
            current === r.value
              ? "bg-blue-600 text-white shadow-lg shadow-blue-900/30"
              : "text-slate-400 hover:text-slate-200"
          }`}>
          {r.label}
        </button>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export function AnalyticsCharts({ data, range }: { data: AnalyticsData; range: string }) {
  const { stats, hcsTrend, activityBreakdown, aiTools, sensorTrend, sessions } = data
  const latestSession = sessions[0]

  return (
    <div className="space-y-6 -mx-6 px-6">

      {/* ── Header ── */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Analytics</h1>
          <p className="text-slate-500 text-sm mt-0.5">Human confidence signals &amp; AI usage across your writing sessions</p>
        </div>
        <RangeFilter current={range} />
      </div>

      {/* ── Stats row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <StatCard label="Sessions"      value={String(stats.totalSessions)}  sub="in period" />
        <StatCard label="Avg HCS"       value={String(stats.avgHcs)}          sub={TIER_LABEL(stats.avgHcs)} color={TIER_COLOR(stats.avgHcs)} />
        <StatCard label="AI Pastes"     value={String(stats.totalInflux)}     sub="external influx events" color={stats.totalInflux > 0 ? "#f97316" : undefined} />
        <StatCard label="Top AI Tool"   value={stats.topAITool === "None detected" ? "—" : stats.topAITool} sub="most pasted from" color="#818cf8" />
        <StatCard label="Writing Days"  value={String(stats.writingDays)}     sub="active days" color="#06b6d4" />
      </div>

      {/* ── HCS Trend (full width) ── */}
      <ChartCard title="🎯 Human Confidence Score — over time">
        <HCSTrendChart data={hcsTrend} />
        <div className="flex items-center gap-4 mt-3 text-xs text-slate-600">
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"/>&ge;80 Organic</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-500  inline-block"/>&ge;60 Handmade</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500  inline-block"/>&ge;40 Blended</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-orange-500 inline-block"/>&ge;20 Boosted</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500    inline-block"/>&lt;20 Generated</span>
        </div>
      </ChartCard>

      {/* ── Middle row: Donut + AI Tools ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <ChartCard title="📊 Activity Breakdown">
          <ActivityDonut data={activityBreakdown} />
        </ChartCard>
        <ChartCard title="🤖 AI Tools Used">
          <AIToolsChart data={aiTools} />
        </ChartCard>
      </div>

      {/* ── Sensor Trend (full width) ── */}
      <ChartCard title="📡 Sensor Signals — over time">
        <SensorTrendChart data={sensorTrend} />
      </ChartCard>

      {/* ── Bottom row: Radar + Sessions ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <ChartCard title="🔬 Latest Session Profile">
          <SensorRadar session={latestSession} />
          {latestSession && (
            <div className="mt-3 text-center">
              <span className="text-xs text-slate-500">Session from </span>
              <span className="text-xs text-slate-400">{new Date(latestSession.startedAt).toLocaleString()}</span>
            </div>
          )}
        </ChartCard>
        <ChartCard title="📋 Recent Sessions">
          <SessionList sessions={sessions} />
        </ChartCard>
      </div>

    </div>
  )
}
