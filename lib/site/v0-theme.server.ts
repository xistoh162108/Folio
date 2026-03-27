import "server-only"

import { cookies } from "next/headers"

import { V0_THEME_COOKIE, isV0DarkMode, normalizeV0ThemeMode } from "@/lib/site/v0-theme"

export async function getV0ThemeIsDark() {
  const cookieStore = await cookies()
  return isV0DarkMode(cookieStore.get(V0_THEME_COOKIE)?.value)
}

export async function getV0ThemeMode() {
  const cookieStore = await cookies()
  return normalizeV0ThemeMode(cookieStore.get(V0_THEME_COOKIE)?.value)
}
