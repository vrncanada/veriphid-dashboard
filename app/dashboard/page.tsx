import { redirect } from "next/navigation"
import { createServerSupabaseClient } from "@/lib/supabase-server"
import { computeHCS } from "@/lib/hcs"
import { BadgeChip } from "@/components/BadgeChip"

const PERIODS = [
  { label: "24h",   hours: 24 },
  { label: "7d",    hours: 24 * 7 },
  { label: "30d",   hours: 24 * 30 },
  { label: "All",   hours: null },
] as const

type Period = typeof PERIODS[number]["label"]

interface Props { searchParams: Promise<{ period?: string }> }

export default async function DashboardPage({ searchParams }: Props) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { period: rawPeriod } = await searchParams
  const activePeriod: Period = (PERIODS.find(p => p.label === rawPeriod)?.label) ?? "7d"
  const activeHours = PERIODS.find(p => p.label === activePeriod)?.hours ?? null

  let query = supabase
    .from("manifests")
    .select("session_id, started_at, action_count, last_synced_at, actions")
    .eq("user_id", user.id)
    .order("started_at", { ascending: false })

  if (activeHours !== null) {
    const since = new Date(Date.now() - activeHours * 3_600_000).toISOString()
    query = query.gte("started_at", since)
  }

  const { data: sessions } = await query

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-slate-100">My Sessions</h1>
        <div className="flex items-center gap-1">
          {PERIODS.map(({ label }) => (
            <a
              key={label}
              href={`/dashboard?period=${label}`}
              className={[
                "px-3 py-1 rounded-lg text-sm font-medium transition-colors",
                label === activePeriod
                  ? "bg-blue-600 text-white"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-700",
              ].join(" ")}
            >
              {label}
            </a>
          ))}
        </div>
        <span className="text-sm text-slate-500">{user.email}</span>
      </div>

      {!sessions || sessions.length === 0 ? (
        <div className="rounded-xl border border-slate-700 bg-slate-800/30 p-12 text-center space-y-3">
          <div className="text-slate-500 text-lg">No sessions in this period</div>
          <p className="text-slate-600 text-sm max-w-sm mx-auto">
            Sessions appear here automatically as the Veriphid extension syncs your activity.
            Make sure you are logged into the same account in the extension.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map(session => {
            const lastAction = session.actions?.[session.actions.length - 1]
            const meta = lastAction?.parameters?.entropyMetadata ?? {}
            const hcs  = computeHCS(meta)
            const synced = session.last_synced_at ?? null

            return (
              <a
                key={session.session_id}
                href={`/session/${session.session_id}`}
                className="flex items-center gap-4 rounded-xl border border-slate-700 bg-slate-800/30 hover:bg-slate-800/60 p-4 transition-colors"
              >
                <BadgeChip score={hcs} size="sm" />

                <div className="flex-1 min-w-0">
                  <div className="text-sm font-mono text-slate-400 truncate">{session.session_id}</div>
                  <div className="text-xs text-slate-600 mt-0.5">
                    {new Date(session.started_at).toLocaleString()}
                    {" · "}
                    {session.action_count ?? session.actions?.length ?? 0} actions
                    {synced && (
                      <span className="text-slate-700">
                        {" · synced "}{new Date(synced).toLocaleTimeString()}
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-slate-600 text-sm flex-shrink-0">→</div>
              </a>
            )
          })}
        </div>
      )}
    </div>
  )
}
