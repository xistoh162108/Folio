import type { Metadata } from "next"

import { ProjectsScreenBound } from "@/components/v0/public/projects-screen-bound"
import { buildPublicMetadata } from "@/lib/seo/metadata"

export const dynamic = "force-dynamic"

function readParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}): Promise<Metadata> {
  const params = await searchParams
  const q = readParam(params.q)?.trim() ?? ""
  const tag = readParam(params.tag)?.trim() ?? ""
  const page = Number.parseInt(readParam(params.page) ?? "1", 10)

  return buildPublicMetadata({
    title: "Projects",
    description: "Selected projects, builds, and shipped work presented in the exact xistoh.log project shell.",
    path: "/projects",
    noIndex: Boolean(q || tag || (Number.isFinite(page) && page > 1)),
    feed: {
      path: "/projects/rss.xml",
      title: "xistoh.log Projects RSS",
    },
  })
}

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams

  return (
    <ProjectsScreenBound
      query={{
        q: readParam(params.q),
        tag: readParam(params.tag),
        page: readParam(params.page),
      }}
    />
  )
}
