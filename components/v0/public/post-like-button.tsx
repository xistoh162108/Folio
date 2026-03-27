"use client"

import { useEffect, useMemo, useState } from "react"

function ensureSessionId() {
  let sessionId = sessionStorage.getItem("xistoh_log_sess")
  if (!sessionId) {
    sessionId = crypto.randomUUID()
    sessionStorage.setItem("xistoh_log_sess", sessionId)
  }

  return sessionId
}

export function V0PostLikeButton({
  postId,
  initialCount,
  isDarkMode,
}: {
  postId: string
  initialCount: number
  isDarkMode: boolean
}) {
  const storageKey = useMemo(() => `xistoh_log_like_${postId}`, [postId])
  const [count, setCount] = useState(initialCount)
  const [liked, setLiked] = useState(false)
  const [pending, setPending] = useState(false)

  const mutedText = isDarkMode ? "text-white/50" : "text-black/50"
  const hoverBg = isDarkMode ? "hover:bg-white/5" : "hover:bg-black/5"

  useEffect(() => {
    setLiked(localStorage.getItem(storageKey) === "1")
  }, [storageKey])

  const handleLike = async () => {
    if (liked || pending) return

    setPending(true)
    try {
      const sessionId = ensureSessionId()
      const response = await fetch(`/api/posts/${postId}/like`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sessionId }),
      })

      const result = (await response.json()) as { count?: number }
      if (!response.ok) return

      setCount(typeof result.count === "number" ? result.count : count + 1)
      setLiked(true)
      localStorage.setItem(storageKey, "1")
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="flex items-center gap-4 text-xs">
      <button
        type="button"
        onClick={handleLike}
        disabled={liked || pending}
        className={`${hoverBg} px-2 py-1 ${liked ? (isDarkMode ? "text-[#D4FF00]" : "text-[#3F5200]") : ""} ${
          pending ? "opacity-50" : ""
        }`}
      >
        {liked ? "[liked]" : pending ? "[...]" : "[+1]"}
      </button>
      <span className={mutedText}>[likes: {count}]</span>
    </div>
  )
}
