import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function proxy(request: NextRequest) {
  try {
    const url  = process.env.NEXT_PUBLIC_SUPABASE_URL
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !anon) return NextResponse.next({ request })

    let supabaseResponse = NextResponse.next({ request })

    const supabase = createServerClient(url, anon, {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    })

    // Refresh session token
    const { data: { user } } = await supabase.auth.getUser()

    // Protect /dashboard and /session routes — server pages also check auth,
    // but this gives a faster redirect without an extra DB call.
    const pathname = request.nextUrl.pathname
    if (!user && (pathname.startsWith("/dashboard") || pathname.startsWith("/session"))) {
      const loginUrl = request.nextUrl.clone()
      loginUrl.pathname = "/login"
      loginUrl.searchParams.set("redirect", pathname)
      return NextResponse.redirect(loginUrl)
    }

    return supabaseResponse
  } catch {
    // Never let proxy errors break page rendering
    return NextResponse.next({ request })
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|circuits/).*)"],
}
