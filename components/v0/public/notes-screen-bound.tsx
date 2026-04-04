import { NotesScreen } from "@/components/v0/public/notes-screen"
import { getPublicPosts, type PublicPostsQueryInput } from "@/lib/data/posts"
import { getV0ThemeIsDark } from "@/lib/site/v0-theme.server"

export async function NotesScreenBound({
  brandLabel = "xistoh.log",
  query,
}: {
  brandLabel?: string
  query?: PublicPostsQueryInput
} = {}) {
  const [isDarkMode, result] = await Promise.all([getV0ThemeIsDark(), getPublicPosts("NOTE", query)])

  return (
    <NotesScreen
      brandLabel={brandLabel}
      isDarkMode={isDarkMode}
      notes={result.posts}
      pagination={result.pagination}
      searchQuery={result.query.q}
      selectedTag={result.query.tag}
      tagOptions={result.tags}
      rssHref="/notes/rss.xml"
    />
  )
}
