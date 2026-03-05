import { notFound, redirect } from "next/navigation"
import { createServerSupabaseClient } from "@/lib/supabase-server"
import { computeHCS } from "@/lib/hcs"
import { BadgeChip } from "@/components/BadgeChip"
import { HCSGauge } from "@/components/HCSGauge"
import { ActivityTimeline } from "@/components/ActivityTimeline"
import { SignatureCard } from "@/components/SignatureCard"
import { SessionZKPPanel } from "./SessionZKPPanel"

interface Props { params: Promise<{ sessionId: string }> }

export default async function SessionPage({ params }: Props) {
  const { sessionId } = await params
  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const [{ data: manifest }, { data: proof }] = await Promise.all([
    supabase.from("manifests").select("*").eq("session_id", sessionId).single(),
    supabase.from("proofs").select("*").eq("session_id", sessionId).maybeSingle(),
  ])

  if (!manifest) notFound()

  // Only allow the owner to access this page
  if (manifest.user_id && manifest.user_id !== user.id) notFound()

  const lastAction = manifest.actions[manifest.actions.length - 1]
  const meta = lastAction?.parameters?.entropyMetadata ?? {}
  const hcs  = computeHCS(meta)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <a href="/dashboard" className="text-xs text-slate-600 hover:text-slate-400 transition-colors">
            ← My Sessions
          </a>
          <h1 className="text-2xl font-bold text-slate-100">Session Detail</h1>
          <p className="text-sm text-slate-500 font-mono">{sessionId}</p>
        </div>
        <div className="flex items-center gap-3">
          <BadgeChip score={hcs} size="lg" />
          <a
            href={`/verify/${sessionId}`}
            target="_blank"
            className="text-xs text-slate-500 hover:text-slate-300 border border-slate-700 rounded-lg px-3 py-1.5 transition-colors"
          >
            Public verify →
          </a>
        </div>
      </div>

      {/* Gauge + meta */}
      <div className="grid grid-cols-[auto_1fr] gap-6 items-center rounded-xl bg-slate-800/30 border border-slate-700 p-6">
        <HCSGauge score={hcs} size={140} />
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-slate-500 text-xs mb-1">Session started</div>
            <div className="text-slate-200">{new Date(manifest.started_at).toLocaleString()}</div>
          </div>
          <div>
            <div className="text-slate-500 text-xs mb-1">Actions recorded</div>
            <div className="text-slate-200">{manifest.action_count}</div>
          </div>
          <div>
            <div className="text-slate-500 text-xs mb-1">Signed at</div>
            <div className="text-slate-200">{new Date(manifest.signed_at).toLocaleString()}</div>
          </div>
          <div>
            <div className="text-slate-500 text-xs mb-1">Status</div>
            <div className="text-green-400">✓ Signed &amp; Saved</div>
          </div>
        </div>
      </div>

      {/* ZKP panel (interactive, client component) */}
      <div>
        <h2 className="text-sm font-semibold text-slate-400 mb-3 uppercase tracking-wider">Zero-Knowledge Proof</h2>
        <SessionZKPPanel sessionId={sessionId} hcsScore={hcs} existingProof={proof} />
      </div>

      {/* Activity timeline */}
      <div>
        <h2 className="text-sm font-semibold text-slate-400 mb-3 uppercase tracking-wider">Activity Timeline</h2>
        <div className="rounded-xl bg-slate-800/30 border border-slate-700 p-4">
          <ActivityTimeline actions={manifest.actions} />
        </div>
      </div>

      {/* Signature */}
      <div>
        <h2 className="text-sm font-semibold text-slate-400 mb-3 uppercase tracking-wider">Cryptographic Proof</h2>
        <SignatureCard manifest={manifest} />
      </div>
    </div>
  )
}
