"use client"

import { useState } from "react"
import type { ManifestRow } from "@/lib/supabase"

interface SignatureCardProps {
  manifest: ManifestRow
}

export function SignatureCard({ manifest }: SignatureCardProps) {
  const [copied, setCopied] = useState(false)

  const copy = async (text: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="rounded-xl bg-slate-800/50 border border-slate-700 p-4 space-y-3">
      <h3 className="text-sm font-semibold text-slate-300">Ed25519 Signature</h3>

      <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-xs">
        <span className="text-slate-500">Algorithm</span>
        <span className="text-slate-300 font-mono">{manifest.algorithm}</span>

        <span className="text-slate-500">Signed at</span>
        <span className="text-slate-300">{new Date(manifest.signed_at).toLocaleString()}</span>

        <span className="text-slate-500">Session ID</span>
        <span className="text-slate-300 font-mono break-all">{manifest.session_id}</span>

        <span className="text-slate-500">Seal (SHA-256)</span>
        <span className="text-slate-300 font-mono break-all text-[11px]">{manifest.seal}</span>

        <span className="text-slate-500">Signature</span>
        <div className="flex items-start gap-2">
          <span className="text-slate-300 font-mono break-all text-[11px]">
            {manifest.signature.slice(0, 32)}…
          </span>
          <button
            onClick={() => copy(manifest.signature)}
            className="flex-shrink-0 text-slate-500 hover:text-slate-200 transition-colors text-[10px] border border-slate-600 rounded px-1.5 py-0.5"
          >
            {copied ? "✓" : "Copy"}
          </button>
        </div>

        <span className="text-slate-500">Public key</span>
        <span className="text-slate-300 font-mono break-all text-[11px]">{manifest.public_key}</span>
      </div>

      <p className="text-[11px] text-slate-600">
        Verify offline: decode signature + public key from base64, verify Ed25519(
        <code className="text-slate-500">{manifest.session_id.slice(0, 8)}…:{manifest.seal.slice(0, 8)}…</code>
        )
      </p>
    </div>
  )
}
