"use client"

import { useState } from "react"

export function CreateWorkspaceForm() {
  const [name,    setName]    = useState("")
  const [loading, setLoading] = useState(false)
  const [result,  setResult]  = useState<{ id: string; invite_code: string } | null>(null)
  const [error,   setError]   = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || loading) return
    setLoading(true)
    setError("")
    try {
      const res  = await fetch("/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Failed to create workspace")
      setResult(data)
      setName("")
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex gap-2">
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Workspace name"
          className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-600"
        />
        <button
          type="submit"
          disabled={loading || !name.trim()}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm rounded-lg transition-colors"
        >
          {loading ? "Creating…" : "Create"}
        </button>
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
      {result && (
        <div className="rounded-lg bg-green-900/20 border border-green-700 p-3 text-sm text-green-300 space-y-1">
          <div>Workspace created!</div>
          <div className="font-mono text-xs text-green-400">
            Invite code: <span className="font-bold">{result.invite_code}</span>
          </div>
          <button
            type="button"
            onClick={() => navigator.clipboard.writeText(result.invite_code)}
            className="text-xs text-green-500 hover:text-green-300 underline"
          >
            Copy invite code
          </button>
        </div>
      )}
    </form>
  )
}

export function JoinWorkspaceForm() {
  const [code,    setCode]    = useState("")
  const [loading, setLoading] = useState(false)
  const [joined,  setJoined]  = useState(false)
  const [error,   setError]   = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!code.trim() || loading) return
    setLoading(true)
    setError("")
    try {
      const res  = await fetch("/api/workspaces/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteCode: code.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Failed to join workspace")
      setJoined(true)
      setCode("")
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex gap-2">
        <input
          type="text"
          value={code}
          onChange={e => setCode(e.target.value)}
          placeholder="Enter invite code"
          className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-600"
        />
        <button
          type="submit"
          disabled={loading || !code.trim()}
          className="px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white text-sm rounded-lg transition-colors"
        >
          {loading ? "Joining…" : "Join"}
        </button>
      </div>
      {error  && <p className="text-xs text-red-400">{error}</p>}
      {joined && <p className="text-xs text-green-400">Joined workspace! Refresh to see team badges.</p>}
    </form>
  )
}
