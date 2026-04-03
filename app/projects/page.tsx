import type { Metadata } from "next"

import { ProjectsScreenBound } from "@/components/v0/public/projects-screen-bound"
import { buildPublicMetadata } from "@/lib/seo/metadata"

export const dynamic = "force-dynamic"

export const metadata: Metadata = buildPublicMetadata({
  title: "Projects",
  description: "Selected projects, builds, and shipped work presented in the exact xistoh.log project shell.",
  path: "/projects",
})

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
  return <ProjectsScreenBound q={q} />
}
