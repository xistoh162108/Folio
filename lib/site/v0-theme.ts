export const V0_THEME_COOKIE = "xistoh-v0-theme"

export type V0ThemeMode = "dark" | "light"

export function normalizeV0ThemeMode(value?: string | null): V0ThemeMode {
  return value === "light" ? "light" : "dark"
}

export function isV0DarkMode(value?: string | null): boolean {
  return normalizeV0ThemeMode(value) === "dark"
}

export function toV0ThemeMode(isDarkMode: boolean): V0ThemeMode {
  return isDarkMode ? "dark" : "light"
}

export function getNextV0ThemeMode(value: V0ThemeMode): V0ThemeMode {
  return value === "dark" ? "light" : "dark"
}
