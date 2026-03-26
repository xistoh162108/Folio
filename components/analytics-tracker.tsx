"use client"

import { useEffect, useRef } from "react"
import { usePathname } from "next/navigation"

export function AnalyticsTracker() {
  const pathname = usePathname()
  const latestPathRef = useRef<string | null>(null)

  useEffect(() => {
    if (pathname.startsWith("/admin")) {
      return
    }

    if (latestPathRef.current === pathname && process.env.NODE_ENV === 'development') return
    latestPathRef.current = pathname

    let sessionId = sessionStorage.getItem("jimin_garden_sess")
    if (!sessionId) {
      sessionId = crypto.randomUUID()
      sessionStorage.setItem("jimin_garden_sess", sessionId)
    }

    const startedAt = performance.now()
    let heartbeatSent = false
    const logAnalyticsFailure = async (response: Response) => {
      if (process.env.NODE_ENV !== "development") {
        return
      }

      try {
        const body = (await response.json()) as { error?: string; skipped?: string }
        if (body.skipped) {
          return
        }

        console.warn("[analytics]", body.error ?? `Analytics write failed with ${response.status}.`)
      } catch {
        console.warn("[analytics]", `Analytics write failed with ${response.status}.`)
      }
    }

    const sendEvent = (payload: Record<string, unknown>) => {
      const body = JSON.stringify(payload)
      const blob = new Blob([body], { type: "application/json" })

      if (navigator.sendBeacon?.("/api/analytics", blob)) {
        return
      }

      void fetch("/api/analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        keepalive: true,
      })
        .then(async (response) => {
          if (!response.ok) {
            await logAnalyticsFailure(response)
          }
        })
        .catch((error) => {
          if (process.env.NODE_ENV === "development") {
            console.warn("[analytics]", error)
          }
        })
    }

    const sendHeartbeat = () => {
      if (heartbeatSent) return
      heartbeatSent = true

      sendEvent({
        eventType: "HEARTBEAT",
        sessionId,
        path: pathname,
        duration: Math.max(1, Math.round((performance.now() - startedAt) / 1000)),
        referrer: document.referrer,
        userAgentHint: window.navigator.userAgent,
      })
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        sendHeartbeat()
      }
    }

    sendEvent({
      eventType: "PAGEVIEW",
      sessionId,
      path: pathname,
      referrer: document.referrer,
      userAgentHint: window.navigator.userAgent,
    })

    let pageLoadMs = Math.max(1, Math.round(performance.now() - startedAt))
    const navigationEntry = performance.getEntriesByType("navigation")[0]

    if (navigationEntry && "name" in navigationEntry && "duration" in navigationEntry) {
      try {
        const navigationPath = new URL(String(navigationEntry.name)).pathname
        if (navigationPath === pathname) {
          pageLoadMs = Math.max(1, Math.round(Number(navigationEntry.duration)))
        }
      } catch {
        // Ignore malformed navigation URLs and keep analytics reporting alive.
      }
    }

    sendEvent({
      eventType: "PAGELOAD",
      sessionId,
      path: pathname,
      pageLoadMs,
      referrer: document.referrer,
      userAgentHint: window.navigator.userAgent,
    })

    document.addEventListener("visibilitychange", handleVisibilityChange)
    window.addEventListener("pagehide", sendHeartbeat)

    return () => {
      sendHeartbeat()
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      window.removeEventListener("pagehide", sendHeartbeat)
    }
  }, [pathname])

  return null
}
