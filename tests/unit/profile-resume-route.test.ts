import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest"

const readProfileResumeOverrideMock = vi.fn()
const getPrimaryProfileRuntimeSnapshotMock = vi.fn()

vi.mock("@/lib/profile/resume", () => ({
  readProfileResumeOverride: readProfileResumeOverrideMock,
}))

vi.mock("@/lib/data/profile", () => ({
  getPrimaryProfileRuntimeSnapshot: getPrimaryProfileRuntimeSnapshotMock,
}))

let GET: typeof import("@/app/resume.pdf/route").GET

beforeAll(async () => {
  ;({ GET } = await import("@/app/resume.pdf/route"))
})

beforeEach(() => {
  readProfileResumeOverrideMock.mockReset()
  getPrimaryProfileRuntimeSnapshotMock.mockReset()
})

describe("/resume.pdf route", () => {
  it("serves the uploaded resume override when one exists", async () => {
    readProfileResumeOverrideMock.mockResolvedValue({
      buffer: Buffer.from("%PDF-uploaded%"),
      contentType: "application/pdf",
    })

    const response = await GET()

    expect(response.headers.get("Content-Type")).toBe("application/pdf")
    expect(Buffer.from(await response.arrayBuffer()).toString("utf8")).toContain("%PDF-uploaded%")
    expect(getPrimaryProfileRuntimeSnapshotMock).not.toHaveBeenCalled()
  })

  it("falls back to a generated profile pdf that uses a unicode-safe label-based experience layout", async () => {
    readProfileResumeOverrideMock.mockResolvedValue(null)
    getPrimaryProfileRuntimeSnapshotMock.mockResolvedValue({
      displayName: "Jimin Park",
      role: "CS @ KAIST",
      summary: "교환학생과 시스템 빌더",
      education: [{ institution: "KAIST", degree: "B.S.", period: "2024-" }],
      experience: [{ label: "GDGoC Lead", period: "2026", sortOrder: 0 }],
    })

    const response = await GET()
    const body = Buffer.from(await response.arrayBuffer()).toString("utf8")

    expect(response.headers.get("Content-Type")).toBe("application/pdf")
    expect(body).toContain("/UniKS-UCS2-H")
    expect(body).toContain("/HYGoThic-Medium")
    expect(body).not.toContain("undefined")
  })
})
