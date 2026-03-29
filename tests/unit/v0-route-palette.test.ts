import { describe, expect, it } from "vitest"

import { getV0RouteAccentPalette, resolveV0RouteAccentKey } from "@/lib/site/v0-route-palette"

describe("v0 route palette", () => {
  it("maps dither routes to deterministic accent keys", () => {
    expect(resolveV0RouteAccentKey({ mode: "dither", variant: "home" })).toBe("default")
    expect(resolveV0RouteAccentKey({ mode: "dither", variant: "notes" })).toBe("notes")
    expect(resolveV0RouteAccentKey({ mode: "dither", variant: "detail-note" })).toBe("notes")
    expect(resolveV0RouteAccentKey({ mode: "dither", variant: "projects" })).toBe("projects")
    expect(resolveV0RouteAccentKey({ mode: "dither", variant: "detail-project" })).toBe("projects")
    expect(resolveV0RouteAccentKey({ mode: "dither", variant: "admin-settings" })).toBe("default")
  })

  it("treats life routes as the contact palette family", () => {
    expect(resolveV0RouteAccentKey({ mode: "life", variant: "contact" })).toBe("contact")
    expect(resolveV0RouteAccentKey({ mode: "life", variant: "guestbook" })).toBe("contact")
  })

  it("returns the expected dark and light palette values", () => {
    expect(getV0RouteAccentPalette("default", true)).toMatchObject({
      color: "#D4FF00",
      colorRgba: "rgba(212, 255, 0, 0.7)",
    })
    expect(getV0RouteAccentPalette("notes", false)).toMatchObject({
      color: "#1F5A4C",
      colorRgba: "rgba(31, 90, 76, 0.72)",
    })
    expect(getV0RouteAccentPalette("projects", true)).toMatchObject({
      color: "#7CFFD4",
    })
    expect(getV0RouteAccentPalette("contact", false)).toMatchObject({
      color: "#4D5E1E",
    })
  })
})
