import type { ProfileBootstrapInput, ProfileLinkKind, ProfileSnapshotDTO } from "@/lib/contracts/profile"
import { profile } from "@/lib/site/profile"

export const PRIMARY_PROFILE_SLUG = "primary"

function inferProfileLinkKind(url: string): ProfileLinkKind {
  if (url.startsWith("mailto:")) {
    return "EMAIL"
  }

  if (/github\.com/i.test(url)) {
    return "GITHUB"
  }

  if (/linkedin\.com/i.test(url)) {
    return "LINKEDIN"
  }

  return "WEBSITE"
}

export function buildStaticProfileBootstrap(): ProfileBootstrapInput {
  const links = [
    profile.githubHref ? { label: "GitHub", url: profile.githubHref, isVerified: true } : null,
    profile.linkedinHref ? { label: "LinkedIn", url: profile.linkedinHref, isVerified: true } : null,
    profile.instagramHref ? { label: "Instagram", url: profile.instagramHref, isVerified: true } : null,
    profile.emailAddress ? { label: "Email", url: `mailto:${profile.emailAddress}`, isVerified: true } : null,
  ].filter((item): item is { label: string; url: string; isVerified: boolean } => Boolean(item))

  return {
    slug: PRIMARY_PROFILE_SLUG,
    displayName: profile.name,
    role: profile.role,
    summary: profile.bio,
    emailAddress: profile.emailAddress,
    resumeHref: profile.resumeHref ?? null,
    githubHref: profile.githubHref ?? null,
    linkedinHref: profile.linkedinHref ?? null,
    education: [
      {
        institution: profile.education,
        degree: "",
        period: "",
        sortOrder: 0,
      },
    ],
    experience: profile.experience.map((item, index) => ({
      title: item.title,
      label: item.label,
      detail: item.detail,
      period: item.period,
      year: item.year ?? null,
      sortOrder: index,
    })),
    awards: [],
    links: links.map((link, index) => ({
      label: link.label,
      url: link.url,
      kind: inferProfileLinkKind(link.url),
      isVerified: link.isVerified,
      sortOrder: index,
    })),
  }
}

export function buildStaticProfileSnapshot(): ProfileSnapshotDTO {
  const bootstrap = buildStaticProfileBootstrap()

  return {
    id: "static-primary-profile",
    slug: bootstrap.slug,
    displayName: bootstrap.displayName,
    role: bootstrap.role,
    summary: bootstrap.summary,
    emailAddress: bootstrap.emailAddress,
    resumeHref: bootstrap.resumeHref,
    githubHref: bootstrap.githubHref,
    linkedinHref: bootstrap.linkedinHref,
    education: bootstrap.education.map((entry, index) => ({
      id: `static-education-${index}`,
      institution: entry.institution,
      degree: entry.degree,
      period: entry.period,
      sortOrder: entry.sortOrder,
    })),
    experience: bootstrap.experience.map((entry, index) => ({
      id: `static-experience-${index}`,
      title: entry.title,
      label: entry.label,
      detail: entry.detail,
      period: entry.period,
      year: entry.year,
      sortOrder: entry.sortOrder,
    })),
    awards: [],
    links: bootstrap.links.map((entry, index) => ({
      id: `static-link-${index}`,
      label: entry.label,
      url: entry.url,
      kind: entry.kind,
      isVerified: entry.isVerified,
      sortOrder: entry.sortOrder,
    })),
    source: "static-fallback",
  }
}
