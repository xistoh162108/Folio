import { V0CommentsLog } from "@/components/v0/public/comments-log"
import { DetailProjectScreen } from "@/components/v0/public/detail-project-screen"
import { formatBytes } from "@/components/v0/public/mappers"
import { V0PostLikeButton } from "@/components/v0/public/post-like-button"
import { getSession } from "@/lib/auth"
import { collectBlockDocumentResources, normalizeContentResourceUrl } from "@/lib/content/post-content"
import { getPublishedPostDetail } from "@/lib/data/posts"
import type { PostDetailDTO } from "@/lib/contracts/posts"
import { getV0ThemeIsDark } from "@/lib/site/v0-theme.server"

export async function DetailProjectScreenBound({
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
    post ? Promise.resolve(post) : getPublishedPostDetail("PROJECT", slug),
    getV0ThemeIsDark(),
  ])
  const borderColor = isDarkMode ? "border-white/20" : "border-black/20"
  const hoverBg = isDarkMode ? "hover:bg-white/5" : "hover:bg-black/5"
  const mutedText = isDarkMode ? "text-white/50" : "text-black/50"
  const renderedResources = collectBlockDocumentResources(resolvedPost.content)
  const visibleAssets = resolvedPost.assets.filter(
    (asset) =>
      !renderedResources.assetIds.includes(asset.id) &&
      !renderedResources.assetUrls.includes(normalizeContentResourceUrl(asset.url)),
  )

  return (
    <DetailProjectScreen
      isDarkMode={isDarkMode}
      brandLabel={brandLabel}
      post={resolvedPost}
      backHref="/projects"
      footerActions={<V0PostLikeButton postId={resolvedPost.id} initialCount={resolvedPost.likeCount} isDarkMode={isDarkMode} />}
      extraSections={
        <>
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
            canModerate={Boolean(session?.user?.id)}
            isDarkMode={isDarkMode}
          />
        </>
      }
    />
  )
}
