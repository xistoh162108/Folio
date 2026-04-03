import { ProjectsScreen } from "@/components/v0/public/projects-screen"
import { getPublishedProjectIndexItems } from "@/lib/data/posts"
import { getV0ThemeIsDark } from "@/lib/site/v0-theme.server"

interface ProjectsScreenBoundProps {
  brandLabel?: string
  q?: string
}

export async function ProjectsScreenBound({ brandLabel = "xistoh.log", q }: ProjectsScreenBoundProps = {}) {
  const [isDarkMode, projects] = await Promise.all([getV0ThemeIsDark(), getPublishedProjectIndexItems({ q })])

  return <ProjectsScreen brandLabel={brandLabel} isDarkMode={isDarkMode} projects={projects} initialSearchQuery={q ?? ""} />
}
