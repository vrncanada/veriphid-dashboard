import { createServerSupabaseClient } from "@/lib/supabase-server"

/**
 * GET /api/extension-token?token=<uuid>
 *
 * The extension polls this endpoint after opening /extension-auth.
 * Returns { access_token, refresh_token } once the user authorizes,
 * { pending: true } while waiting, or { error } on expiry.
 * Deletes the row after delivering the token (single-use).
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const token = searchParams.get("token")
  if (!token) return Response.json({ error: "Missing token" }, { status: 400 })

  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from("link_tokens")
    .select("access_token, refresh_token, expires_at")
    .eq("token", token)
    .single()

  if (error || !data) return Response.json({ pending: true })

  if (new Date(data.expires_at) < new Date()) {
    await supabase.from("link_tokens").delete().eq("token", token)
    return Response.json({ error: "Token expired" }, { status: 410 })
  }

  if (!data.access_token) return Response.json({ pending: true })

  // Delete immediately — single use
  await supabase.from("link_tokens").delete().eq("token", token)

  return Response.json({
    access_token:  data.access_token,
    refresh_token: data.refresh_token,
  })
}
