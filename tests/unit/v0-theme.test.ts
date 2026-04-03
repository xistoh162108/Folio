import { getNextV0ThemeMode, isV0DarkMode, normalizeV0ThemeMode } from "@/lib/site/v0-theme"

describe("v0 theme normalization", () => {
  it("defaults missing or invalid values to light mode", () => {
    expect(normalizeV0ThemeMode(undefined)).toBe("light")
    expect(normalizeV0ThemeMode(null)).toBe("light")
    expect(normalizeV0ThemeMode("system")).toBe("light")
  })

  it("preserves valid cookie values", () => {
    expect(normalizeV0ThemeMode("light")).toBe("light")
    expect(normalizeV0ThemeMode("dark")).toBe("dark")
  })

  it("keeps dark-mode checks and toggling behavior", () => {
    expect(isV0DarkMode(undefined)).toBe(false)
    expect(isV0DarkMode("dark")).toBe(true)
    expect(getNextV0ThemeMode("light")).toBe("dark")
    expect(getNextV0ThemeMode("dark")).toBe("light")
  })
})
