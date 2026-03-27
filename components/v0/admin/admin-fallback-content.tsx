"use client"

import Link from "next/link"

import { useOptionalV0ExperienceTheme } from "@/components/v0/runtime/v0-experience-runtime"

interface AdminFallbackAction {
  label: string
  href?: string
  onClick?: () => void
}

interface AdminFallbackContentProps {
  initialIsDarkMode: boolean
  title?: string
  code: string
  message?: string
  actions?: AdminFallbackAction[]
}

export function AdminFallbackContent({
  initialIsDarkMode,
  title,
  code,
  message,
  actions = [],
}: AdminFallbackContentProps) {
  const runtimeTheme = useOptionalV0ExperienceTheme()
  const isDarkMode = runtimeTheme?.isDarkMode ?? initialIsDarkMode
  const mutedText = isDarkMode ? "text-white/50" : "text-black/50"
  const borderColor = isDarkMode ? "border-white/20" : "border-black/20"
  const hoverBg = isDarkMode ? "hover:bg-white/5" : "hover:bg-black/5"

  return (
    <main className="flex-1 overflow-y-auto p-6">
      <div className="max-w-3xl space-y-4 font-mono">
        {title ? (
          <div>
            <p className={`text-xs ${mutedText}`}>// admin</p>
            <h2 className="mt-1 text-lg">{title}</h2>
          </div>
        ) : (
          <p className={`text-xs ${mutedText}`}>// admin</p>
        )}

        <div className={`space-y-2 border ${borderColor} px-4 py-4 text-xs`}>
          <p>{code}</p>
          {message ? <p className={mutedText}>{message}</p> : null}
        </div>

        {actions.length > 0 ? (
          <div className="flex flex-wrap gap-3 text-xs">
            {actions.map((action) =>
              action.href ? (
                <Link key={`${action.label}:${action.href}`} href={action.href} className={`border px-3 py-2 ${borderColor} ${hoverBg}`}>
                  {action.label}
                </Link>
              ) : (
                <button
                  key={action.label}
                  type="button"
                  onClick={action.onClick}
                  className={`border px-3 py-2 ${borderColor} ${hoverBg}`}
                >
                  {action.label}
                </button>
              ),
            )}
          </div>
        ) : null}
      </div>
    </main>
  )
}
