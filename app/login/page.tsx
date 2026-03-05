"use client"

export const dynamic = "force-dynamic"

import { useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Auth } from "@supabase/auth-ui-react"
import { ThemeSupa } from "@supabase/auth-ui-shared"
import { createClient } from "@/lib/supabase"

function LoginContent() {
  const supabase     = createClient()
  const searchParams = useSearchParams()
  const router       = useRouter()
  const claim        = searchParams.get("claim")
  const redirect     = searchParams.get("redirect") ?? "/dashboard"

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === "SIGNED_IN") {
        if (claim) {
          // Claim the session then go to dashboard
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
  }, [claim, redirect, router, supabase.auth])

  const origin = typeof window !== "undefined" ? window.location.origin : ""

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

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  )
}
