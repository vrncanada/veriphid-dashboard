import { notFound } from "next/navigation"
import { createServerSupabaseClient } from "@/lib/supabase-server"
import { BadgeChip } from "@/components/BadgeChip"
import { HCSGauge } from "@/components/HCSGauge"
import { ActivityTimeline } from "@/components/ActivityTimeline"
import { Ed25519VerifyPanel } from "./Ed25519VerifyPanel"

interface Props { params: Promise<{ badgeId: string }> }

export default async function BadgePage({ params }: Props) {
  const { badgeId } = await params

  const supabase = await createServerSupabaseClient()

  const { data: badge, error } = await supabase
    .from("document_badges")
    .select("*, manifests(actions, started_at, action_count, last_synced_at)")
    .eq("id", badgeId)
    .single()

  if (error || !badge) notFound()

  const manifest = (badge as { manifests?: { actions: unknown[]; started_at: string; action_count: number; last_synced_at: string | null } }).manifests

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-slate-100 truncate max-w-xs sm:max-w-none">
            {badge.doc_title}
          </h1>
          <a
            href={badge.doc_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-400 hover:text-blue-300 truncate block max-w-xs"
          >
            {badge.doc_url}
          </a>
        </div>
        <BadgeChip score={badge.hcs} size="lg" />
      </div>

      {/* Badge meta */}
      <div className="grid grid-cols-[auto_1fr] gap-6 items-center rounded-xl bg-slate-800/30 border border-slate-700 p-6">
        <HCSGauge score={badge.hcs} size={140} />
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-slate-500 text-xs mb-1">Provenance tier</div>
            <div className="text-slate-200">{badge.hcs_label}</div>
          </div>
          <div>
            <div className="text-slate-500 text-xs mb-1">HCS score</div>
            <div className="text-slate-200">{badge.hcs} / 100</div>
          </div>
          <div>
            <div className="text-slate-500 text-xs mb-1">Badged at</div>
            <div className="text-slate-200">{new Date(badge.badged_at).toLocaleString()}</div>
          </div>
          <div>
            <div className="text-slate-500 text-xs mb-1">Session ID</div>
            <div className="text-slate-400 font-mono text-xs truncate">{badge.session_id}</div>
          </div>
        </div>
      </div>

      {/* Ed25519 verification panel */}
      {badge.signature && badge.public_key && badge.seal && (
        <Ed25519VerifyPanel
          sessionId={badge.session_id}
          seal={badge.seal}
          signature={badge.signature}
          publicKey={badge.public_key}
        />
      )}

      {/* Links */}
      <div className="flex gap-3 text-sm flex-wrap">
        <a
          href={`/verify/${badge.session_id}`}
          className="text-blue-400 hover:text-blue-300 border border-blue-800/50 rounded-lg px-3 py-1.5 transition-colors"
        >
          View full session →
        </a>
      </div>

      {/* Activity timeline from manifest */}
      {manifest?.actions && manifest.actions.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-slate-400 mb-3 uppercase tracking-wider">Activity Timeline</h2>
          <div className="rounded-xl bg-slate-800/30 border border-slate-700 p-4">
            <ActivityTimeline actions={manifest.actions as Parameters<typeof ActivityTimeline>[0]["actions"]} />
          </div>
        </div>
      )}
    </div>
  )
}
