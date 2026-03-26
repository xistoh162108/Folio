"use client"

import { useEffect, useMemo, useState } from "react"

function ensureSessionId() {
  let sessionId = sessionStorage.getItem("jimin_garden_sess")
  if (!sessionId) {
    sessionId = crypto.randomUUID()
    sessionStorage.setItem("jimin_garden_sess", sessionId)
  }

  return sessionId
}

export function PostLikeButton({
  postId,
  initialCount,
}: {
  postId: string
  initialCount: number
}) {
  const storageKey = useMemo(() => `jimin_garden_like_${postId}`, [postId])
  const [count, setCount] = useState(initialCount)
  const [liked, setLiked] = useState(false)
  const [isPending, setIsPending] = useState(false)
  const [glitching, setGlitching] = useState(false)

  useEffect(() => {
    setLiked(localStorage.getItem(storageKey) === "1")
  }, [storageKey])

  const handleLike = async () => {
    if (liked || isPending) {
      return
    }

    setIsPending(true)

    try {
      const sessionId = ensureSessionId()
      const response = await fetch(`/api/posts/${postId}/like`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sessionId }),
      })

      const result = (await response.json()) as { count?: number; liked?: boolean; alreadyLiked?: boolean }

      if (!response.ok) {
        return
      }

      setCount(typeof result.count === "number" ? result.count : count + 1)
      setLiked(true)
      localStorage.setItem(storageKey, "1")
      setGlitching(true)
      window.setTimeout(() => setGlitching(false), 200)
    } finally {
      setIsPending(false)
    }
  }

  return (
    <div className="relative inline-flex items-center gap-4">
      <button
        type="button"
        onClick={handleLike}
        disabled={liked || isPending}
        className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
          liked
            ? "border-[#D4FF00]/25 bg-[#D4FF00]/10 text-[#D4FF00]"
            : "border-white/10 text-zinc-300 hover:border-[#D4FF00]/40 hover:text-[#D4FF00]"
        }`}
      >
        [ +1 ]
      </button>
      <span className="text-sm text-zinc-500">{count} likes</span>
      {glitching ? (
        <div className="pointer-events-none absolute -inset-2 rounded-full border border-[#D4FF00]/50 bg-[#D4FF00]/10 blur-[1px]" />
      ) : null}
    </div>
  )
}
