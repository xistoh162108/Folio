import Link from "next/link"

import { AssetGallery } from "@/components/site/asset-gallery"
import { CommentsSection } from "@/components/site/comments-section"
import { LinkPreviews } from "@/components/site/link-previews"
import { PostLikeButton } from "@/components/site/post-like-button"
import { RichContent } from "@/components/site/rich-content"
import type { PostDetailDTO } from "@/lib/contracts/posts"

export function PostDetailView({
  post,
  kindLabel,
  backHref,
  backLabel,
  attachmentTitle,
  canModerate,
}: {
  post: PostDetailDTO
  kindLabel: string
  backHref: string
  backLabel: string
  attachmentTitle: string
  canModerate: boolean
}) {
  const publishedLabel = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "Draft"

  return (
    <article className="mt-8 space-y-6">
      <Link href={backHref} className="text-sm text-zinc-500 transition hover:text-white">
        ← {backLabel}
      </Link>
      <div className="space-y-4">
        <p className="text-xs uppercase tracking-[0.22em] text-[#D4FF00]">{kindLabel}</p>
        <h1 className="max-w-4xl text-4xl font-semibold text-white md:text-5xl">{post.title}</h1>
        {post.excerpt ? <p className="max-w-2xl text-base leading-7 text-zinc-400">{post.excerpt}</p> : null}
      </div>
      <div className="flex flex-wrap gap-3 text-xs uppercase tracking-[0.18em] text-zinc-500">
        <span>{publishedLabel}</span>
        <span>{post.views} views</span>
        {post.tags.map((tag) => (
          <span key={tag}>{tag}</span>
        ))}
      </div>
      {post.coverImageUrl ? (
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-zinc-950/60">
          <img src={post.coverImageUrl} alt={post.title} className="h-auto w-full object-cover" />
        </div>
      ) : null}
      <div className="rounded-3xl border border-white/10 bg-zinc-950/60 p-8">
        <div className="prose prose-invert max-w-none prose-p:text-zinc-300 prose-headings:text-white prose-pre:bg-transparent prose-code:text-inherit">
          <RichContent content={post.content} fallbackHtml={post.htmlContent} />
        </div>
      </div>
      <div className="flex items-center justify-between gap-4 rounded-3xl border border-white/10 bg-black/30 px-5 py-4">
        <p className="text-sm text-zinc-400">Leave a signal on the log stream.</p>
        <PostLikeButton postId={post.id} initialCount={post.likeCount} />
      </div>
      <CommentsSection postId={post.id} initialComments={post.comments} canModerate={canModerate} />
      <AssetGallery assets={post.assets} coverImageUrl={post.coverImageUrl} />
      <LinkPreviews links={post.links} />
      {post.assets.filter((asset) => asset.kind === "FILE").length > 0 ? (
        <section className="space-y-3 rounded-3xl border border-white/10 bg-zinc-950/60 p-6">
          <h2 className="text-lg font-semibold text-white">{attachmentTitle}</h2>
          <ul className="space-y-2">
            {post.assets
              .filter((asset) => asset.kind === "FILE")
              .map((asset) => (
                <li key={asset.id}>
                  <a
                    href={asset.url}
                    className="inline-flex items-center gap-2 text-sm text-[#D4FF00] transition hover:text-white"
                  >
                    <span>{asset.originalName}</span>
                    <span className="text-zinc-500">download</span>
                  </a>
                </li>
              ))}
          </ul>
        </section>
      ) : null}
    </article>
  )
}
