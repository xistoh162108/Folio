import Link from "next/link"
import { redirect } from "next/navigation"

import { confirmSubscription } from "@/lib/actions/subscriber.actions"
import { SiteHeader } from "@/components/site/site-header"

function getConfirmCopy(code: string | undefined, fallback: string | undefined) {
  switch (code) {
    case "confirmed":
      return {
        eyebrow: "Subscription",
        title: "Subscription confirmed",
        description: fallback ?? "Your subscription is now active.",
      }
    case "already_confirmed":
      return {
        eyebrow: "Subscription",
        title: "Already confirmed",
        description: fallback ?? "This subscription has already been confirmed.",
      }
    case "expired":
      return {
        eyebrow: "Subscription",
        title: "Confirmation link expired",
        description: fallback ?? "Please request a fresh confirmation email from the homepage.",
      }
    default:
      return {
        eyebrow: "Subscription",
        title: "Subscription link issue",
        description: fallback ?? "This confirmation link is invalid.",
      }
  }
}

export default async function ConfirmSubscriptionPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; result?: string; message?: string }>
}) {
  const { token, result, message } = await searchParams
  const copy = getConfirmCopy(result, message)

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
    <div className="min-h-screen bg-black text-white">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-6 py-16">
        <div className="rounded-3xl border border-white/10 bg-zinc-950/70 p-8">
          <p className="text-xs uppercase tracking-[0.22em] text-[#D4FF00]">{copy.eyebrow}</p>
          <h1 className="mt-3 text-3xl font-semibold text-white">{result ? copy.title : "Confirm your subscription"}</h1>
          <p className="mt-4 text-base leading-7 text-zinc-400">
            {result
              ? copy.description
              : token
                ? "Confirm this subscription to start receiving newsletter updates."
                : "This confirmation link is invalid."}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            {!result && token ? (
              <form action={handleConfirm}>
                <input type="hidden" name="token" value={token} />
                <button className="rounded-full border border-[#D4FF00]/40 px-4 py-2 text-sm text-[#D4FF00] transition hover:bg-[#D4FF00] hover:text-black">
                  Confirm subscription
                </button>
              </form>
            ) : null}
            <Link href="/" className="rounded-full border border-[#D4FF00]/40 px-4 py-2 text-sm text-[#D4FF00] transition hover:bg-[#D4FF00] hover:text-black">
              Return home
            </Link>
            {result && result !== "confirmed" ? (
              <Link href="/" className="rounded-full border border-white/10 px-4 py-2 text-sm text-white transition hover:border-white/30">
                Request a new link
              </Link>
            ) : null}
          </div>
        </div>
      </main>
    </div>
  )
}
