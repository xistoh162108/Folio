import { describe, expect, it } from "vitest"

import { getPublicFallbackState } from "@/lib/site/public-fallback-state"

describe("public fallback state", () => {
  it("defines the generic route-missing fallback as a public-generic surface", () => {
    const fallback = getPublicFallbackState("route-not-found")

    expect(fallback.currentPage).toBeNull()
    expect(fallback.title).toBe("Route Missing")
    expect(fallback.code).toBe("[ ROUTE_NOT_FOUND ]")
    expect(fallback.runtimeDescriptor).toMatchObject({
      mode: "dither",
      variant: "public-generic",
    })
  })

  it("keeps note and project not-found states route-aware", () => {
    const noteFallback = getPublicFallbackState("note-not-found")
    const projectFallback = getPublicFallbackState("project-not-found")

    expect(noteFallback.currentPage).toBe("notes")
    expect(noteFallback.accentKey).toBe("notes")
    expect(noteFallback.code).toBe("[ NOTE_NOT_FOUND ]")
    expect(noteFallback.runtimeDescriptor).toMatchObject({
      mode: "dither",
      variant: "detail-note",
    })

    expect(projectFallback.currentPage).toBe("projects")
    expect(projectFallback.accentKey).toBe("projects")
    expect(projectFallback.code).toBe("[ PROJECT_NOT_FOUND ]")
    expect(projectFallback.runtimeDescriptor).toMatchObject({
      mode: "dither",
      variant: "detail-project",
    })
  })

  it("defines separate public and global runtime fault states", () => {
    const publicFault = getPublicFallbackState("public-runtime-error")
    const globalFault = getPublicFallbackState("global-runtime-error")

    expect(publicFault.code).toBe("[ PUBLIC_RUNTIME_ERROR ]")
    expect(publicFault.message).toContain("public runtime path")
    expect(globalFault.code).toBe("[ GLOBAL_RUNTIME_ERROR ]")
    expect(globalFault.message).toContain("global app boundary")
  })
})
