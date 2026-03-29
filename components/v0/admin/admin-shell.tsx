"use client"

import type { ReactNode } from "react"
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import { usePathname, useRouter } from "next/navigation"

import {
  getDefaultAdminRuntimeDescriptor,
  type V0RuntimeDescriptor,
  type V0RuntimeFrame,
  useRegisterV0Experience,
} from "@/components/v0/runtime/v0-experience-runtime"
import { useV0ThemeController } from "@/components/v0/use-v0-theme-controller"
import { completeAdminNavigation, recordAdminNavigationStart } from "@/lib/ops/admin-performance-client"

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

function getAdminSectionHref(section: V0AdminSection) {
  return section === "overview"
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
}

function getAdminIdlePrefetchTargets(currentSection: V0AdminSection | null): V0AdminSection[] {
  switch (currentSection) {
    case "overview":
      return ["manage-posts", "settings"]
    case "content":
      return ["manage-posts", "settings"]
    case "manage-posts":
      return ["content", "settings"]
    case "newsletter":
      return ["overview", "settings"]
    case "settings":
      return ["overview", "manage-posts"]
    case "community":
      return ["overview", "manage-posts"]
    default:
      return ["overview", "manage-posts"]
  }
}

export function AdminShell({
  children,
  currentSection,
  isDarkMode = true,
  isPageLoading = false,
  loadingText = "",
  brandLabel = "xistoh.log",
  onNavigateSection,
  onToggleTheme,
  runtimeDescriptor,
}: AdminShellProps) {
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
  const mutedText = resolvedIsDarkMode ? "text-white/50" : "text-black/50"
  const resolvedRuntimeDescriptor = useMemo(
    () => runtimeDescriptor ?? getDefaultAdminRuntimeDescriptor(currentSection),
    [currentSection, runtimeDescriptor],
  )
  const idlePrefetchTargets = useMemo(
    () => getAdminIdlePrefetchTargets(currentSection).map((section) => getAdminSectionHref(section)),
    [currentSection],
  )
  const navigateSection =
    onNavigateSection ??
    ((section: V0AdminSection) => {
      router.push(getAdminSectionHref(section))
    })
  const toggleTheme = onToggleTheme ?? theme.toggleTheme

  useEffect(() => {
    completeAdminNavigation(pathname)
  }, [pathname])

  useEffect(() => {
    if (onNavigateSection) {
      return
    }

    const prefetchTargets = [...new Set(idlePrefetchTargets)]
    const prefetch = () => {
      for (const href of prefetchTargets) {
        router.prefetch(href)
      }
    }

    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      const callbackId = window.requestIdleCallback(prefetch, { timeout: 1500 })
      return () => window.cancelIdleCallback(callbackId)
    }

    const timeoutId = globalThis.setTimeout(prefetch, 900)
    return () => globalThis.clearTimeout(timeoutId)
  }, [idlePrefetchTargets, onNavigateSection, router])

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
    layout: "admin",
    descriptor: resolvedRuntimeDescriptor,
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
          <button
            onClick={toggleTheme}
            className={`text-xs ${hoverBg} px-2 py-1 transition-colors`}
            aria-label="Toggle theme"
          >
            {resolvedIsDarkMode ? "[light]" : "[dark]"}
          </button>
        </div>
      </header>

      <div className="flex min-h-0 min-w-0 flex-col overflow-hidden font-mono md:h-full md:flex-row">
        <aside className={`shrink-0 border-b px-4 py-3 sm:px-6 md:w-52 md:border-b-0 md:border-r md:px-4 md:py-4 ${borderColor}`}>
          <div className="flex min-w-0 items-center gap-3 md:block">
            <p className={`shrink-0 text-xs md:mb-4 ${mutedText}`}>// admin</p>
            <div data-v0-admin-strip className="flex min-w-0 flex-1 gap-1 overflow-x-auto md:flex-col md:gap-1 md:overflow-visible">
              {adminItems.map((item) => (
                <button
                  key={item.key}
                  onClick={() => {
                    const href = getAdminSectionHref(item.key)
                    recordAdminNavigationStart(href)
                    navigateSection(item.key)
                  }}
                  onMouseEnter={() => {
                    if (!onNavigateSection) {
                      router.prefetch(getAdminSectionHref(item.key))
                    }
                  }}
                  onFocus={() => {
                    if (!onNavigateSection) {
                      router.prefetch(getAdminSectionHref(item.key))
                    }
                  }}
                  className={`shrink-0 px-3 py-2 text-left text-xs transition-colors md:w-full ${
                    currentSection === item.key ? activeBg : hoverBg
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
            {isPageLoading ? (
              <p className={`shrink-0 text-xs md:mt-4 ${resolvedIsDarkMode ? "text-[#D4FF00]" : "text-[#3F5200]"}`}>
                {loadingText}
              </p>
            ) : null}
          </div>
        </aside>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden md:h-full md:flex-row md:items-stretch">
          <div
            data-v0-shell-primary
            className="relative order-2 z-20 min-h-0 min-w-0 flex-1 overflow-y-auto md:order-1 md:h-full md:flex-none md:self-stretch md:w-[56%] md:overflow-hidden lg:w-1/2"
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
    </div>
  )
}
