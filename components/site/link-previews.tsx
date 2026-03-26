import type { PostLinkDTO } from "@/lib/contracts/posts"

export function LinkPreviews({ links }: { links: PostLinkDTO[] }) {
  if (links.length === 0) {
    return null
  }

  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <p className="text-xs uppercase tracking-[0.22em] text-[#D4FF00]">Linked resources</p>
        <h2 className="text-2xl font-semibold text-white">References and embeds</h2>
      </div>

      <div className="space-y-4">
        {links.map((link) =>
          link.type === "YOUTUBE" && link.embedUrl ? (
            <div key={link.url} className="overflow-hidden rounded-3xl border border-white/10 bg-zinc-950/60">
              <div className="aspect-video">
                <iframe
                  src={link.embedUrl}
                  title={link.title ?? link.label}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="h-full w-full"
                />
              </div>
              <div className="space-y-2 p-5">
                <p className="text-lg font-semibold text-white">{link.title ?? link.label}</p>
                {link.description ? <p className="text-sm leading-6 text-zinc-400">{link.description}</p> : null}
              </div>
            </div>
          ) : (
            <a
              key={link.url}
              href={link.url}
              target="_blank"
              rel="noreferrer"
              className="block overflow-hidden rounded-3xl border border-white/10 bg-zinc-950/60 transition hover:border-[#D4FF00]/40"
            >
              {link.imageUrl ? <img src={link.imageUrl} alt={link.title ?? link.label} className="h-48 w-full object-cover" /> : null}
              <div className="space-y-2 p-5">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-lg font-semibold text-white">{link.title ?? link.label}</p>
                  <span className="text-xs uppercase tracking-[0.18em] text-zinc-500">{link.siteName ?? link.type}</span>
                </div>
                {link.description ? <p className="text-sm leading-6 text-zinc-400">{link.description}</p> : null}
                {link.metadata?.kind === "GITHUB" ? (
                  <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.16em] text-zinc-500">
                    <span>{link.metadata.owner}/{link.metadata.repo}</span>
                    {link.metadata.primaryLanguage ? <span>{link.metadata.primaryLanguage}</span> : null}
                    {typeof link.metadata.stars === "number" ? <span>{link.metadata.stars} stars</span> : null}
                    {typeof link.metadata.forks === "number" ? <span>{link.metadata.forks} forks</span> : null}
                    {typeof link.metadata.openIssues === "number" ? <span>{link.metadata.openIssues} issues</span> : null}
                  </div>
                ) : null}
                <p className="text-sm text-[#D4FF00]">{link.url}</p>
              </div>
            </a>
          ),
        )}
      </div>
    </section>
  )
}
