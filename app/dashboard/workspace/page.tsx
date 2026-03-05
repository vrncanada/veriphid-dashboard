import { redirect } from "next/navigation"
import { createServerSupabaseClient } from "@/lib/supabase-server"
import { BadgeChip } from "@/components/BadgeChip"
import { CreateWorkspaceForm, JoinWorkspaceForm } from "./WorkspaceForms"

export default async function WorkspacePage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  // Fetch workspaces (RLS shows only member/owner workspaces)
  const { data: workspaces } = await supabase
    .from("workspaces")
    .select("id, name, invite_code, owner_id, workspace_members(user_id, joined_at)")
    .order("created_at", { ascending: false })

  // Fetch all team badges for all workspaces
  const workspaceIds = workspaces?.map(w => w.id) ?? []
  const { data: teamBadges } = workspaceIds.length > 0
    ? await supabase
        .from("document_badges")
        .select("id, doc_title, doc_url, hcs, hcs_label, badged_at, user_id, workspace_id, session_id, signature")
        .in("workspace_id", workspaceIds)
        .order("badged_at", { ascending: false })
    : { data: [] }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-100">Workspace</h1>
        <span className="text-sm text-slate-500">{user.email}</span>
      </div>

      {/* Create / Join forms */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-xl border border-slate-700 bg-slate-800/30 p-5 space-y-3">
          <h2 className="text-sm font-semibold text-slate-300">Create Workspace</h2>
          <p className="text-xs text-slate-500">Create a team workspace and share the invite code with colleagues.</p>
          <CreateWorkspaceForm />
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-800/30 p-5 space-y-3">
          <h2 className="text-sm font-semibold text-slate-300">Join Workspace</h2>
          <p className="text-xs text-slate-500">Enter an invite code to join an existing workspace.</p>
          <JoinWorkspaceForm />
        </div>
      </div>

      {/* Workspace list */}
      {workspaces && workspaces.length > 0 && (
        <div className="space-y-6">
          {workspaces.map(workspace => {
            const badges = (teamBadges ?? []).filter(b => b.workspace_id === workspace.id)
            const isOwner = workspace.owner_id === user.id
            const memberCount = (workspace.workspace_members as { user_id: string; joined_at: string }[])?.length ?? 0

            return (
              <div key={workspace.id} className="rounded-xl border border-slate-700 bg-slate-800/30 p-5 space-y-4">
                {/* Workspace header */}
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-semibold text-slate-100">{workspace.name}</h2>
                      {isOwner && (
                        <span className="text-xs bg-blue-900/40 text-blue-400 border border-blue-800/50 rounded px-1.5 py-0.5">Owner</span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {memberCount} member{memberCount !== 1 ? "s" : ""}
                    </div>
                  </div>
                  {isOwner && (
                    <div className="text-xs text-slate-400 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2">
                      Invite code: <span className="font-mono font-bold text-slate-200">{workspace.invite_code}</span>
                    </div>
                  )}
                </div>

                {/* Team badges */}
                <div>
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    Team Badges {badges.length > 0 && `(${badges.length})`}
                  </h3>
                  {badges.length === 0 ? (
                    <p className="text-xs text-slate-600">
                      No badges shared to this workspace yet. Team members can select a workspace when attaching a badge.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {badges.map(badge => (
                        <div
                          key={badge.id}
                          className="flex items-center gap-3 rounded-lg border border-slate-700/50 bg-slate-800/20 p-3"
                        >
                          <BadgeChip score={badge.hcs} size="sm" />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm text-slate-200 truncate">{badge.doc_title}</div>
                            <div className="text-xs text-slate-600 mt-0.5">
                              {new Date(badge.badged_at).toLocaleString()}
                              {badge.signature && <span className="text-green-700 ml-1">· signed</span>}
                            </div>
                          </div>
                          <a
                            href={`/badge/${badge.id}`}
                            className="text-xs text-blue-400 hover:text-blue-300 border border-blue-800/50 rounded px-2 py-1 transition-colors flex-shrink-0"
                          >
                            Verify →
                          </a>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {(!workspaces || workspaces.length === 0) && (
        <div className="rounded-xl border border-slate-700 bg-slate-800/30 p-12 text-center text-slate-500">
          No workspaces yet. Create one above or join with an invite code.
        </div>
      )}
    </div>
  )
}
