import Link from "next/link"
import { redirect } from "next/navigation"

import { confirmSubscription } from "@/lib/actions/subscriber.actions"
import { SubscriptionResultScreen } from "@/components/v0/public/subscription-result-screen"
import { getV0ThemeIsDark } from "@/lib/site/v0-theme.server"

function getConfirmCopy(code: string | undefined, fallback: string | undefined) {
  switch (code) {
    case "confirmed":
      return {
        eyebrow: "Subscription",
        title: "Subscription confirmed",
        description: fallback ?? "The signal is live. Future sends will route to this inbox.",
        overlayValue: "[CONFIRMED]",
      }
    case "subscribed":
      return {
        eyebrow: "Subscription",
        title: "Subscribed",
        description: fallback ?? "This inbox is already active.",
        overlayValue: "[SUBSCRIBED]",
      }
    case "expired":
      return {
        eyebrow: "Subscription",
        title: "Confirmation link expired",
        description: fallback ?? "This signal window closed. Request a fresh confirmation link from home.",
        overlayValue: "[EXPIRED]",
      }
    default:
      return {
        eyebrow: "Subscription",
        title: "Subscription link issue",
        description: fallback ?? "This confirmation link is invalid.",
        overlayValue: "[INVALID]",
      }
  }
}

export async function ConfirmSubscriptionScreenBound({
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
  const copy = getConfirmCopy(result, message)
  const hoverBg = isDarkMode ? "hover:bg-white/5" : "hover:bg-black/5"

  async function handleConfirm(formData: FormData) {
    "use server"

    const formToken = String(formData.get("token") ?? "")
    const response = await confirmSubscription(formToken)
    const params = new URLSearchParams({ result: response.code ?? "invalid" })
    if (response.message) {
      params.set("message", response.message)
    }
    redirect(`/subscribe/confirm?${params.toString()}`)
  }

  return (
    <SubscriptionResultScreen
      brandLabel={brandLabel}
      isDarkMode={isDarkMode}
      eyebrow={copy.eyebrow}
      overlayValue={result ? copy.overlayValue : token ? "[PENDING]" : "[INVALID]"}
      title={result ? copy.title : "Confirm your subscription"}
      body={
        result
          ? copy.description
          : token
            ? "One step left. Confirm this address to start receiving xistoh.log dispatches."
            : "This confirmation link is invalid."
      }
      actions={
        <>
          {!result && token ? (
            <form action={handleConfirm}>
              <input type="hidden" name="token" value={token} />
              <button className={`${hoverBg} px-2 py-1`}>[confirm subscription]</button>
            </form>
          ) : null}
          <Link href="/" className={`${hoverBg} px-2 py-1`}>
            [home]
          </Link>
          {result && result !== "confirmed" && result !== "subscribed" ? (
            <Link href="/" className={`${hoverBg} px-2 py-1`}>
              [request new link]
            </Link>
          ) : null}
        </>
      }
    />
  )
}
