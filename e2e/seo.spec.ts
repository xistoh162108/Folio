import { expect, test } from "@playwright/test"

import { prisma } from "../lib/db/prisma"

async function ensurePublishedSeoDetailPath() {
  const existing = await prisma.post.findFirst({
    where: {
      status: "PUBLISHED",
      type: "NOTE",
    },
    select: {
      slug: true,
    },
  })

  if (existing?.slug) {
    return `/notes/${existing.slug}`
  }

  const marker = `playwright-seo-${Date.now()}`
  const created = await prisma.post.create({
    data: {
      slug: `${marker}-note`,
      type: "NOTE",
      status: "PUBLISHED",
      title: `${marker} title`,
      excerpt: `${marker} excerpt`,
      content: {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: `${marker} detail body` }],
          },
        ],
      },
      htmlContent: `<p>${marker} detail body</p>`,
      publishedAt: new Date(),
    },
    select: {
      slug: true,
    },
  })

  return `/notes/${created.slug}`
}

test("robots and sitemap reflect the shipped IA", async ({ request }) => {
  const robotsResponse = await request.get("/robots.txt")
  expect(robotsResponse.ok()).toBeTruthy()
  const robotsText = await robotsResponse.text()
  expect(robotsText).toContain("Sitemap: https://xistoh.com/sitemap.xml")
  expect(robotsText).toContain("Disallow: /admin")
  expect(robotsText).toContain("Disallow: /api")

  const sitemapResponse = await request.get("/sitemap.xml")
  expect(sitemapResponse.ok()).toBeTruthy()
  const sitemapText = await sitemapResponse.text()
  expect(sitemapText).toContain("<loc>https://xistoh.com</loc>")
  expect(sitemapText).toContain("<loc>https://xistoh.com/notes</loc>")
  expect(sitemapText).toContain("<loc>https://xistoh.com/projects</loc>")
  expect(sitemapText).not.toContain("/knowledge")
})

test("public pages emit route metadata and detail structured data", async ({ request }) => {
  const homeResponse = await request.get("/")
  expect(homeResponse.ok()).toBeTruthy()
  const homeHtml = await homeResponse.text()
  expect(homeHtml).toContain("<title>Jimin Park | xistoh.log</title>")
  expect(homeHtml).toContain('property="og:title"')
  expect(homeHtml).toContain('name="twitter:card"')
  expect(homeHtml).toContain('rel="canonical" href="https://xistoh.com"')

  const detailPath = await ensurePublishedSeoDetailPath()
  const detailResponse = await request.get(detailPath)
  expect(detailResponse.ok()).toBeTruthy()
  const detailHtml = await detailResponse.text()
  expect(detailHtml).toContain('property="og:type" content="article"')
  expect(detailHtml).toContain('application/ld+json')
  expect(detailHtml).toContain('"@type":"Article"')
  expect(detailHtml).toContain('"name":"Jimin Park"')
  expect(detailHtml).toContain('rel="canonical" href="https://xistoh.com')
})
