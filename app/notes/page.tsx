import type { Metadata } from "next"

import { NotesScreenBound } from "@/components/v0/public/notes-screen-bound"
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
    title: "Notes",
    description: "Published notes, seeds, and experiments in the exact xistoh.log reading language.",
    path: "/notes",
    noIndex: Boolean(q || tag || (Number.isFinite(page) && page > 1)),
    feed: {
      path: "/notes/rss.xml",
      title: "xistoh.log Notes RSS",
    },
  })
}

export default async function NotesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams

  return (
    <NotesScreenBound
      query={{
        q: readParam(params.q),
        tag: readParam(params.tag),
        page: readParam(params.page),
      }}
    />
  )
}
