import { describe, expect, it } from "vitest"

import {
  getAdminIdlePrefetchTargets,
  getAdminSectionHref,
  shouldPrefetchAdminSection,
} from "@/lib/site/admin-nav"

describe("admin shell prefetch rules", () => {
  it("never prefetches the explicit create route", () => {
    expect(shouldPrefetchAdminSection("content")).toBe(false)
    expect(getAdminIdlePrefetchTargets("manage-posts")).toContain("content")
    expect(
      getAdminIdlePrefetchTargets("manage-posts")
        .filter((section) => shouldPrefetchAdminSection(section))
        .map((section) => getAdminSectionHref(section)),
    ).not.toContain("/admin/content")
  })

  it("keeps safe neighboring admin routes eligible for prefetch", () => {
    expect(shouldPrefetchAdminSection("settings")).toBe(true)
    expect(shouldPrefetchAdminSection("overview")).toBe(true)
    expect(getAdminSectionHref("manage-posts")).toBe("/admin/posts")
  })
})
