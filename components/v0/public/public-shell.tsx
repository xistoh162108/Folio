"use client"

import type { ReactNode } from "react"
import { useLayoutEffect, useMemo, useRef, useState } from "react"
import { usePathname, useRouter } from "next/navigation"

import {
  getDefaultPublicRuntimeDescriptor,
  type V0RuntimeDescriptor,
  type V0RuntimeFrame,
  useRegisterV0Experience,
} from "@/components/v0/runtime/v0-experience-runtime"
import { useV0ThemeController } from "@/components/v0/use-v0-theme-controller"
import { getV0RouteAccentPalette } from "@/lib/site/v0-route-palette"

export type V0PublicPage = "home" | "notes" | "projects" | "contact"

interface PublicShellProps {
  children: ReactNode
  currentPage?: V0PublicPage | null
  isDarkMode?: boolean
  isPageLoading?: boolean
  loadingText?: string
  brandLabel?: string
  onNavigate?: (page: V0PublicPage) => void
  onAdminClick?: () => void
  onToggleTheme?: () => void
  runtimeDescriptor?: V0RuntimeDescriptor | null
}

export function PublicShell({
  children,
  currentPage = null,
  isDarkMode = true,
  isPageLoading = false,
  loadingText = "",
  brandLabel = "xistoh.log",
  onNavigate,
  onToggleTheme,
  runtimeDescriptor,
}: PublicShellProps) {
  const router = useRouter()
  const pathname = usePathname()
  const theme = useV0ThemeController(isDarkMode)
  const rightPanelRef = useRef<HTMLDivElement>(null)
  const [runtimeFrame, setRuntimeFrame] = useState<V0RuntimeFrame | null>(null)
  const resolvedIsDarkMode = onToggleTheme ? isDarkMode : theme.isDarkMode
  const bgColor = resolvedIsDarkMode ? "bg-black" : "bg-white"
  const textColor = resolvedIsDarkMode ? "text-white" : "text-black"
  const borderColor = resolvedIsDarkMode ? "border-white/20" : "border-black/20"
  const hoverBg = resolvedIsDarkMode ? "hover:bg-white/5" : "hover:bg-black/5"
  const activeBg = resolvedIsDarkMode ? "bg-white/10" : "bg-black/10"
  const routeAccentColor = getV0RouteAccentPalette(
    currentPage === "notes" ? "notes" : currentPage === "projects" ? "projects" : currentPage === "contact" ? "contact" : "default",
    resolvedIsDarkMode,
  ).color
  const resolvedRuntimeDescriptor = useMemo(
    () => runtimeDescriptor ?? getDefaultPublicRuntimeDescriptor(currentPage),
    [currentPage, runtimeDescriptor],
  )
  const navigate =
    onNavigate ??
    ((page: V0PublicPage) => {
      router.push(page === "home" ? "/" : `/${page}`)
    })
  const toggleTheme = onToggleTheme ?? theme.toggleTheme

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
    layout: "public",
    descriptor: resolvedRuntimeDescriptor,
    frame: runtimeFrame,
    slot: rightPanelRef.current,
    isDarkMode: resolvedIsDarkMode,
  })

  return (
    <div
      className={`relative flex min-h-[100svh] flex-col ${bgColor} ${textColor} md:grid md:h-[100svh] md:min-h-[100svh] md:grid-rows-[auto_auto_minmax(0,1fr)] md:overflow-hidden`}
    >
      <header
        className={`relative z-20 flex items-center justify-between border-b px-4 py-4 font-mono sm:px-6 md:px-8 ${borderColor}`}
      >
        <h1>
          <button
            type="button"
            onClick={() => navigate("home")}
            className={`text-sm ${hoverBg} px-2 py-1 -mx-2 -my-1 transition-colors`}
            aria-label="Go to home"
          >
            {brandLabel}
          </button>
        </h1>

        <div className="flex items-center gap-3 sm:gap-6">
          <button
            type="button"
            onClick={toggleTheme}
            className={`text-xs ${hoverBg} px-2 py-1 transition-colors`}
            aria-label="Toggle theme"
          >
            {resolvedIsDarkMode ? "[light]" : "[dark]"}
          </button>
        </div>
      </header>

      <nav
        data-v0-public-strip
        className={`font-mono flex items-center gap-1 overflow-x-auto border-b px-4 py-3 text-xs sm:px-6 md:px-8 ${borderColor}`}
      >
        {(["home", "notes", "projects", "contact"] as V0PublicPage[]).map((page) => (
          <button
            type="button"
            key={page}
            onClick={() => navigate(page)}
            className={`shrink-0 px-3 py-1 transition-colors ${currentPage === page ? activeBg : hoverBg}`}
          >
            /{page}
          </button>
        ))}
        {isPageLoading ? (
          <span className="ml-4 shrink-0" style={{ color: routeAccentColor }}>{loadingText}</span>
        ) : null}
      </nav>

      <div className="font-mono flex min-w-0 flex-col overflow-visible md:min-h-0 md:h-full md:flex-row md:items-stretch md:overflow-hidden">
        <div
          data-v0-shell-primary
          className="relative order-2 z-20 min-w-0 overflow-visible md:order-1 md:min-h-0 md:h-full md:flex-none md:self-stretch md:w-[56%] md:overflow-y-auto md:overflow-x-visible lg:w-1/2"
        >
          {children}
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
