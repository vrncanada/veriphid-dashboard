import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Veriphid — Content Provenance Dashboard",
  description: "Verify and explore Veriphid human-authorship manifests",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <nav className="border-b border-slate-800 px-6 py-3 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <span className="text-blue-400 font-bold text-lg tracking-tight">Veriphid</span>
            <span className="text-slate-600 text-sm">Dashboard</span>
          </a>
          <div className="flex items-center gap-4 text-sm">
            <a href="/dashboard" className="text-slate-400 hover:text-slate-200 transition-colors">My Sessions</a>
            <a href="/dashboard/analytics" className="text-slate-400 hover:text-slate-200 transition-colors">Analytics</a>
            <a href="/dashboard/badges" className="text-slate-400 hover:text-slate-200 transition-colors">My Badges</a>
            <a href="/dashboard/workspace" className="text-slate-400 hover:text-slate-200 transition-colors">Workspace</a>
            <a href="/login" className="text-slate-400 hover:text-slate-200 transition-colors">Login</a>
          </div>
        </nav>
        <main className="max-w-6xl mx-auto px-6 py-8">
          {children}
        </main>
      </body>
    </html>
  )
}
