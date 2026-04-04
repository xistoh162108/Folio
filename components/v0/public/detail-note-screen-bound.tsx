import { V0CommentsLog } from "@/components/v0/public/comments-log"
import { DetailNoteScreen } from "@/components/v0/public/detail-note-screen"
import { formatBytes } from "@/components/v0/public/mappers"
import { V0PostLikeButton } from "@/components/v0/public/post-like-button"
import { getSession } from "@/lib/auth"
import { collectBlockDocumentResources, normalizeContentResourceUrl } from "@/lib/content/post-content"
import { getPublishedPostDetail } from "@/lib/data/posts"
import type { PostDetailDTO } from "@/lib/contracts/posts"
import { getV0ThemeIsDark } from "@/lib/site/v0-theme.server"

export async function DetailNoteScreenBound({
  slug,
  brandLabel = "xistoh.log",
  post,
}: {
  slug: string
  brandLabel?: string
  post?: PostDetailDTO
}) {
  const [session, resolvedPost, isDarkMode] = await Promise.all([
    getSession(),
    post ? Promise.resolve(post) : getPublishedPostDetail("NOTE", slug),
    getV0ThemeIsDark(),
  ])
  const borderColor = isDarkMode ? "border-white/20" : "border-black/20"
  const hoverBg = isDarkMode ? "hover:bg-white/5" : "hover:bg-black/5"
  const mutedText = isDarkMode ? "text-white/50" : "text-black/50"
  const renderedResources = collectBlockDocumentResources(resolvedPost.content)
  const visibleLinks = resolvedPost.links.filter(
    (link) => !renderedResources.linkUrls.includes(normalizeContentResourceUrl(link.normalizedUrl ?? link.url)),
  )
  const visibleAssets = resolvedPost.assets.filter(
    (asset) =>
      !renderedResources.assetIds.includes(asset.id) &&
      !renderedResources.assetUrls.includes(normalizeContentResourceUrl(asset.url)),
  )

  return (
    <DetailNoteScreen
      isDarkMode={isDarkMode}
      brandLabel={brandLabel}
      post={resolvedPost}
      backHref="/notes"
      footerActions={<V0PostLikeButton postId={resolvedPost.id} initialCount={resolvedPost.likeCount} isDarkMode={isDarkMode} />}
      extraSections={
        <>
          {visibleLinks.length ? (
            <section className={`pt-8 border-t ${borderColor} space-y-3`}>
              <p className={`text-xs ${mutedText}`}>// links</p>
              <div className="space-y-2 text-xs">
                {visibleLinks.map((link) => (
                  <a
                    key={link.id ?? link.url}
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                    className={`block ${hoverBg} px-2 py-1`}
                  >
                    {link.label} -&gt;
                  </a>
                ))}
              </div>
            </section>
          ) : null}
          {visibleAssets.length ? (
            <section className={`pt-8 border-t ${borderColor} space-y-3`}>
              <p className={`text-xs ${mutedText}`}>// assets</p>
              <div className="space-y-2 text-xs">
                {visibleAssets.map((asset) => (
                  <a key={asset.id} href={asset.url} className={`flex items-center justify-between ${hoverBg} px-2 py-1`}>
                    <span>{asset.originalName}</span>
                    <span className={mutedText}>
                      {asset.mime} / {formatBytes(asset.size)}
                    </span>
                  </a>
                ))}
              </div>
            </section>
          ) : null}
          <V0CommentsLog
            postId={resolvedPost.id}
            initialComments={resolvedPost.comments}
            initialCommentsPagination={resolvedPost.commentsPagination}
            canModerate={Boolean(session?.user?.id)}
            isDarkMode={isDarkMode}
          />
        </>
      }
    />
  )
}
