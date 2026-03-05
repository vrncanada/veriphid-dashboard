"use client"

import { useEffect, useState } from "react"

interface Props {
  sessionId: string
  seal:      string
  signature: string
  publicKey: string
}

type VerifyState = "verifying" | "valid" | "invalid" | "error"

export function Ed25519VerifyPanel({ sessionId, seal, signature, publicKey }: Props) {
  const [state,   setState]   = useState<VerifyState>("verifying")
  const [errMsg,  setErrMsg]  = useState("")

  useEffect(() => {
    verify().then(setState).catch((err) => {
      setErrMsg(err instanceof Error ? err.message : String(err))
      setState("error")
    })
  }, [sessionId, seal, signature, publicKey])

  async function verify(): Promise<VerifyState> {
    // Decode base64 → Uint8Array
    const b64ToBytes = (b64: string) =>
      Uint8Array.from(atob(b64), c => c.charCodeAt(0))

    const pubKeyBytes = b64ToBytes(publicKey)
    const sigBytes    = b64ToBytes(signature)
    const msgBytes    = new TextEncoder().encode(`${sessionId}:${seal}`)

    const key = await crypto.subtle.importKey(
      "raw",
      pubKeyBytes,
      { name: "Ed25519" },
      false,
      ["verify"],
    )

    const valid = await crypto.subtle.verify("Ed25519", key, sigBytes, msgBytes)
    return valid ? "valid" : "invalid"
  }

  const config: Record<VerifyState, { icon: string; label: string; cls: string }> = {
    verifying: { icon: "⏳", label: "Verifying signature…",  cls: "bg-slate-800/40 border-slate-700 text-slate-400" },
    valid:     { icon: "✓",  label: "Signature valid",        cls: "bg-green-900/20 border-green-700 text-green-400" },
    invalid:   { icon: "✗",  label: "Signature invalid",      cls: "bg-red-900/20  border-red-700   text-red-400"   },
    error:     { icon: "⚠", label: `Verification error${errMsg ? ": " + errMsg : ""}`, cls: "bg-yellow-900/20 border-yellow-700 text-yellow-400" },
  }

  const { icon, label, cls } = config[state]

  return (
    <div className={`rounded-xl border p-4 flex items-center gap-3 text-sm font-medium ${cls}`}>
      <span className="text-lg leading-none">{icon}</span>
      <div>
        <div>{label}</div>
        {state === "valid" && (
          <div className="text-xs text-slate-500 mt-0.5 font-normal">
            Ed25519 signature verified against public key in-browser
          </div>
        )}
      </div>
    </div>
  )
}
