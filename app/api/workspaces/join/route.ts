import { createServerSupabaseClient } from "@/lib/supabase-server"

export async function POST(req: Request) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { inviteCode } = await req.json()
  if (!inviteCode?.trim()) return Response.json({ error: "Invite code required" }, { status: 400 })

  const { data: workspace, error: wErr } = await supabase
    .from("workspaces")
    .select("id, name")
    .eq("invite_code", inviteCode.trim())
    .single()

  if (wErr || !workspace) {
    return Response.json({ error: "Invalid invite code" }, { status: 404 })
  }

  const { error } = await supabase
    .from("workspace_members")
    .insert({ workspace_id: workspace.id, user_id: user.id })

  // 23505 = unique violation → already a member, treat as success
  if (error && error.code !== "23505") {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ ok: true, workspaceId: workspace.id, workspaceName: workspace.name })
}
