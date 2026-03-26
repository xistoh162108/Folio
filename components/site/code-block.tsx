"use client"

import { useState } from "react"

export function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1200)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#2c3854] bg-[#151a2a]">
      <button
        type="button"
        onClick={handleCopy}
        className="absolute right-3 top-3 rounded-full border border-[#7aa2f7]/30 bg-[#101522]/90 px-3 py-1 text-xs uppercase tracking-[0.16em] text-[#7dcfff] transition hover:border-[#7dcfff]/50 hover:text-white"
      >
        {copied ? "[copied]" : "[y] copy"}
      </button>
      <pre className="overflow-x-auto px-4 pb-4 pt-12 text-sm leading-7 text-[#c0caf5]">
        <code>{code}</code>
      </pre>
    </div>
  )
}
