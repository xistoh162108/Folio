import Link from "next/link"
import { redirect } from "next/navigation"

import { unsubscribeSubscription } from "@/lib/actions/subscriber.actions"
import { SubscriptionResultScreen } from "@/components/v0/public/subscription-result-screen"
import { getV0ThemeIsDark } from "@/lib/site/v0-theme.server"

function getUnsubscribeCopy(code: string | undefined, fallback: string | undefined) {
  switch (code) {
    case "unsubscribed":
      return {
        eyebrow: "Unsubscribe",
        title: "STATUS: UNSUBSCRIBED",
        description: fallback ?? "Unsubscribe command complete. You have been removed from future sends.",
      }
    case "already_unsubscribed":
      return {
        eyebrow: "Unsubscribe",
        title: "STATUS: ALREADY UNSUBSCRIBED",
        description: fallback ?? "No action required. This address is already removed from future sends.",
      }
    default:
      return {
        eyebrow: "Unsubscribe",
        title: "STATUS: LINK INVALID",
        description: fallback ?? "Token validation failed. This unsubscribe link is invalid.",
      }
  }
}

export async function UnsubscribeScreenBound({
  token,
  result,
  message,
  brandLabel = "xistoh.log",
}: {
  token?: string
  result?: string
  message?: string
  brandLabel?: string
}) {
  const isDarkMode = await getV0ThemeIsDark()
  const copy = getUnsubscribeCopy(result, message)
  const hoverBg = isDarkMode ? "hover:bg-white/5" : "hover:bg-black/5"

  async function handleUnsubscribe(formData: FormData) {
    "use server"

    const formToken = String(formData.get("token") ?? "")
    const response = await unsubscribeSubscription(formToken)
    const params = new URLSearchParams({ result: response.code ?? "invalid" })
    if (response.message) {
      params.set("message", response.message)
    }
    redirect(`/unsubscribe?${params.toString()}`)
  }

  return (
    <SubscriptionResultScreen
      brandLabel={brandLabel}
      isDarkMode={isDarkMode}
      eyebrow={copy.eyebrow}
      title={result ? copy.title : "STATUS: AWAITING UNSUBSCRIBE"}
      body={
        result
          ? copy.description
          : token
            ? "Run unsubscribe action to stop all future newsletter sends for this address."
            : "Token validation failed. This unsubscribe link is invalid."
      }
      actions={
        <>
          {!result && token ? (
            <form action={handleUnsubscribe}>
              <input type="hidden" name="token" value={token} />
              <button className={`${hoverBg} px-2 py-1`}>[Unsubscribe / 구독 취소하기]</button>
            </form>
          ) : null}
          <Link href="/" className={`${hoverBg} px-2 py-1`}>
            [Go Home / 홈으로]
          </Link>
        </>
      }
    />
  )
}
