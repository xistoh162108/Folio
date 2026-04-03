import { normalizeGuestbookPageQuery } from "@/lib/data/guestbook"

describe("normalizeGuestbookPageQuery", () => {
  it("parses a valid page query", () => {
    expect(normalizeGuestbookPageQuery({ page: "3" })).toBe(3)
  })

  it("supports array values from query params", () => {
    expect(normalizeGuestbookPageQuery({ page: ["2", "7"] })).toBe(2)
  })

  it("falls back to page one for invalid values", () => {
    expect(normalizeGuestbookPageQuery({ page: "0" })).toBe(1)
    expect(normalizeGuestbookPageQuery({ page: "abc" })).toBe(1)
  })
})
