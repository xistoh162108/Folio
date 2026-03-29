import { describe, expect, it } from "vitest"

import { getPublicVerifiedProfileLinks, getVerifiedInstagramProfileLink } from "@/lib/profile/public-links"

const baseSnapshot = {
  links: [
    { id: "github", label: "GitHub", url: "https://github.com/example", kind: "GITHUB", isVerified: true, sortOrder: 0 },
    { id: "linkedin", label: "LinkedIn", url: "https://www.linkedin.com/in/example", kind: "LINKEDIN", isVerified: true, sortOrder: 1 },
    { id: "instagram", label: "Instagram", url: "https://www.instagram.com/example", kind: "WEBSITE", isVerified: true, sortOrder: 2 },
  ],
} as const

describe("public profile links", () => {
  it("returns the limited public-visible verified links", () => {
    expect(getPublicVerifiedProfileLinks(baseSnapshot)).toEqual({
      githubHref: "https://github.com/example",
      linkedinHref: "https://www.linkedin.com/in/example",
      instagramHref: "https://www.instagram.com/example",
    })
  })

  it("recognizes instagram by hostname even when the label differs", () => {
    expect(
      getVerifiedInstagramProfileLink({
        links: [
          { id: "insta", label: "social", url: "https://instagram.com/example", kind: "WEBSITE", isVerified: true, sortOrder: 0 },
        ],
      }),
    ).toMatchObject({ url: "https://instagram.com/example" })
  })

  it("does not expose unverified instagram links", () => {
    expect(
      getVerifiedInstagramProfileLink({
        links: [
          { id: "insta", label: "Instagram", url: "https://www.instagram.com/example", kind: "WEBSITE", isVerified: false, sortOrder: 0 },
        ],
      }),
    ).toBeNull()
  })
})
