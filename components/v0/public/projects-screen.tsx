"use client";

import Link from "next/link";

import type { PostCardDTO } from "@/lib/contracts/posts";
import { projectsData } from "@/components/v0/fixtures";
import { formatV0Tag } from "@/components/v0/public/mappers";
import { formatPostDate } from "@/components/v0/public/mappers";
import { PublicShell } from "@/components/v0/public/public-shell";
import { useV0ThemeController } from "@/components/v0/use-v0-theme-controller";
import type { PublicTagFilterOption } from "@/lib/data/posts";

interface ProjectsScreenProps {
  isDarkMode?: boolean;
  brandLabel?: string;
  projects?: PostCardDTO[];
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  searchQuery?: string;
  selectedTag?: string | null;
  tagOptions?: PublicTagFilterOption[];
  rssHref?: string;
}

export function ProjectsScreen({
  isDarkMode: initialIsDarkMode = true,
  brandLabel = "xistoh.log",
  projects,
  pagination = {
    page: 1,
    pageSize: 5,
    total: projects?.length ?? projectsData.length,
    totalPages: 1,
  },
  searchQuery = "",
  selectedTag = null,
  tagOptions = [],
  rssHref = "/projects/rss.xml",
}: ProjectsScreenProps) {
  const { isDarkMode, toggleTheme } = useV0ThemeController(initialIsDarkMode);
  const mutedText = isDarkMode ? "text-white/50" : "text-black/50";
  const borderColor = isDarkMode ? "border-white/20" : "border-black/20";
  const hoverBg = isDarkMode ? "hover:bg-white/5" : "hover:bg-black/5";
  const activeBg = isDarkMode ? "bg-white/10" : "bg-black/10";
  const buildListHref = (next: {
    q?: string | null;
    tag?: string | null;
    page?: number | null;
  }) => {
    const params = new URLSearchParams();
    const q = (next.q ?? searchQuery).trim();
    const tag = next.tag === undefined ? selectedTag : next.tag;
    const page = next.page ?? 1;

    if (q) {
      params.set("q", q);
    }

    if (tag) {
      params.set("tag", tag);
    }

    if (page > 1) {
      params.set("page", String(page));
    }

    const queryString = params.toString();
    return queryString ? `/projects?${queryString}` : "/projects";
  };
  const renderedProjects =
    projects?.map((project) => ({
      id: project.id,
      title: project.title,
      detailHref: `/projects/${project.slug}`,
      description: project.excerpt,
      date: formatPostDate(project.publishedAt, project.updatedAt),
      tags: project.tags.map(formatV0Tag),
      views: project.views,
    })) ??
    projectsData.map((project) => ({
      id: project.id,
      title: project.title,
      detailHref: "#",
      description: project.description,
      date: "active",
      tags: [],
      views: 0,
    }));

  return (
    <PublicShell
      currentPage="projects"
      isDarkMode={isDarkMode}
      brandLabel={brandLabel}
      onToggleTheme={toggleTheme}
    >
      <div className="min-h-full px-4 py-6 sm:px-6 md:h-full md:px-8">
        <div className="space-y-6 max-w-lg md:max-w-none">
          <section className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <p className={`text-xs ${mutedText}`}>// projects</p>
              <a href={rssHref} className={`text-xs ${mutedText} ${hoverBg} px-1`}>
                [rss -&gt;]
              </a>
            </div>
            <h2 className="text-lg">Featured Work</h2>
          </section>

          <form action="/projects" className="flex flex-wrap items-center gap-3 text-xs">
            <input
              type="search"
              name="q"
              defaultValue={searchQuery}
              placeholder="search projects_"
              className={`v0-control-inline-input min-w-[14rem] flex-1 ${borderColor} ${
                isDarkMode
                  ? "text-white placeholder:text-white/30"
                  : "text-black placeholder:text-black/30"
              }`}
            />
            {selectedTag ? <input type="hidden" name="tag" value={selectedTag} /> : null}
            <button type="submit" className={`v0-control-inline-button ${borderColor} ${hoverBg}`}>
              search
            </button>
            {(searchQuery || selectedTag) ? (
              <Link href="/projects" className={`px-2 py-1 border ${borderColor} ${hoverBg}`}>
                [reset]
              </Link>
            ) : null}
          </form>

          <div className="flex flex-wrap gap-2 text-xs">
            <Link href={buildListHref({ tag: null, page: 1 })} className={`px-2 py-1 border ${borderColor} ${!selectedTag ? activeBg : hoverBg}`}>
              [All]
            </Link>
            {tagOptions.map((tag) => (
              <Link
                key={tag.value}
                href={buildListHref({ tag: tag.value, page: 1 })}
                className={`px-2 py-1 border ${borderColor} ${selectedTag === tag.value ? activeBg : hoverBg}`}
              >
                [{tag.label}]
              </Link>
            ))}
          </div>

          <div className="space-y-6">
            {renderedProjects.length > 0 ? (
              renderedProjects.map((project) => (
                <div key={project.id} className="space-y-2">
                  <Link
                    href={project.detailHref}
                    className={`inline-block text-sm ${hoverBg} px-1 -mx-1 text-left`}
                  >
                    {project.title} -&gt;
                  </Link>
                  <div className={`flex flex-wrap items-center gap-x-3 gap-y-1 text-xs ${mutedText}`}>
                    <span>{project.date}</span>
                    <span>[v: {project.views.toLocaleString()}]</span>
                    {project.tags.length > 0 ? <span>{project.tags.join(" ")}</span> : null}
                  </div>
                  {project.description ? <p className={`text-sm ${mutedText}`}>{project.description}</p> : null}
                </div>
              ))
            ) : (
              <div className={`text-sm ${mutedText}`}>
                [ NO_MATCHING_PROJECTS ]
              </div>
            )}
          </div>

          {pagination.totalPages > 1 ? (
            <div className={`flex items-center justify-center gap-2 pt-4 text-xs ${mutedText}`}>
              <Link
                href={buildListHref({ page: Math.max(1, pagination.page - 1) })}
                aria-disabled={pagination.page === 1}
                className={`px-2 py-1 ${pagination.page === 1 ? "pointer-events-none opacity-30" : hoverBg}`}
              >
                [&lt;]
              </Link>
              <span>
                {(pagination.page - 1) * pagination.pageSize + 1}-
                {Math.min(pagination.page * pagination.pageSize, pagination.total)} / {pagination.total}
              </span>
              <Link
                href={buildListHref({ page: Math.min(pagination.totalPages, pagination.page + 1) })}
                aria-disabled={pagination.page === pagination.totalPages}
                className={`px-2 py-1 ${
                  pagination.page === pagination.totalPages ? "pointer-events-none opacity-30" : hoverBg
                }`}
              >
                [&gt;]
              </Link>
            </div>
          ) : null}
        </div>
      </div>
    </PublicShell>
  );
}
