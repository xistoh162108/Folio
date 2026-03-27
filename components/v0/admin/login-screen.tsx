"use client"

import { useLayoutEffect, useRef, useState, useTransition } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"

import {
  ADMIN_ACCESS_RUNTIME_DESCRIPTOR,
  type V0RuntimeFrame,
  useRegisterV0Experience,
} from "@/components/v0/runtime/v0-experience-runtime"
import { useV0ThemeController } from "@/components/v0/use-v0-theme-controller"

interface LoginScreenProps {
  isDarkMode?: boolean
  brandLabel?: string
  redirectPath?: string
}

export function LoginScreen({
  isDarkMode = true,
  brandLabel = "xistoh.log",
  redirectPath = "/admin/analytics",
}: LoginScreenProps) {
  const { isDarkMode: resolvedIsDarkMode, toggleTheme } = useV0ThemeController(isDarkMode)
  const rightPanelRef = useRef<HTMLDivElement>(null)
  const [runtimeFrame, setRuntimeFrame] = useState<V0RuntimeFrame | null>(null)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const bgColor = resolvedIsDarkMode ? "bg-black" : "bg-white"
  const textColor = resolvedIsDarkMode ? "text-white" : "text-black"
  const borderColor = resolvedIsDarkMode ? "border-white/20" : "border-black/20"
  const mutedText = resolvedIsDarkMode ? "text-white/50" : "text-black/50"
  const hoverBg = resolvedIsDarkMode ? "hover:bg-white/5" : "hover:bg-black/5"
  const activeBg = resolvedIsDarkMode ? "bg-white/10" : "bg-black/10"

  useLayoutEffect(() => {
    const measureFrame = () => {
      const element = rightPanelRef.current
      if (!element) {
        return
      }

      const rect = element.getBoundingClientRect()
      setRuntimeFrame({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      })
    }

    measureFrame()
    window.addEventListener("resize", measureFrame)

    return () => window.removeEventListener("resize", measureFrame)
  }, [])

  useRegisterV0Experience({
    layout: "admin-access",
    descriptor: ADMIN_ACCESS_RUNTIME_DESCRIPTOR,
    frame: runtimeFrame,
    isDarkMode: resolvedIsDarkMode,
  })

  return (
    <div className={`relative h-screen overflow-hidden ${bgColor} ${textColor}`}>
      <header className={`flex items-center justify-between px-8 py-4 border-b ${borderColor} font-mono relative z-20`}>
        <h1 className="text-sm">{brandLabel}</h1>

        <div className="flex items-center gap-6">
          <div className="flex text-xs">
            <button
              onClick={() => router.push("/")}
              className={`px-3 py-1 border-l border-t border-b ${borderColor} transition-colors ${hoverBg}`}
            >
              public
            </button>
            <button className={`px-3 py-1 border ${borderColor} transition-colors ${activeBg}`}>admin</button>
          </div>

          <button onClick={toggleTheme} className={`text-xs ${hoverBg} px-2 py-1 transition-colors`} aria-label="Toggle theme">
            {resolvedIsDarkMode ? "[light]" : "[dark]"}
          </button>
        </div>
      </header>

      <div className="flex font-mono h-[calc(100vh-57px)]">
        <div className="w-1/2 min-w-0 px-8 py-6 flex flex-col justify-center relative z-20">
          <div className="space-y-8 max-w-md">
            <section className="space-y-3">
              <p className={`text-xs ${mutedText}`}>// admin</p>
              <h2 className="text-lg">System Access</h2>
            </section>

            {error ? <p className="text-xs text-red-400">[ERROR] {error}</p> : null}

            <form
              onSubmit={(event) => {
                event.preventDefault()
                setError("")
                startTransition(async () => {
                  const result = await signIn("credentials", {
                    email,
                    password,
                    redirect: false,
                  })

                  if (result?.error) {
                    setError("Invalid credentials or server unavailable.")
                    return
                  }

                  router.push(redirectPath)
                  router.refresh()
                })
              }}
              className="space-y-4"
            >
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Identify_"
                className={`w-full bg-transparent border-b ${borderColor} py-2 text-sm outline-none transition-colors ${
                  resolvedIsDarkMode ? "placeholder:text-white/30 focus:border-[#D4FF00]/50" : "placeholder:text-black/30 focus:border-[#3F5200]/50"
                }`}
              />
              <input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Passphrase_"
                type="password"
                className={`w-full bg-transparent border-b ${borderColor} py-2 text-sm outline-none transition-colors ${
                  resolvedIsDarkMode ? "placeholder:text-white/30 focus:border-[#D4FF00]/50" : "placeholder:text-black/30 focus:border-[#3F5200]/50"
                }`}
              />
              <button type="submit" disabled={isPending} className={`text-xs px-3 py-2 border ${borderColor} ${hoverBg}`}>
                {isPending ? "[ authenticating_ ]" : "[ initiate override_ ]"}
              </button>
            </form>
          </div>
        </div>
        <div ref={rightPanelRef} className="w-1/2 shrink-0" aria-hidden="true" />
      </div>
    </div>
  )
}
