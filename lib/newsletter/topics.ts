import { slugify } from "@/lib/utils/normalizers"

export const NEWSLETTER_VISIBLE_TOPIC_ORDER = ["all", "project-info", "log"] as const

export type NewsletterVisibleTopic = (typeof NEWSLETTER_VISIBLE_TOPIC_ORDER)[number]

export interface NewsletterTopicDefinition {
  normalizedName: NewsletterVisibleTopic
  name: string
  aliases: string[]
}

export const NEWSLETTER_TOPIC_DEFINITIONS: NewsletterTopicDefinition[] = [
  {
    normalizedName: "all",
    name: "All",
    aliases: ["all", "all-seeds"],
  },
  {
    normalizedName: "project-info",
    name: "Project & Info",
    aliases: ["project-info", "ai-infosec", "projects-logs"],
  },
  {
    normalizedName: "log",
    name: "Log",
    aliases: ["log"],
  },
]

const TOPIC_ALIAS_LOOKUP = new Map<string, NewsletterVisibleTopic>(
  NEWSLETTER_TOPIC_DEFINITIONS.flatMap((topic) =>
    topic.aliases.map((alias) => [slugify(alias), topic.normalizedName] as const),
  ),
)

const TOPIC_NAME_LOOKUP = new Map<string, string>(
  NEWSLETTER_TOPIC_DEFINITIONS.map((topic) => [topic.normalizedName, topic.name]),
)

export function normalizeNewsletterTopic(value: string): NewsletterVisibleTopic | null {
  return TOPIC_ALIAS_LOOKUP.get(slugify(value)) ?? null
}

export function getNewsletterTopicName(value: string): string | null {
  const normalized = normalizeNewsletterTopic(value)
  return normalized ? TOPIC_NAME_LOOKUP.get(normalized) ?? null : null
}

export function normalizeNewsletterTopics(values: string[]): NewsletterVisibleTopic[] {
  const normalized = values
    .map((value) => normalizeNewsletterTopic(value))
    .filter((value): value is NewsletterVisibleTopic => Boolean(value))

  const unique = [...new Set(normalized)] as NewsletterVisibleTopic[]
  return unique.length > 0 ? unique : ["all"]
}

export function getNewsletterTopicDefinitions(): NewsletterTopicDefinition[] {
  return [...NEWSLETTER_TOPIC_DEFINITIONS]
}

export function buildNewsletterTopicMap(values: string[]) {
  const normalized = normalizeNewsletterTopics(values)
  return {
    all: normalized.includes("all"),
    projectInfo: normalized.includes("project-info"),
    log: normalized.includes("log"),
  }
}

export function serializeNewsletterTopicState(input: {
  all: boolean
  projectInfo: boolean
  log: boolean
}) {
  if (input.all) {
    return ["all"] as NewsletterVisibleTopic[]
  }

  const topics: NewsletterVisibleTopic[] = []
  if (input.projectInfo) {
    topics.push("project-info")
  }
  if (input.log) {
    topics.push("log")
  }

  return topics.length > 0 ? topics : ["all"]
}
