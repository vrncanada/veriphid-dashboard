import { redirect } from "next/navigation"
import { createServerSupabaseClient } from "@/lib/supabase-server"
import { computeHCS } from "@/lib/hcs"
import { BadgeChip } from "@/components/BadgeChip"

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: sessions } = await supabase
    .from("manifests")
    .select("session_id, started_at, action_count, signed_at, actions")
    .eq("user_id", user.id)
    .order("started_at", { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-100">My Sessions</h1>
        <span className="text-sm text-slate-500">{user.email}</span>
      </div>

      {!sessions || sessions.length === 0 ? (
        <div className="rounded-xl border border-slate-700 bg-slate-800/30 p-12 text-center space-y-3">
          <div className="text-slate-500 text-lg">No sessions yet</div>
          <p className="text-slate-600 text-sm max-w-sm mx-auto">
            Sessions appear here after you sign a manifest in the Veriphid extension and claim it
            from the verification page.
          </p>
          <p className="text-slate-600 text-xs">
            To claim a session: open a verify link from the extension → click "Claim this session"
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map(session => {
            const lastAction = session.actions?.[session.actions.length - 1]
            const meta = lastAction?.parameters?.entropyMetadata ?? {}
            const hcs  = computeHCS(meta)

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
                    {new Date(session.started_at).toLocaleString()} · {session.action_count} actions
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
