import { GuestbookLog } from "@/components/site/guestbook-log"
import { SiteHeader } from "@/components/site/site-header"
import { getSession } from "@/lib/auth"
import { getGuestbookEntries } from "@/lib/data/guestbook"

export const dynamic = "force-dynamic"

export default async function GuestbookPage() {
  const [session, entries] = await Promise.all([getSession(), getGuestbookEntries()])

  return (
    <div className="min-h-screen bg-black text-white">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-6 py-12">
        <section className="rounded-[2rem] border border-white/10 bg-zinc-950/70 p-8">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#D4FF00]">Guestbook</p>
          <h1 className="mt-3 text-4xl font-semibold text-white">System logs from visitors</h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-zinc-400">
            Anonymous entries publish immediately, carry lightweight spam protection, and remain soft-deletable by an authenticated administrator.
          </p>
        </section>

        <div className="mt-8">
          <GuestbookLog initialEntries={entries} canModerate={Boolean(session?.user?.id)} />
        </div>
      </main>
    </div>
  )
}
