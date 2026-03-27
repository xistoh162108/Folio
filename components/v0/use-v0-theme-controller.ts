"use client"

import { useEffect, useState } from "react"

import { useOptionalV0ExperienceTheme } from "@/components/v0/runtime/v0-experience-runtime"
import { V0_THEME_COOKIE, getNextV0ThemeMode, toV0ThemeMode, type V0ThemeMode } from "@/lib/site/v0-theme"

function applyDocumentTheme(themeMode: V0ThemeMode) {
  const isDarkMode = themeMode === "dark"

  document.documentElement.dataset.v0Theme = themeMode
  document.documentElement.style.colorScheme = themeMode
  document.body.dataset.v0Theme = themeMode
  document.body.classList.toggle("bg-black", isDarkMode)
  document.body.classList.toggle("text-white", isDarkMode)
  document.body.classList.toggle("bg-white", !isDarkMode)
  document.body.classList.toggle("text-black", !isDarkMode)
}

function persistTheme(themeMode: V0ThemeMode) {
  document.cookie = `${V0_THEME_COOKIE}=${themeMode}; path=/; max-age=31536000; samesite=lax`
}

export function useV0ThemeController(initialIsDarkMode = true) {
  const runtimeTheme = useOptionalV0ExperienceTheme()
  const [themeMode, setThemeMode] = useState<V0ThemeMode>(() => toV0ThemeMode(initialIsDarkMode))

  useEffect(() => {
    if (runtimeTheme) {
      return
    }

    applyDocumentTheme(themeMode)
  }, [runtimeTheme, themeMode])

  const toggleTheme = () => {
    if (runtimeTheme) {
      runtimeTheme.toggleTheme()
      return
    }

    setThemeMode((currentTheme) => {
      const nextTheme = getNextV0ThemeMode(currentTheme)
      persistTheme(nextTheme)
      return nextTheme
    })
  }

  const resolvedThemeMode = runtimeTheme?.themeMode ?? themeMode

  return {
    isDarkMode: resolvedThemeMode === "dark",
    themeMode: resolvedThemeMode,
    toggleTheme,
  }
}
