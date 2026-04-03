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
        title: "STATUS: CONFIRMED",
        description: fallback ?? "Subscription handshake complete. Newsletter delivery is active.",
      }
    case "already_confirmed":
      return {
        eyebrow: "Subscription",
        title: "STATUS: ALREADY CONFIRMED",
        description: fallback ?? "No action required. This subscription is already active.",
      }
    case "expired":
      return {
        eyebrow: "Subscription",
        title: "STATUS: LINK EXPIRED",
        description: fallback ?? "This token is expired. Request a new confirmation link from home.",
      }
    default:
      return {
        eyebrow: "Subscription",
        title: "STATUS: LINK INVALID",
        description: fallback ?? "Token validation failed. This confirmation link is invalid.",
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
      title={result ? copy.title : "STATUS: AWAITING CONFIRMATION"}
      body={
        result
          ? copy.description
          : token
            ? "Run confirm action to activate newsletter delivery for this address."
            : "Token validation failed. This confirmation link is invalid."
      }
      actions={
        <>
          {!result && token ? (
            <form action={handleConfirm}>
              <input type="hidden" name="token" value={token} />
              <button className={`${hoverBg} px-2 py-1`}>[Confirm Subscription / 구독 확정하기]</button>
            </form>
          ) : null}
          <Link href="/" className={`${hoverBg} px-2 py-1`}>
            [Go Home / 홈으로]
          </Link>
          {result && result !== "confirmed" ? (
            <Link href="/" className={`${hoverBg} px-2 py-1`}>
              [Request New Link / 새 링크 요청하기]
            </Link>
          ) : null}
        </>
      }
    />
  )
}
