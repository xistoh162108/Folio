import Link from "next/link"
import { redirect } from "next/navigation"

import { SiteHeader } from "@/components/site/site-header"
import { unsubscribeSubscription } from "@/lib/actions/subscriber.actions"

function getUnsubscribeCopy(code: string | undefined, fallback: string | undefined) {
  switch (code) {
    case "unsubscribed":
      return {
        eyebrow: "Unsubscribe",
        title: "Subscription cancelled",
        description: fallback ?? "You have been removed from future sends.",
      }
    case "already_unsubscribed":
      return {
        eyebrow: "Unsubscribe",
        title: "Already unsubscribed",
        description: fallback ?? "This address had already been removed from future sends.",
      }
    default:
      return {
        eyebrow: "Unsubscribe",
        title: "Unsubscribe link issue",
        description: fallback ?? "This unsubscribe link is invalid.",
      }
  }
}

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; result?: string; message?: string }>
}) {
  const { token, result, message } = await searchParams
  const copy = getUnsubscribeCopy(result, message)

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
    <div className="min-h-screen bg-black text-white">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-6 py-16">
        <div className="rounded-3xl border border-white/10 bg-zinc-950/70 p-8">
          <p className="text-xs uppercase tracking-[0.22em] text-[#D4FF00]">{copy.eyebrow}</p>
          <h1 className="mt-3 text-3xl font-semibold text-white">{result ? copy.title : "Confirm unsubscribe"}</h1>
          <p className="mt-4 text-base leading-7 text-zinc-400">
            {result
              ? copy.description
              : token
                ? "Confirm that you want to stop receiving future newsletter sends."
                : "This unsubscribe link is invalid."}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            {!result && token ? (
              <form action={handleUnsubscribe}>
                <input type="hidden" name="token" value={token} />
                <button className="rounded-full border border-white/10 px-4 py-2 text-sm text-white transition hover:border-white/30">
                  Unsubscribe
                </button>
              </form>
            ) : null}
            <Link href="/" className="rounded-full border border-[#D4FF00]/40 px-4 py-2 text-sm text-[#D4FF00] transition hover:bg-[#D4FF00] hover:text-black">
              Return home
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
