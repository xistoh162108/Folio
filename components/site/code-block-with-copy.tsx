"use client"

import { useState } from "react"

export function CodeBlockWithCopy({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-[#7AA2F7]/20 bg-[#111827] shadow-[0_24px_80px_rgba(17,24,39,0.45)]">
      <div className="flex items-center justify-between border-b border-white/5 bg-[#0B1120] px-4 py-3">
        <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#7DCFFF]">Tokyo Night</span>
        <button
          type="button"
          onClick={handleCopy}
          className="rounded-full border border-[#7AA2F7]/30 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.16em] text-[#C0CAF5] transition hover:border-[#7AA2F7]/60 hover:text-white"
        >
          [{copied ? "copied" : "y"}]
        </button>
      </div>
      <pre className="overflow-x-auto px-4 py-5 text-sm leading-7 text-[#C0CAF5]">
        <code>{code}</code>
      </pre>
    </div>
  )
}
