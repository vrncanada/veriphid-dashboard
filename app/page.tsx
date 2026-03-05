"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function Home() {
  const router = useRouter()
  const [sessionId, setSessionId] = useState("")

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const id = sessionId.trim()
    if (id) router.push(`/verify/${id}`)
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center space-y-10">
      {/* Hero */}
      <div className="space-y-4 max-w-2xl">
        <div className="inline-flex items-center gap-2 text-blue-400 text-sm font-medium bg-blue-950/40 border border-blue-800/50 rounded-full px-4 py-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
          Content Provenance Protocol
        </div>
        <h1 className="text-4xl font-bold text-slate-100 tracking-tight">
          Verify Human Authorship
        </h1>
        <p className="text-lg text-slate-400 leading-relaxed">
          Veriphid generates C2PA-aligned manifests that notarize human effort and oversight.
          Paste a session ID below to verify a manifest — no login required.
        </p>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="w-full max-w-lg space-y-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={sessionId}
            onChange={e => setSessionId(e.target.value)}
            placeholder="Session ID (e.g. 3f2a1b4c-…)"
            className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-slate-200 placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500 transition-colors"
          />
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-500 text-white font-medium px-5 py-3 rounded-lg transition-colors text-sm"
          >
            Verify
          </button>
        </div>
        <p className="text-xs text-slate-600">
          The session ID is shown in the Veriphid extension after signing.
        </p>
      </form>

      {/* Three pillars */}
      <div className="grid grid-cols-3 gap-4 max-w-2xl w-full text-left mt-4">
        {[
          { label: "Direct Composition", desc: "Keystroke-by-keystroke authorship evidenced by dwell, flight, jitter, and correction patterns.", color: "#22c55e" },
          { label: "Human Refinement",   desc: "Editing and annotating existing content — keystroke activity surrounding pastes and revisions.", color: "#f59e0b" },
          { label: "External Influx",    desc: "Content arriving faster than human input speed. Flagged in the manifest, not blocked.", color: "#ef4444" },
        ].map(({ label, desc, color }) => (
          <div key={label} className="rounded-xl bg-slate-800/40 border border-slate-700 p-4 space-y-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
            <div className="text-sm font-semibold text-slate-200">{label}</div>
            <div className="text-xs text-slate-500 leading-relaxed">{desc}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
