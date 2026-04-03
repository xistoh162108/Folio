"use client"

import { useMemo, useState } from "react"

interface RssSubscribeActionsProps {
  feedPath: "/notes/rss.xml" | "/projects/rss.xml"
  isDarkMode: boolean
}

export function RssSubscribeActions({ feedPath, isDarkMode }: RssSubscribeActionsProps) {
  const [status, setStatus] = useState<string | null>(null)
  const mutedText = isDarkMode ? "text-white/50" : "text-black/50"
  const borderColor = isDarkMode ? "border-white/20" : "border-black/20"
  const hoverBg = isDarkMode ? "hover:bg-white/5" : "hover:bg-black/5"
  const feedUrl = useMemo(
    () => (typeof window === "undefined" ? feedPath : new URL(feedPath, window.location.origin).toString()),
    [feedPath],
  )

  async function handleCopyFeed() {
    try {
      await navigator.clipboard.writeText(feedUrl)
      setStatus("[copied]")
    } catch {
      setStatus("[copy_failed]")
    }
  }

  return (
    <div className={`flex flex-wrap items-center gap-2 text-xs ${mutedText}`}>
      <span>// subscribe</span>
      <a href={feedPath} className={`border px-2 py-1 ${borderColor} ${hoverBg}`}>
        [rss]
      </a>
      <a href={`feed:${feedUrl}`} className={`border px-2 py-1 ${borderColor} ${hoverBg}`}>
        [reader]
      </a>
      <button type="button" onClick={handleCopyFeed} className={`border px-2 py-1 ${borderColor} ${hoverBg}`}>
        [copy-url]
      </button>
      {status ? <span>{status}</span> : null}
    </div>
  )
}
