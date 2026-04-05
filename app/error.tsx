"use client"

import { useEffect, useState } from "react"

import { PublicFallbackContent } from "@/components/v0/public/public-fallback-content"
import { PublicShell } from "@/components/v0/public/public-shell"
import { getPublicFallbackState } from "@/lib/site/public-fallback-state"
import { V0_THEME_COOKIE, isV0DarkMode } from "@/lib/site/v0-theme"

function readThemeIsDark() {
  if (typeof document === "undefined") {
    return false
  }

  const cookieValue = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(`${V0_THEME_COOKIE}=`))
    ?.split("=")[1]

  return isV0DarkMode(cookieValue)
}

export default function PublicError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => readThemeIsDark())
  const fallback = getPublicFallbackState("public-runtime-error")

  useEffect(() => {
    console.error(error)
    setIsDarkMode(readThemeIsDark())
  }, [error])

  return (
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
  )
}
