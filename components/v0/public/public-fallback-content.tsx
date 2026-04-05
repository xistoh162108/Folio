"use client"

import Link from "next/link"

import { useOptionalV0ExperienceTheme } from "@/components/v0/runtime/v0-experience-runtime"
import { getV0RouteAccentPalette, type V0RouteAccentKey } from "@/lib/site/v0-route-palette"

interface PublicFallbackAction {
  label: string
  href?: string
  onClick?: () => void
}

interface PublicFallbackContentProps {
  initialIsDarkMode: boolean
  title: string
  code: string
  message?: string
  eyebrow?: string
  actions?: PublicFallbackAction[]
  accentKey?: V0RouteAccentKey
}

export function PublicFallbackContent({
  initialIsDarkMode,
  title,
  code,
  message,
  eyebrow = "// public",
  actions = [],
  accentKey = "default",
}: PublicFallbackContentProps) {
  const runtimeTheme = useOptionalV0ExperienceTheme()
  const isDarkMode = runtimeTheme?.isDarkMode ?? initialIsDarkMode
  const mutedText = isDarkMode ? "text-white/50" : "text-black/50"
  const borderColor = isDarkMode ? "border-white/20" : "border-black/20"
  const hoverBg = isDarkMode ? "hover:bg-white/5" : "hover:bg-black/5"
  const accentColor = getV0RouteAccentPalette(accentKey, isDarkMode).color

  return (
    <main className="min-h-full px-4 py-6 pb-8 sm:px-6 md:h-full md:px-8 md:pb-10">
      <div className="max-w-lg space-y-6 font-mono md:max-w-none">
        <div>
          <p className={`text-xs ${mutedText}`}>{eyebrow}</p>
          <h2 className="mt-1 text-lg">{title}</h2>
        </div>

        <div className={`space-y-2 border px-4 py-4 text-xs ${borderColor}`}>
          <p style={{ color: accentColor }}>{code}</p>
          {message ? <p className={mutedText}>{message}</p> : null}
        </div>

        {actions.length > 0 ? (
          <div className="flex flex-wrap gap-3 text-xs">
            {actions.map((action) => {
              if (action.href) {
                return (
                  <Link
                    key={`${action.label}:${action.href}`}
                    href={action.href}
                    className={`border px-3 py-2 transition-colors ${borderColor} ${hoverBg}`}
                  >
                    {action.label}
                  </Link>
                )
              }

              return (
                <button
                  key={action.label}
                  type="button"
                  onClick={action.onClick}
                  className={`border px-3 py-2 transition-colors ${borderColor} ${hoverBg}`}
                >
                  {action.label}
                </button>
              )
            })}
          </div>
        ) : null}
      </div>
    </main>
  )
}
