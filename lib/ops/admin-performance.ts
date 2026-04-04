import "server-only"

import type { AdminPerformanceDashboard, AdminPerformanceMetric } from "@/lib/contracts/admin-performance"
import { getSession } from "@/lib/auth"
import { getCommunityModerationSnapshot } from "@/lib/data/community"
import { getNewsletterDashboardData } from "@/lib/data/newsletter"
import { getAdminPosts, getAdminPostEditorState } from "@/lib/data/posts"
import { getPrimaryProfileSettingsEditorState } from "@/lib/data/profile"

function getNow() {
  return typeof performance !== "undefined" ? performance.now() : Date.now()
}

async function measureMetric<T>(
  key: string,
  label: string,
  detail: string,
  task: () => Promise<T>,
): Promise<{ metric: AdminPerformanceMetric; value: T }> {
  const startedAt = getNow()
  const value = await task()
  const durationMs = Math.max(1, Math.round(getNow() - startedAt))

  return {
    value,
    metric: {
      key,
      label,
      status: "measured",
      durationMs,
      detail,
    },
  }
}

function createSkippedMetric(key: string, label: string, detail: string): AdminPerformanceMetric {
  return {
    key,
    label,
    status: "skipped",
    durationMs: null,
    detail,
  }
}

function formatError(error: unknown) {
  if (error instanceof Error && error.message.trim()) {
    return error.message
  }

  return "Unavailable."
}

async function measureMetricSafely<T>(
  key: string,
  label: string,
  detail: string,
  task: () => Promise<T>,
): Promise<{ metric: AdminPerformanceMetric; value: T | null }> {
  try {
    return await measureMetric(key, label, detail, task)
  } catch (error) {
    return {
      value: null,
      metric: createSkippedMetric(key, label, `${detail} ${formatError(error)}`.trim()),
    }
  }
}

export async function getAdminPerformanceDashboard(): Promise<AdminPerformanceDashboard> {
  const [
    sessionMeasurement,
    postsMeasurement,
    settingsMeasurement,
    newsletterMeasurement,
    communityMeasurement,
  ] = await Promise.all([
    measureMetricSafely("session", "SESSION_LOOKUP", "NextAuth server session lookup time.", () => getSession()),
    measureMetricSafely("posts", "POST_INDEX_QUERY", "Manage Posts query with the default admin filter path.", () => getAdminPosts()),
    measureMetricSafely(
      "settings",
      "SETTINGS_EDITOR_LOAD",
      "Profile/CV settings editor state with resume metadata.",
      () => getPrimaryProfileSettingsEditorState(),
    ),
    measureMetricSafely(
      "newsletter",
      "NEWSLETTER_DASHBOARD",
      "Newsletter queue/subscriber/delivery snapshot for the admin dashboard.",
      () => getNewsletterDashboardData({ pageSize: 5 }),
    ),
    measureMetricSafely(
      "community",
      "COMMUNITY_QUEUE",
      "Comment and guestbook moderation snapshot with pagination state.",
      () => getCommunityModerationSnapshot({ pageSize: 5 }),
    ),
  ])

  const firstPost = postsMeasurement.value?.posts[0] ?? null
  const editorMeasurement = firstPost
    ? await measureMetricSafely(
        "editor",
        "POST_EDITOR_LOAD",
        `Editor state load for the current first indexed post (${firstPost.slug}).`,
        () => getAdminPostEditorState(firstPost.id),
      )
    : {
        metric: createSkippedMetric(
          "editor",
          "POST_EDITOR_LOAD",
          "Skipped because there is no indexed post yet.",
        ),
      }

  return {
    measuredAt: new Date().toISOString(),
    timings: [
      sessionMeasurement.metric,
      postsMeasurement.metric,
      editorMeasurement.metric,
      settingsMeasurement.metric,
      newsletterMeasurement.metric,
      communityMeasurement.metric,
    ],
    navPrefetchStrategy: "idle-neighbors + hover/focus",
    notes: [
      "Admin navigation timing is captured client-side from nav click to route-ready shell mount.",
      "Runtime handoff timing is captured client-side from admin route registration to visible Jitter slot reuse.",
      "Server diagnostics now measure content, settings, newsletter, and community admin reads separately for route attribution.",
    ],
  }
}
