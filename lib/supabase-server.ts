import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

const url  = process.env.NEXT_PUBLIC_SUPABASE_URL!
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

/** Server-side Supabase client (Server Components and Route Handlers only). */
export async function createServerSupabaseClient() {
  const cookieStore = await cookies()
  return createServerClient(url, anon, {
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
