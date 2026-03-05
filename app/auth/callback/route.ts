import { createServerSupabaseClient } from "@/lib/supabase"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const url    = new URL(request.url)
  const code   = url.searchParams.get("code")
  const claim  = url.searchParams.get("claim") // session to claim after login
  const origin = url.origin

  if (code) {
    const supabase = await createServerSupabaseClient()
    await supabase.auth.exchangeCodeForSession(code)
  }

  // If a claim param was passed through the OAuth flow (unlikely via PKCE but handle the direct case)
  if (claim) {
    return NextResponse.redirect(`${origin}/login?claim=${claim}`)
  }

  return NextResponse.redirect(`${origin}/dashboard`)
}
