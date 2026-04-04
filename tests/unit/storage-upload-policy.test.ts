import { describe, expect, it } from "vitest"

import { FILE_UPLOAD_POLICY } from "@/lib/storage/supabase"

describe("file upload policy", () => {
  it("allows the exact T1 text/document allowlist without broadening to executable types", () => {
    expect(FILE_UPLOAD_POLICY.allowedMimes).toEqual(
      expect.arrayContaining([
        "application/pdf",
        "text/plain",
        "text/markdown",
        "text/csv",
        "application/json",
        "text/yaml",
        "application/xml",
        "text/xml",
      ]),
    )
    expect(FILE_UPLOAD_POLICY.allowedMimes).not.toContain("application/javascript")
  })
})
