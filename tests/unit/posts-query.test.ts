import { normalizeAdminPostsQuery } from "@/lib/data/admin-posts-query"

describe("normalizeAdminPostsQuery", () => {
  it("normalizes search, filters, and page", () => {
    expect(
      normalizeAdminPostsQuery({
        q: "  security  ",
        status: "published",
        type: "project",
        page: "3",
      }),
    ).toEqual({
      q: "security",
      status: "PUBLISHED",
      type: "PROJECT",
      page: 3,
      pageSize: 10,
    })
  })

  it("falls back to safe defaults", () => {
    expect(normalizeAdminPostsQuery({ status: "weird", type: "weird", page: "0" })).toEqual({
      q: "",
      status: "ALL",
      type: "ALL",
      page: 1,
      pageSize: 10,
    })
  })
})
