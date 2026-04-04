import { describe, expect, it, vi } from "vitest"
import { renderToStaticMarkup } from "react-dom/server"

import { V0NewsletterManager } from "@/components/v0/admin/newsletter-manager"
import type { NewsletterDashboardData } from "@/lib/contracts/newsletter"

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams("view=subscribers"),
}))

function createDashboard(): NewsletterDashboardData {
  return {
    topics: [
      { normalizedName: "all", name: "All" },
      { normalizedName: "project-info", name: "Project & Info" },
      { normalizedName: "log", name: "Log" },
    ],
    activeSubscriberCount: 2,
    subscribers: [
      {
        id: "subscriber-1",
        email: "one@example.com",
        topics: ["all"],
        topicLabels: ["All"],
        subscribedAt: "2026-04-04T00:00:00.000Z",
        status: "ACTIVE",
      },
      {
        id: "subscriber-2",
        email: "two@example.com",
        topics: ["log"],
        topicLabels: ["Log"],
        subscribedAt: "2026-04-03T00:00:00.000Z",
        status: "UNSUBSCRIBED",
      },
    ],
    subscribersPagination: {
      page: 1,
      pageSize: 20,
      total: 2,
      totalPages: 1,
      hasPrevious: false,
      hasNext: false,
    },
    subscriberOptions: [],
    campaigns: [],
    campaignsPagination: {
      page: 1,
      pageSize: 20,
      total: 0,
      totalPages: 1,
      hasPrevious: false,
      hasNext: false,
    },
    deliveries: [],
    deliveriesPagination: {
      page: 1,
      pageSize: 20,
      total: 0,
      totalPages: 1,
      hasPrevious: false,
      hasNext: false,
    },
    selectedCampaign: null,
    migrationReady: true,
  }
}

describe("V0NewsletterManager subscribers table", () => {
  it("clips subscriber row borders to the table boundary and clears the last row divider", () => {
    const markup = renderToStaticMarkup(
      <V0NewsletterManager
        dashboard={createDashboard()}
        isDarkMode={false}
        initialView="subscribers"
      />,
    )

    expect(markup).toContain("border border-black/20 overflow-hidden")
    expect(markup).toContain("w-full border-collapse text-sm")
    expect(markup).toContain("last:border-b-0")
  })
})
