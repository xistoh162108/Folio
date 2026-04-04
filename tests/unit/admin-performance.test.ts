import { beforeEach, describe, expect, it, vi } from "vitest"

const getCommunityModerationSnapshotMock = vi.fn()
const getSessionMock = vi.fn()
const getAdminPostsMock = vi.fn()
const getAdminPostEditorStateMock = vi.fn()
const getNewsletterDashboardDataMock = vi.fn()
const getPrimaryProfileSettingsEditorStateMock = vi.fn()

vi.mock("@/lib/data/community", () => ({
  getCommunityModerationSnapshot: getCommunityModerationSnapshotMock,
}))

vi.mock("@/lib/auth", () => ({
  getSession: getSessionMock,
}))

vi.mock("@/lib/data/newsletter", () => ({
  getNewsletterDashboardData: getNewsletterDashboardDataMock,
}))

vi.mock("@/lib/data/posts", () => ({
  getAdminPosts: getAdminPostsMock,
  getAdminPostEditorState: getAdminPostEditorStateMock,
}))

vi.mock("@/lib/data/profile", () => ({
  getPrimaryProfileSettingsEditorState: getPrimaryProfileSettingsEditorStateMock,
}))

describe("getAdminPerformanceDashboard", () => {
  beforeEach(() => {
    getCommunityModerationSnapshotMock.mockReset().mockResolvedValue({ comments: [], guestbookEntries: [] })
    getSessionMock.mockReset().mockResolvedValue({ user: { id: "user_1" } })
    getAdminPostsMock.mockReset().mockResolvedValue({
      posts: [{ id: "post_1", slug: "hello-world" }],
      counts: { total: 1, draft: 0, published: 1, archived: 0, filtered: 1 },
      pagination: { page: 1, pageSize: 10, totalPages: 1 },
      query: { q: "", status: "ALL", type: "ALL", page: 1, pageSize: 10 },
    })
    getAdminPostEditorStateMock.mockReset().mockResolvedValue({ id: "post_1" })
    getNewsletterDashboardDataMock.mockReset().mockResolvedValue({ campaigns: [], deliveries: [], subscribers: [] })
    getPrimaryProfileSettingsEditorStateMock.mockReset().mockResolvedValue({
      source: "database",
      profile: { displayName: "Jimin Park" },
    })
  })

  it("captures server timing metrics and exposes the live prefetch strategy", async () => {
    const { getAdminPerformanceDashboard } = await import("@/lib/ops/admin-performance")
    const dashboard = await getAdminPerformanceDashboard()

    expect(dashboard.navPrefetchStrategy).toBe("idle-neighbors + hover/focus")
    expect(dashboard.timings).toHaveLength(6)
    expect(dashboard.timings.map((metric) => metric.label)).toEqual([
      "SESSION_LOOKUP",
      "POST_INDEX_QUERY",
      "POST_EDITOR_LOAD",
      "SETTINGS_EDITOR_LOAD",
      "NEWSLETTER_DASHBOARD",
      "COMMUNITY_QUEUE",
    ])
    expect(dashboard.timings.every((metric) => metric.status === "measured")).toBe(true)
    expect(dashboard.timings.every((metric) => typeof metric.durationMs === "number" && metric.durationMs! >= 1)).toBe(true)
    expect(dashboard.notes.some((note) => note.includes("newsletter"))).toBe(true)
  })

  it("marks editor timing as skipped when there is no indexed post", async () => {
    getAdminPostsMock.mockResolvedValueOnce({
      posts: [],
      counts: { total: 0, draft: 0, published: 0, archived: 0, filtered: 0 },
      pagination: { page: 1, pageSize: 10, totalPages: 0 },
      query: { q: "", status: "ALL", type: "ALL", page: 1, pageSize: 10 },
    })

    const { getAdminPerformanceDashboard } = await import("@/lib/ops/admin-performance")
    const dashboard = await getAdminPerformanceDashboard()

    expect(dashboard.timings.find((metric) => metric.key === "editor")).toMatchObject({
      status: "skipped",
      durationMs: null,
    })
    expect(getAdminPostEditorStateMock).not.toHaveBeenCalled()
  })
})
