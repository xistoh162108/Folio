import { ProjectsScreen } from "@/components/v0/public/projects-screen"
import { getPublicPosts, type PublicPostsQueryInput } from "@/lib/data/posts"
import { getV0ThemeIsDark } from "@/lib/site/v0-theme.server"

export async function ProjectsScreenBound({
  brandLabel = "xistoh.log",
  query,
}: {
  brandLabel?: string
  query?: PublicPostsQueryInput
} = {}) {
  const [isDarkMode, result] = await Promise.all([getV0ThemeIsDark(), getPublicPosts("PROJECT", query)])

  return (
    <ProjectsScreen
      brandLabel={brandLabel}
      isDarkMode={isDarkMode}
      projects={result.posts}
      pagination={result.pagination}
      searchQuery={result.query.q}
      selectedTag={result.query.tag}
      tagOptions={result.tags}
      rssHref="/projects/rss.xml"
    />
  )
}
