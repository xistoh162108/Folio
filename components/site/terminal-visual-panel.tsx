"use client"

import { useMemo } from "react"

function makeRows() {
  const alphabet = "0123456789abcdef"

  return Array.from({ length: 18 }, (_, rowIndex) =>
    Array.from({ length: 42 }, (_, columnIndex) => alphabet[(rowIndex * 7 + columnIndex * 13) % alphabet.length]).join(""),
  )
}

export function TerminalVisualPanel() {
  const rows = useMemo(() => makeRows(), [])

  return (
    <div className="relative h-full overflow-hidden rounded-[2rem] border border-[#D4FF00]/20 bg-[radial-gradient(circle_at_top,rgba(212,255,0,0.18),transparent_40%),linear-gradient(180deg,rgba(12,18,6,0.95),rgba(2,2,2,0.98))] p-6">
      <div className="absolute inset-0 bg-[linear-gradient(transparent_0%,rgba(212,255,0,0.04)_48%,transparent_100%)] opacity-80" />
      <div className="relative flex h-full flex-col justify-between">
        <div className="space-y-2">
          <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-[#D4FF00]/70">Signal panel</p>
          <h2 className="max-w-sm font-mono text-2xl uppercase tracking-[0.12em] text-white">
            Modern terminal minimalism for notes, projects, and logs.
          </h2>
        </div>

        <div className="grid gap-1 font-mono text-[11px] leading-5 text-[#D4FF00]/45">
          {rows.map((row, index) => (
            <div
              key={`row-${index}`}
              className="animate-pulse whitespace-nowrap"
              style={{ animationDuration: `${2 + (index % 5) * 0.8}s` }}
            >
              {row}
            </div>
          ))}
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-black/40 p-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">Mode</p>
            <p className="mt-2 font-mono text-sm text-white">split-panel</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/40 p-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">Accent</p>
            <p className="mt-2 font-mono text-sm text-[#D4FF00]">acid chartreuse</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/40 p-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">Renderer</p>
            <p className="mt-2 font-mono text-sm text-white">db-backed content</p>
          </div>
        </div>
      </div>
    </div>
  )
}
