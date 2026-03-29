export type V0RouteAccentKey = "default" | "notes" | "projects" | "contact"

const V0_ROUTE_PALETTES = {
  default: {
    dark: "#D4FF00",
    light: "#3F5200",
    darkRgba: "rgba(212, 255, 0, 0.7)",
    lightRgba: "rgba(63, 82, 0, 0.72)",
  },
  notes: {
    dark: "#9EFDDB",
    light: "#1F5A4C",
    darkRgba: "rgba(158, 253, 219, 0.72)",
    lightRgba: "rgba(31, 90, 76, 0.72)",
  },
  projects: {
    dark: "#7CFFD4",
    light: "#1C5B52",
    darkRgba: "rgba(124, 255, 212, 0.72)",
    lightRgba: "rgba(28, 91, 82, 0.72)",
  },
  contact: {
    dark: "#B8FF6A",
    light: "#4D5E1E",
    darkRgba: "rgba(184, 255, 106, 0.72)",
    lightRgba: "rgba(77, 94, 30, 0.72)",
  },
} as const satisfies Record<
  V0RouteAccentKey,
  { dark: string; light: string; darkRgba: string; lightRgba: string }
>

export function resolveV0RouteAccentKey(input: {
  mode: "dither" | "life"
  variant: string
}): V0RouteAccentKey {
  if (input.mode === "life") {
    return "contact"
  }

  switch (input.variant) {
    case "notes":
    case "detail-note":
      return "notes"
    case "projects":
    case "detail-project":
      return "projects"
    default:
      return "default"
  }
}

export function getV0RouteAccentPalette(key: V0RouteAccentKey, isDarkMode: boolean) {
  const palette = V0_ROUTE_PALETTES[key]
  return {
    key,
    color: isDarkMode ? palette.dark : palette.light,
    colorRgba: isDarkMode ? palette.darkRgba : palette.lightRgba,
  }
}
