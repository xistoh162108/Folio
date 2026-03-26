import Link from "next/link"

import { ContactPanel } from "@/components/site/contact-panel"
import { PostCard } from "@/components/site/post-card"
import { SignalPanel } from "@/components/site/signal-panel"
import { SiteHeader } from "@/components/site/site-header"
import { SubscriptionModule } from "@/components/subscription-module"
import { getHomepagePosts } from "@/lib/data/posts"
import { profile } from "@/lib/site/profile"

export const dynamic = "force-dynamic"

export default async function HomePage() {
  const { notes, projects } = await getHomepagePosts()

  return (
    <div className="min-h-screen bg-black text-white">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-6 py-10">
        <section className="grid gap-8 xl:grid-cols-[1fr_1fr]">
          <div className="space-y-8 rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(13,13,13,0.95),rgba(0,0,0,0.98))] p-7">
            <div className="space-y-4">
              <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-[#D4FF00]">Identity</p>
              <h1 className="max-w-3xl font-mono text-4xl font-semibold uppercase leading-tight text-white md:text-5xl">
                {profile.name}
              </h1>
              <p className="font-mono text-sm uppercase tracking-[0.18em] text-[#D4FF00]/80">{profile.role}</p>
              <p className="max-w-2xl text-base leading-7 text-zinc-400">{profile.bio}</p>
            </div>

            <div className="rounded-[1.5rem] border border-white/10 bg-black/30 p-5">
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-zinc-500">Education</p>
              <p className="mt-3 font-mono text-sm leading-7 text-zinc-300">&gt; {profile.educationLine}</p>
            </div>

            <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
              <section className="rounded-[1.5rem] border border-white/10 bg-black/30 p-5">
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-zinc-500">Experience timeline</p>
                <div className="mt-5 space-y-5">
                  {profile.experience.map((item) => (
                    <div key={item.year + item.label} className="grid gap-2 border-l border-[#D4FF00]/20 pl-4">
                      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#D4FF00]/70">{item.year}</p>
                      <p className="text-base font-semibold text-white">{item.label}</p>
                      <p className="text-sm leading-6 text-zinc-400">{item.detail}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-[1.5rem] border border-white/10 bg-black/30 p-5">
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-zinc-500">Focus</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {profile.focusAreas.map((area) => (
                    <span key={area} className="rounded-full border border-white/10 px-3 py-1.5 text-sm text-zinc-300">
                      {area}
                    </span>
                  ))}
                </div>
                <div className="mt-8">
                  <Link
                    href="/resume.pdf"
                    className="inline-flex font-mono text-sm text-[#D4FF00] transition hover:text-white"
                  >
                    [↓ fetch resume.pdf]
                  </Link>
                </div>
              </section>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/knowledge"
                className="rounded-full border border-[#D4FF00]/40 px-5 py-3 font-mono text-sm text-[#D4FF00] transition hover:bg-[#D4FF00] hover:text-black"
              >
                Browse /knowledge
              </Link>
              <Link
                href="/projects"
                className="rounded-full border border-white/10 px-5 py-3 font-mono text-sm text-white transition hover:border-white/30"
              >
                Open /projects
              </Link>
              <Link
                href="/guestbook"
                className="rounded-full border border-white/10 px-5 py-3 font-mono text-sm text-white transition hover:border-white/30"
              >
                Read /guestbook
              </Link>
            </div>
          </div>

          <SignalPanel />
        </section>

        <section className="mt-16 space-y-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-zinc-500">Knowledge</p>
              <h2 className="mt-2 text-3xl font-semibold text-white">Recent notes and built work</h2>
            </div>
            <Link href="/knowledge" className="font-mono text-sm text-zinc-400 transition hover:text-white">
              Open unified index
            </Link>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {notes.slice(0, 2).map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
            {projects.slice(0, 2).map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </section>

        <section className="mt-16 grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <div id="contact" className="rounded-[2rem] border border-white/10 bg-zinc-950/70 p-6">
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-zinc-500">Contact</p>
            <h2 className="mt-3 text-2xl font-semibold text-white">Direct handshake</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400">
              Contact submissions are stored in PostgreSQL, queued for webhook delivery, and rendered in a terminal-first form shell.
            </p>
            <div className="mt-6">
              <ContactPanel />
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-zinc-950/70 p-6">
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-zinc-500">Newsletter</p>
            <h2 className="mt-3 text-2xl font-semibold text-white">Stay on the feed</h2>
            <p className="mt-3 text-sm leading-6 text-zinc-400">
              Subscriptions, confirmations, and newsletter campaigns are already wired into the production backend.
            </p>
            <div className="mt-6">
              <SubscriptionModule isDarkMode compact={false} />
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
