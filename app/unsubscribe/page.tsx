import type { Metadata } from "next"

import { UnsubscribeScreenBound } from "@/components/v0/public/unsubscribe-screen-bound"
import { buildPublicMetadata } from "@/lib/seo/metadata"

export const metadata: Metadata = buildPublicMetadata({
  title: "Unsubscribe Result",
  description: "Newsletter unsubscribe result for xistoh.log.",
  path: "/unsubscribe",
  noIndex: true,
})

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; result?: string; message?: string }>
}) {
  const { token, result, message } = await searchParams
  return <UnsubscribeScreenBound token={token} result={result} message={message} />
}
