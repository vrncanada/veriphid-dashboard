import type { C2PAAction } from "@/lib/supabase"

const ACTIVITY_COLORS: Record<number, string> = {
  0: "#22c55e",   // Composing — green
  1: "#f59e0b",   // Refining  — amber
  2: "#ef4444",   // Influx    — red
  3: "#bfdbfe",   // Idle      — light blue
}

const ACTIVITY_LABELS: Record<number, string> = {
  0: "Direct Composition",
  1: "Human Refinement",
  2: "External Influx",
  3: "Idle",
}

interface ActivityTimelineProps {
  actions: C2PAAction[]
}

export function ActivityTimeline({ actions }: ActivityTimelineProps) {
  if (actions.length === 0) {
    return <p className="text-slate-500 text-sm">No activity recorded.</p>
  }

  const sorted = [...actions].sort((a, b) => new Date(a.when).getTime() - new Date(b.when).getTime())
  const start  = new Date(sorted[0].when).getTime()
  const end    = new Date(sorted[sorted.length - 1].when).getTime()
  const span   = Math.max(end - start, 1)

  // Summarize by state
  const counts: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0 }
  for (const a of actions) counts[a.parameters.activityState]++

  return (
    <div className="space-y-3">
      {/* Timeline bar */}
      <div className="relative h-5 rounded-full overflow-hidden bg-slate-800 flex">
        {sorted.map((action, i) => {
          const t    = new Date(action.when).getTime()
          const left = ((t - start) / span) * 100
          const nextT = sorted[i + 1] ? new Date(sorted[i + 1].when).getTime() : end
          const width = Math.max(((nextT - t) / span) * 100, 0.5)
          const color = ACTIVITY_COLORS[action.parameters.activityState] ?? "#475569"
          return (
            <div
              key={i}
              title={`${action.parameters.activityLabel} — ${new Date(action.when).toLocaleTimeString()}`}
              style={{ left: `${left}%`, width: `${width}%`, backgroundColor: color, position: "absolute", top: 0, bottom: 0 }}
            />
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs text-slate-400">
        {([0, 1, 2, 3] as const).filter(s => counts[s] > 0).map(state => (
          <span key={state} className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: ACTIVITY_COLORS[state] }} />
            {ACTIVITY_LABELS[state]} ({counts[state]})
          </span>
        ))}
      </div>

      {/* Action list */}
      <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
        {sorted.map((action, i) => (
          <div key={i} className="flex items-center gap-2 text-xs text-slate-400">
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: ACTIVITY_COLORS[action.parameters.activityState] }}
            />
            <span className="text-slate-500 tabular-nums w-20 flex-shrink-0">
              {new Date(action.when).toLocaleTimeString()}
            </span>
            <span>{action.parameters.activityLabel}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
