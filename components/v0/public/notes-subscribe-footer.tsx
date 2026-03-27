"use client"

import { startTransition, useActionState, useState } from "react"

import { requestSubscription } from "@/lib/actions/subscriber.actions"

interface NotesSubscribeFooterProps {
  isDarkMode: boolean
  bgColor: string
  borderColor: string
  hoverBg: string
  mutedText: string
}

type TopicState = {
  all: boolean
  aiInfosec: boolean
  projectsLogs: boolean
}

const initialTopics: TopicState = {
  all: true,
  aiInfosec: false,
  projectsLogs: false,
}

export function V0NotesSubscribeFooter({
  isDarkMode,
  bgColor,
  borderColor,
  hoverBg,
  mutedText,
}: NotesSubscribeFooterProps) {
  const [email, setEmail] = useState("")
  const [honey, setHoney] = useState("")
  const [topics, setTopics] = useState<TopicState>(initialTopics)
  const [state, formAction, pending] = useActionState(
    async (
      _previous: { success?: boolean; message?: string; error?: string } | null,
      payload: { email: string; _honey: string; topics: TopicState },
    ) => {
      const result = await requestSubscription(payload)
      if (result.success) {
        setEmail("")
        setHoney("")
      }
      return result
    },
    null,
  )

  const toggleTopic = (topic: keyof TopicState) => {
    if (topic === "all") {
      setTopics(initialTopics)
      return
    }

    setTopics((previous) => ({
      ...previous,
      all: false,
      [topic]: !previous[topic],
    }))
  }

  return (
    <div className={`fixed bottom-0 left-0 w-1/2 ${bgColor} border-t ${borderColor} px-8 py-4 font-mono z-30`}>
      <form
        onSubmit={(event) => {
          event.preventDefault()
          startTransition(() => formAction({ email, _honey: honey, topics }))
        }}
        className="max-w-lg space-y-2"
      >
        <div className="flex items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <p className={`text-xs ${mutedText}`}>// stay in the loop</p>
            <input
              type="text"
              name="_honey"
              value={honey}
              onChange={(event) => setHoney(event.target.value)}
              style={{ display: "none" }}
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
            />
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@email.com"
              className={`px-3 py-1.5 text-xs border ${borderColor} bg-transparent outline-none w-40 ${
                isDarkMode ? "text-white placeholder:text-white/30" : "text-black placeholder:text-black/30"
              } ${pending ? "opacity-50" : ""}`}
            />
            <button
              type="submit"
              disabled={pending}
              className={`px-3 py-1.5 text-xs border ${borderColor} ${hoverBg} ${pending ? "opacity-50" : ""}`}
            >
              {pending ? "[...]" : "Subscribe"}
            </button>
          </div>
          <div className="flex gap-3 text-xs">
            <label className="flex items-center gap-1 cursor-pointer">
              <button
                type="button"
                onClick={() => toggleTopic("all")}
                className={`w-3 h-3 border ${borderColor} flex items-center justify-center text-[10px] ${
                  topics.all ? (isDarkMode ? "bg-white/20" : "bg-black/20") : ""
                }`}
              >
                {topics.all ? "*" : ""}
              </button>
              <span className={mutedText}>All</span>
            </label>
            <label className="flex items-center gap-1 cursor-pointer">
              <button
                type="button"
                onClick={() => toggleTopic("aiInfosec")}
                className={`w-3 h-3 border ${borderColor} flex items-center justify-center text-[10px] ${
                  topics.aiInfosec ? (isDarkMode ? "bg-white/20" : "bg-black/20") : ""
                }`}
              >
                {topics.aiInfosec ? "*" : ""}
              </button>
              <span className={mutedText}>AI</span>
            </label>
            <label className="flex items-center gap-1 cursor-pointer">
              <button
                type="button"
                onClick={() => toggleTopic("projectsLogs")}
                className={`w-3 h-3 border ${borderColor} flex items-center justify-center text-[10px] ${
                  topics.projectsLogs ? (isDarkMode ? "bg-white/20" : "bg-black/20") : ""
                }`}
              >
                {topics.projectsLogs ? "*" : ""}
              </button>
              <span className={mutedText}>Projects</span>
            </label>
          </div>
        </div>
        {state?.success ? (
          <p className={`text-xs ${isDarkMode ? "text-[#D4FF00]" : "text-[#3F5200]"}`}>[ OK: {state.message} ]</p>
        ) : null}
        {state?.error ? <p className="text-xs text-[#FF3333]">[ ERROR: {state.error} ]</p> : null}
      </form>
    </div>
  )
}
