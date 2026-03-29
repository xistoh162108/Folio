import { describe, expect, it } from "vitest"

import { getV0DitherConfig, resolveV0DitherAspectBucket } from "@/lib/site/v0-runtime-dither"

describe("v0 runtime dither config", () => {
  it("classifies tall slots with an explicit aspect threshold", () => {
    expect(resolveV0DitherAspectBucket({ width: 100, height: 129 })).toBe("standard")
    expect(resolveV0DitherAspectBucket({ width: 100, height: 130 })).toBe("tall")
  })

  it("switches home to a filling config on tall aspect ratios", () => {
    expect(getV0DitherConfig("home", "standard")).toMatchObject({ shape: "cat" })
    expect(getV0DitherConfig("home", "tall")).toMatchObject({ shape: "noise", type: "4x4" })
  })

  it("keeps notes unchanged unless explicitly extended", () => {
    expect(getV0DitherConfig("notes", "standard")).toEqual(getV0DitherConfig("notes", "tall"))
  })
})
