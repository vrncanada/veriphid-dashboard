"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase"

function ExtensionAuthContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  const [status, setStatus] = useState<"checking" | "authorizing" | "done" | "error" | "not-logged-in">("checking")

  useEffect(() => {
    if (!token) { setStatus("error"); return }

    const supabase = createClient()

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        setStatus("not-logged-in")
        // Redirect to login, preserving the token so we come back here after auth
        window.location.href = `/login?redirect=/extension-auth?token=${encodeURIComponent(token)}`
        return
      }

      setStatus("authorizing")

      const { error } = await supabase
        .from("link_tokens")
        .update({
          user_id:       session.user.id,
          access_token:  session.access_token,
          refresh_token: session.refresh_token ?? "",
        })
        .eq("token", token)

      setStatus(error ? "error" : "done")
    })
  }, [token])

  return (
    <div className="max-w-sm mx-auto mt-24 text-center space-y-4">
      <div className="text-4xl">
        {status === "done" ? "✓" : status === "error" ? "✗" : "⋯"}
      </div>
      <h1 className="text-xl font-bold text-slate-100">
        {status === "checking"    && "Checking session…"}
        {status === "not-logged-in" && "Redirecting to login…"}
        {status === "authorizing" && "Connecting extension…"}
        {status === "done"        && "Extension connected"}
        {status === "error"       && "Something went wrong"}
      </h1>
      {status === "done" && (
        <p className="text-sm text-slate-400">
          You can close this tab. The Veriphid extension is now connected to your account.
        </p>
      )}
      {status === "error" && (
        <p className="text-sm text-slate-400">
          The link token may have expired. Click "Connect to Dashboard" in the extension again.
        </p>
      )}
    </div>
  )
}

export default function ExtensionAuthPage() {
  return (
    <Suspense>
      <ExtensionAuthContent />
    </Suspense>
  )
}
