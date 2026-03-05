import { createServerSupabaseClient } from "@/lib/supabase-server"

export async function GET() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { data, error } = await supabase
    .from("workspaces")
    .select("id, name, invite_code, owner_id, created_at")
    .order("created_at", { ascending: false })

  return Response.json(error ? { error: error.message } : (data ?? []))
}

export async function POST(req: Request) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { name } = await req.json()
  if (!name?.trim()) return Response.json({ error: "Name required" }, { status: 400 })

  const { data, error } = await supabase
    .from("workspaces")
    .insert({ name: name.trim(), owner_id: user.id })
    .select("id, name, invite_code")
    .single()

  return Response.json(error ? { error: error.message } : data, { status: error ? 500 : 201 })
}
