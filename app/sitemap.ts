import type { MetadataRoute } from "next"

import { getPublishedPostsByType } from "@/lib/data/posts"
import { SITE_URL } from "@/lib/seo/metadata"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [notes, projects] = await Promise.all([getPublishedPostsByType("NOTE"), getPublishedPostsByType("PROJECT")])

  return [
    {
      url: SITE_URL,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/contact`,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/guestbook`,
      changeFrequency: "daily",
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/notes`,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/projects`,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    ...notes.map((note) => ({
      url: `${SITE_URL}/notes/${note.slug}`,
      lastModified: note.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...projects.map((project) => ({
      url: `${SITE_URL}/projects/${project.slug}`,
      lastModified: project.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ]
}
