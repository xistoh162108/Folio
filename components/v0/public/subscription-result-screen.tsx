"use client"

import type { ReactNode } from "react"

import { PublicShell } from "@/components/v0/public/public-shell"
import type { V0RuntimeDescriptor } from "@/components/v0/runtime/v0-experience-runtime"
import { useV0ThemeController } from "@/components/v0/use-v0-theme-controller"

interface SubscriptionResultScreenProps {
  isDarkMode?: boolean
  brandLabel?: string
  title: string
  eyebrow: string
  body: string
  actionLabel?: string
  actions?: ReactNode
}

export function SubscriptionResultScreen({
  isDarkMode: initialIsDarkMode = true,
  brandLabel = "xistoh.log",
  title,
  eyebrow,
  body,
  actionLabel,
  actions,
}: SubscriptionResultScreenProps) {
  const { isDarkMode, toggleTheme } = useV0ThemeController(initialIsDarkMode)
  const mutedText = isDarkMode ? "text-white/50" : "text-black/50"
  const borderColor = isDarkMode ? "border-white/20" : "border-black/20"
  const hoverBg = isDarkMode ? "hover:bg-white/5" : "hover:bg-black/5"
  const runtimeDescriptor: V0RuntimeDescriptor = {
    mode: "dither",
    variant: "public-generic",
    overlay: { label: `// ${eyebrow.toUpperCase()}`, value: "[COMPLETE]" },
  }

  return (
    <PublicShell
      currentPage={null}
      isDarkMode={isDarkMode}
      brandLabel={brandLabel}
      onToggleTheme={toggleTheme}
      runtimeDescriptor={runtimeDescriptor}
    >
      <div className="h-full overflow-y-auto">
        <main className="px-8 py-6 max-w-3xl">
          <div className="max-w-2xl space-y-4">
            <p className={`text-xs ${mutedText}`}>// {eyebrow}</p>
            <h1 className="text-xl">{title}</h1>
            <p className={`text-sm leading-relaxed ${mutedText}`}>{body}</p>
            <div className={`pt-4 border-t ${borderColor} space-y-2`}>
              <p className={`text-xs ${mutedText}`}>[{eyebrow.toUpperCase()}]</p>
              <p className={`text-xs ${mutedText}`}>// command result ready</p>
            </div>
            {actions ? (
              <div className="flex flex-wrap gap-4 text-xs">{actions}</div>
            ) : actionLabel ? (
              <div className="flex gap-4 text-xs">
                <button className={`${hoverBg} px-2 py-1`}>[{actionLabel}]</button>
                <button className={`${hoverBg} px-2 py-1`}>[home]</button>
              </div>
            ) : null}
          </div>
        </main>
      </div>
    </PublicShell>
  )
}
