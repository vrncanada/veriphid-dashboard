import { createServerSupabaseClient } from "@/lib/supabase-server"

export async function POST(req: Request) {
  const { sessionId } = await req.json()
  if (!sessionId) return Response.json({ error: "Missing sessionId" }, { status: 400 })

  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { error } = await supabase
    .from("manifests")
    .update({ user_id: user.id })
    .eq("session_id", sessionId)
    .is("user_id", null)   // idempotent: only claim if unclaimed

  return Response.json({ ok: !error, error: error?.message })
}
