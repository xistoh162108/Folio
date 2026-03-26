"use client"

import { useEffect, useMemo, useState } from "react"

const TOKENS = ["0x1A", "0x7F", "1101", "0110", "A9", "F3", "9b", "2e", "c4", "ff", "10", "7d"]

function buildColumns(width: number) {
  return Array.from({ length: width }, (_, columnIndex) =>
    Array.from({ length: 16 }, (_, rowIndex) => TOKENS[(columnIndex * 3 + rowIndex) % TOKENS.length]).join(" "),
  )
}

export function SignalPanel() {
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const timer = window.setInterval(() => {
      setTick((current) => current + 1)
    }, 180)

    return () => window.clearInterval(timer)
  }, [])

  const columns = useMemo(() => {
    const seeded = buildColumns(5)
    return seeded.map((column, index) => {
      const offset = (tick + index * 7) % column.length
      return `${column.slice(offset)} ${column.slice(0, offset)}`
    })
  }, [tick])

  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-[#D4FF00]/15 bg-[radial-gradient(circle_at_top,_rgba(212,255,0,0.12),_transparent_38%),linear-gradient(160deg,rgba(9,13,7,0.96),rgba(0,0,0,0.96))] p-6 text-[#D4FF00]">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(212,255,0,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(212,255,0,0.04)_1px,transparent_1px)] bg-[size:28px_28px] opacity-40" />
      <div className="absolute inset-0 animate-pulse bg-[radial-gradient(circle_at_center,rgba(212,255,0,0.08),transparent_65%)]" />
      <div className="relative space-y-6 font-mono">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.24em] text-[#D4FF00]/60">Signal Array</p>
            <h2 className="mt-3 text-2xl font-semibold text-[#F2FFD9]">Modern terminal minimalism</h2>
          </div>
          <div className="rounded-full border border-[#D4FF00]/20 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-[#D4FF00]/70">
            online
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-3 rounded-[1.5rem] border border-[#D4FF00]/10 bg-black/35 p-4">
            <p className="text-[11px] uppercase tracking-[0.18em] text-[#D4FF00]/55">Entropy feed</p>
            <div className="grid gap-2 text-[11px] leading-5 text-[#D4FF00]/70">
              {columns.map((column, index) => (
                <p key={`${index}-${tick}`} className="whitespace-pre-wrap break-all">
                  {column}
                </p>
              ))}
            </div>
          </div>

          <div className="space-y-3 rounded-[1.5rem] border border-[#D4FF00]/10 bg-black/35 p-4">
            <p className="text-[11px] uppercase tracking-[0.18em] text-[#D4FF00]/55">Runtime</p>
            <div className="space-y-3 text-sm text-[#F2FFD9]">
              <div className="flex items-center justify-between border-b border-[#D4FF00]/10 pb-2">
                <span className="text-[#D4FF00]/60">shell</span>
                <span>split-panel.desktop</span>
              </div>
              <div className="flex items-center justify-between border-b border-[#D4FF00]/10 pb-2">
                <span className="text-[#D4FF00]/60">content</span>
                <span>notes + projects</span>
              </div>
              <div className="flex items-center justify-between border-b border-[#D4FF00]/10 pb-2">
                <span className="text-[#D4FF00]/60">state</span>
                <span>db-backed</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#D4FF00]/60">signal</span>
                <span>{(tick % 9) + 91}% stable</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
