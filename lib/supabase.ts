import { createBrowserClient } from "@supabase/ssr"
import { createServerClient as _createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

const url  = process.env.NEXT_PUBLIC_SUPABASE_URL!
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

/** Browser-side Supabase client (use in Client Components). */
export function createClient() {
  return createBrowserClient(url, anon)
}

/** Server-side Supabase client (use in Server Components and Route Handlers). */
export async function createServerSupabaseClient() {
  const cookieStore = await cookies()
  return _createServerClient(url, anon, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch {
          // Server Component — cookies can't be set from here; middleware handles refresh
        }
      },
    },
  })
}

// ---------------------------------------------------------------------------
// Shared types (mirrors the Supabase manifests + proofs tables)
// ---------------------------------------------------------------------------

export interface ManifestRow {
  session_id:   string
  started_at:   string
  seal:         string
  actions:      C2PAAction[]
  action_count: number
  signature:    string
  public_key:   string
  algorithm:    string
  signed_at:    string
  created_at:   string
  user_id:      string | null
}

export interface C2PAAction {
  action: string
  when:   string
  softwareAgent: { name: string; version: string }
  parameters: {
    activityState: number   // 0=Composing 1=Refining 2=Influx 3=Idle
    activityLabel: string
    entropyMetadata: {
      dwellVariance?:    number
      flightVariance?:   number
      burstScore?:       number
      correctionScore?:  number
      pasteScore?:       number
      velocityScore?:    number
      compositionScore?: number
    }
  }
}

export interface ProofRow {
  id:             string
  session_id:     string
  user_id:        string
  threshold:      number
  commitment:     string
  proof:          object
  public_signals: string[]
  created_at:     string
}
