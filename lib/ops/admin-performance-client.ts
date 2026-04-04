import type { AdminClientPerformanceEntry, AdminClientPerformanceSnapshot } from "@/lib/contracts/admin-performance"

const NAV_START_STORAGE_KEY = "v0-admin-nav-start"
const PERF_STORAGE_KEY = "v0-admin-performance"
const ADMIN_PREFETCH_STRATEGY = "idle-neighbors + hover/focus (explicit-create excluded)"

type MutableAdminClientPerformanceSnapshot = {
  recentNavigation: AdminClientPerformanceEntry | null
  recentRuntimeHandoff: AdminClientPerformanceEntry | null
  navPrefetchStrategy: string
}

function canUseStorage() {
  return typeof window !== "undefined"
}

function readPersistedSnapshot(): MutableAdminClientPerformanceSnapshot {
  if (!canUseStorage()) {
    return {
      recentNavigation: null,
      recentRuntimeHandoff: null,
      navPrefetchStrategy: ADMIN_PREFETCH_STRATEGY,
    }
  }

  try {
    const raw = window.localStorage.getItem(PERF_STORAGE_KEY)
    if (!raw) {
      return {
        recentNavigation: null,
        recentRuntimeHandoff: null,
        navPrefetchStrategy: ADMIN_PREFETCH_STRATEGY,
      }
    }

    const parsed = JSON.parse(raw) as Partial<MutableAdminClientPerformanceSnapshot>
    return {
      recentNavigation: parsed.recentNavigation ?? null,
      recentRuntimeHandoff: parsed.recentRuntimeHandoff ?? null,
      navPrefetchStrategy: parsed.navPrefetchStrategy ?? ADMIN_PREFETCH_STRATEGY,
    }
  } catch {
    return {
      recentNavigation: null,
      recentRuntimeHandoff: null,
      navPrefetchStrategy: ADMIN_PREFETCH_STRATEGY,
    }
  }
}

function persistSnapshot(snapshot: MutableAdminClientPerformanceSnapshot) {
  if (!canUseStorage()) {
    return
  }

  try {
    window.localStorage.setItem(PERF_STORAGE_KEY, JSON.stringify(snapshot))
  } catch {
    // Ignore local storage failures; diagnostics should never break runtime behavior.
  }
}

export function recordAdminNavigationStart(targetHref: string) {
  if (!canUseStorage()) {
    return
  }

  try {
    window.sessionStorage.setItem(
      NAV_START_STORAGE_KEY,
      JSON.stringify({
        targetHref,
        startedAt: Date.now(),
      }),
    )
  } catch {
    // Ignore transient storage issues.
  }
}

export function completeAdminNavigation(route: string) {
  if (!canUseStorage()) {
    return
  }

  try {
    const raw = window.sessionStorage.getItem(NAV_START_STORAGE_KEY)
    if (!raw) {
      return
    }

    const parsed = JSON.parse(raw) as { targetHref?: string; startedAt?: number }
    if (!parsed.targetHref || typeof parsed.startedAt !== "number") {
      window.sessionStorage.removeItem(NAV_START_STORAGE_KEY)
      return
    }

    if (parsed.targetHref !== route) {
      return
    }

    const snapshot = readPersistedSnapshot()
    snapshot.recentNavigation = {
      route,
      durationMs: Math.max(1, Math.round(Date.now() - parsed.startedAt)),
      measuredAt: new Date().toISOString(),
    }
    snapshot.navPrefetchStrategy = ADMIN_PREFETCH_STRATEGY
    persistSnapshot(snapshot)
    window.sessionStorage.removeItem(NAV_START_STORAGE_KEY)
  } catch {
    // Ignore transient storage issues.
  }
}

export function recordAdminRuntimeHandoff(route: string, durationMs: number) {
  if (!canUseStorage()) {
    return
  }

  const snapshot = readPersistedSnapshot()
  snapshot.recentRuntimeHandoff = {
    route,
    durationMs: Math.max(1, Math.round(durationMs)),
    measuredAt: new Date().toISOString(),
  }
  snapshot.navPrefetchStrategy = ADMIN_PREFETCH_STRATEGY
  persistSnapshot(snapshot)
}

export function readAdminClientPerformanceSnapshot(): AdminClientPerformanceSnapshot {
  const snapshot = readPersistedSnapshot()

  return {
    recentNavigation: snapshot.recentNavigation,
    recentRuntimeHandoff: snapshot.recentRuntimeHandoff,
    navPrefetchStrategy: snapshot.navPrefetchStrategy,
  }
}
