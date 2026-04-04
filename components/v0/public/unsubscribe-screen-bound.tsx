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
        title: "Subscription cancelled",
        description: fallback ?? "This inbox has been removed from future sends.",
        overlayValue: "[UNSUBSCRIBED]",
      }
    case "already_unsubscribed":
      return {
        eyebrow: "Unsubscribe",
        title: "Already unsubscribed",
        description: fallback ?? "This address was already removed from future sends.",
        overlayValue: "[ALREADY_OFFLINE]",
      }
    default:
      return {
        eyebrow: "Unsubscribe",
        title: "Unsubscribe link issue",
        description: fallback ?? "This unsubscribe link is invalid.",
        overlayValue: "[INVALID]",
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
      overlayValue={result ? copy.overlayValue : token ? "[CONFIRM]" : "[INVALID]"}
      title={result ? copy.title : "Confirm unsubscribe"}
      body={
        result
          ? copy.description
          : token
            ? "Confirm that you want to stop receiving future newsletter sends."
            : "This unsubscribe link is invalid."
      }
      actions={
        <>
          {!result && token ? (
            <form action={handleUnsubscribe}>
              <input type="hidden" name="token" value={token} />
              <button className={`${hoverBg} px-2 py-1`}>[unsubscribe]</button>
            </form>
          ) : null}
          <Link href="/" className={`${hoverBg} px-2 py-1`}>
            [home]
          </Link>
        </>
      }
    />
  )
}
