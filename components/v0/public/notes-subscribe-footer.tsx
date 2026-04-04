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
  projectInfo: boolean
  log: boolean
}

const initialTopics: TopicState = {
  all: true,
  projectInfo: false,
  log: false,
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
        className="max-w-lg space-y-2 lg:max-w-none"
      >
        <div className="flex flex-col items-start gap-3 2xl:flex-row 2xl:items-center 2xl:gap-6">
          <div className="flex min-w-0 w-full flex-wrap items-center gap-3 md:gap-4 2xl:flex-1 2xl:flex-nowrap">
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
              className={`px-3 py-1.5 text-xs border ${borderColor} bg-transparent outline-none min-w-[12rem] flex-1 md:w-40 md:flex-none ${
                isDarkMode ? "text-white placeholder:text-white/30" : "text-black placeholder:text-black/30"
              } ${pending ? "opacity-50" : ""}`}
            />
            <button
              type="submit"
              disabled={pending}
              className={`shrink-0 px-3 py-1.5 text-xs border ${borderColor} ${hoverBg} ${pending ? "opacity-50" : ""}`}
            >
              {pending ? "[...]" : "Subscribe"}
            </button>
          </div>
          <div className="flex min-w-fit flex-wrap items-center gap-3 text-xs md:flex-nowrap md:gap-4 md:whitespace-nowrap 2xl:ml-auto">
            <label className="flex shrink-0 items-center gap-1 whitespace-nowrap cursor-pointer">
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
            <label className="flex shrink-0 items-center gap-1 whitespace-nowrap cursor-pointer">
              <button
                type="button"
                onClick={() => toggleTopic("projectInfo")}
                className={`w-3 h-3 border ${borderColor} flex items-center justify-center text-[10px] ${
                  topics.projectInfo ? (isDarkMode ? "bg-white/20" : "bg-black/20") : ""
                }`}
              >
                {topics.projectInfo ? "*" : ""}
              </button>
              <span className={mutedText}>Project &amp; Info</span>
            </label>
            <label className="flex shrink-0 items-center gap-1 whitespace-nowrap cursor-pointer">
              <button
                type="button"
                onClick={() => toggleTopic("log")}
                className={`w-3 h-3 border ${borderColor} flex items-center justify-center text-[10px] ${
                  topics.log ? (isDarkMode ? "bg-white/20" : "bg-black/20") : ""
                }`}
              >
                {topics.log ? "*" : ""}
              </button>
              <span className={mutedText}>Log</span>
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
