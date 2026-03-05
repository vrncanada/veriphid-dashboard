import { redirect } from "next/navigation"
import { createServerSupabaseClient } from "@/lib/supabase-server"
import { BadgeChip } from "@/components/BadgeChip"

export default async function BadgesPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: badges } = await supabase
    .from("document_badges")
    .select("id, doc_title, doc_url, hcs, hcs_label, badged_at, session_id, signature")
    .eq("user_id", user.id)
    .order("badged_at", { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-100">My Badges</h1>
        <span className="text-sm text-slate-500">{user.email}</span>
      </div>

      {!badges || badges.length === 0 ? (
        <div className="rounded-xl border border-slate-700 bg-slate-800/30 p-12 text-center space-y-3">
          <div className="text-slate-500 text-lg">No badges yet</div>
          <p className="text-slate-600 text-sm max-w-sm mx-auto">
            Open the Veriphid extension on a document tab and click &quot;Attach &amp; Sign Badge&quot; to create your first badge.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {badges.map(badge => (
            <div
              key={badge.id}
              className="flex items-center gap-4 rounded-xl border border-slate-700 bg-slate-800/30 p-4"
            >
              <BadgeChip score={badge.hcs} size="sm" />

              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-slate-200 truncate">{badge.doc_title}</div>
                <a
                  href={badge.doc_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-400 hover:text-blue-300 truncate block"
                >
                  {badge.doc_url}
                </a>
                <div className="text-xs text-slate-600 mt-0.5">
                  {new Date(badge.badged_at).toLocaleString()}
                  {" · "}
                  <span className="font-mono">{badge.session_id.slice(0, 8)}…</span>
                  {badge.signature && (
                    <span className="text-green-600 ml-1">· signed</span>
                  )}
                </div>
              </div>

              <div className="flex gap-2 flex-shrink-0">
                <a
                  href={`/badge/${badge.id}`}
                  className="text-xs text-blue-400 hover:text-blue-300 border border-blue-800/50 rounded px-2 py-1 transition-colors"
                >
                  Verify →
                </a>
                <a
                  href={`/verify/${badge.session_id}`}
                  className="text-xs text-slate-400 hover:text-slate-200 border border-slate-700 rounded px-2 py-1 transition-colors"
                >
                  Session
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
