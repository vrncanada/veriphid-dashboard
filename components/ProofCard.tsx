"use client"

import { useState } from "react"
import type { ProofRow } from "@/lib/supabase"

interface ProofCardProps {
  sessionId:    string
  hcsScore:     number
  existingProof?: ProofRow | null
  /** If provided, shows the generate UI. Omit for read-only verify view. */
  onGenerate?:  (threshold: number) => Promise<void>
}

export function ProofCard({ sessionId, hcsScore, existingProof, onGenerate }: ProofCardProps) {
  const [threshold, setThreshold] = useState(60)
  const [status, setStatus]       = useState<"idle" | "generating" | "done" | "error">("idle")
  const [errorMsg, setErrorMsg]   = useState("")

  const handleGenerate = async () => {
    if (!onGenerate) return
    setStatus("generating")
    setErrorMsg("")
    try {
      await onGenerate(threshold)
      setStatus("done")
    } catch (e) {
      setStatus("error")
      setErrorMsg(e instanceof Error ? e.message : "Proof generation failed")
    }
  }

  if (existingProof) {
    return (
      <div className="rounded-xl bg-green-950/40 border border-green-800/50 p-4 space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-green-400 text-lg">✓</span>
          <span className="text-green-300 font-semibold text-sm">
            ZKP: HCS ≥ {existingProof.threshold} — Proven
          </span>
        </div>
        <p className="text-xs text-green-700">
          This session has a verified zero-knowledge proof that its HCS score meets or exceeds
          the stated threshold. The exact score was never revealed.
        </p>
        <div className="text-[11px] text-slate-500 font-mono break-all">
          Commitment: {existingProof.commitment.slice(0, 24)}…
        </div>
        <div className="text-[11px] text-slate-600">
          Proven {new Date(existingProof.created_at).toLocaleString()}
        </div>
      </div>
    )
  }

  if (!onGenerate) {
    return (
      <div className="rounded-xl bg-slate-800/30 border border-slate-700 p-4">
        <p className="text-sm text-slate-500">No ZKP threshold proof for this session.</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl bg-slate-800/50 border border-slate-700 p-4 space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-slate-300">Zero-Knowledge Threshold Proof</h3>
        <p className="text-xs text-slate-500 mt-1">
          Prove your HCS score meets a threshold without revealing the exact value.
          The proof is generated locally — your score never leaves this browser.
        </p>
      </div>

      <div className="space-y-1">
        <div className="flex justify-between text-xs text-slate-400">
          <span>Threshold: HCS ≥ <strong className="text-slate-200">{threshold}</strong></span>
          <span className={hcsScore >= threshold ? "text-green-400" : "text-red-400"}>
            {hcsScore >= threshold ? `✓ Your score (${hcsScore}) qualifies` : `✗ Your score (${hcsScore}) is below threshold`}
          </span>
        </div>
        <input
          type="range" min={20} max={80} step={5}
          value={threshold}
          onChange={e => setThreshold(Number(e.target.value))}
          disabled={status === "generating"}
          className="w-full accent-blue-500"
        />
        <div className="flex justify-between text-[10px] text-slate-600">
          <span>20 (Boosted)</span>
          <span>60 (Handmade)</span>
          <span>80 (Organic)</span>
        </div>
      </div>

      {status === "error" && (
        <div className="rounded bg-red-950/60 border border-red-800/50 px-3 py-2 text-xs text-red-400">
          {errorMsg || "Proof generation failed. Make sure circuit files are loaded."}
        </div>
      )}

      {status === "done" ? (
        <div className="text-sm text-green-400 flex items-center gap-2">
          <span>✓</span> Proof generated and saved.
        </div>
      ) : (
        <button
          onClick={handleGenerate}
          disabled={status === "generating" || hcsScore < threshold}
          className="w-full rounded-lg bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white text-sm font-medium py-2 transition-colors"
        >
          {status === "generating" ? "Generating proof (~5–15s)…" : "Generate Proof"}
        </button>
      )}
    </div>
  )
}
