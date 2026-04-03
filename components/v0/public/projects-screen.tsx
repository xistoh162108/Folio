"use client"

import Link from "next/link"

import { projectsData } from "@/components/v0/fixtures"
import { formatPostDate } from "@/components/v0/public/mappers"
import { PublicShell } from "@/components/v0/public/public-shell"
import { useV0ThemeController } from "@/components/v0/use-v0-theme-controller"
import type { PublishedProjectIndexItem } from "@/lib/data/posts"

interface ProjectsScreenProps {
  isDarkMode?: boolean
  brandLabel?: string
  projects?: PublishedProjectIndexItem[]
  initialSearchQuery?: string
}

export function ProjectsScreen({
  isDarkMode: initialIsDarkMode = true,
  brandLabel = "xistoh.log",
  projects,
  initialSearchQuery = "",
}: ProjectsScreenProps) {
  const { isDarkMode, toggleTheme } = useV0ThemeController(initialIsDarkMode)
  const mutedText = isDarkMode ? "text-white/50" : "text-black/50"
  const hoverBg = isDarkMode ? "hover:bg-white/5" : "hover:bg-black/5"
  const renderedProjects =
    projects?.map((project) => ({
      id: project.id,
      title: project.title,
      detailHref: `/projects/${project.slug}`,
      description: project.excerpt ?? `Published ${formatPostDate(project.publishedAt, project.updatedAt)}`,
      links:
        project.links.length > 0
          ? project.links.map((link) => ({ label: link.label, href: link.url }))
          : [{ label: `/projects/${project.slug}`, href: `/projects/${project.slug}` }],
    })) ??
    projectsData.map((project) => ({
      id: project.id,
      title: project.title,
      detailHref: "#",
      description: project.description,
      links: project.urls.map((url) => ({
        label: `${url.domain}${url.path}`,
        href: "#",
      })),
    }))

  return (
    <PublicShell currentPage="projects" isDarkMode={isDarkMode} brandLabel={brandLabel} onToggleTheme={toggleTheme}>
      <div className="min-h-full px-4 py-6 sm:px-6 md:h-full md:overflow-y-auto md:px-8">
        <div className="space-y-6 max-w-lg md:max-w-none">
            <section className="space-y-3">
              <p className={`text-xs ${mutedText}`}>// projects</p>
              <h2 className="text-lg">Featured Work</h2>
              <form method="get" className="flex flex-wrap items-center gap-2 text-xs">
                <span className={mutedText}>[search]</span>
                <input
                  aria-label="Search projects"
                  name="q"
                  defaultValue={initialSearchQuery}
                  placeholder="title / slug / excerpt"
                  className={`min-w-[12rem] flex-1 border-b ${
                    isDarkMode ? "border-white/20" : "border-black/20"
                  } bg-transparent px-2 py-1 text-xs outline-none`}
                />
                <button type="submit" className={`px-2 py-1 ${hoverBg}`}>
                  [apply]
                </button>
                {initialSearchQuery ? (
                  <Link href="/projects" className={`px-2 py-1 ${hoverBg}`}>
                    [clear]
                  </Link>
                ) : null}
              </form>
            </section>

            <div className="space-y-6">
              {renderedProjects.length > 0 ? (
                renderedProjects.map((project) => (
                  <div key={project.id} className="space-y-2">
                    <Link href={project.detailHref} className={`inline-block text-sm ${hoverBg} px-1 -mx-1 text-left`}>
                      {project.title} -&gt;
                    </Link>
                    <p className={`text-sm ${mutedText}`}>{project.description}</p>
                    <div className="flex gap-4 text-xs">
                      {project.links.map((link, index) => (
                        <a
                          key={`${project.id}-${index}`}
                          href={link.href}
                          target={link.href.startsWith("/") ? undefined : "_blank"}
                          rel={link.href.startsWith("/") ? undefined : "noreferrer"}
                          className={`${hoverBg} px-1`}
                        >
                          {link.label} -&gt;
                        </a>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className={`text-sm ${mutedText}`}>[ NO_PUBLISHED_PROJECTS ]</div>
              )}
            </div>
        </div>
      </div>
    </PublicShell>
  )
}
