"use client"

import { useState, useActionState, startTransition, useEffect } from "react"
import { requestSubscription } from "../lib/actions/subscriber.actions"

interface SubscriptionModuleProps {
  isDarkMode: boolean
  compact?: boolean
}

export function SubscriptionModule({ isDarkMode, compact = false }: SubscriptionModuleProps) {
  const [email, setEmail] = useState("")
  const [honey, setHoney] = useState("")
  const [topics, setTopics] = useState({
    all: true,
    aiInfosec: false,
    projectsLogs: false,
  })
  const [isSubscribed, setIsSubscribed] = useState(false)

  const borderColor = isDarkMode ? "border-white/20" : "border-black/20"
  const mutedText = isDarkMode ? "text-white/50" : "text-black/50"
  const hoverBg = isDarkMode ? "hover:bg-white/5" : "hover:bg-black/5"

  const handleTopicChange = (topic: keyof typeof topics) => {
    if (topic === "all") {
      setTopics({ all: true, aiInfosec: false, projectsLogs: false })
    } else {
      setTopics((prev) => ({
        ...prev,
        all: false,
        [topic]: !prev[topic],
      }))
    }
  }

  const [state, formAction, pending] = useActionState(
    async (prevState: any, payload: { email: string, _honey: string, topics: any }) => {
      return await requestSubscription(payload)
    },
    null
  )

  useEffect(() => {
    if (state?.success) setIsSubscribed(true)
  }, [state])

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    startTransition(() => {
      formAction({ email, _honey: honey, topics })
    })
  }

  // Compact version for home page
  if (compact) {
    return (
      <div className="font-mono">
        {isSubscribed ? (
          <p className={`text-xs ${isDarkMode ? "text-green-400" : "text-green-600"}`}>
            [*] {state?.message ?? "Verification email sent. Check your inbox."}
          </p>
        ) : (
          <form onSubmit={handleSubscribe} className="space-y-2">
            <p className={`text-xs ${mutedText}`}>// newsletter</p>
            <div className="flex gap-2">
              <input
                type="text"
                name="_honey"
                value={honey}
                onChange={(e) => setHoney(e.target.value)}
                style={{ display: "none" }}
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                className={`w-40 px-2 py-1 text-xs border bg-transparent outline-none transition-colors ${borderColor} ${
                  isDarkMode
                    ? "text-white placeholder:text-white/30"
                    : "text-black placeholder:text-black/30"
                }`}
              />
              <button
                type="submit"
                disabled={pending}
                className={`px-2 py-1 text-xs border transition-colors ${pending ? "opacity-50" : ""} ${borderColor} ${hoverBg}`}
              >
                {pending ? "[...]" : "->"}
              </button>
            </div>
            {state?.error && <p className="text-[#FF3333] text-xs opacity-90 mt-1">[ ERROR: {state.error} ]</p>}
          </form>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4 font-mono">
      <div>
        <p className={`text-xs ${mutedText}`}>// subscribe</p>
        <p className="text-sm mt-1">Stay in the loop</p>
      </div>

      {isSubscribed ? (
        <p className={`text-sm ${isDarkMode ? "text-green-400" : "text-green-600"}`}>
          [*] {state?.message ?? "Verification email sent. Check your inbox."}
        </p>
      ) : (
        <form onSubmit={handleSubscribe} className="space-y-4">
          <div className="flex gap-2">
            <input
              type="text"
              name="_honey"
              value={honey}
              onChange={(e) => setHoney(e.target.value)}
              style={{ display: "none" }}
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
            />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              className={`flex-1 px-3 py-2 text-sm border bg-transparent outline-none transition-colors ${borderColor} ${
                isDarkMode
                  ? "text-white placeholder:text-white/30 focus:border-white/40"
                  : "text-black placeholder:text-black/30 focus:border-black/40"
              }`}
            />
            <button
              type="submit"
              disabled={pending}
              className={`px-4 py-2 text-sm border transition-colors ${pending ? "opacity-50" : ""} ${borderColor} ${hoverBg}`}
            >
              {pending ? "Transmitting..." : "Subscribe"}
            </button>
          </div>
          {state?.error && <p className="text-[#FF3333] text-xs opacity-90">[ SYS_ERROR: {state.error} ]</p>}

          <div className="flex flex-wrap gap-4 text-xs">
            <label className="flex items-center gap-2 cursor-pointer">
              <span
                onClick={() => handleTopicChange("all")}
                className={`w-4 h-4 border flex items-center justify-center cursor-pointer ${borderColor} ${
                  topics.all ? (isDarkMode ? "bg-white/20" : "bg-black/20") : ""
                }`}
              >
                {topics.all && <span>*</span>}
              </span>
              <span>All Seeds (Default)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <span
                onClick={() => handleTopicChange("aiInfosec")}
                className={`w-4 h-4 border flex items-center justify-center cursor-pointer ${borderColor} ${
                  topics.aiInfosec ? (isDarkMode ? "bg-white/20" : "bg-black/20") : ""
                }`}
              >
                {topics.aiInfosec && <span>*</span>}
              </span>
              <span>AI &amp; InfoSec</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <span
                onClick={() => handleTopicChange("projectsLogs")}
                className={`w-4 h-4 border flex items-center justify-center cursor-pointer ${borderColor} ${
                  topics.projectsLogs ? (isDarkMode ? "bg-white/20" : "bg-black/20") : ""
                }`}
              >
                {topics.projectsLogs && <span>*</span>}
              </span>
              <span>Projects &amp; Logs</span>
            </label>
          </div>
        </form>
      )}
    </div>
  )
}
