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
  onAdminClick,
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
  const resolvedRuntimeDescriptor = useMemo(
    () => runtimeDescriptor ?? getDefaultPublicRuntimeDescriptor(currentPage),
    [currentPage, runtimeDescriptor],
  )
  const navigate =
    onNavigate ??
    ((page: V0PublicPage) => {
      router.push(page === "home" ? "/" : `/${page}`)
    })
  const openAdmin = onAdminClick ?? (() => router.push("/admin/login"))
  const toggleTheme = onToggleTheme ?? theme.toggleTheme

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
    layout: "public",
    descriptor: resolvedRuntimeDescriptor,
    frame: runtimeFrame,
    isDarkMode: resolvedIsDarkMode,
  })

  return (
    <div className={`relative h-screen overflow-hidden ${bgColor} ${textColor}`}>
      <header className={`flex items-center justify-between px-8 py-4 border-b ${borderColor} font-mono relative z-20`}>
        <h1 className="text-sm">{brandLabel}</h1>

        <div className="flex items-center gap-6">
          <div className="flex text-xs">
            <button type="button" className={`px-3 py-1 border-l border-t border-b ${borderColor} transition-colors ${activeBg}`}>
              public
            </button>
            <button
              type="button"
              onClick={openAdmin}
              className={`px-3 py-1 border ${borderColor} transition-colors ${hoverBg}`}
            >
              admin
            </button>
          </div>

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

      <div className="font-mono h-[calc(100vh-57px)] flex flex-col">
        <nav className={`flex items-center gap-1 px-8 py-3 text-xs border-b ${borderColor}`}>
          {(["home", "notes", "projects", "contact"] as V0PublicPage[]).map((page) => (
            <button
              type="button"
              key={page}
              onClick={() => navigate(page)}
              className={`px-3 py-1 transition-colors ${currentPage === page ? activeBg : hoverBg}`}
            >
              /{page}
            </button>
          ))}
          {isPageLoading ? (
            <span className={`ml-4 ${resolvedIsDarkMode ? "text-[#D4FF00]" : "text-[#3F5200]"}`}>{loadingText}</span>
          ) : null}
        </nav>

        <div className="flex flex-1 min-h-0">
          <div className="w-1/2 min-w-0 h-full relative z-20">{children}</div>
          <div ref={rightPanelRef} className="w-1/2 shrink-0" aria-hidden="true" />
        </div>
      </div>
    </div>
  )
}
