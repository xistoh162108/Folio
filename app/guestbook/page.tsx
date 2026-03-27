import type { Metadata } from "next"

import { GuestbookScreenBound } from "@/components/v0/public/guestbook-screen-bound"
import { buildPublicMetadata } from "@/lib/seo/metadata"

export const dynamic = "force-dynamic"

export const metadata: Metadata = buildPublicMetadata({
  title: "Guestbook",
  description: "Visitor system logs and guestbook entries inside the exact xistoh.log terminal composition.",
  path: "/guestbook",
})

export default async function GuestbookPage() {
  return <GuestbookScreenBound />
}
