import type { ProfileLinkDTO } from "@/lib/contracts/profile"

type ProfileLinkSnapshot = {
  links: readonly ProfileLinkDTO[]
}

function normalizeLabel(label: string) {
  return label.trim().toLowerCase()
}

function hasInstagramHostname(url: string) {
  try {
    const hostname = new URL(url).hostname.toLowerCase()
    return hostname === "instagram.com" || hostname === "www.instagram.com"
  } catch {
    return false
  }
}

function findVerifiedLink(snapshot: ProfileLinkSnapshot, predicate: (link: ProfileLinkDTO) => boolean) {
  return snapshot.links.find((link) => link.isVerified && predicate(link)) ?? null
}

export function getVerifiedInstagramProfileLink(snapshot: ProfileLinkSnapshot) {
  return findVerifiedLink(snapshot, (link) => normalizeLabel(link.label) === "instagram" || hasInstagramHostname(link.url))
}

export function getPublicVerifiedProfileLinks(snapshot: ProfileLinkSnapshot) {
  const githubLink = findVerifiedLink(snapshot, (link) => link.kind === "GITHUB")
  const linkedinLink = findVerifiedLink(snapshot, (link) => link.kind === "LINKEDIN")
  const instagramLink = getVerifiedInstagramProfileLink(snapshot)

  return {
    githubHref: githubLink?.url ?? null,
    linkedinHref: linkedinLink?.url ?? null,
    instagramHref: instagramLink?.url ?? null,
  }
}
