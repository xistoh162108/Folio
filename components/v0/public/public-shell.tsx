"use client"

import type { ReactNode } from "react"
import { useLayoutEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"

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

    const measureFrame = () => {
      const rect = element.getBoundingClientRect()
      setRuntimeFrame({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      })
    }

    measureFrame()
    const resizeObserver = new ResizeObserver(measureFrame)
    resizeObserver.observe(element)
    window.addEventListener("resize", measureFrame)

    return () => {
      resizeObserver.disconnect()
      window.removeEventListener("resize", measureFrame)
    }
  }, [])

  useRegisterV0Experience({
    layout: "public",
    descriptor: resolvedRuntimeDescriptor,
    frame: runtimeFrame,
    slot: rightPanelRef.current,
    isDarkMode: resolvedIsDarkMode,
  })

  return (
    <div className={`relative flex h-[100svh] min-h-[100svh] flex-col overflow-hidden ${bgColor} ${textColor}`}>
      <header
        className={`relative z-20 flex items-center justify-between border-b px-4 py-4 font-mono sm:px-6 md:px-8 ${borderColor}`}
      >
        <h1 className="text-sm">{brandLabel}</h1>

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

      <div className="font-mono flex min-h-0 flex-1 flex-col">
        <nav
          data-v0-public-strip
          className={`flex items-center gap-1 overflow-x-auto border-b px-4 py-3 text-xs sm:px-6 md:px-8 ${borderColor}`}
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

        <div className="flex min-h-0 flex-1 flex-col md:flex-row">
          <div
            data-v0-shell-primary
            className="relative order-2 z-20 min-h-0 min-w-0 flex-1 overflow-y-auto md:order-1 md:h-full md:flex-none md:w-[56%] md:overflow-hidden lg:w-1/2"
          >
            {children}
          </div>
          <div
            ref={rightPanelRef}
            data-v0-jitter-slot
            className={`relative order-1 h-40 min-h-[10rem] w-full shrink-0 overflow-hidden border-b sm:h-52 md:order-2 md:h-full md:min-h-0 md:flex-none md:w-[44%] md:border-b-0 lg:w-1/2 ${borderColor}`}
            aria-hidden="true"
          />
        </div>
      </div>
    </div>
  )
}
