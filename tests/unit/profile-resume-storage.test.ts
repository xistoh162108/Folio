import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest"

const storageObjectExistsMock = vi.fn()
const downloadAssetFromSupabaseMock = vi.fn()

vi.mock("@/lib/storage/supabase", () => ({
  FILE_UPLOAD_POLICY: {
    bucket: "post-files",
  },
  storageObjectExists: storageObjectExistsMock,
  downloadAssetFromSupabase: downloadAssetFromSupabaseMock,
  uploadAssetToSupabase: vi.fn(),
  deleteAssetFromSupabase: vi.fn(),
}))

let getProfileResumeEditorState: typeof import("@/lib/profile/resume").getProfileResumeEditorState
let readProfileResumeOverride: typeof import("@/lib/profile/resume").readProfileResumeOverride

beforeAll(async () => {
  ;({ getProfileResumeEditorState, readProfileResumeOverride } = await import("@/lib/profile/resume"))
})

beforeEach(() => {
  storageObjectExistsMock.mockReset().mockResolvedValue(false)
  downloadAssetFromSupabaseMock.mockReset().mockResolvedValue(null)
})

describe("profile resume storage fallbacks", () => {
  it("falls back to generated editor state when resume override storage cannot be read", async () => {
    storageObjectExistsMock.mockRejectedValue(new Error("Supabase storage is not configured."))

    await expect(getProfileResumeEditorState("primary")).resolves.toEqual({
      source: "generated",
      fileName: null,
    })
  })

  it("treats resume override download failures as a generated fallback path", async () => {
    downloadAssetFromSupabaseMock.mockRejectedValue(new Error("Supabase storage is not configured."))

    await expect(readProfileResumeOverride("primary")).resolves.toBeNull()
  })
})
