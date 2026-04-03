import type { Metadata } from "next"

import { NotesScreenBound } from "@/components/v0/public/notes-screen-bound"
import { buildPublicMetadata } from "@/lib/seo/metadata"

export const dynamic = "force-dynamic"

export const metadata: Metadata = buildPublicMetadata({
  title: "Notes",
  description: "Published notes, seeds, and experiments in the exact xistoh.log reading language.",
  path: "/notes",
})

export default async function NotesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  return <NotesScreenBound searchParams={searchParams} />
}
