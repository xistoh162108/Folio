import type { Metadata } from "next"

import { ConfirmSubscriptionScreenBound } from "@/components/v0/public/confirm-subscription-screen-bound"
import { buildPublicMetadata } from "@/lib/seo/metadata"

export const metadata: Metadata = buildPublicMetadata({
  title: "Subscription Result",
  description: "Subscription confirmation result for xistoh.log.",
  path: "/subscribe/confirm",
  noIndex: true,
})

export default async function ConfirmSubscriptionPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; result?: string; message?: string }>
}) {
  const { token, result, message } = await searchParams
  return <ConfirmSubscriptionScreenBound token={token} result={result} message={message} />
}
