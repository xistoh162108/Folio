"use client"

import { Geist, JetBrains_Mono } from "next/font/google"
import { useEffect, useState } from "react"

import { PublicFallbackContent } from "@/components/v0/public/public-fallback-content"
import { PublicShell } from "@/components/v0/public/public-shell"
import { V0ExperienceProvider } from "@/components/v0/runtime/v0-experience-runtime"
import { getPublicFallbackState } from "@/lib/site/public-fallback-state"
import { V0_THEME_COOKIE, normalizeV0ThemeMode, type V0ThemeMode } from "@/lib/site/v0-theme"
import "./globals.css"

const geist = Geist({ subsets: ["latin"], variable: "--font-geist-sans" })
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains-mono" })

function readThemeMode(): V0ThemeMode {
  if (typeof document === "undefined") {
    return "light"
  }

  const cookieValue = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(`${V0_THEME_COOKIE}=`))
    ?.split("=")[1]

  return normalizeV0ThemeMode(cookieValue)
}

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const [themeMode, setThemeMode] = useState<V0ThemeMode>(() => readThemeMode())
  const fallback = getPublicFallbackState("global-runtime-error")
  const isDarkMode = themeMode === "dark"

  useEffect(() => {
    console.error(error)
    setThemeMode(readThemeMode())
  }, [error])

  return (
    <html lang="en" data-v0-theme={themeMode} suppressHydrationWarning style={{ colorScheme: themeMode }}>
      <body
        data-v0-theme={themeMode}
        style={{ colorScheme: themeMode }}
        className={`min-h-screen font-sans antialiased ${
          isDarkMode ? "bg-black text-white" : "bg-white text-black"
        } ${geist.variable} ${jetbrainsMono.variable}`}
      >
        <V0ExperienceProvider key={themeMode} initialThemeMode={themeMode}>
          <PublicShell currentPage={fallback.currentPage} isDarkMode={isDarkMode} runtimeDescriptor={fallback.runtimeDescriptor}>
            <PublicFallbackContent
              initialIsDarkMode={isDarkMode}
              eyebrow={fallback.eyebrow}
              title={fallback.title}
              code={fallback.code}
              message={fallback.message}
              accentKey={fallback.accentKey}
              actions={[
                { label: "[retry]", onClick: reset },
                { label: "[home]", href: "/" },
                { label: "[notes]", href: "/notes" },
              ]}
            />
          </PublicShell>
        </V0ExperienceProvider>
      </body>
    </html>
  )
}
