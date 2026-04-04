export type V0AdminSection = "overview" | "content" | "manage-posts" | "newsletter" | "settings" | "community"

export function isExplicitCreateSection(section: V0AdminSection) {
  return section === "content"
}

export function getAdminSectionHref(section: V0AdminSection) {
  return section === "overview"
    ? "/admin/analytics"
    : section === "content"
      ? "/admin/content"
      : section === "manage-posts"
        ? "/admin/posts"
        : section === "newsletter"
          ? "/admin/newsletter"
          : section === "settings"
            ? "/admin/settings"
            : section === "community"
              ? "/admin/community"
              : "/admin/posts"
}

export function getAdminIdlePrefetchTargets(currentSection: V0AdminSection | null): V0AdminSection[] {
  switch (currentSection) {
    case "overview":
      return ["manage-posts", "settings"]
    case "content":
      return ["manage-posts", "settings"]
    case "manage-posts":
      return ["content", "settings"]
    case "newsletter":
      return ["overview", "settings"]
    case "settings":
      return ["overview", "manage-posts"]
    case "community":
      return ["overview", "manage-posts"]
    default:
      return ["overview", "manage-posts"]
  }
}

export function shouldPrefetchAdminSection(section: V0AdminSection) {
  return !isExplicitCreateSection(section)
}
