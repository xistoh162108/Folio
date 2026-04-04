import { describe, expect, it } from "vitest"

import {
  buildNewsletterTopicMap,
  getNewsletterTopicName,
  normalizeNewsletterTopics,
  serializeNewsletterTopicState,
} from "@/lib/newsletter/topics"

describe("newsletter topic authority", () => {
  it("normalizes legacy aliases into the locked H6 topic set", () => {
    expect(normalizeNewsletterTopics(["all-seeds", "ai-infosec", "projects-logs"])).toEqual([
      "all",
      "project-info",
    ])
  })

  it("falls back to all when nothing valid is selected", () => {
    expect(normalizeNewsletterTopics(["unknown-topic"])).toEqual(["all"])
  })

  it("serializes public checkbox state into canonical topics", () => {
    expect(
      serializeNewsletterTopicState({
        all: false,
        projectInfo: true,
        log: true,
      }),
    ).toEqual(["project-info", "log"])
  })

  it("builds names and map state from canonical values", () => {
    expect(getNewsletterTopicName("project-info")).toBe("Project & Info")
    expect(buildNewsletterTopicMap(["project-info", "log"])).toEqual({
      all: false,
      projectInfo: true,
      log: true,
    })
  })
})
