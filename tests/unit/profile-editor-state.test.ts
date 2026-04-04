import { describe, expect, it } from "vitest"

import { mapProfileEditorInput } from "@/lib/data/profile"

describe("mapProfileEditorInput", () => {
  it("reduces experience rows to the fields actually rendered by the site", () => {
    const input = mapProfileEditorInput(
      {
        id: "profile-1",
        slug: "primary",
        displayName: "Jimin Park",
        role: "CS @ KAIST",
        summary: "Terminal-native profile.",
        emailAddress: "jimin@example.com",
        resumeHref: "/resume.pdf",
        githubHref: "https://github.com/example",
        linkedinHref: "https://linkedin.com/in/example",
        education: [],
        experience: [
          {
            id: "exp-1",
            label: "GDGoC Lead",
            period: "2026",
            sortOrder: 0,
          },
        ],
        awards: [],
        links: [],
        source: "database",
      },
      {
        source: "uploaded",
        fileName: "resume.pdf",
      },
    )

    expect(input.resumeState).toEqual({
      source: "uploaded",
      fileName: "resume.pdf",
    })
    expect(input.experience).toEqual([
      {
        id: "exp-1",
        label: "GDGoC Lead",
        period: "2026",
        sortOrder: 0,
      },
    ])
  })
})
