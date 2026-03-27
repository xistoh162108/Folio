"use client"

import type { ReactNode } from "react"
import { useLayoutEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"

import {
  getDefaultAdminRuntimeDescriptor,
  type V0RuntimeDescriptor,
  type V0RuntimeFrame,
  useRegisterV0Experience,
} from "@/components/v0/runtime/v0-experience-runtime"
import { useV0ThemeController } from "@/components/v0/use-v0-theme-controller"

export type V0AdminSection = "overview" | "content" | "manage-posts" | "newsletter" | "settings" | "community"
type V0AdminSidebarSection = V0AdminSection

interface AdminShellProps {
  children: ReactNode
  currentSection: V0AdminSection | null
  isDarkMode?: boolean
  isPageLoading?: boolean
  loadingText?: string
  brandLabel?: string
  onNavigateSection?: (section: V0AdminSection) => void
  onPublicClick?: () => void
  onToggleTheme?: () => void
  runtimeDescriptor?: V0RuntimeDescriptor | null
}

const adminItems: Array<{ key: V0AdminSidebarSection; label: string }> = [
  { key: "overview", label: "Analytics" },
  { key: "content", label: "[+] New Content" },
  { key: "manage-posts", label: "Manage Posts" },
  { key: "newsletter", label: "Newsletter" },
  { key: "settings", label: "Profile / CV" },
  { key: "community", label: "Community" },
]

export function AdminShell({
  children,
  currentSection,
  isDarkMode = true,
  isPageLoading = false,
  loadingText = "",
  brandLabel = "xistoh.log",
  onNavigateSection,
  onPublicClick,
  onToggleTheme,
  runtimeDescriptor,
}: AdminShellProps) {
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
  const mutedText = resolvedIsDarkMode ? "text-white/50" : "text-black/50"
  const resolvedRuntimeDescriptor = useMemo(
    () => runtimeDescriptor ?? getDefaultAdminRuntimeDescriptor(currentSection),
    [currentSection, runtimeDescriptor],
  )
  const navigateSection =
    onNavigateSection ??
    ((section: V0AdminSection) => {
      const href =
        section === "overview"
          ? "/admin/analytics"
          : section === "content"
            ? "/admin/content"
          : section === "manage-posts"
            ? "/admin/posts"
            : section === "newsletter"
              ? "/admin/newsletter"
              : section === "settings"
                ? "/admin/settings"
                : section === "community"
                  ? "/admin/community"
                  : "/admin/posts"
      router.push(href)
    })
  const openPublic = onPublicClick ?? (() => router.push("/"))
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
    layout: "admin",
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
            <button
              onClick={openPublic}
              className={`px-3 py-1 border-l border-t border-b ${borderColor} transition-colors ${hoverBg}`}
            >
              public
            </button>
            <button className={`px-3 py-1 border ${borderColor} transition-colors ${activeBg}`}>admin</button>
          </div>

          <button
            onClick={toggleTheme}
            className={`text-xs ${hoverBg} px-2 py-1 transition-colors`}
            aria-label="Toggle theme"
          >
            {resolvedIsDarkMode ? "[light]" : "[dark]"}
          </button>
        </div>
      </header>

      <div className="flex font-mono h-[calc(100vh-57px)]">
        <aside className={`w-52 border-r ${borderColor} p-4 space-y-1 shrink-0`}>
          <p className={`text-xs ${mutedText} mb-4`}>// admin</p>
          {adminItems.map((item) => (
            <button
              key={item.key}
              onClick={() => navigateSection(item.key)}
              className={`w-full text-left px-3 py-2 text-xs transition-colors ${
                currentSection === item.key ? activeBg : hoverBg
              }`}
            >
              {item.label}
            </button>
          ))}
          {isPageLoading ? (
            <p className={`text-xs mt-4 ${resolvedIsDarkMode ? "text-[#D4FF00]" : "text-[#3F5200]"}`}>{loadingText}</p>
          ) : null}
        </aside>

        <div className="flex flex-1 min-w-0">
          <div className="w-1/2 min-w-0 h-full relative z-20">{children}</div>
          <div ref={rightPanelRef} className="w-1/2 shrink-0" aria-hidden="true" />
        </div>
      </div>
    </div>
  )
}
