"use client"

import { useLayoutEffect, useRef, useState, useTransition } from "react"
import { signIn } from "next-auth/react"
import { usePathname, useRouter } from "next/navigation"

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
  const pathname = usePathname()
  const bgColor = resolvedIsDarkMode ? "bg-black" : "bg-white"
  const textColor = resolvedIsDarkMode ? "text-white" : "text-black"
  const borderColor = resolvedIsDarkMode ? "border-white/20" : "border-black/20"
  const mutedText = resolvedIsDarkMode ? "text-white/50" : "text-black/50"
  const hoverBg = resolvedIsDarkMode ? "hover:bg-white/5" : "hover:bg-black/5"

  useLayoutEffect(() => {
    const element = rightPanelRef.current
    if (!element) {
      return
    }

    let isActive = true
    let firstFrame = 0
    let secondFrame = 0

    const measureFrame = () => {
      if (!isActive) {
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

    const scheduleDeferredMeasure = () => {
      window.cancelAnimationFrame(firstFrame)
      window.cancelAnimationFrame(secondFrame)
      firstFrame = window.requestAnimationFrame(() => {
        secondFrame = window.requestAnimationFrame(measureFrame)
      })
    }

    measureFrame()
    scheduleDeferredMeasure()
    const resizeObserver = new ResizeObserver(scheduleDeferredMeasure)
    resizeObserver.observe(element)
    window.addEventListener("resize", scheduleDeferredMeasure)
    document.fonts?.ready.then(() => {
      if (isActive) {
        scheduleDeferredMeasure()
      }
    }).catch(() => {})

    return () => {
      isActive = false
      window.cancelAnimationFrame(firstFrame)
      window.cancelAnimationFrame(secondFrame)
      resizeObserver.disconnect()
      window.removeEventListener("resize", scheduleDeferredMeasure)
    }
  }, [pathname])

  useRegisterV0Experience({
    layout: "admin-access",
    descriptor: ADMIN_ACCESS_RUNTIME_DESCRIPTOR,
    frame: runtimeFrame,
    slot: rightPanelRef.current,
    isDarkMode: resolvedIsDarkMode,
  })

  return (
    <div className={`relative grid h-[100svh] min-h-[100svh] grid-rows-[auto_minmax(0,1fr)] overflow-hidden ${bgColor} ${textColor}`}>
      <header
        className={`relative z-20 flex items-center justify-between border-b px-4 py-4 font-mono sm:px-6 md:px-8 ${borderColor}`}
      >
        <h1 className="text-sm">{brandLabel}</h1>

        <div className="flex items-center gap-3 sm:gap-6">
          <button onClick={toggleTheme} className={`text-xs ${hoverBg} px-2 py-1 transition-colors`} aria-label="Toggle theme">
            {resolvedIsDarkMode ? "[light]" : "[dark]"}
          </button>
        </div>
      </header>

      <div className="flex min-h-0 min-w-0 flex-col overflow-hidden font-mono md:h-full md:flex-row md:items-stretch">
        <div className="relative order-2 z-20 flex min-h-0 min-w-0 flex-1 flex-col justify-center px-4 py-6 sm:px-6 md:order-1 md:h-full md:flex-none md:self-stretch md:w-[56%] md:px-8 lg:w-1/2">
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
        <div
          ref={rightPanelRef}
          data-v0-jitter-slot
          className={`relative order-1 h-40 min-h-[10rem] w-full shrink-0 overflow-hidden border-b sm:h-52 md:order-2 md:h-full md:min-h-0 md:flex-none md:self-stretch md:w-[44%] md:border-b-0 lg:w-1/2 ${borderColor}`}
          aria-hidden="true"
        />
      </div>
    </div>
  )
}
