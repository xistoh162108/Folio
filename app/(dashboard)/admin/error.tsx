"use client"
import { useEffect, useState } from "react"

import { AdminFallbackContent } from "@/components/v0/admin/admin-fallback-content"
import { AdminShell } from "@/components/v0/admin/admin-shell"
import { V0_THEME_COOKIE, isV0DarkMode } from "@/lib/site/v0-theme"

function readThemeIsDark() {
  if (typeof document === "undefined") {
    return true
  }

  const cookieValue = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(`${V0_THEME_COOKIE}=`))
    ?.split("=")[1]

  return isV0DarkMode(cookieValue)
}

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const [isDarkMode, setIsDarkMode] = useState(true)

  useEffect(() => {
    setIsDarkMode(readThemeIsDark())
  }, [])

  return (
    <AdminShell currentSection={null} isDarkMode={isDarkMode}>
      <AdminFallbackContent
        initialIsDarkMode={isDarkMode}
        title="System Fault"
        code="[ SYS_ERROR ]"
        message={error.message || "Unknown admin runtime error."}
        actions={[
          { label: "[retry]", onClick: reset },
          { label: "[analytics]", href: "/admin/analytics" },
        ]}
      />
    </AdminShell>
  )
}
