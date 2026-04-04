import { describe, expect, it } from "vitest"

import { buildPostRssFeed } from "@/lib/feeds/rss"

describe("buildPostRssFeed", () => {
  it("renders an RSS feed with categories and summary metadata", () => {
    const xml = buildPostRssFeed({
      title: "notes",
      description: "Terminal-native notes feed.",
      path: "/notes/rss.xml",
      type: "NOTE",
      items: [
        {
          id: "note-1",
          slug: "signal-processing-log",
          type: "NOTE",
          status: "PUBLISHED",
          title: "Signal Processing Log",
          excerpt: "A short note about signal paths.",
          tags: ["InfoSec", "Log"],
          views: 12,
          coverImageUrl: null,
          publishedAt: "2026-04-03T12:00:00.000Z",
          updatedAt: "2026-04-03T12:00:00.000Z",
        },
      ],
    })

    expect(xml).toContain("<rss version=\"2.0\"")
    expect(xml).toContain("<title>notes | xistoh.log</title>")
    expect(xml).toContain("<description>Terminal-native notes feed.</description>")
    expect(xml).toContain("<link>https://xistoh.com/notes/signal-processing-log</link>")
    expect(xml).toContain("<category>InfoSec</category>")
    expect(xml).toContain("<category>Log</category>")
    expect(xml).toContain("<description>A short note about signal paths.</description>")
  })
})
