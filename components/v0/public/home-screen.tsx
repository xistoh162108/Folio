"use client"

import Link from "next/link"

import type { GuestbookEntryDTO } from "@/lib/contracts/community"
import type { PostCardDTO } from "@/lib/contracts/posts"

import {
  digitalGardenNotes,
  educationData,
  experienceData,
  projectsData,
} from "@/components/v0/fixtures"
import { formatPostDate } from "@/components/v0/public/mappers"
import { PublicShell } from "@/components/v0/public/public-shell"
import { V0SubscriptionModule } from "@/components/v0/public/subscription-module"
import { useV0ThemeController } from "@/components/v0/use-v0-theme-controller"

interface HomeLineItem {
  id: string
  period: string
  label: string
}

interface HomeScreenProps {
  isDarkMode?: boolean
  brandLabel?: string
  profileName?: string
  profileBio?: string
  emailAddress?: string
  githubHref?: string | null
  linkedinHref?: string | null
  instagramHref?: string | null
  education?: HomeLineItem[]
  experience?: HomeLineItem[]
  awards?: HomeLineItem[]
  recentNotes?: PostCardDTO[]
  recentProjects?: PostCardDTO[]
  recentLogs?: GuestbookEntryDTO[]
  resumeHref?: string
}

export function HomeScreen({
  isDarkMode: initialIsDarkMode = true,
  brandLabel = "xistoh.log",
  profileName = "Jimin Park",
  profileBio = "Undergraduate at KAIST School of Computing. Exploring the intersections of AI, Information Security, and full-stack development.",
  emailAddress = "xistoh162108@kaist.ac.kr",
  githubHref = null,
  linkedinHref = null,
  instagramHref = null,
  education = educationData.map((item) => ({
    id: item.id,
    period: item.period,
    label: `${item.institution}, ${item.degree}`,
  })),
  experience = experienceData.slice(0, 3).map((item) => ({
    id: item.id,
    period: item.period,
    label: item.role,
  })),
  awards = [],
  recentNotes,
  recentProjects,
  recentLogs = [],
  resumeHref = "/resume.pdf",
}: HomeScreenProps) {
  const { isDarkMode, toggleTheme } = useV0ThemeController(initialIsDarkMode)
  const mutedText = isDarkMode ? "text-white/50" : "text-black/50"
  const hoverBg = isDarkMode ? "hover:bg-white/5" : "hover:bg-black/5"
  const renderedRecentNotes =
    recentNotes?.slice(0, 5).map((note) => ({
      id: note.id,
      title: note.title,
      href: `/notes/${note.slug}`,
      date: formatPostDate(note.publishedAt, note.updatedAt),
    })) ??
    digitalGardenNotes.slice(0, 5).map((note) => ({
      id: note.id,
      title: note.title,
      href: "#",
      date: note.date,
    }))
  const renderedRecentProjects =
    recentProjects?.slice(0, 2).map((project) => ({
      id: project.id,
      title: project.title,
      href: `/projects/${project.slug}`,
      date: formatPostDate(project.publishedAt, project.updatedAt),
    })) ??
    projectsData.slice(0, 2).map((project) => ({
      id: project.id,
      title: project.title,
      href: "#",
      date: "active",
    }))
  const renderedRecentLogs =
    recentLogs.length > 0
      ? recentLogs.map((entry) => ({
          id: entry.id,
          label: `${entry.sourceLabel} - ${entry.message}`,
        }))
      : [
          { id: "log-1", label: "local - visitor log stream open" },
          { id: "log-2", label: "signal - guestbook trace pending" },
        ]

  return (
    <PublicShell currentPage="home" isDarkMode={isDarkMode} brandLabel={brandLabel} onToggleTheme={toggleTheme}>
      <div className="flex min-h-full flex-col justify-start px-4 py-6 sm:px-6 md:h-full md:justify-center md:px-8">
        <div className="space-y-6 max-w-md">
            <section className="space-y-3">
              <p className={`text-xs ${mutedText}`}>// profile</p>
              <h2 className="text-xl">{profileName}</h2>
              <p className={`text-sm leading-relaxed ${mutedText}`}>{profileBio}</p>
              <div className={`flex flex-wrap gap-4 text-xs ${mutedText}`}>
                {githubHref ? (
                  <a href={githubHref} target="_blank" rel="noreferrer" className={`${hoverBg} px-1`}>
                    github -&gt;
                  </a>
                ) : (
                  <span className="px-1">github</span>
                )}
                {linkedinHref ? (
                  <a href={linkedinHref} target="_blank" rel="noreferrer" className={`${hoverBg} px-1`}>
                    linkedin -&gt;
                  </a>
                ) : (
                  <span className="px-1">linkedin</span>
                )}
                {instagramHref ? (
                  <a href={instagramHref} target="_blank" rel="noreferrer" className={`${hoverBg} px-1`}>
                    instagram -&gt;
                  </a>
                ) : null}
                <a href={`mailto:${emailAddress}`} className={`${hoverBg} px-1`}>
                  email -&gt;
                </a>
                <a href={resumeHref} download className={`${hoverBg} px-1`}>
                  [&darr;] fetch resume.pdf
                </a>
              </div>
            </section>

            <section className="space-y-2">
              <p className={`text-xs ${mutedText}`}>// education</p>
              <div className="space-y-0.5">
                {education.map((education) => (
                  <div key={education.id} className={`text-xs ${hoverBg} py-0.5 px-1 -mx-1`}>
                    <span className={mutedText}>{education.period}</span>
                    <span className="mx-1">-</span>
                    <span>{education.label}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-2">
              <p className={`text-xs ${mutedText}`}>// experience</p>
              <div className="space-y-0.5">
                {experience.map((experience) => (
                  <div key={experience.id} className={`text-xs ${hoverBg} py-0.5 px-1 -mx-1`}>
                    <span className={mutedText}>{experience.period}</span>
                    <span className="mx-1">-</span>
                    <span>{experience.label}</span>
                  </div>
                ))}
              </div>
            </section>

            {awards.length ? (
              <section className="space-y-2">
                <p className={`text-xs ${mutedText}`}>// awards</p>
                <div className="space-y-0.5">
                  {awards.map((award) => (
                    <div key={award.id} className={`text-xs ${hoverBg} py-0.5 px-1 -mx-1`}>
                      <span className={mutedText}>{award.period}</span>
                      <span className="mx-1">-</span>
                      <span>{award.label}</span>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            <section className="space-y-2">
              <p className={`text-xs ${mutedText}`}>// recent notes</p>
              <div className="space-y-0.5">
                {renderedRecentNotes.map((note) => (
                  <Link
                    key={note.id}
                    href={note.href}
                    className={`block text-xs ${hoverBg} py-0.5 px-1 -mx-1 transition-colors`}
                  >
                    <span className={mutedText}>{note.date}</span>
                    <span className="mx-1">-</span>
                    <span>{note.title}</span>
                    <span className="mx-1">-&gt;</span>
                  </Link>
                ))}
              </div>
              <Link href="/notes" className={`inline-block text-xs ${mutedText} ${hoverBg} px-1`}>
                [+] all notes
              </Link>
            </section>

            <section className="space-y-2">
              <p className={`text-xs ${mutedText}`}>// recent projects</p>
              <div className="space-y-0.5">
                {renderedRecentProjects.map((project) => (
                  <Link
                    key={project.id}
                    href={project.href}
                    className={`block text-xs ${hoverBg} py-0.5 px-1 -mx-1 transition-colors`}
                  >
                    <span className={mutedText}>{project.date}</span>
                    <span className="mx-1">-</span>
                    <span>{project.title}</span>
                    <span className="mx-1">-&gt;</span>
                  </Link>
                ))}
              </div>
              <Link href="/projects" className={`inline-block text-xs ${mutedText} ${hoverBg} px-1`}>
                [+] all projects
              </Link>
            </section>

            <section className="space-y-2">
              <p className={`text-xs ${mutedText}`}>// visitor logs</p>
              <div className="space-y-0.5">
                {renderedRecentLogs.map((entry) => (
                  <Link
                    key={entry.id}
                    href="/guestbook"
                    className={`block text-xs ${hoverBg} py-0.5 px-1 -mx-1 transition-colors`}
                  >
                    {entry.label}
                    <span className="mx-1">-&gt;</span>
                  </Link>
                ))}
              </div>
              <Link href="/guestbook" className={`inline-block text-xs ${mutedText} ${hoverBg} px-1`}>
                [+] guestbook archive
              </Link>
            </section>

            <section className="pt-2">
              <V0SubscriptionModule isDarkMode={isDarkMode} compact />
            </section>
        </div>
      </div>
    </PublicShell>
  )
}
