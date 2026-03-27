import { ProjectsScreen } from "@/components/v0/public/projects-screen"
import { getPublishedProjectIndexItems } from "@/lib/data/posts"
import { getV0ThemeIsDark } from "@/lib/site/v0-theme.server"

export async function ProjectsScreenBound({ brandLabel = "xistoh.log" }: { brandLabel?: string } = {}) {
  const [isDarkMode, projects] = await Promise.all([getV0ThemeIsDark(), getPublishedProjectIndexItems()])

  return <ProjectsScreen brandLabel={brandLabel} isDarkMode={isDarkMode} projects={projects} />
}
