"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Auth } from "@supabase/auth-ui-react"
import { ThemeSupa } from "@supabase/auth-ui-shared"
import { createClient } from "@/lib/supabase"
import type { SupabaseClient } from "@supabase/supabase-js"

function LoginContent() {
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null)
  const searchParams = useSearchParams()
  const router       = useRouter()
  const claim        = searchParams.get("claim")
  const redirect     = searchParams.get("redirect") ?? "/dashboard"

  // Create the Supabase client only on the browser — never during SSR
  useEffect(() => {
    setSupabase(createClient())
  }, [])

  useEffect(() => {
    if (!supabase) return
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === "SIGNED_IN") {
        if (claim) {
          await fetch("/api/claim", {
            method:  "POST",
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify({ sessionId: claim }),
          })
          router.push("/dashboard")
        } else {
          router.push(redirect)
        }
      }
    })
    return () => subscription.unsubscribe()
  }, [supabase, claim, redirect, router])

  if (!supabase) return null   // render nothing during SSR / before hydration

  const origin = window.location.origin

  return (
    <div className="max-w-sm mx-auto mt-16 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-slate-100">
          {claim ? "Login to claim session" : "Welcome back"}
        </h1>
        {claim && (
          <p className="text-sm text-slate-400">
            Sign in to add session <code className="text-blue-400">{claim.slice(0, 8)}…</code> to your dashboard.
          </p>
        )}
      </div>

      <div className="rounded-xl border border-slate-700 p-6 bg-slate-800/30">
        <Auth
          supabaseClient={supabase}
          appearance={{ theme: ThemeSupa }}
          providers={["github"]}
          redirectTo={`${origin}/auth/callback`}
          theme="dark"
        />
      </div>
    </div>
  )
}

export function LoginClient() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  )
}
